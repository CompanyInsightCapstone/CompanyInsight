from collections import deque
from functools import lru_cache
from itertools import chain
from typing import Any, Dict, List, Optional
import networkx as nx
import numpy.random as rng


rng.seed(42)
QUERY_COLOR = "white"
DOCUMENT_COLOR = "blue"
uniform_node_sample = lambda node_set: node_set[rng.randint(0, len(node_set))]


# https://en.wikipedia.org/wiki/Random_walk
# https://arxiv.org/pdf/2209.13103
# https://networkx.org/documentation/stable/tutorial.html
class RandomWalker:
    def __init__(self, subgraph, process_buffer):
        self.subgraph = subgraph
        self.buffer = process_buffer
        self.node_set_size = len(self.subgraph.nodes())
        self.degree_cache = dict(subgraph.degree(weight="weight"))

    @lru_cache(maxsize=1000)
    def subgraph_nodes(self):
        return list(self.subgraph.nodes(data=True))

    @lru_cache(maxsize=1000)
    def subgraph_edges(self):
        return list(self.subgraph.edges(data=True))

    @lru_cache(maxsize=1000)
    def get_degree(self, node):
        return self.degree_cache.get(node, 0)

    @lru_cache(maxsize=1000)
    def get_edge_weight(self, u, v):
        if self.subgraph.has_edge(u, v):
            return self.subgraph[u][v].get("weight", 1.0)
        return 0.0

    @lru_cache(maxsize=1000)
    def query_nodes(self):
        return [
            n for n, data in self.subgraph_nodes() if data.get("color") == QUERY_COLOR
        ]

    @lru_cache(maxsize=1000)
    def document_nodes(self):
        return [
            n
            for n, data in self.subgraph_nodes()
            if data.get("color") == DOCUMENT_COLOR
        ]

    @lru_cache(maxsize=1000)
    def get_lowest_similarity_docs(self, query_node, k=3):
        doc_nodes = self.document_nodes()
        similarities = []
        for doc in doc_nodes:
            if self.subgraph.has_edge(query_node, doc):
                sim = self.get_edge_weight(query_node, doc)
                similarities.append((doc, sim))

        if similarities:
            similarities.sort(key=lambda x: x[1])
            return similarities[: min(k, len(similarities))]
        return []

    def get_query_document_triplet(
        self, query_node, positive_node, positive_similarity
    ):
        neg_docs = self.get_lowest_similarity_docs(query_node, k=1)
        if not neg_docs:
            return None
        negative_node, negative_similarity = neg_docs[0]

        query_data = dict(self.subgraph.nodes(data=True))[query_node]
        positive_data = dict(self.subgraph.nodes(data=True))[positive_node]
        negative_data = dict(self.subgraph.nodes(data=True))[negative_node]
        query = None
        if "data" in query_data and hasattr(query_data["data"], "query"):
            query = query_data["data"].query
        else:
            # Try different ways to get the query
            query = (query_data.get("data", {}).get("query", None) or
                    query_data.get("query", None) or
                    str(query_node))
        positive_doc = positive_data.get("data", {}).get("document", positive_data)
        if isinstance(positive_doc, dict) and "document" in positive_doc:
            positive_doc = positive_doc["document"]

        negative_doc = negative_data.get("data", {}).get("document", negative_data)
        if isinstance(negative_doc, dict) and "document" in negative_doc:
            negative_doc = negative_doc["document"]
        triplet = {
            "query": query,
            "positive_document": positive_doc,
            "negative_document": negative_doc,
            "query_positive_similarity": positive_similarity,
            "query_negative_similarity": negative_similarity,
        }
        return triplet

    def metropolis_hastings_random_walk(self, budget):
        entries = []
        nodes = [n for n, _ in self.subgraph_nodes()]
        if not nodes:
            return entries
        v = uniform_node_sample(nodes)
        node_data = dict(self.subgraph.nodes(data=True))[v]
        query_nodes = self.query_nodes()
        if query_nodes and node_data.get("color") != QUERY_COLOR:
            v = uniform_node_sample(query_nodes)
            node_data = dict(self.subgraph.nodes(data=True))[v]
        i = 0
        while i < budget:
            neighbors = list(self.subgraph.neighbors(v))
            if not neighbors:
                v = uniform_node_sample(nodes)
                node_data = dict(self.subgraph.nodes(data=True))[v]
                continue
            u = uniform_node_sample(neighbors)
            u_data = dict(self.subgraph.nodes(data=True))[u]
            edge_weight = self.get_edge_weight(v, u)
            v_degree = self.get_degree(v)
            u_degree = self.get_degree(u)
            if rng.random() < min(1.0, (u_degree * edge_weight) / (v_degree + 1e-10)):
                if (
                    node_data.get("color") == QUERY_COLOR
                    and u_data.get("color") == DOCUMENT_COLOR
                ):
                    triplet = self.get_query_document_triplet(v, u, edge_weight)
                    if triplet:
                        entries.append(triplet)
                v = u
                node_data = u_data
            i += 1
        return entries

    def random_sample(self):
        entries = self.metropolis_hastings_random_walk(self.node_set_size * 2)
        for pair in entries:
            self.buffer.add(pair)
        return len(entries)

    def run(self):
        try:
            print(f"RandomWalker starting on subgraph with {self.node_set_size} nodes")
            num_entries = self.random_sample()
            print(f"RandomWalker finished: Generated {num_entries} query-document entries")
            return num_entries
        except Exception as e:
            print(f"Error in RandomWalker: {e}")
            return 0

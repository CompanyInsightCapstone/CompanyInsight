import sys
import os
import json
import time
import random
import multiprocessing as mp
import networkx as nx
import itertools
from utils import load_company_documents
from lib.disk_writer import DiskWriter
from lib.process_buffer import ProcessBuffer
from lib.random_walker import RandomWalker
from lib.query_generation import QueryGeneration
from lib.scoring import SimilarityScoring
from dataclasses import dataclass, field
from typing import Dict, Any, List

QUERY_COLOR = "white"
DOCUMENT_COLOR = "blue"


@dataclass
class QueryNodeData:
    query: str
    color: int


@dataclass
class DocumentNodeData:
    document: Dict[str, Any]
    color: int


class MonteCarloSimulation:
    def __init__(self, documents, output_path, num_processes=4, batch_size=8):
        self.documents = documents
        self.output_path = output_path
        self.num_processes = num_processes
        self.batch_size = batch_size
        current_dir = os.path.dirname(os.path.abspath(__file__))
        query_data_path = os.path.join(current_dir, "lib", "query_generation_data.json")
        self.query_generation_data = json.load(open(query_data_path, "r"))
        self.query_generation = QueryGeneration(self.query_generation_data["SYSTEM_PROMPT"])
        self.scoring = SimilarityScoring(self.documents)
        self.shared_buffer = ProcessBuffer()
        self.writer_worker = DiskWriter(self.shared_buffer, output_path, batch_size=batch_size)
        self.graph = None
        self.subgraphs = [None] * (self.num_processes - 1)

    def make_triplet_entry(self, query, positive_document, negative_document):
        return {
            "query": query,
            "positive_document": positive_document,
            "negative_document": negative_document
        }

    def run_simulation(self, num_samples=10000):
        print(f"Starting Monte Carlo simulation to generate {num_samples} samples...")
        start_time = time.time()
        self.graph = nx.Graph()
        print(f"Processing company queries...")
        company_query_templates = self.query_generation_data.get("COMPANY_QUERY_TEMPLATES", [])
        sample_size = min(250, len(self.documents))
        sampled_documents = random.sample(self.documents, sample_size)
        company_count = 0
        total_companies = len(sampled_documents) * len(company_query_templates)
        company_template_pairs = list(itertools.product(company_query_templates, sampled_documents))
        for idx, (query_template, document) in enumerate(company_template_pairs):
            company_name = document.get("name", "")
            if not company_name:
                continue
            context = query_template.format(company=company_name)
            query = self.query_generation.generate(context)
            all_docs = self.documents
            neg_doc_idx = random.randint(0, len(all_docs) - 1)
            while all_docs[neg_doc_idx].get("id") == document.get("id"):
                neg_doc_idx = (neg_doc_idx + 1) % len(all_docs)
            neg_document = all_docs[neg_doc_idx]
            triplet = self.make_triplet_entry(query, document, neg_document)
            self.shared_buffer.add(triplet)
            company_count += 1
            if company_count % 10 == 0:
                print(f"Processed {company_count}/{total_companies} company queries ({company_count/total_companies*100:.1f}%)")
        print(f"Completed company queries processing. Time elapsed: {time.time() - start_time:.2f}s")
        print(f"Processing sector queries...")
        sector_start_time = time.time()
        sector_query_templates = self.query_generation_data.get("SECTOR_QUERY_TEMPLATES", [])
        sectors = self.query_generation_data.get("SECTORS", [])
        sector_count = 0
        total_sectors = len(sectors) * len(sector_query_templates)
        sector_template_pairs = list(itertools.product(sectors, sector_query_templates))
        for idx, (sector, query_template) in enumerate(sector_template_pairs):
            context = query_template.format(sector=sector)
            query = self.query_generation.generate(context)
            query_node = f"query_{len(self.graph.nodes())}"
            self.graph.add_node(query_node, data=QueryNodeData(query=query, color=QUERY_COLOR))
            similarity_data = {"score_type": "SECTOR", "query": query, "key_type": ""}
            result_list = self.scoring.scores(similarity_data)
            top_k = min(5, len(result_list))
            for i in range(top_k):
                doc = result_list[i]
                doc_idx = next((idx for idx, d in enumerate(self.documents) if d.get("id") == doc.get("id")), -1)
                if doc_idx >= 0:
                    doc_node = f"doc_{doc_idx}"
                    if not self.graph.has_node(doc_node):
                        self.graph.add_node(doc_node, data=DocumentNodeData(document=doc, color=DOCUMENT_COLOR))
                    similarity = 1.0 - (i / top_k)
                    self.graph.add_edge(query_node, doc_node, weight=similarity)

            sector_count += 1
            if sector_count % 5 == 0:
                print(f"Processed {sector_count}/{total_sectors} sector queries ({sector_count/total_sectors*100:.1f}%)")
        print(f"Completed sector queries processing. Time elapsed: {time.time() - sector_start_time:.2f}s")
        print(f"Processing numerical field queries...")
        numerical_start_time = time.time()
        numerical_fields = self.query_generation_data.get("NUMERICAL_DOCUMENT_FIELDS", [])
        numerical_templates = self.query_generation_data.get("NUMERICAL_QUERY_TEMPLATES", [])
        numerical_count = 0
        total_numerical = len(numerical_fields) * len(numerical_templates)
        field_template_pairs = list(itertools.product(numerical_fields, numerical_templates))
        for idx, (field, template) in enumerate(field_template_pairs):
            context = template.format(field=field)
            query = self.query_generation.generate(context)
            similarity_data = {"score_type": "EXTREMA", "query": query, "key_type": field}
            result_list = self.scoring.scores(similarity_data)
            if not result_list:
                continue
            if "high" in template.lower():
                positive_doc = result_list[-1]
                negative_doc = result_list[0] if len(result_list) > 1 else None
            else:
                positive_doc = result_list[0]
                negative_doc = result_list[-1] if len(result_list) > 1 else None
            triplet = self.make_triplet_entry(query, positive_doc, negative_doc)
            self.shared_buffer.add(triplet)
            numerical_count += 1
            if numerical_count % 5 == 0:
                print(f"Processed {numerical_count}/{total_numerical} numerical queries ({numerical_count/total_numerical*100:.1f}%)")
        print(f"Completed numerical queries processing. Time elapsed: {time.time() - numerical_start_time:.2f}s")
        print(f"Graph built with {len(self.graph.nodes())} nodes and {len(self.graph.edges())} edges")
        if self.num_processes > 1:
            self.subgraphs = self._split_graph(self.graph, self.num_processes - 1)
        print(f"Starting walker and writer processes...")
        walker_start_time = time.time()
        samples_per_process = num_samples // self.num_processes
        writer_process = mp.Process(target=self._run_writer)
        writer_process.start()
        walker_processes = []
        for i in range(self.num_processes - 1):
            p = mp.Process(
                target=self._run_walker,
                args=(samples_per_process, i)
            )
            p.start()
            walker_processes.append(p)
            print(f"Started walker process {i+1}/{self.num_processes-1}")
        for p in walker_processes:
            p.join()
        print(f"All walker processes completed. Time elapsed: {time.time() - walker_start_time:.2f}s")
        self.shared_buffer.mark_done()
        writer_process.join()
        print(f"Monte Carlo simulation completed. Generated {num_samples} samples.")
        print(f"Total simulation time: {time.time() - start_time:.2f}s")

    def _split_graph(self, graph, num_parts):
        if len(graph.nodes()) < num_parts:
            return [graph] * num_parts
        subgraphs = []
        nodes = list(graph.nodes())
        nodes_per_part = len(nodes) // num_parts
        for i in range(num_parts):
            start_idx = i * nodes_per_part
            end_idx = (i + 1) * nodes_per_part if i < num_parts - 1 else len(nodes)
            part_nodes = nodes[start_idx:end_idx]
            subgraph = graph.subgraph(part_nodes).copy()
            subgraphs.append(subgraph)
        return subgraphs

    def _run_walker(self, num_samples, process_id):
        try:
            graph_to_use = self.subgraphs[process_id] if process_id < len(self.subgraphs) else self.graph
            walker = RandomWalker(graph_to_use, self.shared_buffer)
            walker.run()
        except Exception as e:
            print(f"Error in Walker Process {process_id}: {e}")

    def _run_writer(self):
        """Run the DiskWriter process."""
        self.writer_worker.run()


def main():
    documents = load_company_documents()
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "simulation_output")
    num_workers = os.cpu_count() // 2
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    output_file = os.path.join(output_dir, f"simulation_results_{int(time.time())}.json")
    start_time = time.time()
    simulation = MonteCarloSimulation(documents, output_file, num_workers, batch_size=16)
    simulation.run_simulation(num_samples=10000)
    end_time = time.time()
    print(f"Simulation took {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    main()

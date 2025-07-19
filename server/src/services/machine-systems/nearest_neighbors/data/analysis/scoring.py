import math
from collections import Counter, defaultdict
from typing import List, Tuple

import numpy as np


def tokenize(string_seq):
    return string_seq.split()


def build_inverted_index(documents):
    inv_index = defaultdict(list)
    for idx, document in enumerate(documents):
        for key, value in document.items():
            if isinstance(value, str) and key != "id":
                context_string = key.lower() + ":" + value.lower()
                c = Counter(tokenize(context_string))
                for term, freq in c.items():
                    inv_index[term].append((idx, freq))
    return inv_index


def logistic(x):
    return 1 / (1 + math.exp(-x))


def build_numerical_index(documents):
    numerical_index = defaultdict(int)
    for idx, document in enumerate(documents):
        accum = 0
        for key, value in document.items():
            if isinstance(value, float) or isinstance(value, int):
                accum += value
        numerical_index[idx] = logistic(accum)
    return numerical_index


def compute_idf(inv_idx, n_docs, min_df=10, max_df_ratio=0.95):
    return {
        k: math.log2(n_docs / (1 + len(v)))
        for k, v in inv_idx.items()
        if min_df <= len(v) <= (max_df_ratio * n_docs)
    }


def numerical_index_search(query, numerical_index, doc):
    """
    Search for numerical relevance between a query and a document.

    Args:
        query (str): The query string
        numerical_index (dict): Dictionary mapping document indices to numerical scores
        doc (dict): The document to search in

    Returns:
        float: A relevance score based on numerical fields
    """
    score = 0.0
    query_lower = query.lower()
    if any(
        term in query_lower
        for term in ["price", "stock", "value", "$", "dollar", "money"]
    ):
        if "id" in doc and doc["id"] in numerical_index:
            score += numerical_index[doc["id"]] * 0.8
        for field in ["close", "open", "high", "low", "simpleMovingAverage"]:
            if field in doc and doc[field] is not None:
                score += 0.2
    return score


def compute_doc_norms(index, idf, n_docs):
    acc = np.zeros(n_docs)
    for k, v in index.items():
        for idx, tf in v:
            acc[idx] += (tf * (idf.get(k, 0))) ** 2
    return np.sqrt(acc)


def accumulate_dot_scores(query_word_counts, index, idf):
    d = defaultdict(float)
    for k, v in query_word_counts.items():
        for idx, tf in index.get(k, []):
            d[idx] += v * tf * ((idf.get(k, 0)) ** 2)
    return d


def index_search(
    query,
    index,
    idf,
    doc_norms,
    score_func=accumulate_dot_scores,
    tokenizer=tokenize,
):
    c = Counter(tokenize(query.lower()))
    q_norm = 0
    for w in c:
        v = c.get(w, 0) * idf.get(w, 0)
        q_norm += v * v
    q_norm = math.sqrt(q_norm)
    if q_norm == 0:
        return []
    scores = score_func(c, index, idf).items()
    acc = [
        ((score / (q_norm * doc_norms[idx])), idx)
        for idx, score in scores
        if doc_norms[idx] > 0
    ]
    return sorted(acc, key=lambda x: x[0], reverse=True)

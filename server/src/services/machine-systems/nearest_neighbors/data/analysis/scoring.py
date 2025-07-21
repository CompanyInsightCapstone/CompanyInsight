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
    """
    Build a numerical index from documents, normalizing scores to form a probability distribution.

    Returns:
        dict: A dictionary mapping document indices to normalized numerical scores
    """
    numerical_index = defaultdict(float)
    for idx, document in enumerate(documents):
        accum = 0
        for key, value in document.items():
            if isinstance(value, float) or isinstance(value, int):
                accum += value
        numerical_index[idx] = logistic(accum)
    total_score = sum(numerical_index.values())
    if total_score > 0:
        for idx in numerical_index:
            numerical_index[idx] /= total_score
    return numerical_index


def compute_idf(inv_idx, n_docs, min_df=10, max_df_ratio=0.95):
    """
    Compute inverse document frequency with proper normalization.
    """
    idf_values = {
        k: math.log2(n_docs / (1 + len(v)))
        for k, v in inv_idx.items()
        if min_df <= len(v) <= (max_df_ratio * n_docs)
    }

    min_idf = min(idf_values.values()) if idf_values else 0
    if min_idf < 0:
        for k in idf_values:
            idf_values[k] -= min_idf

    return idf_values


def numerical_index_search(query, numerical_index, doc):
    """
    Search for numerical relevance between a query and a document.

    Args:
        query (str): The query string
        numerical_index (dict): Dictionary mapping document indices to numerical scores
        doc (dict): The document to search in

    Returns:
        float: A relevance score based on numerical fields, normalized as part of a probability distribution
    """
    score = 0.0
    query_lower = query.lower()
    if "id" in doc and doc["id"] in numerical_index:
        score += numerical_index[doc["id"]]
    return score


def compute_doc_norms(index, idf, n_docs):
    acc = np.zeros(n_docs)
    for k, v in index.items():
        for idx, tf in v:
            acc[idx] += (tf * (idf.get(k, 0))) ** 2
    return np.sqrt(acc)


def accumulate_dot_scores(query_word_counts, index, idf):
    """
    Accumulate dot product scores between query and documents.
    Returns a probability distribution of scores.
    """
    d = defaultdict(float)
    for k, v in query_word_counts.items():
        for idx, tf in index.get(k, []):
            d[idx] += v * tf * ((idf.get(k, 0)) ** 2)

    total_score = sum(d.values())
    if total_score > 0:
        for idx in d:
            d[idx] /= total_score

    return d


def index_search(
    query,
    index,
    idf,
    doc_norms,
    score_func=accumulate_dot_scores,
    tokenizer=tokenize,
):
    """
    Search for documents using TF-IDF scoring.
    Returns results as a probability distribution.

    Args:
        query: The search query
        index: Inverted index of documents
        idf: Inverse document frequency values
        doc_norms: Document norms for normalization
        score_func: Function to calculate scores
        tokenizer: Function to tokenize text

    Returns:
        List of (score, document_idx) tuples, where scores form a probability distribution
    """
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

    if acc:
        total_score = sum(score for score, _ in acc)
        if total_score > 0:
            acc = [(score / total_score, idx) for score, idx in acc]
        else:
            equal_prob = 1.0 / len(acc)
            acc = [(equal_prob, idx) for _, idx in acc]

    return sorted(acc, key=lambda x: x[0], reverse=True)

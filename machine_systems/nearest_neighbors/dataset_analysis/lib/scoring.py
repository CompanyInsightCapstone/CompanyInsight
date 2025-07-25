import importlib.util
import os
import sys
from collections import Counter, defaultdict
from typing import Any, Dict, List, Tuple, Union
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

utils_path = os.path.join(
    os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")),
    "utils.py",
)
spec = importlib.util.spec_from_file_location("utils", utils_path)
utils = importlib.util.module_from_spec(spec)
spec.loader.exec_module(utils)
load_company_documents = utils.load_company_documents


class SingularValueDecompositionEmbedding(TfidfVectorizer):
    def __init__(self, documents_descriptions: List[str]):
        self.documents_descriptions = documents_descriptions
        super(SingularValueDecompositionEmbedding, self).__init__(
            max_features=5000, stop_words="english", max_df=0.9, min_df=5
        )
        self.num_principle_components = 100
        self.svd_call = TruncatedSVD(
            n_components=self.num_principle_components, random_state=42
        )
        self.svd_matrix = self.svd_call.fit_transform(
            self.fit_transform(documents_descriptions)
        )
        self.svd_matrix = csr_matrix(self.svd_matrix)

    def forward(self, x: str) -> np.ndarray:
        """
        given a string, return the  cosine similarity between the string and all other documents, where the ith document is the ith row of the matrix
        """
        x_decomposed = self.svd_call.transform(self.transform([x])).reshape(1, -1)
        x_decomposed = csr_matrix(x_decomposed)
        return cosine_similarity(x_decomposed, self.svd_matrix)

    def top_svd_terms(self, latent_row):
        if hasattr(latent_row, "toarray"):
            latent_row = latent_row.toarray().flatten()
        else:
            latent_row = np.array(latent_row).flatten()

        if latent_row.shape[0] != self.num_principle_components:
            raise ValueError(
                f"Expected latent_row to have shape ({self.num_principle_components},), got {latent_row.shape}"
            )
        w = self.svd_call.components_.T @ latent_row
        idx = w.argsort()[-self.num_principle_components :][::-1]
        return [self.get_feature_names_out()[i] for i in idx]


class SimilarityScoring:
    def __init__(self, documents: List[Dict[str, Any]]):
        self.documents = documents

        self.numerical_keys = [
            "close",
            "open",
            "high",
            "low",
            "volume",
            "simpleMovingAverage",
        ]

        self.extreme_values_sorted = self.precompute_sorted_numerical_fields()
        self.SVD = SingularValueDecompositionEmbedding([d["description"] for d in documents])

        if self.SVD.svd_matrix.shape[0] > 0:
            self.top_svd_terms = self.SVD.top_svd_terms(self.SVD.svd_matrix[0])
            print(self.top_svd_terms)
        else:
            print("Warning: SVD matrix is empty")
            self.top_svd_terms = []

    def precompute_sorted_numerical_fields(self):
        result = {}
        for key in self.numerical_keys:
            median_value = np.median([doc[key] for doc in self.documents])
            result[key] = sorted(self.documents, key=lambda x: x.get(key, median_value))
        return result

    def query_text_search(self, query: str) -> List[any]:
        svd_scores = self.SVD.forward(query)
        svd_scores_flat = svd_scores.flatten()
        sorted_indices = np.argsort(svd_scores_flat)[::-1]
        return [self.documents[i] for i in sorted_indices]

    def score_extrema(self, key_type: str) -> List[any]:
        return self.extreme_values_sorted[key_type]

    def scores(self, data: Dict[any, any]) -> float:
        score_type = data["score_type"]
        query = data["query"]
        key_type = data["key_type"]
        match data["score_type"]:
            case "EXTREMA":
                return self.score_extrema(data["key_type"])
            case "SECTOR":
                return self.query_text_search(data["query"])
            case _:
                return []


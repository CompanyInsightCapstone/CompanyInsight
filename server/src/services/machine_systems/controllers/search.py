import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from machine_systems.models.database import *
from machine_systems.models.company import *
from machine_systems.nearest_neighbors.model.inference import compute_query_embedding


class SearchController:
    def __init__(self, database):
        Company.connect(database)

    def search(self, query_text, limit=20):
        query_embeddings = compute_query_embedding(query_text)
        return Company.query_nearest_neighbors(query_embeddings, limit=limit)

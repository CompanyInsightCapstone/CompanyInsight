import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from models.database import *
from models.company import *
from models.user import *
import random
import numpy as np
from nearest_neighbors.model.inference import (
    compute_document_embedding,
    compute_query_embedding,
)

class RecommendationController:
    def __init__(self, database):
        Company.connect(database)
        User.connect(database)

    def recommendations(self, user_id):
        results = []
        watchlists = User.watchlist(user_id)
        if not watchlists:
            output_dim = 768
            random_vector = np.random.rand(output_dim)
            most_similiar_companies = (
                Company.company_nearest_neighbors(random_vector, k=5)
            ).get("data")
            return {"data": most_similiar_companies, "count": 0}
        watchlist_symbols = set()
        for company in watchlists:
            watchlist_symbols.add(company.get("symbol"))
            company_vector = compute_document_embedding(company)
            most_similiar_companies = (
                Company.company_nearest_neighbors(company_vector, k=5)
            ).get("data")
            for most_similiar_company in most_similiar_companies:
                if not (most_similiar_company["symbol"] in watchlist_symbols):
                    results.append(most_similiar_company)
        random.shuffle(results)
        return {"data": results, "count": len(results)}

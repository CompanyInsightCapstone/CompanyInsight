from models.database import Database
from models.company import Company
from transformers import AutoTokenizer, AutoModel



class SearchController:
    def __init__(self, database):
        Company.connect(database)

    def search(self, query_text, limit=20):
        return Company.nearest_neighbors(query_text, limit=limit)

import sys
import os
import uuid
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
from machine_systems.models.database import Database
from machine_systems.nearest_neighbors.model.inference import compute_document_embedding
from machine_systems.nearest_neighbors.dataset_analysis.utils import load_company_documents



def save_company_embedding(company, company_embedding):
    """Save the company embedding to the database"""
    db = Database()
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO CompanyEmbeddings (id, companyId, companySymbol, vector) VALUES (%s, %s, %s, %s)",
        (str(uuid.uuid4()), company["id"] ,company["symbol"], company_embedding)
    )
    db.commit()


def main():
    db = Database()
    cursor = db.cursor()
    companies = load_company_documents()
    for company in companies:
        company_embedding = compute_document_embedding(company)
        save_company_embedding(company, document_embedding)
    db.commit()
    db.close()



if __name__ == "__main__":
    main()

import os
import sys
import uuid

from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
load_dotenv(env_path)
from ...models.database import Database
from ..model.inference import compute_document_embedding
from .utils import *


def save_company_embedding(company, company_embedding):
    """Save the company embedding to the database"""
    db = Database()
    cursor = db.cursor()
    cursor.execute(
        """INSERT INTO "CompanyEmbeddings" (id, "companyId", "companySymbol", vector) VALUES (%s, %s, %s, %s)""",
        (str(uuid.uuid4()), company["id"], company["symbol"], company_embedding),
    )
    db.commit()


def main():
    db = Database()
    cursor = db.cursor()
    companies = load_company_documents()
    for company in companies:
        company_embedding = compute_document_embedding(company)
        save_company_embedding(company, company_embedding)
    db.commit()
    db.close()


if __name__ == "__main__":
    main()

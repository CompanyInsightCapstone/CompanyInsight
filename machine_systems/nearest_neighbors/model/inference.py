import os
import sys
import uuid
import numpy as np
import torch
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from data_processing.tokenizer import Tokenizer
from model.document_encoder import DocumentEncoder
from model.query_encoder import QueryEncoder
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
if os.path.exists(env_path):
    load_dotenv(env_path)
tokenizer = Tokenizer()
query_encoder = QueryEncoder()
document_encoder = DocumentEncoder()
query_path = "parameters/epoch_5_query_encoder.pt"
document_path = "parameters/epoch_5_document_encoder.pt"
query_path = os.path.join(os.path.dirname(__file__), query_path)
document_path = os.path.join(os.path.dirname(__file__), document_path)
query_encoder.load_state_dict(torch.load(query_path, map_location=torch.device("cpu")))
document_encoder.load_state_dict(torch.load(document_path, map_location=torch.device("cpu")))

def compute_document_embedding(company):
    """Compute embedding for a company document"""
    name = company.get("name", "")
    symbol = company.get("symbol", "")
    description = company.get("description", "")
    exchange = company.get("exchange", "")
    asset_type = company.get("assetType", "")
    document_string = (
        f"{name} [SEP] {symbol} [SEP] {exchange} [SEP] {asset_type} [SEP] {description}"
    )
    document = tokenizer(document_string)

    document_input_ids = document["input_ids"]
    document_attention_mask = document["attention_mask"]

    numerical_features = [
        company.get(key, 0.0)
        for key in [
            "close",
            "open",
            "high",
            "low",
            "volume",
            "simpleMovingAverage",
        ]
    ]
    numerical_features_tensor = torch.tensor([numerical_features], dtype=torch.float)
    encoder_input = {
        "document_input_ids": document_input_ids,
        "document_attention_mask": document_attention_mask,
        "document_numerical_features": numerical_features_tensor,
    }
    document_embedding = document_encoder(encoder_input)
    return document_embedding.detach().cpu().numpy().tolist()[0]


def compute_query_embedding(query_raw):
    """Compute embedding for a query string"""
    query = tokenizer(query_raw)
    query_input = {
        "query_input_ids": query["input_ids"],
        "query_attention_mask": query["attention_mask"],
    }
    query_embedding = query_encoder(query_input)
    return query_embedding.detach().cpu().numpy().tolist()[0]


def save_company_embedding(company, company_embedding):
    """Save the company embedding to the database"""
    try:
        import importlib.util
        import os
        possible_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/database.py")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../models/database.py"))
        ]

        db_module = None
        for path in possible_paths:
            if os.path.exists(path):
                print(f"Found database module at: {path}")
                spec = importlib.util.spec_from_file_location("database_module", path)
                db_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(db_module)
                break

        if db_module is None:
            raise ImportError("Could not find database.py module")

        Database = db_module.Database
        db = Database()
        cursor = db.cursor()
        cursor.execute(
            """INSERT INTO "CompanyEmbeddings" (id, "companyId", "companySymbol", vector) VALUES (%s, %s, %s, %s)""",
            (str(uuid.uuid4()), company["id"], company["symbol"], company_embedding),
        )
        db.commit()
        print(f"Saved embedding for company {company['symbol']}")
    except Exception as e:
        print(f"Error saving embedding for company {company.get('symbol', 'unknown')}: {e}")


def update_vector_database():
    """Update the vector database with embeddings for all companies"""
    try:
        import importlib.util
        import os
        possible_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/database.py")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../models/database.py"))
        ]

        db_module = None
        for path in possible_paths:
            if os.path.exists(path):
                print(f"Found database module at: {path}")
                spec = importlib.util.spec_from_file_location("database_module", path)
                db_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(db_module)
                break

        if db_module is None:
            raise ImportError("Could not find database.py module")
        utils_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../dataset_analysis/utils.py")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../dataset_analysis/utils.py"))
        ]
        utils_module = None
        for path in utils_paths:
            if os.path.exists(path):
                print(f"Found utils module at: {path}")
                spec = importlib.util.spec_from_file_location("utils_module", path)
                utils_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(utils_module)
                break

        if utils_module is None:
            raise ImportError("Could not find utils.py module")

        print("Starting vector database update...")
        Database = db_module.Database
        db = Database()
        companies = utils_module.load_company_documents()
        print(f"Found {len(companies)} companies to process")

        for i, company in enumerate(companies):
            print(f"Processing company {i+1}/{len(companies)}: {company.get('symbol', 'unknown')}")
            company_embedding = compute_document_embedding(company)
            save_company_embedding(company, company_embedding)
        db.commit()
        db.close()
        print("Vector database update completed successfully")
    except Exception as e:
        print(f"Error updating vector database: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    update_vector_database()

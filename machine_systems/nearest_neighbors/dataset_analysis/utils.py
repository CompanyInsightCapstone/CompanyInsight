import os

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from machine_systems.models.database import Database


def config():
    """
    Set up the environment by loading environment variables.

    Returns:
        str: The current directory path
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    machine_systems_dir = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
    env_path = os.path.join(machine_systems_dir, ".env")
    load_dotenv(env_path)

    return current_dir


current_dir = config()
data_dir = os.path.join(current_dir, "data")
analysis_dir = os.path.join(data_dir, "analysis")
os.makedirs(data_dir, exist_ok=True)


def load_csv(file_path):
    """
    Load a CSV file into a pandas DataFrame.

    Args:
        file_path (str): Path to the CSV file

    Returns:
        pandas.DataFrame: The loaded data
    """
    return pd.read_csv(file_path)


def load_parquet(file_path):
    """
    Load a Parquet file into a pandas DataFrame.

    Args:
        file_path (str): Path to the Parquet file

    Returns:
        pandas.DataFrame: The loaded data
    """
    return pd.read_parquet(file_path)


def load_companies():
    """Load company data from database"""
    try:
        database = Database()
        cursor = database.cursor()
        cursor.execute('SELECT * FROM "Company";')
        companies = cursor.fetchall()
        return companies
    except Exception as e:
        print(f"Error loading companies: {e}")


def load_company_documents():
    """
    Load company documents from database.
    Returns a list of JSON objects with company data.
    """
    try:
        print("Successfully imported Database class")

        database = Database()
        cursor = database.cursor()
        cursor.execute(
            """
            SELECT
                c.id, c.symbol, c.name, c.exchange, c."assetType", c."ipoDate", c."delistingDate", c.status,
                cd.id as details_id, cd.description,
                cn.id as numericals_id, cn."rawClose", cn.close, cn.open, cn.high, cn.low, cn.volume, cn."simpleMovingAverage"
            FROM "Company" c
            LEFT JOIN "CompanyDetails" cd ON cd."companyId" = c.id
            LEFT JOIN "CompanyNumericals" cn ON cn."companyId" = c.id
            """
        )

        rows = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]

        companies = {}
        for row in rows:
            row_dict = {column_names[i]: value for i, value in enumerate(row)}

            company_id = row_dict["id"]
            companies[company_id] = {
                "id": company_id,
                "symbol": row_dict["symbol"],
                "name": row_dict["name"],
                "exchange": row_dict.get("exchange"),
                "assetType": row_dict.get("assetType"),
                "ipoDate": row_dict.get("ipoDate"),
                "delistingDate": row_dict.get("delistingDate", "N/A"),
                "status": row_dict.get("status"),
                "description": row_dict.get("description"),
                "close": row_dict.get("close"),
                "open": row_dict.get("open"),
                "high": row_dict.get("high"),
                "low": row_dict.get("low"),
                "volume": row_dict.get("volume"),
                "simpleMovingAverage": row_dict.get("simpleMovingAverage"),
            }

        company_list = list(companies.values())
        print(f"Loaded {len(company_list)} company documents from database")
        return company_list
    except Exception as e:
        print(f"Error loading company documents: {e}")
        return []


search_url = "https://en.wikipedia.org/w/api.php"


def sample_system_prompt():
    return np.random.choice(SYSTEM_PROMPTS)


def sample_pattern():
    return np.random.choice(patterns)


def sample_prompt_template():
    return np.random.choice(prompts)


def sample_general_query_template():
    return np.random.choice(GENERAL_QUERY_TEMPLATES)


def sample_company_query_template():
    return np.random.choice(COMPANY_QUERY_TEMPLATES)


def get_sampling_weights(query_type="mixed"):
    if query_type == "company_heavy":
        return 0.8, 0.2
    elif query_type == "balanced":
        return 0.5, 0.5
    elif query_type == "general_heavy":
        return 0.2, 0.8
    else:
        return 0.7, 0.3


def is_company_name_first(query, company_name):
    query_lower = query.lower().strip()
    company_lower = company_name.lower().strip()
    return query_lower.startswith(company_lower)

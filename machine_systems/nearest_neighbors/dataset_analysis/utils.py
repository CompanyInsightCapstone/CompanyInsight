import importlib.util
import os
import sys

import pandas as pd
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))


# Dynamic import of Database class
def import_database():
    """
    Dynamically import the Database class from one of several possible locations.
    This handles different environments (local development vs Docker).

    Returns:
        Database class
    """
    possible_paths = [
        os.path.join("/usr/src/app/models", "database.py"),  # Docker path
        os.path.abspath(
            os.path.join(current_dir, "..", "..", "models", "database.py")
        ),  # Local relative path
        os.path.abspath(
            os.path.join(current_dir, "..", "..", "..", "models", "database.py")
        ),  # Alternative local path
    ]

    for path in possible_paths:
        if os.path.exists(path):
            try:
                print(f"Trying to import Database from: {path}")
                spec = importlib.util.spec_from_file_location("database", path)
                database_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(database_module)
                print(f"Successfully imported Database from: {path}")
                return database_module.Database
            except Exception as e:
                print(f"Failed to import from {path}: {e}")

    raise ImportError(
        "Could not find or import the Database class from any of the expected locations"
    )

Database = import_database()


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

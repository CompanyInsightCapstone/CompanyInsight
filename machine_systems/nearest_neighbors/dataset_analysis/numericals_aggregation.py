import importlib.util
import os
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from utils import config, load_companies, load_csv, load_parquet, import_database
Database = import_database()
import os
import sys
import uuid
import pandas as pd
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
current_dir = config()
data_dir = os.path.join(current_dir, "data")
analysis_dir = os.path.join(data_dir, "analysis")


def calculate_sma(price_data, window=30):
    """Calculate Simple Moving Average for price data"""
    if len(price_data) < window:
        return None
    sma = price_data["close"].rolling(window=window).mean().iloc[-1]
    start_date = price_data["date"].iloc[0]
    end_date = price_data["date"].iloc[-1]
    return sma, start_date, end_date


def load_numerical_data():
    """Load numerical data from parquet file and matching tickers from CSV"""
    try:
        matching_tickers = load_csv(os.path.join(analysis_dir, "matching_tickers.csv"))
        numericals_dataset = load_parquet(os.path.join(data_dir, "full_data.parquet"))
        numericals_dataset = numericals_dataset.sort_values(by="date")
        print(f"Loaded {len(matching_tickers)} matching tickers")
        print(f"Loaded numerical dataset with shape: {numericals_dataset.shape}")
        return numericals_dataset
    except Exception as e:
        print(f"Error loading data: {e}")
        return None


def populate_numericals_table():
    """Populate numericals database with calculated metrics"""
    numericals_dataset = load_numerical_data()
    if numericals_dataset is None:
        print("Failed to load numerical dataset")
        return

    db = Database()
    cursor = db.cursor()
    companies = load_companies()
    if not companies:
        print("No companies found in database")
        return

    processed_count = 0
    matching_count = 0

    for company in companies:
        print(f"Processing company {company}")
        company_id, symbol = company[0], company[2]
        company_numericals = numericals_dataset[numericals_dataset["ticker"] == symbol]

        if len(company_numericals) == 0:
            print(f"No data found for {symbol}")
            continue

        sma_result = calculate_sma(company_numericals)
        if sma_result:
            sma_value, start_date, end_date = sma_result
            print(
                f"{symbol}: SMA={sma_value:.2f}, Date Range: {start_date} to {end_date}"
            )

        most_recent_company_numerical_entry = company_numericals.iloc[-1]

        sql_query = """
            INSERT INTO "CompanyNumericals"
            ("id", "companyId", "companySymbol", "rawClose", "close", "open", "high", "low", "volume", "simpleMovingAverage", "smaStartDate", "smaEndDate")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        params = (
            str(uuid.uuid4()),
            str(company_id),
            str(symbol),
            float(most_recent_company_numerical_entry["close"]),
            float(most_recent_company_numerical_entry["close"]),
            float(most_recent_company_numerical_entry["open"]),
            float(most_recent_company_numerical_entry["high"]),
            float(most_recent_company_numerical_entry["low"]),
            int(most_recent_company_numerical_entry["volume"]),
            float(sma_value) if sma_value else None,
            str(start_date) if start_date else None,
            str(end_date) if end_date else None,
        )

        cursor.execute(sql_query, params)

        processed_count += 1
        if processed_count % 100 == 0:
            print(f"Processed {processed_count}/{len(companies)} companies")
            db.commit()

    print(f"Completed: {processed_count} companies processed")
    db.commit()


if __name__ == "__main__":




    # populate_numericals_table()
    print("errs not found")

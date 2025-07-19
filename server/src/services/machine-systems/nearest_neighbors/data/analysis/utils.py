import os
import sys

import numpy as np
import pandas as pd
from dotenv import load_dotenv


def config(custom_path=None):
    """
    Set up the environment by loading environment variables and adding paths to sys.path.

    Args:
        custom_path (str, optional): Custom path to the root directory. If None,
                                     will calculate based on current file location.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))

    if custom_path:
        machine_systems_dir = os.path.abspath(custom_path)
    else:
        machine_systems_dir = os.path.abspath(
            os.path.join(current_dir, "..", "..", "..")
        )

    env_path = os.path.join(machine_systems_dir, ".env")
    load_dotenv(env_path)

    if machine_systems_dir not in sys.path:
        sys.path.append(machine_systems_dir)
    return current_dir


current_dir = config()
data_dir = os.path.join(current_dir, "data")
analysis_dir = os.path.join(data_dir, "analysis")
os.makedirs(data_dir, exist_ok=True)

from models.database import Database


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
    If database connection fails, returns dummy data for testing.
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
        import traceback

        traceback.print_exc()


SYSTEM_PROMPTS = [
    "Generate short financial search queries (2-10 words) as if you were a user of a stock tracking app. Focus on general investment topics, not specific companies. Provide one query per line with no formatting or explanations.",
    "Create brief stock market search queries (2-10 words) as if you were a user of a financial information app. Focus on sectors, trends, and strategies rather than specific companies. Output raw text only, one query per line, no numbering or extra text.",
    "Produce financial search queries only, each under 10 words. Focus on general investment concepts and market trends. No numbering, bullet points, or formatting. One query per line.",
    "Write search queries that an investor might use to research market trends and sectors rather than individual companies.",
    "Generate search queries related to personal finance and investing strategies.",
    "Create search queries that a financial analyst might use to analyze market trends and economic indicators.",
    "Generate search queries related to investment strategies, portfolio management, and market analysis.",
    "Generate search queries about investment sectors, market trends, and economic indicators.",
    "Create search queries that investors would use to find information about investment strategies and market conditions.",
    "Write search queries that focus on comparing different sectors and investment approaches.",
    "Generate search queries that a day trader might use to track market movements and trends.",
]


patterns = [
    # General market and sector patterns
    "market trends",
    "sector performance",
    "industry outlook",
    "market analysis",
    "economic indicators",
    "market sentiment",
    "market volatility",
    "sector rotation",
    "bull market",
    "bear market",
    "market correction",
    "recession indicators",
    "inflation impact",
    "interest rate effects",
    "market cycles",
    # Investment strategy patterns
    "investment strategies",
    "portfolio diversification",
    "asset allocation",
    "risk management",
    "long term investing",
    "short term trading",
    "value investing",
    "growth investing",
    "dividend investing",
    "passive investing",
    "active investing",
    "dollar cost averaging",
    "technical analysis",
    "fundamental analysis",
    "momentum trading",
    # Financial metrics and analysis
    "financial ratios",
    "valuation metrics",
    "earnings analysis",
    "revenue growth",
    "profit margins",
    "cash flow analysis",
    "debt levels",
    "return on investment",
    "price to earnings",
    "dividend yield",
    # Specific sectors
    "technology stocks",
    "healthcare sector",
    "financial sector",
    "energy stocks",
    "consumer staples",
    "consumer discretionary",
    "industrial sector",
    "utilities stocks",
    "real estate investment",
    "communication services",
    # Original patterns (kept but will be used less frequently)
    "stock price",
    "company overview",
    "sector or industry",
    "rising or falling stock prices",
    "company performance",
    "company financials",
    "stock trends",
    "dividends and yield",
    "earnings reports",
    "market capitalization",
    "analyst ratings and recommendations",
    "portfolio tracking",
]

prompts = [
    # General prompts that don't focus on specific companies
    "Generate search queries for the pattern: {pattern}. Focus on typical user questions or interests.",
    "Create 5 realistic search queries related to {pattern} that a user might enter.",
    "What would users search for regarding {pattern}? Provide concise queries.",
    "List potential search queries focusing on {pattern} that users might use.",
    "Generate natural user queries about {pattern} for financial search.",
    "What would an investor want to know about {pattern}?",
    "Generate queries about {pattern} that don't mention specific company names.",
    "How would someone research {pattern} in the current market?",
    "What questions would investors have about {pattern}?",
    "Create queries that explore {pattern} across different market conditions.",
    # Company-specific prompts (kept but will be used less frequently)
    "Create search queries specifically about {company} related to {pattern}.",
    "Generate 5 different ways users might search for information about {company}.",
    "What would an investor type to find {pattern} information about {company}?",
    "Create search queries that mention {company} by name or ticker symbol.",
    "Generate queries that compare {company} with its competitors regarding {pattern}.",
]

# Added general query templates that don't focus on specific companies
GENERAL_QUERY_TEMPLATES = [
    "best {sector} stocks to buy",
    "top performing {sector} companies",
    "how to invest in {sector}",
    "is {sector} a good investment",
    "{sector} market outlook",
    "{sector} industry trends",
    "undervalued {sector} stocks",
    "high growth {sector} stocks",
    "{sector} ETFs",
    "{sector} mutual funds",
    "how to analyze {sector} stocks",
    "{sector} stocks with dividends",
    "best time to buy {sector} stocks",
    "{sector} market leaders",
    "{sector} market share analysis",
    "investing in {sector} during recession",
    "{sector} stocks for beginners",
    "long term {sector} investments",
    "{sector} stock performance",
    "{sector} investment risks",
    "how to research {sector} companies",
    "{sector} stock valuation",
    "{sector} industry disruption",
    "{sector} future outlook",
    "{sector} competitive analysis",
]


COMPANY_QUERY_TEMPLATES = [
    "{company} stock price",
    "{company} stock",
    "{company} financials",
    "{company} earnings",
    "{company} news",
    "{company} CEO",
    "{company} products",
    "{company} competitors",
    "{company} vs competitors",
    "{company} market cap",
    "{company} dividend",
    "{company} forecast",
    "{company} analyst rating",
    "{company} quarterly report",
    "{company} revenue",
    "{company} profit margin",
    "{company} PE ratio",
    "{company} stock history",
    "buy {company} stock",
    "sell {company} stock",
    "is {company} a good investment",
    "{company} stock prediction",
    "{company} stock chart",
    "{company} latest news",
    "{company} investor relations",
]

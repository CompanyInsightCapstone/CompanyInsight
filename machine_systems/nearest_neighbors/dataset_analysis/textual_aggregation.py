import os
import re
import sys
import time
import uuid
import requests
from utils import config, load_companies

current_dir = config()
data_dir = os.path.join(current_dir, "data")
analysis_dir = os.path.join(data_dir, "analysis")

try:
    from models.database import Database
except ImportError as e:
    print(f"Error importing Database: {e}")
    sys.exit(1)

def fetch(url, params=None, max_retries=10):
    contact_info = os.environ.get("CONTACT_INFO")
    headers = {"User-Agent": f"CompanyInsight/1.0 ({contact_info})"}
    if params is None:
        params = {}

    retries = 0
    while retries < max_retries:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 1))
            print(f"Rate limit exceeded. Retrying in {retry_after} seconds...")
            time.sleep(retry_after)
            retries += 1
        else:
            time.sleep(0.05)
            return response
    raise Exception("Max retries exceeded due to rate limiting.")


def search_wikipedia_page(company_name):
    if not company_name or not company_name.strip():
        print(f"Cannot search Wikipedia with empty company name")
        return None

    params = {
        "action": "query",
        "list": "search",
        "srsearch": company_name,
        "format": "json",
        "srlimit": 1,
    }
    try:
        response = fetch(search_url, params=params)
        if response.status_code == 200:
            data = response.json()
            results = data.get("query", {}).get("search", [])
            if results:
                return results[0].get("title", "")
        else:
            print(
                f"Search failed with status code {response.status_code}: {response.text}"
            )
    except Exception as e:
        print(f"Error searching Wikipedia for '{company_name}': {e}")
    return None


def normalize_company_name(company_name):
    normalized = company_name.lower().strip()
    pattern = r"(,?\s+(inc|ltd|llc|corp|corporation))\.?$"
    normalized = re.sub(pattern, "", normalized)
    normalized = normalized.strip()
    return normalized


def fetch_company_description(company_name):
    """
    Fetch company description from Wikipedia using the MediaWiki API.
    Optimized to try the original name first, then the normalized name if needed.
    """

    page_title = search_wikipedia_page(company_name)
    time.sleep(0.75)
    if not page_title:
        normalized_name = normalize_company_name(company_name)
        if normalized_name != company_name:
            page_title = search_wikipedia_page(normalized_name)
            time.sleep(0.5)
    if not page_title:
        normalized_name = normalize_company_name(company_name)
        return f"No Wikipedia page found for '{company_name}' (normalized: '{normalized_name}')."

    time.sleep(0.75)

    summary_url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "prop": "extracts",
        "exintro": True,
        "explaintext": True,
        "titles": page_title,
        "format": "json",
    }

    try:
        response = fetch(summary_url, params=params)
        if response.status_code == 200:
            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            if pages:
                page_id = list(pages.keys())[0]
                page_data = pages[page_id]

                if "extract" in page_data and page_data["extract"]:
                    return page_data["extract"]
                else:
                    return f"Found page '{page_title}' but no description available."
            else:
                return f"No content found for '{page_title}'."
        else:
            return f"Error fetching summary for '{page_title}': {response.status_code}"
    except Exception as e:
        return f"Error processing description for '{page_title}': {str(e)}"


def populate_details_table():
    """Populate details database with company details"""
    db = Database()
    cursor = db.cursor()
    companies = load_companies()
    processed_count = 0
    success_count = 0
    error_count = 0
    max_companies = len(companies)

    for i, company in enumerate(companies[:max_companies]):
        print(f"Processing company {i+1}/{max_companies}: {company}")
        company_id, company_name, company_symbol = company[0], company[1], company[2]

        try:
            cursor.execute(
                """
                SELECT "id", "description" FROM "CompanyDetails"
                WHERE "companyId" = %s
            """,
                (str(company_id),),
            )

            existing_record = cursor.fetchone()
            existing_record_id = None
            existing_description = None

            if existing_record:
                existing_record_id = existing_record[0]
                existing_description = existing_record[1]
                print(
                    f"Company {company_name} ({company_symbol}) already exists in CompanyDetails, updating..."
                )

            if not company_name or not company_name.strip():
                print(
                    f"Company with ID {company_id} and symbol {company_symbol} has an empty name, skipping"
                )
                error_count += 1
                continue

            company_description = fetch_company_description(company_name)
            print(company_description)

            if (
                not company_description
                or company_description.startswith("No Wikipedia page found")
                or company_description.startswith("Error")
            ):
                print(f"No valid description found for company {company_name}")
                error_count += 1
                continue

            if existing_record_id:
                sql_query = """
                    UPDATE "CompanyDetails"
                    SET "description" = %s
                    WHERE "id" = %s
                """
                params = (
                    str(company_description),
                    existing_record_id,
                )
                cursor.execute(sql_query, params)
                print(f"Updated description for {company_name} ({company_symbol})")
            else:
                sql_query = """
                    INSERT INTO "CompanyDetails"
                    ("id", "companyId", "companySymbol", "description")
                    VALUES (%s, %s, %s, %s)
                """
                params = (
                    str(uuid.uuid4()),
                    str(company_id),
                    str(company_symbol),
                    str(company_description),
                )
                cursor.execute(sql_query, params)
                print(f"Inserted new description for {company_name} ({company_symbol})")

            success_count += 1
            time.sleep(1.5)

        except Exception as e:
            print(f"Error processing {company_name} ({company_symbol}): {e}")
            error_count += 1

        processed_count += 1
        if processed_count % 10 == 0:
            print(f"Progress: {processed_count}/{max_companies} companies processed")
            print(f"Success: {success_count}, Errors: {error_count}")

    print(
        f"Completed: {processed_count} companies processed with {success_count} successes and {error_count} errors"
    )
    db.commit()

if __name__ == "__main__":
    populate_details_table()

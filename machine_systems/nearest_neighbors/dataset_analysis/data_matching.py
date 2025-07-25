import os
import sys
import pandas as pd
from kaggle.api.kaggle_api_extended import KaggleApi
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from utils import config, load_companies, load_csv, load_parquet, import_database
Database = import_database()

current_dir = config()
data_dir = os.path.join(current_dir, "data")
analysis_dir = os.path.join(data_dir, "analysis")
os.makedirs(data_dir, exist_ok=True)


class DataAggregator:
    def __init__(self):
        self.data_dir = data_dir
        self.analysis_dir = analysis_dir
        self.dataset_name = "code1110/yfinance-stock-price-data-for-numerai-signals"
        self.dataset_df = None
        self.companies = None
        self.ticker_analysis = None

    def download_dataset(self):
        """Download dataset from Kaggle and load it into a DataFrame"""

    def download_dataset(self, dataset_name):
        """Download dataset from Kaggle and load it into a DataFrame"""
        print(f"Downloading dataset: {dataset_name}")
        api = KaggleApi()
        api.authenticate()
        api.dataset_download_files(dataset_name, path=data_dir, unzip=True)

        parquet_files = [f for f in os.listdir(data_dir) if f.endswith(".parquet")]
        if parquet_files:
            parquet_path = os.path.join(data_dir, parquet_files[0])
            return load_parquet(os.path.join(data_dir, parquet_files[0]))
        else:
            return None

    def initialize_dataset_df():
        """Initialize dataset DataFrame, loading from disk if available or downloading if not"""
        parquet_files = [f for f in os.listdir(data_dir) if f.endswith(".parquet")]
        if parquet_files:
            parquet_path = os.path.join(data_dir, parquet_files[0])
            return pd.read_parquet(parquet_path)
        else:
            return download_dataset(
                "code1110/yfinance-stock-price-data-for-numerai-signals"
            )

    def process_ticker_symbols(df, companies):
        """Process ticker symbols and analyze the results"""
        dataset_tickers = set(df["ticker"].unique())
        companies_tickers = set([company[1] for company in companies])

        matching_tickers = dataset_tickers.intersection(companies_tickers)
        dataset_only_tickers = dataset_tickers - companies_tickers
        companies_only_tickers = companies_tickers - dataset_tickers

        print("\n=== Ticker Symbol Analysis ===")
        print(f"Dataset unique tickers: {len(dataset_tickers)}")
        print(f"Database unique tickers: {len(companies_tickers)}")
        print(f"Matching tickers: {len(matching_tickers)}")
        print(f"Tickers only in dataset: {len(dataset_only_tickers)}")
        print(f"Tickers only in database: {len(companies_only_tickers)}")

        return {
            "matching": matching_tickers,
            "dataset_only": dataset_only_tickers,
            "companies_only": companies_only_tickers,
        }

    def analyze_dataset(df):
        """Analyze the dataset structure and content"""
        print("\n=== Dataset Analysis ===")
        print(f"Shape: {df.shape}")
        print("\nColumns:")
        for col in df.columns:
            print(f"- {col}: {df[col].dtype}")
        print("\nSample data:")
        print(df.head())

        print("\nMissing values:")
        print(df.isnull().sum())

    def save_ticker_lists(ticker_analysis):
        """Save ticker lists to CSV files for future reference"""
        output_dir = os.path.join(data_dir, "analysis")
        os.makedirs(output_dir, exist_ok=True)
        matching_path = os.path.join(output_dir, "matching_tickers.csv")
        pd.DataFrame(list(ticker_analysis["matching"]), columns=["ticker"]).to_csv(
            matching_path, index=False
        )
        dataset_only_path = os.path.join(output_dir, "dataset_only_tickers.csv")
        pd.DataFrame(list(ticker_analysis["dataset_only"]), columns=["ticker"]).to_csv(
            dataset_only_path, index=False
        )
        companies_only_path = os.path.join(output_dir, "companies_only_tickers.csv")
        pd.DataFrame(
            list(ticker_analysis["companies_only"]), columns=["ticker"]
        ).to_csv(companies_only_path, index=False)

        print(f"\nTicker lists saved to {output_dir}")

    def update_database_smaller_set():
        """Update database to keep only matching tickers"""
        try:
            matching_tickers_path = os.path.join(analysis_dir, "matching_tickers.csv")
            if not os.path.exists(matching_tickers_path):
                print(
                    f"Error: Matching tickers file not found at {matching_tickers_path}"
                )
                return False

            matching_tickers = pd.read_csv(matching_tickers_path)
            db = Database()
            cursor = db.cursor()
            ticker_symbols = matching_tickers["ticker"].tolist()
            cursor.execute(""" SELECT COUNT(*) FROM "Company" """)
            before_count = cursor.fetchone()[0]
            print(f"Companies before update: {before_count}")
            sql_query = (
                """DELETE FROM "Company" WHERE symbol NOT IN (%s) """
                % ", ".join(["'%s'" % ticker for ticker in ticker_symbols])
            )
            cursor.execute(sql_query)
            cursor.execute(""" SELECT COUNT(*) FROM "Company" """)
            after_count = cursor.fetchone()[0]
            print(f"Companies after update: {after_count}")
            print(f"Removed {before_count - after_count} companies")
            db.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"Error updating database: {e}")
            return False


def main():
    """Main function to run the data matching process"""
    df = initialize_dataset_df()
    if df is None:
        print("Failed to load dataset")
        return
    companies = load_companies()
    if not companies:
        print("No companies loaded from database")
        return
    ticker_analysis = process_ticker_symbols(df, companies)
    analyze_dataset(df)
    save_ticker_lists(ticker_analysis)
    update_database_smaller_set()
    print("\nData Matching Complete")


if __name__ == "__main__":
    main()

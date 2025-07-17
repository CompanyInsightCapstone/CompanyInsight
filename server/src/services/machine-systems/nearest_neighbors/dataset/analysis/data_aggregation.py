import os
from utils import *
config()
from models.database import Database

os.chdir(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
analysis_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data/analysis")
matching_tickers = load_csv(os.path.join(analysis_dir, "matching_tickers.csv"))
numericals_dataset = load_parquet(os.path.join(data_dir, "full_data.parquet"))

def update_database_smaller_set():
    db = Database()
    cursor = db.cursor()
    ticker_symbols = matching_tickers['ticker'].tolist()
    sql_query = """DELETE FROM "Company" WHERE symbol NOT IN (%s) """ % ', '.join(["'%s'" % ticker for ticker in ticker_symbols])
    cursor.execute(sql_query)
    cursor.execute(""" SELECT COUNT(*) FROM "Company" """)
    print(cursor.fetchall())
    cursor.close()


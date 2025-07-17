import os
from utils import *
config()
from models.database import Database

os.chdir(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
matching_tickers = load_csv(os.path.join(data_dir, "matching_tickers.csv"))
numericals_dataset = load_parquet(os.path.join(data_dir, "full_data.parquet"))

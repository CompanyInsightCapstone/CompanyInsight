import os
import sys
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

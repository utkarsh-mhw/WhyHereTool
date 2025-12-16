import requests
import pandas as pd
import json
import os
import time
from io import StringIO
from typing import List, Dict, Any

# ====================================================================
# Configuration (Uses Environment Variables for Security)
# ====================================================================

# NOTE: Set these environment variables in your Flask environment (.env file or shell)
DATABRICKS_HOST = os.environ.get("DATABRICKS_HOST", "https://dbc-e1432fe3-232e.cloud.databricks.com")

###### IMPORTANT ###### 
# Do not add the databricks token here, add as environment variable instead, creating problems while pushing to github #
###### IMPORTANT ###### 
DATABRICKS_TOKEN = os.environ.get("DATABRICKS_TOKEN", "databricks_token_placeholder")

DATABRICKS_WAREHOUSE_ID = os.environ.get("DATABRICKS_WAREHOUSE_ID", "b57287b3b881de1c")

# ====================================================================
# Databricks API Functions
# ====================================================================

def fetch_data_from_databricks(sql_query: str) -> pd.DataFrame:
    """
    Executes a SQL query against a Databricks SQL Warehouse and fetches the results.

    NOTE: This uses the Databricks SQL Statement Execution API, which is the
    modern way to interact with SQL warehouses.

    Args:
        sql_query: The SQL statement to run (e.g., "SELECT * FROM atlanta_pois_table").

    Returns:
        A pandas DataFrame containing the query results.
    """
    if not (DATABRICKS_HOST and DATABRICKS_TOKEN and DATABRICKS_WAREHOUSE_ID):
        print("ERROR: Databricks environment variables not fully configured.")
        return pd.DataFrame()

    url = f"{DATABRICKS_HOST}/api/2.0/sql/statements"
    
    headers = {
        "Authorization": f"Bearer {DATABRICKS_TOKEN}",
        "Content-Type": "application/json"
    }

    # 1. Execute the SQL Statement
    payload = {
        "statement": sql_query,
        "warehouse_id": DATABRICKS_WAREHOUSE_ID,
        "row_limit": 100000,  # Set an appropriate limit
        "wait_timeout": "30s" # Wait up to 30 seconds for execution
    }
    
    print(f"Executing SQL query on Databricks Warehouse: {DATABRICKS_WAREHOUSE_ID}")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status() # Raises an exception for 4xx or 5xx status codes
        result_data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Databricks API Request Error: {e}")
        return pd.DataFrame()
    
    # 2. Check for Execution Errors
    if result_data.get('status') and result_data['status']['state'] == 'FAILED':
        print(f"SQL Execution Failed: {result_data['status'].get('error', 'Unknown Error')}")
        return pd.DataFrame()

    # 3. Retrieve Results (The API returns data in columns, not rows)
    try:
        if 'manifest' not in result_data:
             print("Warning: No manifest found in successful response. Check SQL Statement API documentation.")
             return pd.DataFrame()

        column_names = [col['name'] for col in result_data['manifest']['schema']['columns']]
        
        # The result_data contains the first chunk of data inline
        rows = []
        for row_set in result_data.get('result', {}).get('data_array', []):
            # The API returns values as a list matching the column order
            rows.append(row_set)

        df = pd.DataFrame(rows, columns=column_names)
        print(f"Successfully fetched {len(df)} rows from Databricks.")
        return df

    except Exception as e:
        print(f"Error processing Databricks response data: {e}")
        return pd.DataFrame()


def load_databricks_pois(table_name: str = 'restaurants') -> pd.DataFrame:
    """
    A convenience function to run the POI query.
    Assumes the table has 'lat', 'lon', 'type', and 'name' columns.
    """
    sql_query = f"SELECT * FROM {table_name}"
    
    df_pois = fetch_data_from_databricks(sql_query)
    
    if not df_pois.empty:
        # Validate essential columns
        # required_cols = ['lat', 'lon', 'type']
        # for col in required_cols:
        #     if col not in df_pois.columns:
        #         raise ValueError(f"Databricks data is missing required column: '{col}'")
        
        # Ensure coordinates are floats
        df_pois['lat'] = pd.to_numeric(df_pois['latitude'], errors='coerce')
        df_pois['lon'] = pd.to_numeric(df_pois['longitude'], errors='coerce')
        df_pois.dropna(subset=['latitude', 'longitude'], inplace=True)

        print(f"Loaded and validated {len(df_pois)} POIs from Databricks.")
    
    return df_pois

# ====================================================================
# Example Usage (Commented Out)
# ====================================================================
# if __name__ == '__main__':
#     # NOTE: You must set the environment variables above to run this example
#     
#     # Example SQL query to fetch your POI data
#     df = load_databricks_pois(table_name="your_db_catalog.your_schema.atlanta_pois_table")
#     
#     if not df.empty:
#         print(df.head())
#     else:
#         print("Failed to load data.")

def load_pois():
    
    ############## IMPORTANT ##############
    ############### the latest file is combine_datasets_v2.csv - Aayush to update this and its dependecies ##############
    ############## IMPORTANT ##############

    file_to_read = "data/input_data/atlanta_pois.csv"
    df_pois = pd.read_csv(file_to_read)
    # pois_dict = df_pois.to_dict(orient='records')
    # print(f"Loaded {len(df_pois)}")
    # print("Summary by type:")
    # print(df_pois['type'].value_counts())

    '''
    type
    latitude
    longitude
    name
    attribute
    '''
    
    return df_pois

def load_rent():
    file_to_read = "data/input_data/Rent_atlanta.csv"
    df_rent = pd.read_csv(file_to_read)
    return df_rent


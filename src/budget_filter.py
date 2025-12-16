import sys
import requests
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, Polygon
import folium
import json
import time
import numpy as np
import h3
from folium.plugins import HeatMap
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import MinMaxScaler


#load budget data
def load_budget_data(file_name):
    file_path = f'data/input_data/{file_name}.csv'
    raw_budget_data = pd.read_csv(file_path)
    df_budget = raw_budget_data.dropna()
    df_budget = df_budget[['lat', 'lon', 'avg_rent_est']].reset_index(drop=True)
    return df_budget



# fucntion to convert lat long budget data to hex grids with same resolution as poi hex grids
def convert_rent_data_to_h3(df_budget, resolution=8):
    hex_budget_list = []
    for _,r in df_budget.iterrows():
        lat = r['lat']
        lon = r['lon']
        budget = r['avg_rent_est']

        hex_id = h3.latlng_to_cell(lat, lon, resolution)
        hex_budget_list.append({'hex_id': hex_id, 'avg_rent': budget})

    df_budget_hex = pd.DataFrame(hex_budget_list)
    df_budget_hex = df_budget_hex.groupby('hex_id').agg({'avg_rent':'mean'}).reset_index()
    return df_budget_hex


#impute rent
def get_nearest_rent(df_budget_hex, hexagons, K=3):


    # Known rent hexes
    known = df_budget_hex[['hex_id', 'avg_rent']].copy()

    # Prepare output df
    out = pd.DataFrame({'hex_id': hexagons})
    out = out.merge(df_budget_hex[['hex_id', 'avg_rent']], 
                    on='hex_id', how='left')

    # Function to impute a single hex
    def impute_single_hex(target_hex):
        # compute distances to all known-rent hexes
        known['dist'] = known['hex_id'].apply(
            lambda x: h3.grid_distance(target_hex, x)
        )

        # pick top-K nearest neighbors
        nearest = known.sort_values('dist').head(K)

        # imputation method = median of nearest K (you can change)
        return nearest['avg_rent'].median()

    # Apply only on missing rents
    out.loc[out.avg_rent.isnull(), 'avg_rent'] = (
        out.loc[out.avg_rent.isnull(), 'hex_id'].apply(impute_single_hex)
    )

    return out


#merge budget with accesibility scores
def merge_budget_with_accessibility(df_hexagons, df_budget_hex):
    print(f"Merging budget data with {len(df_budget_hex)} with accessibility data with {len(df_hexagons)}")
    df_merged = pd.merge(df_hexagons, df_budget_hex, on="hex_id", how="inner")
    if len(df_merged) == len(df_hexagons):
        print(f"Merge successful: all accessibility hexagons have budget data; total entries: {len(df_merged)}")
    else:
        print("Merge warning: some hex grids have been dropped")
    
    return df_merged
    

#filter by budget
def filter_hexagons_by_budget(df_hexagons, max_budget):

    print(f"Before filtering: {len(df_hexagons)} hexagons")
    
    df_filtered = df_hexagons[df_hexagons['avg_rent'] <= max_budget].copy()
    
    print(f"After filtering: {len(df_filtered)} hexagons")
    
    return df_filtered

import sys
import requests
import pandas as pd
# import geopandas as gpd
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
import json


# def save_pois(all_pois, file_name):

#     df = pd.DataFrame(all_pois)
#     geometry = [Point(xy) for xy in zip(df['lon'], df['lat'])]
#     gdf = gpd.GeoDataFrame(df, geometry=geometry, crs='EPSG:4326')


#     file_path_geojson = f"data/input_data/{file_name}.geojson"
#     gdf.to_file(file_path_geojson, driver='GeoJSON')
#     print("Saved as GeoJSON")


#     file_path_csv = f"data/input_data/{file_name}.csv"
    
#     df.to_csv(file_path_csv, index=False)
#     print("Saved as CSV")


def load_pois(file_name):
    file_to_read = f"data/input_data/{file_name}.csv"
    df_pois = pd.read_csv(file_to_read)
    print(f"Loaded {len(df_pois)}")
    print("Summary by type:")
    print(df_pois['type'].value_counts())

    '''
    type
    latitude
    longitude
    name
    attribute
    '''
    
    return df_pois

# def save_map(folium_map, output_file='suitability_map.html'):
#     """
#     Save a Folium map to an HTML file.
    
#     Parameters:
#     -----------
#     folium_map : folium.Map
#         Folium map object to save.
#     output_file : str, optional
#         Output file name for the HTML map. Default is 'suitability_map.html'.
#     """

#     file_path = f"data/output_data/{output_file}"
#     folium_map.save(file_path)
#     print(f"Saved: {file_path}")


def save_csv(df, filename):

    file_path = f"data/output_data/{filename}.csv"
    df.to_csv(file_path, index=False)
    print(f"Saved CSV: {file_path}")



# def save_geojson(df, filename, geometry_column='hex_id', geometry_func=None):


#     if geometry_column not in df.columns:
#         raise ValueError(f"DataFrame must contain the specified geometry column: '{geometry_column}'")
    

#     df = df.copy()
    
#     # Define default H3 hexagon conversion function if none provided and geometry_column is 'hex_id'
#     if geometry_func is None and geometry_column == 'hex_id':
#         def geometry_func(x):
#             try:
#                 boundary = h3.cell_to_boundary(x)
#                 return Polygon([(lon, lat) for lat, lon in boundary])
#             except Exception as e:
#                 raise ValueError(f"Failed to convert hex_id {x} to polygon: {str(e)}")
    
#     # Convert grid identifiers to geometries if geometry_func is provided
#     if geometry_func is not None:
#         try:
#             df['geometry'] = df[geometry_column].apply(geometry_func)
#         except Exception as e:
#             raise ValueError(f"Failed to apply geometry_func to column '{geometry_column}': {str(e)}")
#     else:
#         # Assume geometry_column contains Shapely geometries
#         df['geometry'] = df[geometry_column]
    
#     # Validate that geometries are valid
#     if not all(df['geometry'].apply(lambda x: isinstance(x, (Polygon, gpd.GeoSeries)))):
#         raise ValueError(f"Column 'geometry' must contain valid Shapely geometries after processing")
    
#     # Create GeoDataFrame
#     gdf = gpd.GeoDataFrame(df, geometry='geometry', crs='EPSG:4326')
    
#     # Save to GeoJSON
#     file_path = f"data/output_data/{filename}.geojson"
#     gdf.to_file(file_path, driver='GeoJSON')
#     print(f"Saved GeoJSON: {file_path}")


def convert_json(df):

    records = df.replace({np.nan: None}).to_dict(orient="records")
    return records

def save_json(data, file_name):
    filepath = f"data/output_data/{file_name}.json"
    with open(filepath, "w") as f:
        json.dump(data, f, indent=4)
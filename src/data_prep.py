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


def calculate_max_min_coordinates(center, radius_km):
    center_lat, center_lon = center
    # Convert radius to lat/lon degrees (approximate)
    lat_radius = radius_km / 111  # 1 degree lat ≈ 111 km
    lon_radius = radius_km / (111 * np.cos(np.radians(center_lat)))  # Adjust for latitude
    
    lat_min = center_lat - lat_radius
    lat_max = center_lat + lat_radius
    lon_min = center_lon - lon_radius
    lon_max = center_lon + lon_radius

    return (lat_min, lat_max, lon_min, lon_max)

    


def keep_pois_within_bbox(df_pois, radius, center = (33.749, -84.388)):
    # print(f"Keeping POIs withing radius {radius} km of center ({center:.4f}, {center:.4f})")
    radius = radius * 1.2 # add some buffer
    lat_min, lat_max, lon_min, lon_max = calculate_max_min_coordinates(center, radius)
    mk = df_pois['lat'].between(lat_min, lat_max) & df_pois['lon'].between(lon_min, lon_max)
    filt_pois = df_pois[mk].copy()
    print(f"Filtered POIs from {len(df_pois)} to {len(filt_pois)} within bbox")
    filt_pois.reset_index(drop=True, inplace=True)
    return filt_pois


def create_hex_grids_with_boundaries(df_pois, size_of_grid = 8):


    h3_resolution = size_of_grid
    ATLANTA_CENTER = (33.749, -84.388)

    lat_min, lat_max = df_pois['lat'].min(), df_pois['lat'].max()
    lon_min, lon_max = df_pois['lon'].min(), df_pois['lon'].max()

    hexagons = set()
    for lat in np.linspace(lat_min, lat_max, 50):
        for lon in np.linspace(lon_min, lon_max, 50):
            hex_id = h3.latlng_to_cell(lat, lon, h3_resolution)
            hexagons.add(hex_id)

    hexagons = list(hexagons)
    print(f"Generated {len(hexagons)} hexagons at resolution {h3_resolution}")

    return hexagons



def create_hex_grids_with_radius(df_pois, radius_km, center = (33.749, -84.388), size_of_grid=8):

    h3_resolution = size_of_grid
    
    # Determine area bounds
    # if center is None:
    #     # Use data bounds (rectangular)
    #     lat_min, lat_max = df_pois['lat'].min(), df_pois['lat'].max()
    #     lon_min, lon_max = df_pois['lon'].min(), df_pois['lon'].max()
    #     use_circular = False
    #     print(f"Using rectangular bounds: lat [{lat_min:.4f}, {lat_max:.4f}], lon [{lon_min:.4f}, {lon_max:.4f}]")
    # else:
        # Use circular boundary



    # # use_circular = True
    center_lat, center_lon = center
    # # Convert radius to lat/lon degrees (approximate)
    # lat_radius = radius_km / 111  # 1 degree lat ≈ 111 km
    # lon_radius = radius_km / (111 * np.cos(np.radians(center_lat)))  # Adjust for latitude
    
    # lat_min = center_lat - lat_radius
    # lat_max = center_lat + lat_radius
    # lon_min = center_lon - lon_radius
    # lon_max = center_lon + lon_radius


    

    lat_min, lat_max, lon_min, lon_max = calculate_max_min_coordinates(center, radius_km)        
    print(f"Using circular boundary: center ({center_lat:.4f}, {center_lon:.4f}), radius {radius_km} km")

    # Generate hexagons
    hexagons = set()
    for lat in np.linspace(lat_min, lat_max, 50):
        for lon in np.linspace(lon_min, lon_max, 50):
            hex_id = h3.latlng_to_cell(lat, lon, h3_resolution)
            hexagons.add(hex_id)

    hexagons = list(hexagons)
    print(f"Generated {len(hexagons)} hexagons (before filtering)")
    
    # Filter by circular boundary if specified

    filtered_hexagons = []
    center_lat, center_lon = center
    
    for hex_id in hexagons:
        hex_lat, hex_lon = h3.cell_to_latlng(hex_id)
        # Calculate distance from center
        lat_diff = abs(hex_lat - center_lat)
        lon_diff = abs(hex_lon - center_lon)
        distance_km = np.sqrt(lat_diff**2 + lon_diff**2) * 111
        
        if distance_km <= radius_km:
            filtered_hexagons.append(hex_id)
    
    print(f"Filtered to {len(filtered_hexagons)} hexagons within {radius_km} km of center")
    hexagons = filtered_hexagons

    return hexagons
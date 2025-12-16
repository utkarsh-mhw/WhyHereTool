

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
import hashlib


def distance_decay_score(hex_center, pois_subset, decay_rate=1.5, max_distance_km=5, invert=False):

    hex_lat, hex_lon = hex_center
    score = 0
    
    for _, poi in pois_subset.iterrows():
        lat_diff = abs(hex_lat - poi['lat'])
        lon_diff = abs(hex_lon - poi['lon'])
        distance_km = np.sqrt(lat_diff**2 + lon_diff**2) * 111
        
        if distance_km <= max_distance_km:
            if invert == False:
                score += 1 / (1 + distance_km) ** decay_rate
            else:
                score -= 1 / (1 + distance_km) ** decay_rate
    
    return score

import hashlib
_ACCESSIBILITY_CACHE = {} # Cache for accessibility scores


def _make_hex_key(hexagons):
    """
    Create a stable hash key from the list of hexagon IDs.
    """
    # Sort for order-independence
    hex_str = "|".join(sorted(hexagons))
    return hashlib.sha1(hex_str.encode("utf-8")).hexdigest()


def calculate_accessibility_scores(
    hexagons,
    df_pois,
    user_has_vehicle,
    poi_types_config=None
):
    """
    Original function with caching logic added.
    Assumes df_pois does not change while the app is running.
    """

    #Build cache key ----
    hex_key = _make_hex_key(hexagons)
    cache_key = (hex_key, bool(user_has_vehicle))

    if cache_key in _ACCESSIBILITY_CACHE:
        print(">> Using cached accessibility scores")
        return _ACCESSIBILITY_CACHE[cache_key].copy()
    #Compute scores if not cached ----
    if poi_types_config is None:
        if user_has_vehicle is False:
            poi_types_config = {
                'restaurant':     {'types': ['restaurant'],     'decay_rate': 1.5, 'max_distance_km': 5,  'invert': False},
                'grocery_store':  {'types': ['grocery_store'],  'decay_rate': 2,   'max_distance_km': 2,  'invert': False},
                'school':         {'types': ['school'],         'decay_rate': 1,   'max_distance_km': 10, 'invert': False},
                'hospital':       {'types': ['hospital'],       'decay_rate': 0.8, 'max_distance_km': 20, 'invert': False},
                'marta_stop':     {'types': ['marta_stop'],     'decay_rate': 0.5, 'max_distance_km': 3,  'invert': False},
                'police_station': {'types': ['police_station'], 'decay_rate': 0.5, 'max_distance_km': 10, 'invert': False},
                'park':           {'types': ['park'],           'decay_rate': 1.0, 'max_distance_km': 3,  'invert': False},
                'crime_incident': {'types': ['crime_incident'], 'decay_rate': 2.0, 'max_distance_km': 3,  'invert': True},
            }
        else:
            poi_types_config = {
                'restaurant':     {'types': ['restaurant'],     'decay_rate': 1.5, 'max_distance_km': 10, 'invert': False},
                'grocery_store':  {'types': ['grocery_store'],  'decay_rate': 2,   'max_distance_km': 8,  'invert': False},
                'school':         {'types': ['school'],         'decay_rate': 1,   'max_distance_km': 15, 'invert': False},
                'hospital':       {'types': ['hospital'],       'decay_rate': 0.8, 'max_distance_km': 20, 'invert': False},
                'marta_stop':     {'types': ['marta_stop'],     'decay_rate': 0.5, 'max_distance_km': 5,  'invert': False},
                'police_station': {'types': ['police_station'], 'decay_rate': 0.5, 'max_distance_km': 10, 'invert': False},
                'park':           {'types': ['park'],           'decay_rate': 1.0, 'max_distance_km': 5,  'invert': False},
                'crime_incident': {'types': ['crime_incident'], 'decay_rate': 2.0, 'max_distance_km': 3,  'invert': True},
            }

    hex_data = []
    print("Calculating accessibility scores for each hexagon...")

    for i, hex_id in enumerate(hexagons):
        if i % 25 == 0:
            print(f"  Processing hexagon {i}/{len(hexagons)}...")

        hex_center = h3.cell_to_latlng(hex_id)
        hex_scores = {'hex_id': hex_id, 'lat': hex_center[0], 'lon': hex_center[1]}

        for poi_type, config in poi_types_config.items():
            pois_subset = df_pois[df_pois['type'].isin(config['types'])]
            score = distance_decay_score(
                hex_center,
                pois_subset,
                decay_rate=config['decay_rate'],
                max_distance_km=config['max_distance_km'],
                invert=config.get('invert', False),
            )
            hex_scores[f"{poi_type}_accessibility"] = score

        hex_data.append(hex_scores)

    df_hexagons = pd.DataFrame(hex_data)
    print(f"\nCalculated accessibility scores for {len(df_hexagons)} hexagons")

    print("\nAccessibility Score Statistics:")
    score_columns = [f"{poi_type}_accessibility" for poi_type in poi_types_config]
    print(df_hexagons[score_columns].describe())
    #save to cache
    _ACCESSIBILITY_CACHE[cache_key] = df_hexagons
    return df_hexagons.copy()

# def calculate_accessibility_scores(hexagons, df_pois, user_has_vehicle ,poi_types_config=None):
#     #update this fucntion to account for accesibility based on whether user has vehicle or not

#     if poi_types_config is None:
#         # poi_types_config = {
#         #     'restaurant': {'types': ['restaurant'], 'decay_rate': 1.5, 'max_distance_km': 10},
#         #     'grocery_store': {'types': ['grocery_store'], 'decay_rate': 2, 'max_distance_km': 8},
#         #     'school': {'types': ['school'], 'decay_rate': 1, 'max_distance_km': 15},
#         #     'hospital': {'types': ['hospital'], 'decay_rate': 0.8, 'max_distance_km': 20},
#         #     'marta_stop': {'types': ['marta_stop'], 'decay_rate': 0.5, 'max_distance_km': 5},
#         #     'police_station': {'types': ['police_station'], 'decay_rate': 0.5, 'max_distance_km': 10},
#         # }
#         #account for whether user has vehicle or not based on max_distance rather than decay rate
#         if user_has_vehicle == False:
#             poi_types_config = {
#                 'restaurant': {'types': ['restaurant'], 'decay_rate': 1.5, 'max_distance_km': 5, 'invert': False},
#                 'grocery_store': {'types': ['grocery_store'], 'decay_rate': 2, 'max_distance_km': 2, 'invert': False},
#                 'school': {'types': ['school'], 'decay_rate': 1, 'max_distance_km': 10, 'invert': False},
#                 'hospital': {'types': ['hospital'], 'decay_rate': 0.8, 'max_distance_km': 20, 'invert': False},
#                 'marta_stop': {'types': ['marta_stop'], 'decay_rate': 0.5, 'max_distance_km': 3, 'invert': False},
#                 'police_station': {'types': ['police_station'], 'decay_rate': 0.5, 'max_distance_km': 10, 'invert': False},
#                 'park': {'types': ['park'], 'decay_rate': 1.0, 'max_distance_km': 3, 'invert': False},
#                 'crime_incident': {'types': ['crime_incident'], 'decay_rate': 2.0, 'max_distance_km': 3, 'invert': True},
#             }
#         else:
#             poi_types_config = {
#                 'restaurant': {'types': ['restaurant'], 'decay_rate': 1.5, 'max_distance_km': 10, 'invert': False},
#                 'grocery_store': {'types': ['grocery_store'], 'decay_rate': 2, 'max_distance_km': 8, 'invert': False},
#                 'school': {'types': ['school'], 'decay_rate': 1, 'max_distance_km': 15, 'invert': False},
#                 'hospital': {'types': ['hospital'], 'decay_rate': 0.8, 'max_distance_km': 20, 'invert': False},
#                 'marta_stop': {'types': ['marta_stop'], 'decay_rate': 0.5, 'max_distance_km': 5, 'invert': False},
#                 'police_station': {'types': ['police_station'], 'decay_rate': 0.5, 'max_distance_km': 10, 'invert': False},
#                 'park': {'types': ['park'], 'decay_rate': 1.0, 'max_distance_km': 5, 'invert': False},
#                 'crime_incident': {'types': ['crime_incident'], 'decay_rate': 2.0, 'max_distance_km': 3, 'invert': True},
#             }
    
#     hex_data = []
#     print("Calculating accessibility scores for each hexagon...")
    
#     for i, hex_id in enumerate(hexagons):
#         if i % 25 == 0:
#             print(f"  Processing hexagon {i}/{len(hexagons)}...")
        
#         hex_center = h3.cell_to_latlng(hex_id)
#         hex_scores = {'hex_id': hex_id, 'lat': hex_center[0], 'lon': hex_center[1]}
        
#         for poi_type, config in poi_types_config.items():
#             pois_subset = df_pois[df_pois['type'].isin(config['types'])]
#             score = distance_decay_score(
#                 hex_center,
#                 pois_subset,
#                 decay_rate=config['decay_rate'],
#                 max_distance_km=config['max_distance_km'],
#                 invert=config.get('invert', False)
#             )
#             hex_scores[f"{poi_type}_accessibility"] = score
        
#         hex_data.append(hex_scores)
    
#     df_hexagons = pd.DataFrame(hex_data)
#     print(f"\nCalculated accessibility scores for {len(df_hexagons)} hexagons")
    
#     print("\nAccessibility Score Statistics:")
#     score_columns = [f"{poi_type}_accessibility" for poi_type in poi_types_config]
#     print(df_hexagons[score_columns].describe())
    
#     return df_hexagons

def normalize_user_weights(raw_weights, method='exponential', scale_factor=2, power=1.5):
    # filtered = {k: v for k, v in raw_weights.items() if v > 0}
    # print(filtered)
    # if not filtered:
    #     raise ValueError("At least one POI type must have importance > 0")

    filtered = {k: v for k, v in raw_weights.items() if v > 0}
    if not filtered:
        raise ValueError("At least one POI type must have importance > 0")
    if method == 'exponential':
        max_rank = max(filtered.values())
        weights = {k: scale_factor ** (max_rank - v) for k, v in filtered.items()}
        total_weight = sum(weights.values())
        weights = {k: v / total_weight for k, v in weights.items()}

    elif method == 'linear':
        total = sum(filtered.values())
        weights = {k: v/total for k, v in filtered.items()}
    
    return weights



def smooth_scores_spatially(df_hexagons, score_columns=None, neighbor_weight=0.3):

    if score_columns is None:
        score_columns = [col for col in df_hexagons.columns if col.endswith('_accessibility')]
    
    print(f"\nApplying spatial smoothing to {len(score_columns)} score columns...")

    
    df_smoothed = df_hexagons.copy()
    
    # Create hex_id lookup for fast access
    hex_to_idx = {hex_id: idx for idx, hex_id in enumerate(df_hexagons['hex_id'])}
    
    # For each hexagon, find neighbors and smooth scores
    for i, row in df_hexagons.iterrows():
        if i % 50 == 0:
            print(f"  Smoothing hexagon {i}/{len(df_hexagons)}...")
        
        hex_id = row['hex_id']
        
        # Get neighbor hexagon IDs (k-ring with k=1 means immediate neighbors)
        neighbor_ids = h3.grid_disk(hex_id, 1)  # Returns set including the hex itself
        # neighbor_ids.discard(hex_id)  # Remove self
        if hex_id in neighbor_ids:
            neighbor_ids.remove(hex_id)  # Remove self
        
        # Find neighbors that exist in our dataset
        valid_neighbors = [nid for nid in neighbor_ids if nid in hex_to_idx]
        
        if not valid_neighbors:
            continue  # No neighbors, keep original scores
        
        # Smooth each score column
        for col in score_columns:
            own_score = row[col]
            neighbor_scores = [df_hexagons.loc[hex_to_idx[nid], col] for nid in valid_neighbors]
            avg_neighbor_score = np.mean(neighbor_scores)
            
            # Weighted average: keep some of own score, blend with neighbors
            smoothed_score = (1 - neighbor_weight) * own_score + neighbor_weight * avg_neighbor_score
            df_smoothed.at[i, col] = smoothed_score
    
    print("Spatial smoothing complete")
    return df_smoothed


def apply_user_weights(df_hexagons, raw_user_weights, smooth_before_weighting=False, neighbor_weight=0.3, normalization_method='exponential'):

    
    print(f"Applying user preferences: {raw_user_weights}")
    # print(f"Sum of weights: {sum(user_weights.values()):.2f} (should be 1.0)")

    user_weights = normalize_user_weights(raw_user_weights, method=normalization_method)
    print(f"Normalized weights ({normalization_method}): {user_weights}")
    
    df_hexagons = df_hexagons.copy()
    
    # Apply spatial smoothing if requested
    if smooth_before_weighting:
        score_columns = [f"{poi_type}_accessibility" for poi_type in user_weights.keys()]
        df_hexagons = smooth_scores_spatially(df_hexagons, score_columns, neighbor_weight)
    
    # Normalize accessibility scores to 0-1 range
    scaler = MinMaxScaler()
    
    for poi_type in user_weights:
        score_column = f"{poi_type}_accessibility"
        norm_column = f"{poi_type}_norm"
        if score_column in df_hexagons.columns:
            df_hexagons[norm_column] = scaler.fit_transform(df_hexagons[[score_column]])
        else:
            raise ValueError(f"Accessibility score for {poi_type} not found in DataFrame")
    
    # Calculate weighted match score
    df_hexagons['user_match_score'] = 0.0
    for poi_type, weight in user_weights.items():
        norm_column = f"{poi_type}_norm"
        if norm_column in df_hexagons.columns:
            df_hexagons['user_match_score'] += df_hexagons[norm_column] * weight
    
    print(f"\nUser Match Score Statistics:")
    print(df_hexagons['user_match_score'].describe())
    
    return df_hexagons
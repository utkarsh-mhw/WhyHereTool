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

def classify_suitability(score, thresholds):
    # if score >= high_threshold:
    #     return 0  # Most Suitable
    # elif score >= medium_threshold:
    #     return 1  # Okay
    # else:
    #     return 2  # Less Suitable
    
    for i, threshold in enumerate(thresholds):
        if score >= threshold:
            return i
    return len(thresholds)
    


def cluster_based_on_score(df_hexagons, score_column='user_match_score', n_tiers=3, suitability_labels=None):

    df_hexagons = df_hexagons.copy()

    if suitability_labels is None:
        suitability_labels = {
            0: 'Most Suitable',
            1: 'Okay',
            2: 'Less Suitable'
        }
    
    percentiles = [(1 - i/n_tiers) for i in range(1, n_tiers)]
    thresholds = [df_hexagons[score_column].quantile(p) for p in percentiles]


    print(f"Classifying into {n_tiers} tiers:")
    for i, (p, t) in enumerate(zip(percentiles, thresholds)):
        print(f"  Tier {i} threshold (top {p*100:.1f}%): {t:.3f}")
    

    df_hexagons['suitability'] = df_hexagons[score_column].apply(
        lambda x: classify_suitability(x, thresholds)
    )
    
    # Generate labels if not provided
    if suitability_labels is None:
        suitability_labels = {i: f'Tier {i+1}' for i in range(n_tiers)}
    
    # Map numerical tiers to readable labels
    df_hexagons['suitability_label'] = df_hexagons['suitability'].map(suitability_labels)
    
    # Print suitability distribution
    print(f"\nSuitability Distribution:")
    print(df_hexagons['suitability_label'].value_counts().sort_index())
    
    # Print tier characteristics
    print("\n" + "="*60)
    print("SUITABILITY TIER CHARACTERISTICS")
    print("="*60)
    
    accessibility_columns = [col for col in df_hexagons.columns 
                           if col.endswith('_accessibility')]
    
    for tier in sorted(suitability_labels.keys()):
        tier_data = df_hexagons[df_hexagons['suitability'] == tier]
        if len(tier_data) == 0:
            continue
        label = suitability_labels[tier]
        print(f"\n{label} ({len(tier_data)} hexagons):")
        print(f"  Match Score Range: {tier_data[score_column].min():.3f} - {tier_data[score_column].max():.3f}")
        
        # Show top 3 accessibility metrics only (to avoid clutter)
        if len(accessibility_columns) <= 3:
            for col in accessibility_columns:
                print(f"  Avg {col.replace('_accessibility', '')}: {tier_data[col].mean():.3f}")
        else:
            for col in accessibility_columns[:3]:
                print(f"  Avg {col.replace('_accessibility', '')}: {tier_data[col].mean():.3f}")
    
    return df_hexagons

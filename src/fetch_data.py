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


def fetch_osm_pois(poi_type, tags, bbox, name_prefix):

    

    overpass_url = "http://overpass-api.de/api/interpreter"
    tag_filters = ''.join([f'["{k}"="{v}"]' for k, v in tags.items()])
    
    overpass_query = f"""
    [out:json][timeout:25];
    (
      node{tag_filters}({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      way{tag_filters}({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      relation{tag_filters}({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
    );
    out center;
    """
    
    print(f"Fetching {poi_type} data")
    
    
    try:
        response = requests.get(overpass_url, params={'data': overpass_query})
        data = response.json()
        
        # Parse results
        pois = []
        for element in data.get('elements', []):
            # Get coordinates (handle nodes vs ways/relations)
            if element['type'] == 'node':
                lat, lon = element['lat'], element['lon']
            elif 'center' in element:
                lat, lon = element['center']['lat'], element['center']['lon']
            else:
                continue
            
            # Extract properties
            props = element.get('tags', {})
            pois.append({
                'type': poi_type,
                'name': props.get('name', 'Unknown'),
                'lat': lat,
                'lon': lon,
                'amenity': props.get('amenity', ''),
                'cuisine': props.get('cuisine', ''),
                'leisure': props.get('leisure', ''),
                'osm_id': element['id']
            })
        
        print(f" Found {len(pois)} {poi_type}")
        return pois
    
    except Exception as e:
        print(f" Error fetching {poi_type}: {e}")
        return []
    

def query_restaurant_data(ATLANTA_BBOX, all_pois):
    restaurants = fetch_osm_pois(
        poi_type='restaurant',
        tags={'amenity': 'restaurant'},
        bbox=ATLANTA_BBOX,
        name_prefix='restaurants'
    )
    all_pois.extend(restaurants)

    time.sleep(1)

    cafes = fetch_osm_pois(
        poi_type='cafe',
        tags={'amenity': 'cafe'},
        bbox=ATLANTA_BBOX,
        name_prefix='cafes'
    )
    all_pois.extend(cafes)
    time.sleep(1)

    return all_pois

def query_park_data(ATLANTA_BBOX, all_pois):

    parks = fetch_osm_pois(
        poi_type='park',
        tags={'leisure': 'park'},
        bbox=ATLANTA_BBOX,
        name_prefix='parks'
    )
    all_pois.extend(parks)
    time.sleep(1)

    return all_pois

def query_hospital_and_clinic_data(ATLANTA_BBOX, all_pois):
    hospitals = fetch_osm_pois(
        poi_type='hospital',
        tags={'amenity': 'hospital'},
        bbox=ATLANTA_BBOX,
        name_prefix='hospitals'
    )
    all_pois.extend(hospitals)
    time.sleep(1)

    clinics = fetch_osm_pois(
        poi_type='clinic',
        tags={'amenity': 'clinic'},
        bbox=ATLANTA_BBOX,
        name_prefix='clinics'
    )
    all_pois.extend(clinics)

    return all_pois





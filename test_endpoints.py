import requests
import json

BASE_URL = "http://localhost:5000"

def test_recommendations():
    print("testing getting a recommendation 2")
    payload = {
        "radius_km": 12,
        "user_weights": {
            "restaurant": 0.49,
            "grocery_store": 0.86,
            "school": 0.72,
            "hospital": 0.7,
            "marta_stop": 0.41,
            "police_station": 0.79,
            "park": 0.75,
            "crime_incident": 0.8
        },
        "budget": 1000,
        "has_car": True,
        "center": [33.749, -84.388],
        "liked_hexagons": ['8844c1a839fffff','8844c1a83bfffff','8844c1a819fffff','8844c1a889fffff','8844c1a801fffff']
    }
    
    response = requests.post(f"{BASE_URL}/data/recommendations", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_save_profile():
    print("testing saving a user profile")
    payload = {
        "user_weights": {
            "restaurant": 0.49,
            "grocery_store": 0.86,
            "school": 0.72,
            "hospital": 0.7,
            "marta_stop": 0.41,
            "police_station": 0.79,
            "park": 0.75,
            "crime_incident": 0.8
        },
        "liked_hexagons": ['8844c1a839fffff','8844c1a83bfffff','8844c1a819fffff','8844c1a889fffff','8844c1a801fffff']
    }
    
    response = requests.post(f"{BASE_URL}/data/save_profile", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_full_pipeline():
    print("testig full pipeline")
    payload = {
        "radius_km": 12,
        "user_weights": {
            "restaurant": 0.49,
            "grocery_store": 0.86,
            "school": 0.72,
            "hospital": 0.7,
            "marta_stop": 0.41,
            "police_station": 0.79,
            "park": 0.75,
            "crime_incident": 0.8
        },
        "budget": 1000,
        "has_car": True,
        "center": [33.749, -84.388]
    }
    
    print("Starting full calculation (this will take ~12 minutes)...")
    response = requests.post(f"{BASE_URL}/data/pois", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response (truncated): {str(response.json())[:500]}...")

if __name__ == "__main__":

    
    test_recommendations()
    test_save_profile()
    test_full_pipeline()
import requests
import pandas as pd

headers = {
    "Authorization": "Bearer R0Ip2eydYBsZa24z-7YucdClUPxkvmIYto2Mu8pyLbsXt9imUrPyovUH_I0byjEjdVQUP1mVf9ucLjwzzcG6wM02uMbR_PCufcIaNtVnP-GLAPE8UfVvf-rnwtwYaXYx"
}
params = {
    "location": "Atlanta, GA",
    "categories": "restaurants",
    # "limit": 50
}

response = requests.get("https://api.yelp.com/v3/businesses/search", headers=headers, params=params)
restaurants = response.json()
restaurants = restaurants.get("businesses", [])
# print(restaurants)
for restaurant in restaurants:
    print(restaurant)
    coords = restaurant.get("coordinates", {})
    restaurant["latitude"] = coords.get("latitude")
    restaurant["longitude"] = coords.get("longitude")

df = pd.DataFrame(restaurants)

# Save as CSV
df.to_csv("restaurants_raw.csv", index=False)

print("CSV created: restaurants_raw.csv")
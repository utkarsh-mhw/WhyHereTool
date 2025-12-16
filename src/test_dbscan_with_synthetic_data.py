"""
Test DBSCAN clustering with simple zone-based synthetic data.
Creates 4 distinct score regions to verify dbscan_score_clustering and dbscan_spatial_clustering.
"""

import pandas as pd
import numpy as np
import h3
import matplotlib.pyplot as plt
from dbscan_clustering import dbscan_score_clustering, dbscan_spatial_clustering, get_cluster_colors
from visualization import create_dbscan_map

# ============================================
# Generate Synthetic Test Data
# ============================================

print("="*60)
print("GENERATING SYNTHETIC TEST DATA")
print("="*60)

# Define grid parameters
ATLANTA_CENTER = (33.749, -84.388)
H3_RESOLUTION = 12

# Generate hexagons in a grid (0.2x0.2 degree area)
hexagons = []
for lat in np.linspace(33.65, 33.85, 30):
    for lon in np.linspace(-84.5, -84.3, 30):
        hex_id = h3.latlng_to_cell(lat, lon, H3_RESOLUTION)
        hexagons.append(hex_id)

hexagons = list(set(hexagons))  # Remove duplicates
print(f"Generated {len(hexagons)} hexagons")

# Create DataFrame with hexagon info
df_test = pd.DataFrame([
    {
        'hex_id': hex_id,
        'lat': h3.cell_to_latlng(hex_id)[0],
        'lon': h3.cell_to_latlng(hex_id)[1]
    }
    for hex_id in hexagons
])

# ============================================
# Assign Scores by Spatial Zones
# ============================================

print("\nAssigning synthetic scores by spatial zones...")

def assign_zone_score(row):
    """Assign user_match_score based on spatial zone with minimal noise."""
    lat, lon = row['lat'], row['lon']
    noise = np.random.normal(0, 0.005)  # Small noise for realism
    
    # Divide into 4 zones
    if lat > 33.75 and lon < -84.4:  # Top-left
        base_score = 0.9
    elif lat > 33.75 and lon >= -84.4:  # Top-right
        base_score = 0.6
    elif lat <= 33.75 and lon < -84.4:  # Bottom-left
        base_score = 0.4
    else:  # Bottom-right
        base_score = 0.2
    
    # Apply noise and clip to [0, 1]
    score = np.clip(base_score + noise, 0.0, 1.0)
    return score

# Assign user_match_score
df_test['user_match_score'] = df_test.apply(assign_zone_score, axis=1)

# Add fake accessibility scores for visualization
df_test['restaurant_accessibility'] = df_test['user_match_score'] * 10
df_test['park_accessibility'] = df_test['user_match_score'] * 5
df_test['clinic_accessibility'] = df_test['user_match_score'] * 1

# Print score statistics
print(f"\nScore Statistics:")
print(df_test['user_match_score'].describe())
print(f"\nScore Distribution:")
print(f"  High (>0.7): {(df_test['user_match_score'] > 0.7).sum()} hexagons")
print(f"  Medium-High (0.5-0.7): {((df_test['user_match_score'] > 0.5) & (df_test['user_match_score'] <= 0.7)).sum()} hexagons")
print(f"  Medium-Low (0.3-0.5): {((df_test['user_match_score'] > 0.3) & (df_test['user_match_score'] <= 0.5)).sum()} hexagons")
print(f"  Low (<0.3): {(df_test['user_match_score'] <= 0.3).sum()} hexagons")

# Plot score distribution
plt.hist(df_test['user_match_score'], bins=20)
plt.title('Synthetic Score Distribution')
plt.xlabel('User Match Score')
plt.ylabel('Count')
plt.savefig('score_distribution.png')
print("\n✓ Saved: score_distribution.png")

# ============================================
# Test DBSCAN Score Clustering
# ============================================

print("\n" + "="*60)
print("TEST 1: DBSCAN Score Clustering")
print("="*60)

df_dbscan_test = dbscan_score_clustering(
    df_test,
    eps=0.05,  # Small eps for clear score separation
    min_samples=10  # Moderate min_samples for robust clusters
)

cluster_colors = get_cluster_colors(df_dbscan_test)

map_dbscan = create_dbscan_map(
    df_dbscan_test,
    user_weights={'restaurant': 1, 'park': 0, 'clinic': 0},
    cluster_colors=cluster_colors,
    use_heatmap=True,
    heatmap_radius=15
)
map_dbscan.save('test_dbscan_score.html')
print("\n✓ Saved: test_dbscan_score.html")

# ============================================
# Test DBSCAN Spatial Clustering
# ============================================

print("\n" + "="*60)
print("TEST 2: DBSCAN Spatial Clustering")
print("="*60)

df_dbscan_spatial_test = dbscan_spatial_clustering(
    df_test,
    eps=0.1,  # Small eps for spatial clustering
    min_samples=10,  # Moderate min_samples
    spatial_weight=0.3  # Lower weight to emphasize scores
)

cluster_colors_spatial = get_cluster_colors(df_dbscan_spatial_test)

map_dbscan_spatial = create_dbscan_map(
    df_dbscan_spatial_test,
    user_weights={'restaurant': 0.5, 'park': 0.3, 'clinic': 0.2},
    cluster_colors=cluster_colors_spatial,
    use_heatmap=True,
    heatmap_radius=15
)
map_dbscan_spatial.save('test_dbscan_spatial.html')
print("\n✓ Saved: test_dbscan_spatial.html")

# ============================================
# Export Test Data
# ============================================

df_test[['hex_id', 'lat', 'lon', 'user_match_score', 
         'restaurant_accessibility', 'park_accessibility', 
         'clinic_accessibility']].to_csv('test_hexagons_synthetic.csv', index=False)
print("\n✓ Saved: test_hexagons_synthetic.csv")

# ============================================
# Summary
# ============================================

print("\n" + "="*60)
print("RESULTS SUMMARY")
print("="*60)

print("\nScore-based DBSCAN:")
print(f"  Clusters: {len([c for c in df_dbscan_test['cluster'].unique() if c != -1])}")
print(f"  Noise: {(df_dbscan_test['cluster'] == -1).sum()}")

print("\nSpatial DBSCAN:")
print(f"  Clusters: {len([c for c in df_dbscan_spatial_test['cluster'].unique() if c != -1])}")
print(f"  Noise: {(df_dbscan_spatial_test['cluster'] == -1).sum()}")

print("\nOpen test_dbscan_score.html, test_dbscan_spatial.html, and score_distribution.png to verify clustering!")



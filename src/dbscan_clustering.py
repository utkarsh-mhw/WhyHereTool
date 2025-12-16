import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler


def dbscan_score_clustering(df_hexagons, score_column='user_match_score', 
                            eps=0.1, min_samples=3):
    print("\n" + "="*60)
    print("DBSCAN CLUSTERING (Score-Based)")
    print("="*60)
    print(f"Parameters: eps={eps}, min_samples={min_samples}")
    
    df_result = df_hexagons.copy()
    
    # Prepare features: just the match score
    X = df_result[[score_column]].values
    
    # DON'T standardize for single-feature clustering
    # Use MinMaxScaler instead to keep interpretable scale
    from sklearn.preprocessing import MinMaxScaler
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    
    print(f"Score range after scaling: [{X_scaled.min():.3f}, {X_scaled.max():.3f}]")
    
    # Run DBSCAN
    dbscan = DBSCAN(eps=eps, min_samples=min_samples)
    clusters = dbscan.fit_predict(X_scaled)
    
    df_result['cluster'] = clusters
    
    # Calculate statistics
    n_clusters = len(set(clusters)) - (1 if -1 in clusters else 0)
    n_noise = (clusters == -1).sum()
    
    print(f"\nResults:")
    print(f"  Clusters found: {n_clusters}")
    print(f"  Noise points: {n_noise}")
    
    # Create cluster labels based on average score
    cluster_info = []
    for cluster_id in sorted(set(clusters)):
        mask = clusters == cluster_id
        count = mask.sum()
        avg_score = df_result.loc[mask, score_column].mean()
        
        if cluster_id == -1:
            label = "Noise/Uncertain"
        else:
            label = f"Cluster {cluster_id}"
        
        cluster_info.append({
            'cluster_id': cluster_id,
            'label': label,
            'count': count,
            'avg_score': avg_score
        })
        
        print(f"  {label}: {count} hexagons, avg score = {avg_score:.3f}")
    
    # Map cluster IDs to labels
    label_map = {info['cluster_id']: info['label'] for info in cluster_info}
    df_result['cluster_label'] = df_result['cluster'].map(label_map)
    
    # Store cluster info for visualization
    df_result.attrs['cluster_info'] = cluster_info
    
    return df_result


def dbscan_spatial_clustering(df_hexagons, score_column='user_match_score',
                              eps=0.5, min_samples=3, 
                              spatial_weight=0.5):

    print("\n" + "="*60)
    print("DBSCAN CLUSTERING (Spatially-Aware)")
    print("="*60)
    print(f"Parameters: eps={eps}, min_samples={min_samples}, spatial_weight={spatial_weight}")
    
    df_result = df_hexagons.copy()
    
    # Prepare features: score + spatial coordinates
    X = df_result[[score_column, 'lat', 'lon']].values
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Apply spatial weighting: adjust the importance of spatial vs score features
    # Column 0 = score, Columns 1-2 = lat/lon
    X_scaled[:, 0] *= (1 - spatial_weight)  # Score weight
    X_scaled[:, 1:] *= spatial_weight  # Spatial weight
    
    # Run DBSCAN
    dbscan = DBSCAN(eps=eps, min_samples=min_samples)
    clusters = dbscan.fit_predict(X_scaled)
    
    df_result['cluster'] = clusters
    
    # Calculate statistics
    n_clusters = len(set(clusters)) - (1 if -1 in clusters else 0)
    n_noise = (clusters == -1).sum()
    
    print(f"\nResults:")
    print(f"  Clusters found: {n_clusters}")
    print(f"  Noise points: {n_noise}")
    
    # Create cluster labels with richer information
    cluster_info = []
    for cluster_id in sorted(set(clusters)):
        mask = clusters == cluster_id
        count = mask.sum()
        avg_score = df_result.loc[mask, score_column].mean()
        
        # Calculate spatial extent (how spread out the cluster is)
        if cluster_id != -1:
            lat_range = df_result.loc[mask, 'lat'].max() - df_result.loc[mask, 'lat'].min()
            lon_range = df_result.loc[mask, 'lon'].max() - df_result.loc[mask, 'lon'].min()
            spatial_extent = np.sqrt(lat_range**2 + lon_range**2) * 111  # Rough km
        else:
            spatial_extent = 0
        
        if cluster_id == -1:
            label = "Noise/Uncertain"
        else:
            label = f"Region {cluster_id}"
        
        cluster_info.append({
            'cluster_id': cluster_id,
            'label': label,
            'count': count,
            'avg_score': avg_score,
            'spatial_extent_km': spatial_extent
        })
        
        if cluster_id == -1:
            print(f"  {label}: {count} hexagons")
        else:
            print(f"  {label}: {count} hexagons, avg score = {avg_score:.3f}, extent = {spatial_extent:.1f} km")
    
    # Map cluster IDs to labels
    label_map = {info['cluster_id']: info['label'] for info in cluster_info}
    df_result['cluster_label'] = df_result['cluster'].map(label_map)
    
    # Store cluster info for visualization
    df_result.attrs['cluster_info'] = cluster_info
    
    return df_result


def get_cluster_colors(df_hexagons, cluster_column='cluster', score_column='user_match_score',
                      noise_color='#808080'):

    # Calculate average score for each cluster
    cluster_scores = df_hexagons.groupby(cluster_column)[score_column].mean().sort_values(ascending=False)
    
    # Remove noise cluster if present
    non_noise_clusters = [c for c in cluster_scores.index if c != -1]
    
    if not non_noise_clusters:
        return {-1: noise_color}
    
    # Create gradient from green (high) to red (low)
    colors = {}
    n_clusters = len(non_noise_clusters)
    
    for i, cluster_id in enumerate(non_noise_clusters):
        # Interpolate between green and red via yellow
        # High score: green (120 hue), Medium: yellow (60 hue), Low: red (0 hue)
        hue = 120 * (1 - i / max(n_clusters - 1, 1))  # 120 to 0
        
        # Convert HSV to RGB
        import colorsys
        rgb = colorsys.hsv_to_rgb(hue / 360, 0.7, 0.9)
        hex_color = '#{:02x}{:02x}{:02x}'.format(
            int(rgb[0] * 255),
            int(rgb[1] * 255),
            int(rgb[2] * 255)
        )
        colors[cluster_id] = hex_color
    
    # Add noise color
    if -1 in df_hexagons[cluster_column].values:
        colors[-1] = noise_color
    
    return colors
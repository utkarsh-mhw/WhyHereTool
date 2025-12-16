import pandas as pd
import folium
from folium.plugins import HeatMap
from shapely.geometry import Polygon
import h3
import numpy as np


def get_tier_colors(n_tiers):
    """Generate color gradient for n tiers."""
    if n_tiers == 3:
        return {
            0: '#2ecc71',  # Green
            1: '#f39c12',  # Orange
            2: '#e74c3c'   # Red
        }
    
    # For any other n_tiers, generate gradient
    colors = {}
    for i in range(n_tiers):
        ratio = i / (n_tiers - 1) if n_tiers > 1 else 0
        # Green (46,204,113) → Yellow (241,196,15) → Red (231,76,60)
        if ratio < 0.5:
            # Green to Yellow
            r = int(46 + (241 - 46) * (ratio * 2))
            g = int(204 + (196 - 204) * (ratio * 2))
            b = int(113 + (15 - 113) * (ratio * 2))
        else:
            # Yellow to Red
            r = int(241 + (231 - 241) * ((ratio - 0.5) * 2))
            g = int(196 + (76 - 196) * ((ratio - 0.5) * 2))
            b = int(15 + (60 - 15) * ((ratio - 0.5) * 2))
        colors[i] = f'#{r:02x}{g:02x}{b:02x}'
    
    return colors

def hex_to_polygon(hex_id):
    """Convert H3 hexagon ID to Shapely polygon."""
    try:
        boundary = h3.cell_to_boundary(hex_id)
        return Polygon([(lon, lat) for lat, lon in boundary])
    except Exception as e:
        raise ValueError(f"Failed to convert hex_id {hex_id} to polygon: {str(e)}")


def create_dbscan_map(df_hexagons, user_weights, cluster_colors=None,
                     center=(33.749, -84.388), zoom_start=11, 
                     use_heatmap=True, heatmap_radius=15):

    # Initialize map
    m = folium.Map(location=center, zoom_start=zoom_start, tiles='CartoDB positron')
    
    # Get cluster colors if not provided
    if cluster_colors is None:
        from dbscan_clustering import get_cluster_colors
        cluster_colors = get_cluster_colors(df_hexagons)
    
    # Add title
    n_clusters = len([c for c in df_hexagons['cluster'].unique() if c != -1])
    n_noise = (df_hexagons['cluster'] == -1).sum()
    
    title_html = f'''
    <div style="position: fixed; top: 10px; left: 50%; transform: translateX(-50%); 
                width: 700px; height: auto; background-color: white; border:2px solid grey; 
                z-index:9999; font-size:16px; font-weight:bold; padding: 15px; text-align: center;">
        DBSCAN Clustering Results<br>
        <span style="font-size: 13px; font-weight: normal; color: #666;">
        {n_clusters} Clusters Found | {n_noise} Uncertain Areas<br>
        User Preferences: {', '.join([f'{k.capitalize()}: {v*100:.0f}%' for k, v in user_weights.items()])}
        </span>
    </div>
    '''
    m.get_root().html.add_child(folium.Element(title_html))
    
    # Add hexagons with cluster colors
    print("Adding hexagons to map...")
    for idx, row in df_hexagons.iterrows():
        if idx % 50 == 0:
            print(f"  Added {idx}/{len(df_hexagons)} hexagons...")
        
        try:
            polygon = hex_to_polygon(row['hex_id'])
            cluster_id = row['cluster']
            color = cluster_colors.get(cluster_id, '#808080')
            
            # Accessibility scores for popup
            access_cols = [col for col in df_hexagons.columns if col.endswith('_accessibility')]
            access_info = '<br>'.join([
                f"{col.replace('_accessibility', '').capitalize()}: {row[col]:.2f}"
                for col in access_cols
            ])
            
            popup_content = f"""
                <b>{row['cluster_label']}</b><br>
                Match Score: {row['user_match_score']:.3f}<br><br>
                <b>Accessibility:</b><br>
                {access_info}
            """
            
            folium.Polygon(
                locations=[(lat, lon) for lon, lat in polygon.exterior.coords],
                color=color,
                fill=True,
                fill_color=color,
                fill_opacity=0.5,
                weight=1,
                popup=popup_content
            ).add_to(m)
        except Exception as e:
            print(f"Warning: Failed to add hexagon {row['hex_id']}: {str(e)}")
    
    # Add smooth heatmap overlay
    if use_heatmap:
        print("Adding heatmap overlay for smooth visualization...")
        heat_data = []
        for _, row in df_hexagons.iterrows():
            # Use match score as intensity (higher score = more intense)
            heat_data.append([row['lat'], row['lon'], row['user_match_score']])
        
        HeatMap(
            heat_data,
            radius=heatmap_radius,
            blur=20,
            max_zoom=13,
            gradient={
                0.0: '#e74c3c',  # Red (low score)
                0.5: '#f39c12',  # Orange
                0.7: '#f1c40f',  # Yellow
                1.0: '#2ecc71'   # Green (high score)
            }
        ).add_to(m)
    
    # Add legend
    cluster_counts = df_hexagons['cluster_label'].value_counts().to_dict()
    
    # Sort clusters by average score for legend
    cluster_order = df_hexagons.groupby('cluster')['user_match_score'].mean().sort_values(ascending=False).index
    
    legend_html = '''
    <div style="position: fixed; bottom: 50px; left: 50px; 
                background-color: white; padding: 15px; 
                border: 2px solid grey; z-index: 9999; font-size: 14px;
                max-height: 400px; overflow-y: auto;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Discovered Clusters</p>
    '''
    
    for cluster_id in cluster_order:
        if cluster_id == -1:
            continue  # Add noise at the end
        label = df_hexagons[df_hexagons['cluster'] == cluster_id]['cluster_label'].iloc[0]
        color = cluster_colors.get(cluster_id, '#808080')
        count = cluster_counts.get(label, 0)
        avg_score = df_hexagons[df_hexagons['cluster'] == cluster_id]['user_match_score'].mean()
        legend_html += f'''
        <p style="margin: 5px 0;">
            <span style="color:{color}; font-size: 20px;">●</span> 
            {label} ({count} areas, score: {avg_score:.2f})
        </p>
        '''
    
    # Add noise at the end
    if -1 in df_hexagons['cluster'].values:
        noise_label = df_hexagons[df_hexagons['cluster'] == -1]['cluster_label'].iloc[0]
        noise_count = cluster_counts.get(noise_label, 0)
        legend_html += f'''
        <p style="margin: 5px 0;">
            <span style="color:#808080; font-size: 20px;">●</span> 
            {noise_label} ({noise_count} areas)
        </p>
        '''
    
    legend_html += '''
        <p style="margin: 15px 0 5px 0; font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px;">
            Color Gradient
        </p>
        <p style="margin: 5px 0; font-size: 12px;">
            🟢 Green = High Match Score<br>
            🟡 Yellow = Medium Match<br>
            🔴 Red = Low Match
        </p>
    </div>
    '''
    
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return m


def create_suitability_map(df_hexagons, user_weights, center=(33.749, -84.388), 
                         zoom_start=11, tiles='CartoDB positron', 
                         colormap=None, title='Area Suitability Map', 
                         suitability_column='suitability', 
                         label_column='suitability_label', 
                         score_column='user_match_score', 
                         accessibility_columns=None):

    # Validate input DataFrame
    required_columns = ['hex_id', suitability_column, label_column, score_column]
    missing_columns = [col for col in required_columns if col not in df_hexagons.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns in df_hexagons: {missing_columns}")
    
    # Determine accessibility columns if not provided
    if accessibility_columns is None:
        accessibility_columns = [col for col in df_hexagons.columns if col.endswith('_accessibility')]
    
    # Initialize map
    m = folium.Map(location=center, zoom_start=zoom_start, tiles=tiles)
    # m = folium.Map(location=center, zoom_start=zoom_start, tiles=tiles)
    
    # Hardcoded colors
    n_tiers = df_hexagons[suitability_column].nunique()
    colors = get_tier_colors(n_tiers)
    # colors = {
    #     0: '#2ecc71',  # Green - Most Suitable
    #     1: '#f39c12',  # Orange - Okay
    #     2: '#e74c3c'   # Red - Less Suitable
    # }
    
    # Add title
    title_html = f'''
    <div style="position: fixed; top: 10px; left: 50%; transform: translateX(-50%); 
                width: 700px; height: auto; background-color: white; border:2px solid grey; 
                z-index:9999; font-size:16px; font-weight:bold; padding: 15px; text-align: center;">
        {title}<br>
        <span style="font-size: 13px; font-weight: normal; color: #666;">
        User Preferences: {', '.join([f'{k.capitalize()}: {v*100:.0f}%' for k, v in user_weights.items()])}
        </span>
    </div>
    '''
    m.get_root().html.add_child(folium.Element(title_html))
    
    # Add hexagons
    print("Adding hexagons to map...")
    for idx, row in df_hexagons.iterrows():
        if idx % 50 == 0:
            print(f"  Added {idx}/{len(df_hexagons)} hexagons...")
        
        try:
            polygon = hex_to_polygon(row['hex_id'])
            tier = row[suitability_column]
            
            if tier not in colors:
                continue
            
            popup_content = f"""
                <b>{row[label_column]}</b><br>
                Match Score: {row[score_column]:.3f}<br><br>
                <b>Accessibility Scores:</b><br>
                {''.join([f"{col.replace('_accessibility', '').capitalize()}: {row[col]:.2f}<br>" 
                          for col in accessibility_columns])}
            """
            
            folium.Polygon(
                locations=[(lat, lon) for lon, lat in polygon.exterior.coords],
                color=colors[tier],
                fill=True,
                fill_color=colors[tier],
                fill_opacity=0.6,
                weight=1,
                popup=popup_content
            ).add_to(m)
        except Exception as e:
            print(f"Warning: Failed to add hexagon {row['hex_id']}: {str(e)}")
    
    # Add legend
    label_counts = df_hexagons[label_column].value_counts().to_dict()
    legend_html = f'''
    <div style="position: fixed; bottom: 50px; left: 50px; 
                background-color: white; padding: 15px; 
                border: 2px solid grey; z-index: 9999; font-size: 14px;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Area Suitability</p>
        {''.join([f'<p style="margin: 5px 0;"><span style="color:{colors[tier]}; font-size: 20px;">●</span> {label} ({label_counts.get(label, 0)} areas)</p>' 
                  for tier, label in sorted(df_hexagons[[suitability_column, label_column]].drop_duplicates().set_index(suitability_column)[label_column].to_dict().items())])}
        <p style="margin: 15px 0 5px 0; font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px;">User Weights</p>
        {''.join([f'<p style="margin: 5px 0; font-size: 12px;">{k.capitalize()}: {v*100:.0f}%</p>' 
                  for k, v in user_weights.items()])}
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return m
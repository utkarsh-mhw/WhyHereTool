import streamlit as st
import pydeck as pdk
import pandas as pd
import json
import requests
import h3


# pdk.settings.mapbox_api_key = "test_token"
# Replace your current line 9 with these 2 lines:
# import os
# os.environ["MAPBOX_TOKEN"] = "test_token"

# ============================================================================
# PAGE CONFIGURATION
# ============================================================================
st.set_page_config(
    page_title="WhyHere - Atlanta Livability Analytics",
    page_icon="🏙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ============================================================================
# CUSTOM CSS FOR BETTER STYLING
# ============================================================================
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        padding: 1rem 0;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    .stButton>button {
        width: 100%;
        background-color: #1f77b4;
        color: white;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# TITLE
# ============================================================================
st.markdown('<p class="main-header">🏙️ WhyHere - Atlanta Livability Analytics</p>', unsafe_allow_html=True)
st.markdown("---")

# ============================================================================
# SESSION STATE INITIALIZATION
# ============================================================================
if 'data' not in st.session_state:
    st.session_state.data = None
if 'calculated' not in st.session_state:
    st.session_state.calculated = False

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def load_static_json(filename='output.json'):
    """Load pre-computed JSON for demo"""
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        st.error(f"File {filename} not found!")
        return None

def call_backend_api(payload, backend_url='http://localhost:5000/data/pois'):
    """Call Flask backend API"""
    try:
        response = requests.post(backend_url, json=payload, timeout=60)
        if response.status_code == 200:
            result = response.json()
            return result.get('data', [])
        else:
            st.error(f"Backend error: {response.status_code}")
            return None
    except Exception as e:
        st.error(f"Failed to connect to backend: {str(e)}")
        return None

def get_color_from_score(score):
    """Convert match score (0-1) to RGB color (red to green)"""
    # Red (low score) → Yellow → Green (high score)
    r = int(255 * (1 - score))
    g = int(255 * score)
    b = 50
    return [r, g, b, 180]

# ============================================================================
# LAYOUT: 3 COLUMNS
# ============================================================================
col_left, col_center, col_right = st.columns([1, 2.5, 1])

# ============================================================================
# LEFT COLUMN: USER INPUTS
# ============================================================================
with col_left:
    st.header("⚙️ Configuration")
    
    # Mode selection
    mode = st.radio(
        "Demo Mode",
        ["Use Static JSON (Fast)", "Call Backend API (Live)"],
        help="Static mode loads pre-computed results. API mode calls your Flask backend."
    )
    use_backend = mode == "Call Backend API (Live)"
    
    st.markdown("---")
    
    # Location inputs
    st.subheader("📍 Location")
    center_lat = st.number_input("Center Latitude", value=33.749, format="%.6f")
    center_lon = st.number_input("Center Longitude", value=-84.388, format="%.6f")
    radius_miles = st.slider("Search Radius (miles)", 1, 20, 12)
    
    st.markdown("---")
    
    # Budget
    st.subheader("💰 Budget")
    budget = st.number_input("Max Monthly Rent ($)", min_value=500, max_value=5000, value=1500, step=50)
    
    st.markdown("---")
    
    # Transportation
    st.subheader("🚗 Transportation")
    has_car = st.radio("Do you have a car?", ["Yes", "No"]) == "Yes"
    
    st.markdown("---")
    
    # POI Importance Rankings
    st.subheader("🎯 Feature Importance")
    st.caption("Rate each feature: 0 = Not Important, 3 = Very Important")
    
    poi_weights = {}
    poi_weights['restaurant'] = st.slider("🍽️ Restaurants", 0, 3, 2, key='restaurant')
    poi_weights['grocery_store'] = st.slider("🛒 Grocery Stores", 0, 3, 2, key='grocery')
    poi_weights['school'] = st.slider("🏫 Schools", 0, 3, 1, key='school')
    poi_weights['hospital'] = st.slider("🏥 Hospitals", 0, 3, 2, key='hospital')
    poi_weights['marta_stop'] = st.slider("🚇 MARTA Stops", 0, 3, 1 if not has_car else 0, key='marta')
    poi_weights['police_station'] = st.slider("👮 Police Stations", 0, 3, 1, key='police')
    poi_weights['park'] = st.slider("🌳 Parks", 0, 3, 2, key='park')
    poi_weights['crime_incident'] = st.slider("🚨 Avoid Crime", 0, 3, 3, key='crime')
    
    st.markdown("---")
    
    # Calculate button
    if st.button("🚀 Calculate Best Areas", type="primary"):
        with st.spinner("Analyzing Atlanta neighborhoods..."):
            if use_backend:
                # Prepare payload for backend
                payload = {
                    "radius_km": radius_miles,  # Backend expects miles, converts internally
                    "center": [center_lat, center_lon],
                    "user_weights": poi_weights,
                    "budget": budget,
                    "has_car": has_car
                }
                
                data = call_backend_api(payload)
                if data:
                    st.session_state.data = data
                    st.session_state.calculated = True
                    st.success(f"✅ Found {len(data)} suitable areas!")
            else:
                # Load static JSON
                data = load_static_json('data/output_data/combined_data_outputs_json.json')
                if data:
                    st.session_state.data = data
                    st.session_state.calculated = True
                    st.success(f"✅ Loaded {len(data)} areas from static data!")

# ============================================================================
# CENTER COLUMN: MAP
# ============================================================================
with col_center:
    st.header("🗺️ Livability Heatmap")
    
    if st.session_state.calculated and st.session_state.data:
        # Convert to DataFrame
        df = pd.DataFrame(st.session_state.data)
        
        # Add hex boundary coordinates for visualization
        # Add hex boundary coordinates for visualization
        def hex_to_polygon_coords(hex_id):
            """Universal H3 → pydeck polygon converter (works with h3-py 3.x and 4.x)"""
            try:
                # New h3-py v4+ (returns lon, lat)
                boundary = h3.cell_to_boundary(hex_id, geo_json=True)
                coords = [list(point) for point in boundary]
            except TypeError:
                # Old h3-py v3.x (returns lat, lon)
                boundary = h3.cell_to_boundary(hex_id)
                coords = [[lon, lat] for lat, lon in boundary]
            
            if coords:
                coords.append(coords[0])  # Close ring
            return coords

        # Apply it
        df['polygon'] = df['hex_id'].apply(hex_to_polygon_coords)
        
        # Normalize scores to 0-1 range for consistent coloring
        if 'user_match_score' in df.columns:
            min_score = df['user_match_score'].min()
            max_score = df['user_match_score'].max()
            df['normalized_score'] = (df['user_match_score'] - min_score) / (max_score - min_score) if max_score > min_score else 0.5
        else:
            df['normalized_score'] = 0.5
        
        # Create color column
        df['fill_color'] = df['normalized_score'].apply(get_color_from_score)
        
        # Create pydeck layer
        layer = pdk.Layer(
            "PolygonLayer",
            df,
            get_polygon="polygon",
            get_fill_color="fill_color",
            get_line_color=[255, 255, 255, 100],
            get_line_width=20,
            pickable=True,
            auto_highlight=True,
        )
        
        # Set view state
        view_state = pdk.ViewState(
            latitude=center_lat,
            longitude=center_lon,
            zoom=11,
            pitch=0,
        )
        
        # Create tooltip
        tooltip = {
            "html": """
            <b>Match Score:</b> {user_match_score:.3f}<br/>
            <b>Monthly Rent:</b> ${avg_rent:.0f}<br/>
            <b>Suitability Tier:</b> {suitability}<br/>
            <b>Hex ID:</b> {hex_id}
            """,
            "style": {
                "backgroundColor": "steelblue",
                "color": "white",
                "fontSize": "12px",
                "padding": "10px"
            }
        }
        
        # Render map
        r = pdk.Deck(
            layers=[layer],
            initial_view_state=view_state,
            tooltip=tooltip,
            map_style="mapbox://styles/mapbox/light-v10"
        )
        
        st.pydeck_chart(r, use_container_width=True)
        
        # Legend
        st.markdown("**Color Scale:** 🔴 Lower Match Score → 🟡 Medium → 🟢 Higher Match Score")
        
    else:
        # Placeholder when no data
        st.info("👈 Configure your preferences and click 'Calculate Best Areas' to see results!")
        
        # Show default map of Atlanta
        view_state = pdk.ViewState(
            latitude=33.749,
            longitude=-84.388,
            zoom=10,
            pitch=0,
        )
        
        r = pdk.Deck(
            layers=[],
            initial_view_state=view_state,
            map_style="mapbox://styles/mapbox/light-v10"
        )
        
        st.pydeck_chart(r, use_container_width=True)

# ============================================================================
# RIGHT COLUMN: TOP 5 RECOMMENDATIONS
# ============================================================================
with col_right:
    st.header("🏆 Top 5 Areas")
    
    if st.session_state.calculated and st.session_state.data:
        df = pd.DataFrame(st.session_state.data)
        
        # Sort by user_match_score and get top 5
        top5 = df.nlargest(5, 'user_match_score')
        
        for idx, (_, row) in enumerate(top5.iterrows(), 1):
            with st.container():
                st.markdown(f"### #{idx}")
                
                # Metrics
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Match Score", f"{row['user_match_score']:.3f}")
                with col2:
                    st.metric("Monthly Rent", f"${row['avg_rent']:.0f}")
                
                st.metric("Suitability Tier", f"{row['suitability']}/10")
                
                # Additional info
                with st.expander("View Details"):
                    st.write(f"**Hex ID:** `{row['hex_id']}`")
                    st.write(f"**Location:** {row['lat']:.4f}, {row['lon']:.4f}")
                    st.write("**Accessibility Scores:**")
                    st.write(f"- Restaurants: {row.get('restaurant_accessibility', 0):.2f}")
                    st.write(f"- Grocery: {row.get('grocery_store_accessibility', 0):.2f}")
                    st.write(f"- Schools: {row.get('school_accessibility', 0):.2f}")
                    st.write(f"- Hospitals: {row.get('hospital_accessibility', 0):.2f}")
                    st.write(f"- MARTA: {row.get('marta_stop_accessibility', 0):.2f}")
                    st.write(f"- Parks: {row.get('park_accessibility', 0):.2f}")
                    st.write(f"- Crime Safety: {row.get('crime_incident_accessibility', 0):.2f}")
                
                st.markdown("---")
    else:
        st.info("Results will appear here after calculation.")

# ============================================================================
# FOOTER
# ============================================================================
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: gray;'>
    Built with Streamlit | WhyHere Analytics Engine | Georgia Tech
    </div>
    """,
    unsafe_allow_html=True
)
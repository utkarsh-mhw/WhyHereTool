from sklearn.neighbors import NearestNeighbors
import pandas as pd
import random
import ast

def read_user_proiles():

    filename = "user_profiles"
    path = f"data/input_data/{filename}.csv"
    df_user_profiles = pd.read_csv(path, usecols=lambda x: x != 'Unnamed: 0')
    df_user_profiles['liked_places'] = df_user_profiles['liked_places'].apply(ast.literal_eval)
    return df_user_profiles

def generate_recommendations(user_weights):

    df_user_profiles = read_user_proiles()

    df_user_profiles = df_user_profiles[df_user_profiles['liked_places'].apply(lambda x: len(x) > 0)]

    feature_cols = [col for col in df_user_profiles.columns if (col != 'name' and col != 'liked_places')]
    samples = df_user_profiles[feature_cols].values

    neigh = NearestNeighbors(n_neighbors=1)
    neigh.fit(samples)

    fake_user_array = [user_weights[col] for col in feature_cols]
    distances, indices = neigh.kneighbors([fake_user_array])

    similarity = 1 - distances[0][0]
    recommended_places = df_user_profiles.iloc[indices[0][0], -1]
    return recommended_places, similarity

def save_user_profile(user_weights, liked_hexagons = []):
    df_user_profiles = read_user_proiles()
    new_row = {
            **user_weights,
            'liked_places': liked_hexagons
        }
    df_profiles = pd.concat([df_user_profiles, pd.DataFrame([new_row])], ignore_index=True)
    df_profiles.to_csv('data/input_data/user_profiles.csv', index=False)

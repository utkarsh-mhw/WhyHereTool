import pandas as pd
import geopandas as gpd


file_path = "/Volumes/workspace/default/q2vol/Public_School_Locations_2021-22.csv"

df = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv(file_path)
)

table_name = "public_school_locations"

(
    df.write
    .format("delta")
    .mode("overwrite")      # overwrite if it exists
    .saveAsTable(table_name)
)


file_path = f"/Volumes/workspace/default/q2vol/atlanta_police_stations.csv"

df = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv(file_path)
)

display(df)

table_name = "atlanta_police_stations"

(
    df.write
    .format("delta")
    .mode("overwrite")
    .saveAsTable(table_name)
)


file_path = "/Volumes/workspace/default/q2vol/ACS_Travel_Time_to_Work_Boundaries_-8209965837122723277.csv"

df = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv(file_path)
)

from pyspark.sql.functions import col

clean_cols = [c.replace(" ", "_")
                 .replace("(", "")
                 .replace(")", "")
                 .replace(",", "")
                 .replace("-", "_")
                 .replace("/", "_")
                 for c in df.columns]

df = df.toDF(*clean_cols)


print(df.columns[:10])  


table_name = "travel_time_to_work"

(
    df.write
    .format("delta")
    .mode("overwrite")
    .saveAsTable(table_name)
)
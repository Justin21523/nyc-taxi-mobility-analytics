import path from "node:path";

export const ROOT_DIR = process.cwd();
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const SAMPLE_TRIPS_PATH = path.join(DATA_DIR, "sample", "sample_trips.parquet");
export const SAMPLE_ZONES_PATH = path.join(DATA_DIR, "sample", "sample_zones.parquet");
export const TRIPS_WAREHOUSE_GLOB = path.join(DATA_DIR, "warehouse", "trips", "**", "*.parquet");
export const ZONES_GEOJSON_PATH = path.join(DATA_DIR, "raw", "reference", "nyc_taxi_zones.geojson");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

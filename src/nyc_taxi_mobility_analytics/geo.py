import json
from pathlib import Path

import pandas as pd

from .config import RAW_ZONES_GEOJSON_PATH
from .download import download_zones_geojson


def ensure_zone_geojson(path: Path = RAW_ZONES_GEOJSON_PATH) -> Path | None:
    if path.exists():
        return path
    try:
        return download_zones_geojson(path)
    except Exception as exc:
        print(f"Could not download NYC taxi zones GeoJSON: {exc}")
        return None


def load_zone_geojson(path: Path = RAW_ZONES_GEOJSON_PATH) -> dict | None:
    geojson_path = ensure_zone_geojson(path)
    if not geojson_path or not geojson_path.exists():
        return None
    return json.loads(geojson_path.read_text())


def choropleth_geojson(metrics: pd.DataFrame, value_column: str = "trip_count") -> dict | None:
    geojson = load_zone_geojson()
    if not geojson:
        return None
    metric_lookup = {
        int(row["location_id"]): {
            "metric_value": float(row[value_column]),
            "trip_count": float(row.get("trip_count", 0)),
            "total_revenue": float(row.get("total_revenue", 0)),
        }
        for _, row in metrics.dropna(subset=["location_id"]).iterrows()
    }
    max_value = max((item["metric_value"] for item in metric_lookup.values()), default=0.0)
    for feature in geojson.get("features", []):
        props = feature.setdefault("properties", {})
        location_id = int(props.get("locationid", 0))
        metric = metric_lookup.get(location_id, {"metric_value": 0.0, "trip_count": 0.0, "total_revenue": 0.0})
        intensity = metric["metric_value"] / max_value if max_value else 0.0
        props.update(metric)
        props["fill_color"] = [255, int(235 - 150 * intensity), int(170 - 120 * intensity), int(80 + 150 * intensity)]
    return geojson


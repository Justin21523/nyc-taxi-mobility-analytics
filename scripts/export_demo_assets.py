from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt

from nyc_taxi_mobility_analytics.analytics import fare_distribution, hourly_demand, routes, top_zones
from nyc_taxi_mobility_analytics.config import DOCS_ASSETS_DIR, DB_PATH, ensure_dirs
from nyc_taxi_mobility_analytics.etl import run_etl
from nyc_taxi_mobility_analytics.forecast import make_forecast


def savefig(path: Path) -> None:
    plt.tight_layout()
    plt.savefig(path, dpi=140)
    plt.close()


def export_overview() -> None:
    zones = top_zones("pickup", 10).sort_values("trip_count")
    zones["zone"] = zones["zone"].fillna("Unknown")
    plt.figure(figsize=(9, 5))
    plt.barh(zones["zone"], zones["trip_count"], color="#1976d2")
    plt.title("Top Pickup Zones")
    plt.xlabel("Trips")
    savefig(DOCS_ASSETS_DIR / "overview_top_zones.png")


def export_demand_forecast() -> None:
    demand = hourly_demand(168)
    forecast = make_forecast().tail(168)
    fig, axes = plt.subplots(2, 1, figsize=(10, 7), sharex=False)
    axes[0].plot(demand["pickup_hour"], demand["trip_count"], color="#00695c")
    axes[0].set_title("Hourly Demand")
    axes[0].set_ylabel("Trips")
    axes[1].plot(forecast["pickup_hour"], forecast["actual"], label="Actual", color="#263238")
    axes[1].plot(forecast["pickup_hour"], forecast["moving_average_forecast"], label="Moving average", color="#ef6c00")
    axes[1].set_title("Forecast Baseline")
    axes[1].set_ylabel("Trips")
    axes[1].legend()
    savefig(DOCS_ASSETS_DIR / "demand_forecast.png")


def export_routes() -> None:
    route_df = routes(15)
    labels = route_df["pickup_zone"].fillna("Unknown") + " -> " + route_df["dropoff_zone"].fillna("Unknown")
    plt.figure(figsize=(10, 6))
    plt.barh(labels[::-1], route_df["trip_count"][::-1], color="#5d4037")
    plt.title("Top Routes by Trip Count")
    plt.xlabel("Trips")
    savefig(DOCS_ASSETS_DIR / "routes.png")


def export_fares() -> None:
    fares = fare_distribution()
    plt.figure(figsize=(9, 5))
    plt.hist(fares["total_amount"], bins=25, color="#7b1fa2", alpha=0.85)
    plt.title("Fare Distribution")
    plt.xlabel("Total amount")
    plt.ylabel("Trips")
    savefig(DOCS_ASSETS_DIR / "fare_distribution.png")


def main() -> None:
    ensure_dirs()
    if not DB_PATH.exists():
        run_etl()
    export_overview()
    export_demand_forecast()
    export_routes()
    export_fares()
    print(f"Wrote demo assets to {DOCS_ASSETS_DIR}")


if __name__ == "__main__":
    main()

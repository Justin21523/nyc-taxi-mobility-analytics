import argparse
import shutil
from pathlib import Path

import pandas as pd

from .config import TRIPS_SAMPLE_PATH, TRIPS_WAREHOUSE_DIR, ZONES_SAMPLE_PATH, ensure_dirs
from .sample_data import main as generate_sample_data
from .warehouse import connect, register_views

REQUIRED_TRIP_COLUMNS = [
    "pickup_datetime",
    "dropoff_datetime",
    "passenger_count",
    "trip_distance",
    "pickup_location_id",
    "dropoff_location_id",
    "fare_amount",
    "tip_amount",
    "total_amount",
]


def discover_parquet_files(input_dir: Path, taxi_type: str | None = None, year: int | None = None, month: int | None = None) -> list[Path]:
    files = sorted(input_dir.rglob("*.parquet"))
    if taxi_type:
        files = [path for path in files if path.name.startswith(f"{taxi_type}_tripdata_")]
    if year:
        files = [path for path in files if f"{year}" in path.as_posix() or f"_{year}-" in path.name]
    if month:
        month_text = f"{month:02d}"
        files = [path for path in files if f"month={month_text}" in path.as_posix() or f"-{month_text}.parquet" in path.name]
    return files


def normalize_zones(zones_path: Path) -> pd.DataFrame:
    if zones_path.suffix.lower() == ".csv":
        zones = pd.read_csv(zones_path)
    else:
        zones = pd.read_parquet(zones_path)
    zones = zones.rename(
        columns={
            "LocationID": "location_id",
            "Borough": "borough",
            "Zone": "zone",
            "service_zone": "service_zone",
            "Service Zone": "service_zone",
        }
    )
    required = ["location_id", "borough", "zone", "service_zone"]
    missing = [col for col in required if col not in zones.columns]
    if missing:
        raise ValueError(f"Missing required zone columns: {missing}")
    return zones[required]


def prepare_zones(zones_path: Path = ZONES_SAMPLE_PATH) -> None:
    zones = normalize_zones(zones_path)
    ZONES_SAMPLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    zones.to_parquet(ZONES_SAMPLE_PATH, index=False)


def load_trips(path: Path, source_file_id: int = 0) -> pd.DataFrame:
    df = pd.read_parquet(path)
    rename_map = {
        "tpep_pickup_datetime": "pickup_datetime",
        "tpep_dropoff_datetime": "dropoff_datetime",
        "lpep_pickup_datetime": "pickup_datetime",
        "lpep_dropoff_datetime": "dropoff_datetime",
        "pickup_datetime": "pickup_datetime",
        "dropOff_datetime": "dropoff_datetime",
        "PULocationID": "pickup_location_id",
        "DOLocationID": "dropoff_location_id",
        "VendorID": "vendor_id",
        "airport_fee": "airport_fee",
        "Airport_fee": "airport_fee",
    }
    df = df.rename(columns=rename_map)
    missing = [col for col in REQUIRED_TRIP_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required trip columns: {missing}")
    if "trip_id" not in df.columns:
        df = df.reset_index(drop=True)
        df["trip_id"] = source_file_id * 100_000_000 + df.index + 1
    if "payment_type" not in df.columns:
        df["payment_type"] = "unknown"
    if "vendor_id" not in df.columns:
        df["vendor_id"] = 0
    if "tolls_amount" not in df.columns:
        df["tolls_amount"] = 0.0
    if "congestion_surcharge" not in df.columns:
        df["congestion_surcharge"] = 0.0
    if "airport_fee" not in df.columns:
        df["airport_fee"] = 0.0
    if "cbd_congestion_fee" not in df.columns:
        df["cbd_congestion_fee"] = 0.0
    df["pickup_datetime"] = pd.to_datetime(df["pickup_datetime"])
    df["dropoff_datetime"] = pd.to_datetime(df["dropoff_datetime"])
    df["year"] = df["pickup_datetime"].dt.year
    df["month"] = df["pickup_datetime"].dt.month
    return df[
        [
            "trip_id",
            "vendor_id",
            "pickup_datetime",
            "dropoff_datetime",
            "passenger_count",
            "trip_distance",
            "pickup_location_id",
            "dropoff_location_id",
            "fare_amount",
            "tip_amount",
            "tolls_amount",
            "congestion_surcharge",
            "airport_fee",
            "cbd_congestion_fee",
            "total_amount",
            "payment_type",
            "year",
            "month",
        ]
    ]


def load_trip_files(paths: list[Path]) -> pd.DataFrame:
    if not paths:
        raise ValueError("No Parquet files found for ETL input")
    frames = [load_trips(path, source_file_id=index) for index, path in enumerate(paths, start=1)]
    return pd.concat(frames, ignore_index=True)


def filter_valid_trips(df: pd.DataFrame) -> pd.DataFrame:
    before = len(df)
    valid = df[
        (df["dropoff_datetime"] > df["pickup_datetime"])
        & (df["fare_amount"] >= 0)
        & (df["total_amount"] >= 0)
        & (df["trip_distance"] >= 0)
        & df["pickup_location_id"].notna()
        & df["dropoff_location_id"].notna()
    ].copy()
    dropped = before - len(valid)
    if dropped:
        print(f"Dropped {dropped} invalid trip rows during ETL normalization")
    return valid


def write_partitioned_trips(df: pd.DataFrame, clean: bool = True) -> None:
    ensure_dirs()
    if clean and TRIPS_WAREHOUSE_DIR.exists():
        shutil.rmtree(TRIPS_WAREHOUSE_DIR)
        TRIPS_WAREHOUSE_DIR.mkdir(parents=True, exist_ok=True)
    for (year, month), part in df.groupby(["year", "month"], sort=True):
        out_dir = TRIPS_WAREHOUSE_DIR / f"year={int(year)}" / f"month={int(month):02d}"
        out_dir.mkdir(parents=True, exist_ok=True)
        part.drop(columns=["year", "month"]).to_parquet(out_dir / f"part-{int(year)}-{int(month):02d}.parquet", index=False)


def build_tables() -> None:
    with connect() as con:
        register_views(con)
        con.execute(
            """
            CREATE OR REPLACE TABLE hourly_demand AS
            SELECT date_trunc('hour', pickup_datetime) AS pickup_hour, count(*) AS trip_count
            FROM trips
            GROUP BY 1
            ORDER BY 1
            """
        )
        con.execute(
            """
            CREATE OR REPLACE TABLE daily_revenue AS
            SELECT CAST(pickup_datetime AS DATE) AS trip_date,
                   count(*) AS trip_count,
                   round(sum(total_amount), 2) AS total_revenue,
                   round(avg(total_amount), 2) AS avg_total_amount
            FROM trips
            GROUP BY 1
            ORDER BY 1
            """
        )
        con.execute(
            """
            CREATE OR REPLACE TABLE route_summary AS
            SELECT pickup_location_id, dropoff_location_id, count(*) AS trip_count,
                   round(sum(total_amount), 2) AS total_revenue,
                   round(avg(trip_distance), 2) AS avg_distance,
                   round(avg(total_amount), 2) AS avg_total_amount
            FROM trips
            GROUP BY 1, 2
            ORDER BY trip_count DESC
            """
        )
        con.execute(
            """
            CREATE OR REPLACE TABLE fare_features AS
            SELECT trip_id, fare_amount, tip_amount, total_amount, trip_distance,
                   CASE WHEN total_amount > 0 THEN tip_amount / total_amount ELSE 0 END AS tip_rate,
                   CASE WHEN trip_distance > 0 THEN total_amount / trip_distance ELSE NULL END AS amount_per_mile
            FROM trips
            """
        )
        con.execute("CREATE OR REPLACE TABLE demand_forecast AS SELECT * FROM hourly_demand WHERE false")


def run_etl(
    input_path: Path = TRIPS_SAMPLE_PATH,
    input_dir: Path | None = None,
    zones_path: Path = ZONES_SAMPLE_PATH,
    taxi_type: str | None = None,
    year: int | None = None,
    month: int | None = None,
) -> None:
    if input_dir is None and (not input_path.exists() or not ZONES_SAMPLE_PATH.exists()):
        generate_sample_data()
    if zones_path.exists():
        prepare_zones(zones_path)
    if input_dir:
        paths = discover_parquet_files(input_dir, taxi_type=taxi_type, year=year, month=month)
        df = load_trip_files(paths)
    else:
        df = load_trips(input_path)
    if year:
        df = df[df["year"] == year]
    if month:
        df = df[df["month"] == month]
    df = filter_valid_trips(df)
    if df.empty:
        raise ValueError("ETL produced zero rows after filters")
    write_partitioned_trips(df)
    build_tables()
    print(f"Loaded {len(df)} rows into {TRIPS_WAREHOUSE_DIR}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=TRIPS_SAMPLE_PATH, help="Sample or NYC TLC Parquet path")
    parser.add_argument("--input-dir", type=Path, help="Directory containing one or more NYC TLC Parquet files")
    parser.add_argument("--zones", type=Path, default=ZONES_SAMPLE_PATH, help="Zone lookup CSV or Parquet path")
    parser.add_argument("--taxi-type", choices=["yellow", "green", "fhvhv"], help="Filter discovered TLC files by taxi type")
    parser.add_argument("--year", type=int, help="Filter rows and files by pickup year")
    parser.add_argument("--month", type=int, help="Filter rows and files by pickup month")
    args = parser.parse_args()
    run_etl(args.input, input_dir=args.input_dir, zones_path=args.zones, taxi_type=args.taxi_type, year=args.year, month=args.month)


if __name__ == "__main__":
    main()

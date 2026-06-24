from nyc_taxi_mobility_analytics.config import TRIPS_SAMPLE_PATH, ZONES_SAMPLE_PATH
from nyc_taxi_mobility_analytics.etl import discover_parquet_files, load_trip_files, load_trips


def test_sample_parquet_is_readable():
    trips = load_trips(TRIPS_SAMPLE_PATH)
    assert not trips.empty
    assert ZONES_SAMPLE_PATH.exists()
    assert {"year", "month", "pickup_datetime", "total_amount"}.issubset(trips.columns)


def test_partition_columns_are_derived():
    trips = load_trips(TRIPS_SAMPLE_PATH)
    assert trips["year"].nunique() == 1
    assert trips["month"].between(1, 12).all()


def test_folder_ingestion_discovers_year_month_files(tmp_path):
    target_dir = tmp_path / "yellow" / "year=2024" / "month=01"
    target_dir.mkdir(parents=True)
    target_path = target_dir / "yellow_tripdata_2024-01.parquet"
    load_trips(TRIPS_SAMPLE_PATH).drop(columns=["year", "month"]).to_parquet(target_path, index=False)

    files = discover_parquet_files(tmp_path, taxi_type="yellow", year=2024, month=1)
    assert files == [target_path]
    trips = load_trip_files(files)
    assert not trips.empty


def test_tlc_optional_schema_columns_are_normalized(tmp_path):
    df = load_trips(TRIPS_SAMPLE_PATH).drop(columns=["year", "month"])
    df = df.rename(
        columns={
            "vendor_id": "VendorID",
            "pickup_datetime": "tpep_pickup_datetime",
            "dropoff_datetime": "tpep_dropoff_datetime",
            "pickup_location_id": "PULocationID",
            "dropoff_location_id": "DOLocationID",
        }
    )
    df["cbd_congestion_fee"] = 0.75
    path = tmp_path / "yellow_tripdata_2025-01.parquet"
    df.to_parquet(path, index=False)

    loaded = load_trips(path)
    assert "cbd_congestion_fee" in loaded.columns
    assert loaded["cbd_congestion_fee"].eq(0.75).all()

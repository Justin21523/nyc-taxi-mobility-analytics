from pathlib import Path

from nyc_taxi_mobility_analytics.download import trip_data_path, trip_data_url, zones_url


def test_trip_data_url_for_default_real_dataset():
    assert trip_data_url("yellow", 2024, "01") == "https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_2024-01.parquet"


def test_trip_data_path_layout():
    path = trip_data_path(Path("data/raw/tlc"), "yellow", 2024, 1)
    assert path.as_posix() == "data/raw/tlc/yellow/year=2024/month=01/yellow_tripdata_2024-01.parquet"


def test_zones_url():
    assert zones_url() == "https://d37ci6vzurychx.cloudfront.net/misc/taxi_zone_lookup.csv"


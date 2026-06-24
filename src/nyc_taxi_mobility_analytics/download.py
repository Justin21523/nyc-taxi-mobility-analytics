import argparse
from pathlib import Path
from urllib.request import urlretrieve

from .config import RAW_REFERENCE_DIR, RAW_TLC_DIR, RAW_ZONES_CSV_PATH, RAW_ZONES_GEOJSON_PATH, ensure_dirs

BASE_URL = "https://d37ci6vzurychx.cloudfront.net"
NYC_OPEN_DATA_BASE_URL = "https://data.cityofnewyork.us/resource"
SUPPORTED_TAXI_TYPES = {"yellow", "green", "fhvhv"}


def month_token(month: int | str) -> str:
    return f"{int(month):02d}"


def trip_data_url(taxi_type: str, year: int, month: int | str) -> str:
    if taxi_type not in SUPPORTED_TAXI_TYPES:
        raise ValueError(f"Unsupported taxi_type: {taxi_type}")
    return f"{BASE_URL}/trip-data/{taxi_type}_tripdata_{year}-{month_token(month)}.parquet"


def trip_data_path(output_dir: Path, taxi_type: str, year: int, month: int | str) -> Path:
    return output_dir / taxi_type / f"year={year}" / f"month={month_token(month)}" / f"{taxi_type}_tripdata_{year}-{month_token(month)}.parquet"


def zones_url() -> str:
    return f"{BASE_URL}/misc/taxi_zone_lookup.csv"


def zones_geojson_url() -> str:
    return f"{NYC_OPEN_DATA_BASE_URL}/8meu-9t5y.geojson?$limit=5000"


def download_file(url: str, destination: Path, overwrite: bool = False) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and not overwrite:
        print(f"Already exists: {destination}")
        return destination
    print(f"Downloading {url}")
    urlretrieve(url, destination)
    print(f"Wrote {destination}")
    return destination


def download_trip_data(taxi_type: str, year: int, month: int | str, output_dir: Path = RAW_TLC_DIR, overwrite: bool = False) -> Path:
    return download_file(trip_data_url(taxi_type, year, month), trip_data_path(output_dir, taxi_type, year, month), overwrite)


def download_zones(output_path: Path = RAW_ZONES_CSV_PATH, overwrite: bool = False) -> Path:
    RAW_REFERENCE_DIR.mkdir(parents=True, exist_ok=True)
    return download_file(zones_url(), output_path, overwrite)


def download_zones_geojson(output_path: Path = RAW_ZONES_GEOJSON_PATH, overwrite: bool = False) -> Path:
    RAW_REFERENCE_DIR.mkdir(parents=True, exist_ok=True)
    return download_file(zones_geojson_url(), output_path, overwrite)


def main() -> None:
    parser = argparse.ArgumentParser(description="Download official NYC TLC Parquet data.")
    parser.add_argument("--taxi-type", default="yellow", choices=sorted(SUPPORTED_TAXI_TYPES))
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--month", default="01")
    parser.add_argument("--output-dir", type=Path, default=RAW_TLC_DIR)
    parser.add_argument("--with-zones", action="store_true")
    parser.add_argument("--with-zone-geojson", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    ensure_dirs()
    download_trip_data(args.taxi_type, args.year, args.month, args.output_dir, args.overwrite)
    if args.with_zones:
        download_zones(overwrite=args.overwrite)
    if args.with_zone_geojson:
        download_zones_geojson(overwrite=args.overwrite)


if __name__ == "__main__":
    main()

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
SAMPLE_DIR = DATA_DIR / "sample"
RAW_DIR = DATA_DIR / "raw"
RAW_TLC_DIR = RAW_DIR / "tlc"
RAW_REFERENCE_DIR = RAW_DIR / "reference"
WAREHOUSE_DIR = DATA_DIR / "warehouse"
DUCKDB_DIR = DATA_DIR / "duckdb"
REPORTS_DIR = DATA_DIR / "reports"
DOCS_ASSETS_DIR = ROOT_DIR / "docs" / "assets"
DB_PATH = DUCKDB_DIR / "taxi_analytics.duckdb"

TRIPS_SAMPLE_PATH = SAMPLE_DIR / "sample_trips.parquet"
ZONES_SAMPLE_PATH = SAMPLE_DIR / "sample_zones.parquet"
RAW_ZONES_CSV_PATH = RAW_REFERENCE_DIR / "taxi_zone_lookup.csv"
TRIPS_WAREHOUSE_DIR = WAREHOUSE_DIR / "trips"


def ensure_dirs() -> None:
    for path in [
        SAMPLE_DIR,
        RAW_TLC_DIR,
        RAW_REFERENCE_DIR,
        WAREHOUSE_DIR,
        DUCKDB_DIR,
        REPORTS_DIR,
        DOCS_ASSETS_DIR,
        TRIPS_WAREHOUSE_DIR,
    ]:
        path.mkdir(parents=True, exist_ok=True)

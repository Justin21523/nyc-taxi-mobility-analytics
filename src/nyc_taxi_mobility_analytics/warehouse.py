import duckdb
import pandas as pd

from .config import DB_PATH, TRIPS_WAREHOUSE_DIR, ZONES_SAMPLE_PATH, ensure_dirs


def connect(read_only: bool = False) -> duckdb.DuckDBPyConnection:
    ensure_dirs()
    return duckdb.connect(str(DB_PATH), read_only=read_only)


def trips_glob() -> str:
    return str(TRIPS_WAREHOUSE_DIR / "**" / "*.parquet")


def register_views(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        f"""
        CREATE OR REPLACE VIEW trips AS
        SELECT * FROM read_parquet('{trips_glob()}', hive_partitioning=true)
        """
    )
    con.execute(
        f"""
        CREATE OR REPLACE VIEW zones AS
        SELECT * FROM read_parquet('{ZONES_SAMPLE_PATH}')
        """
    )


def fetch_df(query: str, params: tuple = ()) -> pd.DataFrame:
    with connect() as con:
        register_views(con)
        return con.execute(query, params).fetchdf()


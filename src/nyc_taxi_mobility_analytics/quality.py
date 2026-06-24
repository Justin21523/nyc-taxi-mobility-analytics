import json

from .config import REPORTS_DIR, ensure_dirs
from .etl import REQUIRED_TRIP_COLUMNS
from .warehouse import connect, register_views


def run_quality_checks() -> dict:
    ensure_dirs()
    checks = []
    with connect() as con:
        register_views(con)
        row_count = con.execute("SELECT count(*) FROM trips").fetchone()[0]
        columns = {row[1] for row in con.execute("PRAGMA table_info('trips')").fetchall()}
        checks.append({"check": "row_count_positive", "passed": row_count > 0, "value": row_count})
        missing = [col for col in REQUIRED_TRIP_COLUMNS if col not in columns]
        checks.append({"check": "required_columns", "passed": not missing, "value": missing})
        invalid_time = con.execute("SELECT count(*) FROM trips WHERE dropoff_datetime <= pickup_datetime").fetchone()[0]
        checks.append({"check": "dropoff_after_pickup", "passed": invalid_time == 0, "value": invalid_time})
        negative_amounts = con.execute("SELECT count(*) FROM trips WHERE fare_amount < 0 OR total_amount < 0 OR trip_distance < 0").fetchone()[0]
        checks.append({"check": "non_negative_amounts_distance", "passed": negative_amounts == 0, "value": negative_amounts})
        missing_zones = con.execute(
            """
            SELECT count(*)
            FROM trips t
            LEFT JOIN zones p ON t.pickup_location_id = p.location_id
            LEFT JOIN zones d ON t.dropoff_location_id = d.location_id
            WHERE p.location_id IS NULL OR d.location_id IS NULL
            """
        ).fetchone()[0]
        checks.append({"check": "zone_ids_resolve", "passed": missing_zones == 0, "value": missing_zones})
    report = {"passed": all(item["passed"] for item in checks), "checks": checks}
    (REPORTS_DIR / "data_quality_report.json").write_text(json.dumps(report, indent=2, default=str))
    return report


def main() -> None:
    report = run_quality_checks()
    print(json.dumps(report, indent=2, default=str))
    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()


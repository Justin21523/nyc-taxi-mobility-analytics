from nyc_taxi_mobility_analytics.quality import run_quality_checks


def test_data_quality_report_passes():
    report = run_quality_checks()
    assert report["passed"] is True
    assert {item["check"] for item in report["checks"]} >= {
        "row_count_positive",
        "required_columns",
        "dropoff_after_pickup",
        "non_negative_amounts_distance",
        "zone_ids_resolve",
    }


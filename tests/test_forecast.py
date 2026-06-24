from nyc_taxi_mobility_analytics.evaluation import run_evaluation
from nyc_taxi_mobility_analytics.forecast import forecast_metrics, make_forecast


def test_forecast_generates_baselines():
    forecast = make_forecast(horizon=12)
    assert not forecast.empty
    assert {"pickup_hour", "actual", "naive_forecast", "moving_average_forecast", "seasonal_naive_forecast"}.issubset(forecast.columns)
    assert forecast.tail(12)["actual"].isna().all()


def test_evaluation_metrics_are_present():
    report = run_evaluation()
    assert "naive" in report
    assert "moving_average" in report
    assert report["rows_evaluated"] > 0
    assert report["moving_average"]["mae"] is not None
    assert report["seasonal_naive"]["mae"] is not None


def test_forecast_metrics_compare_models():
    metrics = forecast_metrics(make_forecast(horizon=6))
    assert {"Naive", "Moving average", "Seasonal naive"} == set(metrics["model"])

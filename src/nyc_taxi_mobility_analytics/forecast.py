import numpy as np
import pandas as pd

from .analytics import hourly_demand
from .warehouse import connect


def make_forecast(window: int = 24, horizon: int = 24, filters: dict | None = None) -> pd.DataFrame:
    history = hourly_demand(limit=100000, filters=filters).sort_values("pickup_hour").reset_index(drop=True)
    if history.empty:
        return pd.DataFrame(columns=["pickup_hour", "actual", "naive_forecast", "moving_average_forecast", "seasonal_naive_forecast"])
    history["naive_forecast"] = history["trip_count"].shift(1)
    history["moving_average_forecast"] = history["trip_count"].shift(1).rolling(window=window, min_periods=1).mean()
    history["seasonal_naive_forecast"] = history["trip_count"].shift(24)

    future_start = pd.to_datetime(history["pickup_hour"].max()) + pd.Timedelta(hours=1)
    last_value = float(history["trip_count"].iloc[-1])
    ma_value = float(history["trip_count"].tail(window).mean())
    seasonal_source = history["trip_count"].tail(24).tolist()
    seasonal_values = [float(seasonal_source[index % len(seasonal_source)]) for index in range(horizon)] if seasonal_source else [last_value] * horizon
    future = pd.DataFrame(
        {
            "pickup_hour": pd.date_range(future_start, periods=horizon, freq="h"),
            "actual": np.nan,
            "naive_forecast": last_value,
            "moving_average_forecast": ma_value,
            "seasonal_naive_forecast": seasonal_values,
        }
    )
    backtest = history.rename(columns={"trip_count": "actual"})[
        ["pickup_hour", "actual", "naive_forecast", "moving_average_forecast", "seasonal_naive_forecast"]
    ]
    forecast = pd.concat([backtest, future], ignore_index=True)
    with connect() as con:
        con.register("forecast_df", forecast)
        con.execute("CREATE OR REPLACE TABLE demand_forecast AS SELECT * FROM forecast_df")
    return forecast


def forecast_metrics(forecast: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for label, column in [
        ("Naive", "naive_forecast"),
        ("Moving average", "moving_average_forecast"),
        ("Seasonal naive", "seasonal_naive_forecast"),
    ]:
        mask = forecast["actual"].notna() & forecast[column].notna()
        if not mask.any():
            rows.append({"model": label, "mae": None, "rmse": None, "mape": None})
            continue
        actual = forecast.loc[mask, "actual"].astype(float)
        pred = forecast.loc[mask, column].astype(float)
        error = actual - pred
        non_zero = actual != 0
        rows.append(
            {
                "model": label,
                "mae": float(np.mean(np.abs(error))),
                "rmse": float(np.sqrt(np.mean(error**2))),
                "mape": float(np.mean(np.abs(error[non_zero] / actual[non_zero])) * 100) if non_zero.any() else None,
            }
        )
    return pd.DataFrame(rows)

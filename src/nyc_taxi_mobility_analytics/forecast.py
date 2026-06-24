import numpy as np
import pandas as pd

from .analytics import hourly_demand
from .warehouse import connect


def make_forecast(window: int = 24, horizon: int = 24) -> pd.DataFrame:
    history = hourly_demand(limit=100000).sort_values("pickup_hour").reset_index(drop=True)
    if history.empty:
        return pd.DataFrame(columns=["pickup_hour", "actual", "naive_forecast", "moving_average_forecast"])
    history["naive_forecast"] = history["trip_count"].shift(1)
    history["moving_average_forecast"] = history["trip_count"].shift(1).rolling(window=window, min_periods=1).mean()

    future_start = pd.to_datetime(history["pickup_hour"].max()) + pd.Timedelta(hours=1)
    last_value = float(history["trip_count"].iloc[-1])
    ma_value = float(history["trip_count"].tail(window).mean())
    future = pd.DataFrame(
        {
            "pickup_hour": pd.date_range(future_start, periods=horizon, freq="h"),
            "actual": np.nan,
            "naive_forecast": last_value,
            "moving_average_forecast": ma_value,
        }
    )
    backtest = history.rename(columns={"trip_count": "actual"})[
        ["pickup_hour", "actual", "naive_forecast", "moving_average_forecast"]
    ]
    forecast = pd.concat([backtest, future], ignore_index=True)
    with connect() as con:
        con.register("forecast_df", forecast)
        con.execute("CREATE OR REPLACE TABLE demand_forecast AS SELECT * FROM forecast_df")
    return forecast


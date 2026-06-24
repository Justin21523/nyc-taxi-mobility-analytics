import json

import numpy as np
import pandas as pd

from .config import REPORTS_DIR, ensure_dirs
from .forecast import make_forecast


def regression_metrics(actual: pd.Series, predicted: pd.Series) -> dict:
    mask = actual.notna() & predicted.notna()
    y = actual[mask].astype(float)
    yhat = predicted[mask].astype(float)
    if y.empty:
        return {"mae": None, "rmse": None, "mape": None}
    error = y - yhat
    non_zero = y != 0
    return {
        "mae": float(np.mean(np.abs(error))),
        "rmse": float(np.sqrt(np.mean(error**2))),
        "mape": float(np.mean(np.abs(error[non_zero] / y[non_zero])) * 100) if non_zero.any() else None,
    }


def run_evaluation() -> dict:
    ensure_dirs()
    forecast = make_forecast()
    report = {
        "naive": regression_metrics(forecast["actual"], forecast["naive_forecast"]),
        "moving_average": regression_metrics(forecast["actual"], forecast["moving_average_forecast"]),
        "rows_evaluated": int(forecast["actual"].notna().sum()),
    }
    (REPORTS_DIR / "evaluation_report.json").write_text(json.dumps(report, indent=2))
    return report


def main() -> None:
    print(json.dumps(run_evaluation(), indent=2))


if __name__ == "__main__":
    main()


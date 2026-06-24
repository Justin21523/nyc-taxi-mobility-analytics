# Model Card

## Model

Demand forecasting baseline for hourly taxi trip counts.

## Baselines

- Naive: next hour equals previous observed hour.
- Moving average: next hour equals the recent hourly average.

## Intended Use

The baseline establishes a measurable reference for future forecasting work. It is suitable for demo and regression testing, not production forecasting.

## Metrics

- MAE
- RMSE
- MAPE


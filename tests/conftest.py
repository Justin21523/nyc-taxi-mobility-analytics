import pytest

from nyc_taxi_mobility_analytics.etl import run_etl
from nyc_taxi_mobility_analytics.sample_data import main as generate_sample_data


@pytest.fixture(scope="session", autouse=True)
def prepared_warehouse():
    generate_sample_data()
    run_etl()


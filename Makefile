PYTHON ?= python
PACKAGE := nyc_taxi_mobility_analytics

.PHONY: install sample-data download-real-data etl etl-real real-smoke dq evaluate api app demo-assets test clean

install:
	$(PYTHON) -m pip install -r requirements.txt

sample-data:
	PYTHONPATH=src $(PYTHON) -m $(PACKAGE).sample_data

download-real-data:
	PYTHONPATH=src $(PYTHON) -m $(PACKAGE).download --taxi-type $(or $(TAXI_TYPE),yellow) --year $(or $(YEAR),2024) --month $(or $(MONTH),01) --with-zones

etl:
	PYTHONPATH=src $(PYTHON) -m $(PACKAGE).etl

etl-real:
	PYTHONPATH=src $(PYTHON) -m $(PACKAGE).etl --input-dir data/raw/tlc/$(or $(TAXI_TYPE),yellow) --taxi-type $(or $(TAXI_TYPE),yellow) --year $(or $(YEAR),2024) --month $(or $(MONTH),01) --zones data/raw/reference/taxi_zone_lookup.csv

real-smoke: download-real-data etl-real dq evaluate

dq:
	PYTHONPATH=src $(PYTHON) -m $(PACKAGE).quality

evaluate:
	PYTHONPATH=src $(PYTHON) -m $(PACKAGE).evaluation
	PYTHONPATH=src $(PYTHON) -m $(PACKAGE).benchmark

demo-assets:
	PYTHONPATH=src $(PYTHON) scripts/export_demo_assets.py

api:
	PYTHONPATH=src uvicorn $(PACKAGE).api:app --reload --host 0.0.0.0 --port 8000

app:
	PYTHONPATH=src streamlit run src/$(PACKAGE)/dashboard.py

test:
	PYTHONPATH=src pytest -q

clean:
	rm -rf data/sample data/warehouse data/duckdb data/reports .pytest_cache
	mkdir -p data/sample data/warehouse data/duckdb data/reports

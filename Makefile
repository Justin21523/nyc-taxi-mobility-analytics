PYTHON ?= python
PACKAGE := nyc_taxi_mobility_analytics

.PHONY: install sample-data download-real-data etl etl-real real-smoke dq evaluate api app build smoke-web demo-assets test clean

install:
	$(PYTHON) -m pip install -r requirements.txt
	npm install

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
	npm run dev -- --hostname 0.0.0.0 --port 3000

app:
	npm run dev -- --hostname 0.0.0.0 --port 3000

build:
	npm run typecheck
	npm run lint
	npm run build

smoke-web:
	npm run dev -- --hostname 127.0.0.1 --port 3100 > data/reports/next.log 2>&1 & echo $$! > data/reports/next.pid
	sleep 8
	curl -fsS http://127.0.0.1:3100/ >/dev/null
	curl -fsS http://127.0.0.1:3100/health >/dev/null
	curl -fsS http://127.0.0.1:3100/analytics/overview >/dev/null
	curl -fsS http://127.0.0.1:3100/forecast/metrics >/dev/null
	curl -fsS http://127.0.0.1:3100/airports >/dev/null
	curl -fsS http://127.0.0.1:3100/zones/4 >/dev/null
	curl -fsS http://127.0.0.1:3100/routes/drilldown >/dev/null
	curl -fsS http://127.0.0.1:3100/analytics/airports >/dev/null
	curl -fsS http://127.0.0.1:3100/analytics/routes/drilldown >/dev/null
	kill $$(cat data/reports/next.pid)

test:
	PYTHONPATH=src pytest -q
	npm run typecheck

clean:
	rm -rf data/sample data/warehouse data/duckdb data/reports .pytest_cache
	mkdir -p data/sample data/warehouse data/duckdb data/reports

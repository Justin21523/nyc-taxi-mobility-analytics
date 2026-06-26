PYTHON ?= python
PACKAGE := nyc_taxi_mobility_analytics
DOCKER_IMAGE ?= nyc-taxi-mobility-analytics
DOCKER_CONTAINER ?= nyc-taxi-mobility-analytics-smoke
DOCKER_PORT ?= 3102

.PHONY: install sample-data download-real-data etl etl-real real-smoke dq evaluate api app build smoke-web smoke-docker demo-assets test clean

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
	curl -fsSL http://127.0.0.1:3100/ >/dev/null
	curl -fsSL http://127.0.0.1:3100/health >/dev/null
	curl -fsSL http://127.0.0.1:3100/analytics/overview >/dev/null
	curl -fsSL http://127.0.0.1:3100/forecast/metrics >/dev/null
	curl -fsSL http://127.0.0.1:3100/airports >/dev/null
	curl -fsSL http://127.0.0.1:3100/zones/4 >/dev/null
	curl -fsSL http://127.0.0.1:3100/routes/drilldown >/dev/null
	curl -fsSL http://127.0.0.1:3100/analytics/airports >/dev/null
	curl -fsSL http://127.0.0.1:3100/analytics/routes/drilldown >/dev/null
	curl -fsSL http://127.0.0.1:3100/segments >/dev/null
	curl -fsSL http://127.0.0.1:3100/anomalies >/dev/null
	curl -fsSL http://127.0.0.1:3100/data-quality >/dev/null
	curl -fsSL http://127.0.0.1:3100/warehouse >/dev/null
	curl -fsSL http://127.0.0.1:3100/scenario >/dev/null
	curl -fsSL http://127.0.0.1:3100/saved-views >/dev/null
	curl -fsSL http://127.0.0.1:3100/exports/summary.json >/dev/null
	curl -fsSL http://127.0.0.1:3100/exports/routes.csv >/dev/null
	kill $$(cat data/reports/next.pid)

smoke-docker:
	docker build -t $(DOCKER_IMAGE) .
	set -eu; \
	  docker rm -f $(DOCKER_CONTAINER) >/dev/null 2>&1 || true; \
	  docker run -d --name $(DOCKER_CONTAINER) -e PORT=3000 -p 127.0.0.1:$(DOCKER_PORT):3000 $(DOCKER_IMAGE) >/dev/null; \
	  trap 'docker rm -f $(DOCKER_CONTAINER) >/dev/null 2>&1 || true' EXIT; \
	  sleep 8; \
	  curl -fsSL http://127.0.0.1:$(DOCKER_PORT)/ >/dev/null; \
	  curl -fsSL http://127.0.0.1:$(DOCKER_PORT)/api/health | grep -q '"warehouseReady":true'; \
	  curl -fsSL http://127.0.0.1:$(DOCKER_PORT)/analytics/overview >/dev/null; \
	  curl -fsSL http://127.0.0.1:$(DOCKER_PORT)/forecast/metrics >/dev/null; \
	  curl -fsSL http://127.0.0.1:$(DOCKER_PORT)/map >/dev/null; \
	  curl -fsSL http://127.0.0.1:$(DOCKER_PORT)/warehouse >/dev/null

test:
	PYTHONPATH=src pytest -q
	npm run typecheck

clean:
	rm -rf data/sample data/warehouse data/duckdb data/reports .pytest_cache
	mkdir -p data/sample data/warehouse data/duckdb data/reports

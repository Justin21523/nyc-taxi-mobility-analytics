from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]


def test_next_route_handlers_exist():
    expected = [
        "app/health/route.ts",
        "app/analytics/overview/route.ts",
        "app/analytics/hourly-demand/route.ts",
        "app/analytics/top-zones/route.ts",
        "app/analytics/routes/route.ts",
        "app/analytics/od-matrix/route.ts",
        "app/analytics/airport-trips/route.ts",
        "app/analytics/fare-summary/route.ts",
        "app/analytics/tip-behavior/route.ts",
        "app/analytics/seasonality/route.ts",
        "app/analytics/peak-hours/route.ts",
        "app/forecast/demand/route.ts",
        "app/forecast/metrics/route.ts",
        "app/zones/route.ts",
        "app/trips/search/route.ts",
    ]
    for path in expected:
        assert (ROOT / path).exists(), path


def test_next_scripts_are_configured():
    package = json.loads((ROOT / "package.json").read_text())
    assert package["scripts"]["dev"] == "next dev"
    assert package["scripts"]["build"] == "next build"
    assert package["scripts"]["typecheck"] == "tsc --noEmit"


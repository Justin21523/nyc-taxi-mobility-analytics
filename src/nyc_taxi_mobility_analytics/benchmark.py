import json
import time

from .analytics import hourly_demand, overview, routes, top_zones
from .config import REPORTS_DIR, ensure_dirs


def run_benchmark() -> dict:
    ensure_dirs()
    queries = {
        "overview": overview,
        "hourly_demand": hourly_demand,
        "top_zones": top_zones,
        "routes": routes,
    }
    results = {}
    for name, fn in queries.items():
        start = time.perf_counter()
        fn()
        results[name] = {"latency_ms": round((time.perf_counter() - start) * 1000, 2)}
    (REPORTS_DIR / "query_latency_benchmark.json").write_text(json.dumps(results, indent=2))
    return results


if __name__ == "__main__":
    print(json.dumps(run_benchmark(), indent=2))


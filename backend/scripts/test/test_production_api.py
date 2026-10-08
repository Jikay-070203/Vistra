"""Smoke-test the normalized Vistra production API contract.

PowerShell:
  $env:API_BASE='https://vistra-backend-production.up.railway.app'
  $env:ADMIN_EMAIL='admin@vistral.com'
  $env:ADMIN_PASSWORD='your-password'
  python backend/scripts/test/test_production_api.py

Results are always written beside this script. The script creates one temporary
traveler, trip, and feedback ticket; it does not modify .env.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path


BASE = os.getenv("API_BASE", "").rstrip("/")
QDRANT_BASE = os.getenv("QDRANT_BASE", "").rstrip("/")
if not BASE:
    raise SystemExit("Set API_BASE to the Railway URL first.")
if any(host in BASE for host in ("localhost", "127.0.0.1")):
    raise SystemExit("API_BASE must be the production Railway URL.")

OUTPUT = Path(__file__).resolve().parent / "production_api_test_results.json"
REPORT = Path(__file__).resolve().parent / "output.md"
VISTRA_PLACES = Path(os.getenv(
    "VISTRA_PLACES_FILE",
    r"D:\Sourcecode\vinai\project\data\data\VISTRA\VISTRA\datasets\raw\scraped_data\places.compact.jsonl",
))
jar = CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
results: list[dict] = []


def request(case: str, method: str, path: str, body=None, expected=(200, 201)):
    raw_body = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=raw_body, method=method,
                                 headers={"Content-Type": "application/json"})
    try:
        with client.open(req, timeout=20) as response:
            status, raw = response.status, response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read().decode("utf-8", "replace")
    except Exception as error:
        results.append({"case": case, "method": method, "path": path, "passed": False,
                        "status": None, "error": repr(error)})
        return None
    try:
        data = json.loads(raw) if raw else None
    except json.JSONDecodeError:
        data = raw
    passed = status in expected
    results.append({"case": case, "method": method, "path": path, "status": status,
                    "expected": list(expected), "passed": passed, "response": data})
    return data if passed else None


def qdrant_request(case: str, path: str, expected=(200,)):
    """Read-only Qdrant smoke check; enabled when QDRANT_BASE is supplied."""
    if not QDRANT_BASE:
        skip(case, "set QDRANT_BASE to check the deployed Qdrant service")
        return None
    req = urllib.request.Request(QDRANT_BASE + path, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            status, raw = response.status, response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read().decode("utf-8", "replace")
    except Exception as error:
        results.append({"case": case, "method": "GET", "path": path, "passed": False,
                        "status": None, "error": repr(error)})
        return None
    try:
        data = json.loads(raw) if raw else None
    except json.JSONDecodeError:
        data = raw
    passed = status in expected
    results.append({"case": case, "method": "GET", "path": path, "status": status,
                    "expected": list(expected), "passed": passed, "response": data})
    return data if passed else None


def skip(case: str, reason: str):
    results.append({"case": case, "passed": None, "skipped": True, "reason": reason})


def load_one_vistra_place() -> dict:
    """Load one source place without copying local paths into production."""
    with VISTRA_PLACES.open("r", encoding="utf-8") as source:
        for line in source:
            if line.strip():
                item = json.loads(line)
                coordinates = item.get("coordinates") or {}
                return {
                    "source_place_id": item["osm_id"],
                    "name": item["name"],
                    "province": item["province"],
                    "category": item.get("category", "attraction"),
                    "address": item.get("address"),
                    "latitude": coordinates["latitude"],
                    "longitude": coordinates["longitude"],
                    "metadata": {"source": item.get("sources", {}), "source_file": "places.compact.jsonl"},
                    "source_updated_at": item.get("last_checked"),
                }
    raise RuntimeError(f"No place found in {VISTRA_PLACES}")


def write_report(source_item: dict | None, import_response: dict | None, qdrant_collections: dict | None):
    """Write the exact admin import response and Qdrant status for presentation/evidence."""
    lines = ["# Production import test", "", f"- Source file: `{VISTRA_PLACES}`",
             "- Image import: commented/not executed in this test.", ""]
    if source_item:
        lines += ["## Place sent to admin API", "", "```json",
                  json.dumps(source_item, ensure_ascii=False, indent=2), "```", ""]
    lines += ["## Admin place-import response", "", "```json",
              json.dumps(import_response, ensure_ascii=False, indent=2), "```", ""]
    lines += ["## Qdrant result", "", "```json",
              json.dumps(qdrant_collections, ensure_ascii=False, indent=2), "```", "",
              "The admin place-import API stores the place metadata in PostgreSQL. "
              "It does not create an embedding or upsert a vector into Qdrant. "
              "Qdrant is only checked for readiness/collections here; a real vector "
              "must be generated by the embedding/indexing pipeline before a point is inserted."]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    qdrant_request("qdrant ready", "/readyz")
    collections = qdrant_request("qdrant collections", "/collections")
    if collections and isinstance(collections, dict):
        names = {item.get("name") for item in collections.get("result", {}).get("collections", [])}
        expected_names = {"wikivoyage_voyage", "scraped_images"}
        passed = expected_names.issubset(names)
        results.append({"case": "qdrant required collections", "method": "ASSERT",
                        "path": "/collections", "status": 200, "expected": sorted(expected_names),
                        "passed": passed, "response": {"found": sorted(names)}})

    request("health", "GET", "/health")
    request("v1 status", "GET", "/api/v1/status")
    request("v1 landing", "GET", "/api/v1/public/landing")
    request("v1 provinces catalog", "GET", "/api/v1/catalog/provinces")
    request("v1 allergies catalog", "GET", "/api/v1/catalog/allergies")
    request("v1 destination recommendations", "GET", "/api/v1/destinations/recommendations")
    request("v1 destination detail", "GET", "/api/v1/destinations/1")

    stamp = int(time.time())
    email = os.getenv("TEST_EMAIL", f"railway-api-test-{stamp}@example.com")
    password = os.getenv("TEST_PASSWORD", "RailwaySmokeTest2026!")
    registered = request("v1 register", "POST", "/api/v1/auth/register", {
        "full_name": "Railway API Test", "email": email, "password": password,
    })
    if registered:
        request("v1 auth me", "GET", "/api/v1/auth/me")
        request("v1 refresh token rotation", "POST", "/api/v1/auth/refresh")
        request("v1 auth me after refresh", "GET", "/api/v1/auth/me")
        request("v1 get profile", "GET", "/api/v1/users/me")
        request("v1 update profile", "PATCH", "/api/v1/users/me", {"bio": "production smoke test"})
        request("v1 get DNA", "GET", "/api/v1/users/me/dna")
        request("v1 update DNA", "PUT", "/api/v1/users/me/dna", {
            "metrics": [{"key": "nature", "score": 80}], "pace": "relaxed"
        })
        trip = request("v1 create trip", "POST", "/api/v1/trips", {
            "destination": "ninh-binh", "start_date": "2026-11-01", "days": 4,
            "people": 2, "budget_vnd": 3200000, "budget_scope": "total",
            "transport": "car", "pace": "relaxed", "interests": ["attraction"]
        })
        if trip and trip.get("id"):
            request("v1 get trip", "GET", f"/api/v1/trips/{trip['id']}")
            request("v1 my trips", "GET", "/api/v1/trips/me")
            request("v1 update trip", "PATCH", f"/api/v1/trips/{trip['id']}",
                    {"base_version": 0, "status": "draft"})
            request("v1 trip chat", "POST", f"/api/v1/trips/{trip['id']}/chat",
                    {"message": "Suggest one quiet attraction"})
        request("v1 community list", "GET", "/api/v1/community/trips")
        request("v1 feedback create", "POST", "/api/v1/feedback", {
            "subject": "Production API smoke test", "description": "Automated test ticket",
            "route_origin": "/test"
        }, expected=(201,))
        request("v1 feedback mine", "GET", "/api/v1/feedback/me")
    else:
        skip("v1 authenticated APIs", "registration failed; inspect v1 register response")

    admin_email, admin_password = os.getenv("ADMIN_EMAIL"), os.getenv("ADMIN_PASSWORD")
    if not admin_email or not admin_password:
        skip("v1 admin APIs", "set ADMIN_EMAIL and ADMIN_PASSWORD to run admin checks")
    elif request("v1 admin login", "POST", "/api/v1/auth/login",
                 {"email": admin_email, "password": admin_password}):
        place_item = None
        place_import = None
        try:
            place_item = load_one_vistra_place()
            place_import = request(
                "admin import one VISTRA place", "POST", "/api/v1/admin/import/places",
                {"source": "vistra-scraped-data", "batch_id": f"test-place-{int(time.time())}",
                 "items": [place_item]}, expected=(200,))
        except Exception as error:
            results.append({"case": "admin import one VISTRA place", "passed": False,
                            "status": None, "error": repr(error)})

        request("admin feedback", "GET", "/api/v1/admin/feedback")
        request("admin traces", "GET", "/api/v1/admin/traces")
        request("admin metrics", "GET", "/api/v1/admin/system/metrics")
        request("admin content", "GET", "/admin/content")
        request("evaluation datasets", "GET", "/admin/evaluation/datasets")
        request("admin system summary", "GET", "/admin/system/summary")
        request("admin place import limit", "POST", "/api/v1/admin/import/places",
                {"source": "production-test", "batch_id": f"test-{int(time.time())}",
                 "items": [{} for _ in range(101)]}, expected=(422,))
        # Image import is intentionally not executed yet. Keep the API contract here
        # for the next test phase after Cloudinary URLs are available:
        # request("admin import one image", "POST", "/api/v1/admin/import/place-images", {...})
        write_report(place_item, place_import, collections)

    request("v1 logout", "POST", "/api/v1/auth/logout")
    passed = sum(item.get("passed") is True for item in results)
    failed = sum(item.get("passed") is False for item in results)
    skipped = sum(item.get("skipped") is True for item in results)
    OUTPUT.write_text(json.dumps({"base": BASE, "results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote: {OUTPUT}")
    print(f"Passed: {passed} | Failed: {failed} | Skipped: {skipped}")
    for item in results:
        state = "SKIP" if item.get("skipped") else "PASS" if item.get("passed") else "FAIL"
        print(f"{state}: {item['case']}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

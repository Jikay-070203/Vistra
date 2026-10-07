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
if not BASE:
    raise SystemExit("Set API_BASE to the Railway URL first.")
if any(host in BASE for host in ("localhost", "127.0.0.1")):
    raise SystemExit("API_BASE must be the production Railway URL.")

OUTPUT = Path(__file__).resolve().parent / "production_api_test_results.json"
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


def skip(case: str, reason: str):
    results.append({"case": case, "passed": None, "skipped": True, "reason": reason})


def main() -> int:
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
        request("admin feedback", "GET", "/api/v1/admin/feedback")
        request("admin traces", "GET", "/api/v1/admin/traces")
        request("admin metrics", "GET", "/api/v1/admin/system/metrics")
        request("admin content", "GET", "/admin/content")
        request("evaluation datasets", "GET", "/admin/evaluation/datasets")

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

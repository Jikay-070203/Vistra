"""Manual full API smoke test for the local Docker backend.

Usage (PowerShell):
  python .\\backend\\scripts\\test_full_api.py
  $env:API_BASE='http://localhost:8000'; python .\\backend\\scripts\\test_full_api.py
  $env:ADMIN_EMAIL='admin@example.com'; $env:ADMIN_PASSWORD='...'; python .\\backend\\scripts\\test_full_api.py
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


BASE = os.getenv("API_BASE", "http://localhost:8000").rstrip("/")
OUT = Path(os.getenv("API_TEST_OUTPUT", "api_test_results.json"))
jar = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
results: list[dict] = []


def call(case: str, method: str, path: str, payload=None, expected=(200, 201)):
    body = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(BASE + path, data=body, method=method,
                                     headers={"Content-Type": "application/json"})
    try:
        with opener.open(request, timeout=15) as response:
            raw = response.read().decode("utf-8", "replace")
            status = response.status
            data = json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", "replace")
        status = error.code
        try:
            data = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            data = raw
    except Exception as error:
        results.append({"case": case, "status": None, "passed": False, "error": repr(error)})
        return None
    passed = status in expected
    results.append({"case": case, "method": method, "path": path, "status": status,
                    "expected": list(expected), "passed": passed, "response": data})
    return data if passed else None


def skip(case: str, reason: str):
    results.append({"case": case, "passed": None, "skipped": True, "reason": reason})


def main() -> int:
    call("health", "GET", "/health")
    call("versioned status", "GET", "/api/v1/status")
    call("destinations", "GET", "/destinations")
    call("public content", "GET", "/public/content")
    call("destination recommendations", "GET", "/recommendations/destinations")

    stamp = str(int(time.time()))
    email = os.getenv("TEST_EMAIL", f"api-test-{stamp}@example.com")
    password = os.getenv("TEST_PASSWORD", "LocalTestPassword123!")
    register = call("register", "POST", "/auth/register", {
        "full_name": "API Test User", "email": email, "password": password,
    })
    if register:
        call("auth me", "GET", "/auth/me")
        call("get profile", "GET", "/me/profile")
        call("update profile", "PATCH", "/me/profile", {"bio": "API smoke test"})
        call("get travel dna", "GET", "/me/travel-dna")
        call("update travel dna", "PATCH", "/me/travel-dna/preferences", {
            "metrics": [{"key": "nature", "score": 80}], "pace": "relaxed"
        })
        call("create trip", "POST", "/trips", {
            "destination": "ninh-binh", "start_date": "2026-11-01", "days": 2,
            "people": 1, "budget_vnd": 1500000, "budget_scope": "per_person",
            "transport": "car", "pace": "normal", "interests": ["attraction"]
        }, expected=(201,))
        call("community plans", "GET", "/community/plans")
        call("create feedback ticket", "POST", "/feedback/tickets", {
            "subject": "API smoke test", "description": "Created by test script",
            "route_origin": "/test"
        }, expected=(201,))
        call("my feedback tickets", "GET", "/me/feedback/tickets")
    else:
        skip("profile/community user tests", "registration failed; inspect the failure above")

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    if admin_email and admin_password:
        admin_login = call("admin login", "POST", "/auth/login",
                           {"email": admin_email, "password": admin_password})
        if admin_login:
            call("admin content", "GET", "/admin/content")
            call("admin feedback", "GET", "/admin/feedback/tickets")
            call("evaluation datasets", "GET", "/admin/evaluation/datasets")
            call("system summary", "GET", "/admin/system/summary")
            call("traces", "GET", "/admin/traces")
    else:
        skip("admin/evaluation tests", "set ADMIN_EMAIL and ADMIN_PASSWORD to run staff/admin cases")

    logout = call("logout", "POST", "/auth/logout")
    OUT.write_text(json.dumps({"base": BASE, "results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    passed = sum(item.get("passed") is True for item in results)
    failed = sum(item.get("passed") is False for item in results)
    skipped = sum(item.get("skipped") is True for item in results)
    print(f"Wrote: {OUT.resolve()}")
    print(f"Passed: {passed} | Failed: {failed} | Skipped: {skipped}")
    for item in results:
        state = "SKIP" if item.get("skipped") else "PASS" if item.get("passed") else "FAIL"
        print(f"{state}: {item['case']}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

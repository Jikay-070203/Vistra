#!/usr/bin/env python3
"""Run five manual API evaluation cases and write reproducible evidence.

Usage (PowerShell):
  python scripts/p-103/run_manual_eval.py --base-url https://example.up.railway.app

The script uses only Python's standard library. It writes results to
presentation/test_case/EVAL_EVIDENCE.md and results.json by default.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "presentation" / "test_case"


def request(base_url: str, path: str, api_key: str = "") -> dict:
    url = base_url.rstrip("/") + path
    headers = {"Accept": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8", errors="replace")
            status = response.status
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        status = exc.code
    except Exception as exc:  # network/DNS/timeout evidence
        return {"status": None, "body": {"error": f"{type(exc).__name__}: {exc}"}}

    try:
        body = json.loads(raw)
    except json.JSONDecodeError:
        body = raw
    return {"status": status, "body": body}


def main() -> int:
    parser = argparse.ArgumentParser(description="Run manual API evaluation evidence")
    parser.add_argument("--base-url", default=os.getenv("P103_BASE_URL", "http://localhost:8080"))
    parser.add_argument("--api-key", default=os.getenv("P103_API_KEY", ""))
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    cases = [
        ("TC01", "Health endpoint", "/health", 200,
         lambda b: b.get("status") == "ok"),
        ("TC02", "Destination catalog is available", "/destinations", 200,
         lambda b: len(b.get("items", [])) >= 4),
        ("TC03", "Seeded places are queryable", "/places?destination=ninh-binh&limit=5", 200,
         lambda b: b.get("total", 0) >= 1 and len(b.get("items", [])) >= 1),
        ("TC04", "Agent status endpoint", "/agent/status", 200,
         lambda b: "capabilities" in b and "model" in b),
        ("TC05", "Unknown destination is rejected", "/places?destination=not-a-real-destination", 200,
         lambda b: b.get("total") == 0 and b.get("items") == []),
    ]

    results = []
    for case_id, title, path, expected_status, check in cases:
        result = request(args.base_url, path, args.api_key)
        try:
            passed = result["status"] == expected_status and check(result["body"] if isinstance(result["body"], dict) else {})
        except Exception:
            passed = False
        results.append({
            "id": case_id,
            "title": title,
            "request": args.base_url.rstrip("/") + path,
            "expected_status": expected_status,
            "actual_status": result["status"],
            "passed": passed,
            "response": result["body"],
        })

    args.out_dir.mkdir(parents=True, exist_ok=True)
    generated = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    payload = {"generated_at": generated, "base_url": args.base_url.rstrip("/"), "results": results}
    (args.out_dir / "results.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Eval evidence — P-103",
        "",
        f"- Generated: `{generated}`",
        f"- Base URL: `{args.base_url.rstrip('/')}`",
        f"- Summary: **{sum(r['passed'] for r in results)}/{len(results)} passed**",
        "",
    ]
    for result in results:
        mark = "PASS" if result["passed"] else "FAIL"
        lines += [
            f"## {result['id']} — {result['title']} — **{mark}**",
            "",
            f"- Request: `{result['request']}`",
            f"- Expected HTTP: `{result['expected_status']}`",
            f"- Actual HTTP: `{result['actual_status']}`",
            "",
            "```json",
            json.dumps(result["response"], ensure_ascii=False, indent=2),
            "```",
            "",
        ]
    (args.out_dir / "EVAL_EVIDENCE.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"Wrote: {args.out_dir / 'EVAL_EVIDENCE.md'}")
    print(f"Wrote: {args.out_dir / 'results.json'}")
    for result in results:
        print(f"{result['id']}: {'PASS' if result['passed'] else 'FAIL'} ({result['actual_status']})")
    return 0 if all(r["passed"] for r in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())

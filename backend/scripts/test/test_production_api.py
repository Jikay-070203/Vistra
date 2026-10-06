"""Production API smoke test for the deployed Railway backend.

PowerShell:
  $env:API_BASE='https://vistra-backend-production.up.railway.app'
  $env:ADMIN_EMAIL='admin@example.com'
  $env:ADMIN_PASSWORD='your-admin-password'
  python backend/scripts/test/test_production_api.py

The script creates one timestamped test account and does not modify .env.
It writes production_api_test_results.json in the current directory.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

api_base = os.getenv("API_BASE", "").rstrip("/")
if not api_base:
    raise SystemExit("Set API_BASE to the Railway public URL first.")
if "localhost" in api_base or "127.0.0.1" in api_base:
    raise SystemExit("This is the production script; API_BASE must be the Railway URL.")

# Reuse the same test matrix as the local smoke test.
scripts_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(scripts_dir))
os.environ["API_BASE"] = api_base
os.environ.setdefault("API_TEST_OUTPUT", "production_api_test_results.json")

from test_full_api import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())

"""Private helpers for local/admin account maintenance scripts."""

from __future__ import annotations

import hashlib
import os
import secrets
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def load_database_url() -> str:
    if os.getenv("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8-sig").splitlines():
            if line.startswith("DATABASE_URL="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
                if value:
                    return value
    raise SystemExit("DATABASE_URL is missing. Set it in the environment or project .env.")


def password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return f"pbkdf2_sha256$210000${salt.hex()}${digest.hex()}"


def connect_database():
    url = load_database_url()
    if url.startswith(("postgres://", "postgresql://")):
        import psycopg
        return psycopg.connect(url), True
    import sqlite3
    return sqlite3.connect(url.removeprefix("sqlite:///")), False

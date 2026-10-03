"""Copy the current SQLite database into PostgreSQL without modifying SQLite.

Usage:
  pip install "psycopg[binary]"
  $env:SQLITE_PATH = "backend/data/yourtripyourtry.db"
  $env:POSTGRES_DSN = "postgresql://app:local-staging-password@localhost:5434/yourtripyourtry_staging"
  python scripts/migrate_sqlite_to_postgres.py
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path

import psycopg
from psycopg import sql


SQLITE_PATH = Path(os.getenv("SQLITE_PATH", "backend/data/yourtripyourtry.db"))
POSTGRES_DSN = os.getenv(
    "POSTGRES_DSN",
    "postgresql://app:local-staging-password@localhost:5434/yourtripyourtry_staging",
)


def qname(name: str) -> sql.Identifier:
    return sql.Identifier(name)


def pg_type(sqlite_type: str) -> str:
    kind = (sqlite_type or "TEXT").upper()
    if "INT" in kind:
        return "BIGINT"
    if any(token in kind for token in ("REAL", "FLOA", "DOUB")):
        return "DOUBLE PRECISION"
    if "BLOB" in kind:
        return "BYTEA"
    return "TEXT"


def table_names(db: sqlite3.Connection) -> list[str]:
    return [
        row[0]
        for row in db.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
    ]


def create_tables(source: sqlite3.Connection, target: psycopg.Connection, names: list[str]) -> None:
    # Disable FK checks during creation/copy; validate after all tables exist.
    target.execute("SET session_replication_role = replica")
    for name in names:
        columns = source.execute(f'PRAGMA table_info("{name}")').fetchall()
        parts: list[sql.Composed] = []
        primary_keys = [row[1] for row in columns if row[5]]
        for _, column, declared_type, not_null, default, _ in columns:
            definition = sql.SQL("{} {}{}").format(
                qname(column),
                sql.SQL(pg_type(declared_type)),
                sql.SQL(" NOT NULL") if not_null else sql.SQL(""),
            )
            parts.append(definition)
        if primary_keys:
            parts.append(sql.SQL("PRIMARY KEY ({})").format(sql.SQL(", ").join(map(qname, primary_keys))))
        target.execute(
            sql.SQL("CREATE TABLE IF NOT EXISTS {} ({})").format(qname(name), sql.SQL(", ").join(parts))
        )


def copy_rows(source: sqlite3.Connection, target: psycopg.Connection, names: list[str]) -> None:
    for name in names:
        columns = [row[1] for row in source.execute(f'PRAGMA table_info("{name}")')]
        rows = source.execute(f'SELECT * FROM "{name}"').fetchall()
        if not rows:
            continue
        statement = sql.SQL("INSERT INTO {} ({}) VALUES ({}) ON CONFLICT DO NOTHING").format(
            qname(name),
            sql.SQL(", ").join(map(qname, columns)),
            sql.SQL(", ").join(sql.Placeholder() for _ in columns),
        )
        with target.cursor() as cursor:
            cursor.executemany(statement, rows)
        print(f"copied {name}: {len(rows)} rows")


def main() -> None:
    if not SQLITE_PATH.exists():
        raise SystemExit(f"SQLite file not found: {SQLITE_PATH}")
    source = sqlite3.connect(f"file:{SQLITE_PATH.resolve()}?mode=ro", uri=True)
    source.execute("PRAGMA query_only = ON")
    names = table_names(source)
    print(f"source: {SQLITE_PATH} ({len(names)} tables)")
    with psycopg.connect(POSTGRES_DSN) as target:
        with target.transaction():
            create_tables(source, target, names)
            copy_rows(source, target, names)
            target.execute("SET session_replication_role = DEFAULT")
    source.close()
    print("migration completed; SQLite was read-only and unchanged")


if __name__ == "__main__":
    main()

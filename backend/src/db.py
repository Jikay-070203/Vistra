import sqlite3
import re
import logging
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path

from backend.config import ROOT

logger = logging.getLogger(__name__)


class PostgresConnection:
    def __init__(self, connection):
        self._connection = connection

    def execute(self, statement, params=()):
        return self._connection.execute(statement.replace("?", "%s"), params)

    def commit(self):
        self._connection.commit()

    def rollback(self):
        self._connection.rollback()

    def close(self):
        self._connection.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        (self.rollback if exc_type else self.commit)()


def _postgres_sql(sql: str) -> str:
    sql = re.sub(r"^\s*PRAGMA[^;]*;", "", sql, flags=re.MULTILINE | re.IGNORECASE)
    sql = sql.replace("WITHOUT ROWID", "")
    sql = sql.replace("INSERT OR IGNORE INTO", "INSERT INTO")
    sql = sql.replace("CREATE VIEW IF NOT EXISTS", "CREATE OR REPLACE VIEW")
    sql = re.sub(r"CREATE TABLE(?! IF NOT EXISTS)", "CREATE TABLE IF NOT EXISTS", sql, flags=re.IGNORECASE)
    sql = re.sub(r"CREATE INDEX(?! IF NOT EXISTS)", "CREATE INDEX IF NOT EXISTS", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\s+GLOB\s+'[^']+'", "", sql, flags=re.IGNORECASE)
    sql = sql.replace("CHECK (opens_local)", "CHECK (opens_local IS NOT NULL)")
    sql = sql.replace("CHECK (closes_local)", "CHECK (closes_local IS NOT NULL)")
    # SQLite schema declares raw_place_records before places, while PostgreSQL
    # requires a referenced table to exist before creating the foreign key.
    # The relationship remains represented by the column; the application
    # validates matched place IDs when records are processed.
    sql = re.sub(
        r"(matched_place_id\s+INTEGER)\s+REFERENCES\s+places\(id\)\s+ON DELETE SET NULL",
        r"\1",
        sql,
        flags=re.IGNORECASE,
    )
    sql = re.sub(r"DEFAULT \(strftime\([^)]*\)\)", "DEFAULT CURRENT_TIMESTAMP", sql, flags=re.IGNORECASE)
    sql = re.sub(r"(\b\w+\s+)INTEGER PRIMARY KEY\b", r"\1BIGSERIAL PRIMARY KEY", sql)
    sql = re.sub(r"^\s*(BEGIN|COMMIT);\s*$", "", sql, flags=re.MULTILINE | re.IGNORECASE)
    if "INSERT INTO destinations" in sql:
        sql = re.sub(r"INSERT INTO destinations.*?;\s*", "", sql, count=1, flags=re.DOTALL)
    return sql


def _sql_statements(script: str) -> list[str]:
    """Split the small project SQL scripts without splitting quoted strings."""
    # A semicolon may appear inside a SQL line comment (the schema contains
    # prose such as "...; Da Lat is a city destination."). Remove comments
    # before splitting so prose can never be sent to PostgreSQL as SQL.
    script = re.sub(r"--[^\r\n]*", "", script)
    statements, buffer = [], []
    quote = None
    for char in script:
        if char in ("'", '"'):
            if quote == char:
                quote = None
            elif quote is None:
                quote = char
        if char == ";" and quote is None:
            statement = "".join(buffer).strip()
            if statement:
                statements.append(statement)
            buffer = []
        else:
            buffer.append(char)
    statement = "".join(buffer).strip()
    if statement:
        statements.append(statement)
    return statements


def _execute_postgres_script(db, script: str):
    statements = _sql_statements(_postgres_sql(script))
    logger.warning("PostgreSQL schema contains %s statements", len(statements))
    failed = []
    for index, statement in enumerate(statements, start=1):
        savepoint = f"schema_statement_{index}"
        try:
            db._connection.execute(f"SAVEPOINT {savepoint}")
            db._connection.execute(statement)
            db._connection.execute(f"RELEASE SAVEPOINT {savepoint}")
        except Exception as error:
            db._connection.execute(f"ROLLBACK TO SAVEPOINT {savepoint}")
            db._connection.execute(f"RELEASE SAVEPOINT {savepoint}")
            failed.append((index, str(error), statement[:180]))
            logger.warning("Skipping PostgreSQL schema statement %s: %s | %s", index, error, statement[:180])
    if failed:
        logger.warning("PostgreSQL schema completed with %s skipped statements", len(failed))


def _ensure_postgres_core_tables(db):
    """Guarantee the two tables used during application startup exist."""
    db._connection.execute("""
        CREATE TABLE IF NOT EXISTS destinations (
            id BIGSERIAL PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            admin_name TEXT,
            center_lat DOUBLE PRECISION,
            center_lon DOUBLE PRECISION,
            target_places INTEGER NOT NULL DEFAULT 300,
            enabled INTEGER NOT NULL DEFAULT 1
        )
    """)
    db._connection.execute("""
        CREATE TABLE IF NOT EXISTS places (
            id BIGSERIAL PRIMARY KEY,
            destination_id BIGINT NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
            display_name TEXT NOT NULL,
            normalized_name TEXT NOT NULL,
            address TEXT,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            kind TEXT NOT NULL DEFAULT 'other',
            indoor_outdoor TEXT NOT NULL DEFAULT 'unknown',
            rain_sensitivity INTEGER,
            suggested_duration_min INTEGER,
            quality_status TEXT NOT NULL DEFAULT 'discovered',
            price_unknown INTEGER NOT NULL DEFAULT 1,
            opening_hours_unknown INTEGER NOT NULL DEFAULT 1,
            last_verified_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # The production database may contain the earlier minimal bootstrap table.
    # CREATE TABLE IF NOT EXISTS does not add columns to an existing table.
    for column, definition in {
        "rain_sensitivity": "INTEGER",
        "suggested_duration_min": "INTEGER",
        "last_verified_at": "TEXT",
        "created_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
    }.items():
        db._connection.execute(
            f'ALTER TABLE places ADD COLUMN IF NOT EXISTS "{column}" {definition}'
        )


def _ensure_import_destinations(db):
    """Keep the VISTRA province catalog available even if an old migration was marked applied."""
    destinations = [
        ("an-giang", "An Giang"), ("bac-ninh", "Bắc Ninh"), ("cao-bang", "Cao Bằng"),
        ("ca-mau", "Cà Mau"), ("can-tho", "Cần Thơ"), ("gia-lai", "Gia Lai"),
        ("hue", "Huế"), ("ha-tinh", "Hà Tĩnh"), ("hung-yen", "Hưng Yên"),
        ("hai-phong", "Hải Phòng"), ("khanh-hoa", "Khánh Hòa"), ("lai-chau", "Lai Châu"),
        ("lao-cai", "Lào Cai"), ("lam-dong", "Lâm Đồng"), ("lang-son", "Lạng Sơn"),
        ("nghe-an", "Nghệ An"), ("phu-tho", "Phú Thọ"), ("quang-ngai", "Quảng Ngãi"),
        ("quang-ninh", "Quảng Ninh"), ("quang-tri", "Quảng Trị"), ("son-la", "Sơn La"),
        ("thanh-hoa", "Thanh Hóa"), ("thai-nguyen", "Thái Nguyên"), ("tuyen-quang", "Tuyên Quang"),
        ("tay-ninh", "Tây Ninh"), ("vinh-long", "Vĩnh Long"), ("dien-bien", "Điện Biên"),
        ("da-nang", "Đà Nẵng"), ("dak-lak", "Đắk Lắk"), ("dong-nai", "Đồng Nai"),
        ("dong-thap", "Đồng Tháp"),
    ]
    for slug, name in destinations:
        db._connection.execute(
            "INSERT INTO destinations(slug,display_name,target_places,enabled) VALUES(%s,%s,300,1) "
            "ON CONFLICT(slug) DO UPDATE SET display_name=EXCLUDED.display_name,enabled=1",
            (slug, name),
        )
        db._connection.execute(
            "UPDATE destinations SET province_code=%s,source_name=%s,updated_at=CURRENT_TIMESTAMP WHERE slug=%s",
            (slug, name, slug),
        )
    db._connection.execute(
        "UPDATE destinations SET province_code='ho-chi-minh',source_name='Hồ Chí Minh',updated_at=CURRENT_TIMESTAMP "
        "WHERE slug='tp-ho-chi-minh'"
    )


POSTGRES_ID_TABLES = (
    "destinations", "sources",
    "places", "place_sources", "opening_intervals", "opening_exceptions",
    "price_estimates", "place_ratings", "place_reviews",
)


def _fix_mojibake(value):
    """Repair legacy UTF-8 text accidentally decoded as Latin-1."""
    if not isinstance(value, str):
        return value
    markers = ("Ã", "Â", "Ä", "Å", "Æ", "á»", "áº", "â", "�")
    current = value
    for _ in range(3):
        score = sum(current.count(marker) for marker in markers)
        if score == 0:
            break
        try:
            candidate = current.encode("latin1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        candidate_score = sum(candidate.count(marker) for marker in markers)
        if candidate_score >= score:
            break
        current = candidate
    return current


def _repair_mojibake(db):
    """Repair old imported names/addresses without changing valid Unicode."""
    for table, columns in {"destinations": ("display_name",), "places": ("display_name", "address")}.items():
        for column in columns:
            for item in rows(db, f"SELECT id, {column} FROM {table} WHERE {column} IS NOT NULL"):
                fixed = _fix_mojibake(item[column])
                if fixed != item[column]:
                    db.execute(f"UPDATE {table} SET {column}=? WHERE id=?", (fixed, item["id"]))


def _seed_postgres_places_from_sqlite(db):
    """Seed PostgreSQL once from the checked-in demo SQLite catalog."""
    seed_path = ROOT / "backend/seed/places_seed.seed"
    if not seed_path.exists():
        logger.warning("SQLite seed database not found: %s", seed_path)
        return
    existing = db._connection.execute("SELECT COUNT(*) FROM places").fetchone()[0]
    if existing:
        logger.warning("Skipping SQLite place seed; PostgreSQL already has %s places", existing)
        return
    source = sqlite3.connect(seed_path)
    source.row_factory = sqlite3.Row
    try:
        columns = [row[1] for row in source.execute("PRAGMA table_info(places)").fetchall()]
        rows_to_seed = source.execute(
            "SELECT " + ",".join(columns) + " FROM places ORDER BY id"
        ).fetchall()
        if not rows_to_seed:
            logger.warning("SQLite seed database contains no places")
            return
        quoted = ",".join(f'"{column}"' for column in columns)
        placeholders = ",".join(["%s"] * len(columns))
        statement = f"INSERT INTO places ({quoted}) VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING"
        for item in rows_to_seed:
            db._connection.execute(statement, tuple(item[column] for column in columns))
        logger.warning("Seeded %s places from SQLite into PostgreSQL", len(rows_to_seed))
    finally:
        source.close()


def _ensure_postgres_id_sequences(db):
    for table in POSTGRES_ID_TABLES:
        sequence = f"{table}_id_seq"
        db._connection.execute(f'CREATE SEQUENCE IF NOT EXISTS "{sequence}"')
        db._connection.execute(
            f'ALTER TABLE "{table}" ALTER COLUMN id SET DEFAULT nextval(\'{sequence}\')'
        )
        db._connection.execute(
            f"SELECT setval('{sequence}', GREATEST(COALESCE((SELECT MAX(id) FROM \"{table}\"), 0), 1), "
            f"COALESCE((SELECT MAX(id) IS NOT NULL FROM \"{table}\"), false))"
        )


def now() -> str:
    return datetime.now(UTC).isoformat(timespec="microseconds")


def ensure_ai_provider_table(db) -> None:
    """Safety net for deployments where migration 014 was marked but skipped."""
    db._connection.execute("""
        CREATE TABLE IF NOT EXISTS ai_provider_settings (
            id INTEGER PRIMARY KEY,
            provider TEXT NOT NULL DEFAULT 'gemini',
            model TEXT NOT NULL,
            encrypted_api_key TEXT NOT NULL,
            updated_by TEXT,
            updated_at TEXT NOT NULL
        )
    """)


@contextmanager
def connect(path: Path | str):
    if isinstance(path, str) and path.startswith(("postgres://", "postgresql://")):
        import psycopg
        db = PostgresConnection(psycopg.connect(path))
        try:
            yield db
        except Exception:
            db.rollback()
            raise
        else:
            db.commit()
        finally:
            db.close()
        return
    # FastAPI may enter a sync dependency and execute its endpoint/cleanup on
    # different worker threads. Each request still owns its own connection.
    db = sqlite3.connect(path, timeout=30, check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA busy_timeout=30000")
    try:
        with db:
            yield db
    finally:
        db.close()


def initialize(path: Path):
    if isinstance(path, str) and path.startswith(("postgres://", "postgresql://")):
        schema_path = ROOT / "backend/seed/YourTripYourTry_Places_Schema.sql"
        logger.warning("PostgreSQL schema path: %s (exists=%s)", schema_path, schema_path.exists())
        schema = schema_path.read_text(encoding="utf-8-sig")
        migrations = sorted((Path(__file__).resolve().parent / "migrations").glob("*.sql"))
        with connect(path) as db:
            _execute_postgres_script(db, schema)
            _ensure_postgres_core_tables(db)
            db._connection.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY)")
            for file in migrations:
                if not db.execute("SELECT 1 FROM schema_migrations WHERE version=?", (file.name,)).fetchone():
                    _execute_postgres_script(db, file.read_text(encoding="utf-8"))
                    db.execute("INSERT INTO schema_migrations(version) VALUES (?) ON CONFLICT DO NOTHING", (file.name,))
            _ensure_import_destinations(db)
            # Parent rows must exist before seeding places because PostgreSQL
            # enforces places.destination_id as a foreign key.
            db._connection.execute(
                "INSERT INTO destinations (slug, display_name, target_places, enabled) VALUES "
                "('ha-noi', 'H\u00e0 N\u1ed9i', 300, 1), "
                "('ninh-binh', 'Ninh B\u00ecnh', 300, 1), "
                "('tp-ho-chi-minh', 'TP. H\u1ed3 Ch\u00ed Minh', 300, 1), "
                "('da-lat', '\u0110\u00e0 L\u1ea1t', 300, 1) "
                "ON CONFLICT DO NOTHING"
            )
            _seed_postgres_places_from_sqlite(db)
            _ensure_postgres_id_sequences(db)
            db._connection.execute('ALTER TABLE destinations ALTER COLUMN enabled SET DEFAULT 1')
            db._connection.execute('UPDATE destinations SET enabled=1 WHERE enabled IS NULL')
            db._connection.execute('ALTER TABLE trips ALTER COLUMN current_version SET DEFAULT 0')
            db._connection.execute('UPDATE trips SET current_version=0 WHERE current_version IS NULL')
            db._connection.execute('ALTER TABLE revision_previews ALTER COLUMN committed SET DEFAULT 0')
            db._connection.execute('UPDATE revision_previews SET committed=0 WHERE committed IS NULL')
            db._connection.execute(
                "INSERT INTO destinations (slug, display_name, target_places, enabled) VALUES "
                "('ha-noi', 'Hà Nội', 300, 1), ('ninh-binh', 'Ninh Bình', 300, 1), "
                "('tp-ho-chi-minh', 'TP. Hồ Chí Minh', 300, 1), ('da-lat', 'Đà Lạt', 300, 1) "
                "ON CONFLICT DO NOTHING"
            )
            _repair_mojibake(db)
            table_rows = db._connection.execute(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema='public' ORDER BY table_name"
            ).fetchall()
            table_names = [row[0] for row in table_rows]
            logger.warning("PostgreSQL public tables after bootstrap: %s", ", ".join(table_names))
            required_tables = {"destinations", "places", "sources", "trips", "expenses"}
            missing_tables = sorted(required_tables.difference(table_names))
            if missing_tables:
                raise RuntimeError("PostgreSQL schema incomplete; missing tables: " + ", ".join(missing_tables))
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with connect(path) as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.executescript((ROOT / "backend/data/YourTripYourTry_Places_Schema.sql").read_text(encoding="utf-8-sig"))
        db.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY)")
        for file in sorted((Path(__file__).resolve().parent / "migrations").glob("*.sql")):
            if not db.execute("SELECT 1 FROM schema_migrations WHERE version=?", (file.name,)).fetchone():
                try:
                    db.executescript("BEGIN IMMEDIATE;\n" + file.read_text(encoding="utf-8"))
                    db.execute("INSERT INTO schema_migrations VALUES (?)", (file.name,))
                    db.commit()
                except Exception:
                    db.rollback()
                    raise
        _repair_mojibake(db)


def row(db, sql, params=()):
    cursor = db.execute(sql, params)
    result = cursor.fetchone()
    return dict(zip([column[0] for column in cursor.description], result)) if result else None


def rows(db, sql, params=()):
    cursor = db.execute(sql, params)
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, result)) for result in cursor.fetchall()]

# Backend Architecture Diagram

## 1. Current MVP architecture

```mermaid
flowchart LR
    U[User browser]
    V[Vercel frontend]
    API[FastAPI backend\nUvicorn + Docker]
    AG[Agent layer\nintent / planner / Gemini]
    TOOLS[Domain tools\nplaces / budget / routing / weather]
    DB[(SQLite\ncurrent MVP database)]
    DATA[backend/data/yourtripyourtry.db]
    G[Gemini API]
    EXT[External services\nOSM / weather / routing]

    U --> V
    V -->|HTTPS API + X-API-Key| API
    API --> AG
    AG --> G
    AG --> TOOLS
    TOOLS --> DB
    TOOLS --> EXT
    DB --- DATA
```

The production-like MVP backend remains connected to SQLite. The current
SQLite file is not modified by the PostgreSQL migration process.

## 2. Backend request flow

```mermaid
sequenceDiagram
    participant User as Browser / Vercel
    participant API as FastAPI
    participant Auth as API-key middleware
    participant Agent as Agent orchestrator
    participant Gemini as Gemini API
    participant DB as SQLite or PostgreSQL adapter

    User->>API: HTTP request
    API->>Auth: Validate X-API-Key
    Auth-->>API: Authorized / 401
    API->>Agent: Parse intent or build itinerary
    Agent->>DB: Read places, destinations, trips
    Agent->>Gemini: Generate or refine response
    Gemini-->>Agent: Structured model response
    Agent->>DB: Persist trip/version/expense data
    Agent-->>API: Pydantic response
    API-->>User: JSON response
```

## 3. Data domains

```mermaid
flowchart TD
    CRAWL[crawl_runs / crawl_requests]
    SOURCE[sources / source_pages]
    RAW[raw_place_records]
    PLACE[places]
    META[tags / opening hours / prices / ratings / reviews]
    TRIP[trips]
    PLAN[itinerary_versions / revision_previews]
    COST[expenses]

    CRAWL --> SOURCE
    SOURCE --> RAW
    RAW --> PLACE
    PLACE --> META
    PLACE --> TRIP
    TRIP --> PLAN
    TRIP --> COST
```

The migrated database contains 22 tables. The verified staging counts are:

| Table | Rows |
|---|---:|
| `destinations` | 4 |
| `places` | 300 |
| `place_sources` | 300 |
| `raw_place_records` | 300 |
| `source_pages` | 300 |
| `trips` | 5 |

## 4. SQLite → PostgreSQL staging flow

```mermaid
flowchart LR
    SQLITE[(SQLite source\nbackend/data/yourtripyourtry.db)]
    SCRIPT[migrate_sqlite_to_postgres.py\nSQLite read-only]
    PG[(PostgreSQL staging\nlocalhost:5434)]
    VERIFY[Row-count and schema checks]
    ADAPTER[Future database adapter]
    PROD[Future PostgreSQL backend]

    SQLITE -->|read only| SCRIPT
    SCRIPT -->|create tables + copy rows| PG
    PG --> VERIFY
    VERIFY --> ADAPTER
    ADAPTER --> PROD
```

Migration command:

```powershell
$env:SQLITE_PATH = "backend/data/yourtripyourtry.db"
$env:POSTGRES_DSN = "postgresql://app:local-staging-password@localhost:5434/yourtripyourtry_staging"
python scripts/p-103/migrate_sqlite_to_postgres.py
```

The migration is additive and isolated: it writes only to PostgreSQL staging
and does not delete, update, or lock the SQLite source.

## 5. Local Docker deployment

```mermaid
flowchart TB
    COMPOSE[P-103 docker compose]
    BACK[backend container\n:8000]
    FRONT[frontend container\n:3000]
    SQLITEVOL[./backend/data\nSQLite volume]
    PGCOMPOSE[postgres-staging compose]
    PG[postgres-staging\n:5434]

    COMPOSE --> BACK
    COMPOSE --> FRONT
    BACK --- SQLITEVOL
    PGCOMPOSE --> PG
```

The two database modes are intentionally separate:

```text
Normal MVP:       backend → SQLite → ./backend/data
Migration test:   migration script → PostgreSQL staging → Docker volume
```

The backend must not be switched to PostgreSQL until the adapter, migrations,
foreign keys, indexes, views, and API regression tests have been validated.

## 6. Target deployment architecture

```mermaid
flowchart LR
    VERCEL[Vercel frontend]
    RAILWAY[Railway / Render backend Docker]
    PGPROD[(Managed PostgreSQL)]
    LANG[Langfuse Cloud]
    GEMINI[Gemini API]

    VERCEL -->|HTTPS| RAILWAY
    RAILWAY --> PGPROD
    RAILWAY --> GEMINI
    RAILWAY -. traces / cost / evaluations .-> LANG
```

## 7. Migration safety rules

1. Keep SQLite as the current source of truth until PostgreSQL passes tests.
2. Run migration against a new PostgreSQL staging volume.
3. Compare table counts and representative records.
4. Add a database adapter before changing the backend runtime.
5. Test read endpoints, trip creation, itinerary versions, expenses, and agent flows.
6. Take a final SQLite backup before any production cutover.
7. Do not delete SQLite until rollback from PostgreSQL has been tested.

-- YourTripYourTry / SQLite schema draft v0.2 (2026-09-27)
-- REVIEW BEFORE CRAWLING: No URLs are fetched and no records are imported by this file.
-- Scope: 1,200 target places across Ha Noi, Ninh Binh, TP.HCM and Da Lat.
-- All times below are UTC ISO-8601 text except local business hours (HH:MM).
-- Enable foreign key enforcement on EVERY application connection as well.
-- This is the initial schema, not a general migration runner: CREATE TABLE IF
-- NOT EXISTS will not add missing columns to an existing table. Use a numbered
-- ALTER TABLE migration when the schema gains columns in later versions.

PRAGMA foreign_keys = ON;

BEGIN;

-- Product destinations, not administrative provinces; Da Lat is a city destination.
CREATE TABLE IF NOT EXISTS destinations (
    id              INTEGER PRIMARY KEY,
    slug            TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    admin_name      TEXT,
    center_lat      REAL CHECK (center_lat BETWEEN -90 AND 90),
    center_lon      REAL CHECK (center_lon BETWEEN -180 AND 180),
    target_places   INTEGER NOT NULL DEFAULT 300 CHECK (target_places >= 0),
    enabled         INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

-- Source settings require deliberate review. A source is disabled by default.
CREATE TABLE IF NOT EXISTS sources (
    id                       INTEGER PRIMARY KEY,
    name                     TEXT NOT NULL UNIQUE,
    host                     TEXT NOT NULL UNIQUE,
    base_url                 TEXT NOT NULL,
    source_type              TEXT NOT NULL CHECK (source_type IN ('website', 'official_api', 'open_dataset', 'manual')),
    license_url              TEXT,
    terms_url                TEXT,
    robots_reviewed_at       TEXT,
    collection_approved      INTEGER NOT NULL DEFAULT 0 CHECK (collection_approved IN (0, 1)),
    minimum_page_delay_ms    INTEGER NOT NULL DEFAULT 5000 CHECK (minimum_page_delay_ms >= 1000),
    daily_page_cap           INTEGER NOT NULL DEFAULT 100 CHECK (daily_page_cap > 0),
    notes                    TEXT,
    CHECK (collection_approved = 0 OR source_type IN ('official_api', 'open_dataset', 'manual') OR robots_reviewed_at IS NOT NULL)
);

-- A run describes one source/destination/batch. Stop on access blocks or CAPTCHA.
CREATE TABLE IF NOT EXISTS crawl_runs (
    id                  INTEGER PRIMARY KEY,
    source_id           INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    destination_id      INTEGER NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    status              TEXT NOT NULL DEFAULT 'planned' CHECK (status IN (
                            'planned', 'running', 'paused', 'blocked_captcha',
                            'blocked_policy', 'finished', 'failed'
                        )),
    started_at          TEXT,
    finished_at         TEXT,
    pages_fetched       INTEGER NOT NULL DEFAULT 0 CHECK (pages_fetched >= 0),
    records_extracted   INTEGER NOT NULL DEFAULT 0 CHECK (records_extracted >= 0),
    error_message       TEXT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Canonical URL is deduplicated per source. Details pages are tracked before fetch.
CREATE TABLE IF NOT EXISTS source_pages (
    id                  INTEGER PRIMARY KEY,
    source_id           INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    destination_id      INTEGER NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    canonical_url       TEXT NOT NULL,
    page_type           TEXT NOT NULL CHECK (page_type IN ('listing', 'place_detail')),
    status              TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
                            'queued', 'fetched', 'parse_error', 'blocked_captcha',
                            'blocked_policy', 'skipped', 'failed'
                        )),
    last_run_id         INTEGER REFERENCES crawl_runs(id) ON DELETE SET NULL,
    http_status         INTEGER CHECK (http_status BETWEEN 100 AND 599),
    last_fetched_at     TEXT,
    next_eligible_at    TEXT,
    error_message       TEXT,
    UNIQUE (source_id, canonical_url)
);

-- Immutable-ish extraction evidence; one source page may yield multiple records.
-- JSON1 validity is intentionally checked in Python for compatibility with
-- SQLite builds lacking JSON1. Do not store full copyrighted page HTML here.
CREATE TABLE IF NOT EXISTS raw_place_records (
    id                  INTEGER PRIMARY KEY,
    run_id              INTEGER NOT NULL REFERENCES crawl_runs(id) ON DELETE RESTRICT,
    page_id             INTEGER NOT NULL REFERENCES source_pages(id) ON DELETE RESTRICT,
    external_place_id   TEXT,
    extracted_name      TEXT NOT NULL,
    extracted_address   TEXT,
    extracted_lat       REAL CHECK (extracted_lat BETWEEN -90 AND 90),
    extracted_lon       REAL CHECK (extracted_lon BETWEEN -180 AND 180),
    extracted_category  TEXT,
    extracted_json      TEXT NOT NULL,
    observed_at         TEXT NOT NULL,
    review_status       TEXT NOT NULL DEFAULT 'new' CHECK (review_status IN (
                            'new', 'matched', 'approved', 'rejected', 'needs_review'
                        )),
    matched_place_id    INTEGER REFERENCES places(id) ON DELETE SET NULL,
    review_note         TEXT
);

-- Canonical place. Source text remains in raw_place_records until review.
CREATE TABLE IF NOT EXISTS places (
    id                      INTEGER PRIMARY KEY,
    destination_id          INTEGER NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    display_name            TEXT NOT NULL,
    normalized_name         TEXT NOT NULL,
    address                 TEXT,
    latitude                REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude               REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    kind                    TEXT NOT NULL CHECK (kind IN (
                                'attraction', 'food', 'cafe', 'stay', 'activity', 'other'
                            )),
    indoor_outdoor          TEXT NOT NULL DEFAULT 'unknown' CHECK (indoor_outdoor IN (
                                'indoor', 'outdoor', 'mixed', 'unknown'
                            )),
    rain_sensitivity        INTEGER CHECK (rain_sensitivity BETWEEN 0 AND 3),
    suggested_duration_min  INTEGER CHECK (suggested_duration_min BETWEEN 5 AND 1440),
    quality_status          TEXT NOT NULL DEFAULT 'discovered' CHECK (quality_status IN (
                                'discovered', 'schedulable', 'verified', 'archived'
                            )),
    price_unknown           INTEGER NOT NULL DEFAULT 1 CHECK (price_unknown IN (0, 1)),
    opening_hours_unknown   INTEGER NOT NULL DEFAULT 1 CHECK (opening_hours_unknown IN (0, 1)),
    last_verified_at        TEXT,
    created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (quality_status NOT IN ('schedulable', 'verified')
           OR (suggested_duration_min IS NOT NULL AND indoor_outdoor <> 'unknown'))
);

-- Link a canonical place to one or more independently observed sources.
CREATE TABLE IF NOT EXISTS place_sources (
    id                  INTEGER PRIMARY KEY,
    place_id            INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    source_id           INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    source_url          TEXT NOT NULL,
    external_place_id   TEXT,
    first_seen_at       TEXT NOT NULL,
    last_seen_at        TEXT NOT NULL,
    last_raw_record_id  INTEGER REFERENCES raw_place_records(id) ON DELETE SET NULL,
    UNIQUE (source_id, source_url),
    UNIQUE (source_id, external_place_id),
    UNIQUE (id, place_id)
);

-- Flexible activity tags without storing comma-separated category strings.
CREATE TABLE IF NOT EXISTS tags (
    id      INTEGER PRIMARY KEY,
    slug    TEXT NOT NULL UNIQUE,
    label   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS place_tags (
    place_id    INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    tag_id      INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (place_id, tag_id)
) WITHOUT ROWID;

-- Weekly intervals. Split overnight schedules across two weekday rows.
-- weekday: Mon=0 ... Sun=6. Local business time, not UTC.
CREATE TABLE IF NOT EXISTS opening_intervals (
    id              INTEGER PRIMARY KEY,
    place_id        INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    weekday         INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    opens_local     TEXT NOT NULL CHECK (opens_local GLOB '[0-2][0-9]:[0-5][0-9]'),
    closes_local    TEXT NOT NULL CHECK (closes_local GLOB '[0-2][0-9]:[0-5][0-9]'),
    source_link_id  INTEGER REFERENCES place_sources(id) ON DELETE SET NULL,
    last_checked_at TEXT,
    CHECK (opens_local < closes_local),
    CHECK (opens_local < '24:00' AND closes_local <= '24:00'),
    UNIQUE (place_id, weekday, opens_local, closes_local)
);

-- Exceptions override weekly intervals for that calendar date.
CREATE TABLE IF NOT EXISTS opening_exceptions (
    id              INTEGER PRIMARY KEY,
    place_id        INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    local_date      TEXT NOT NULL,
    closed_all_day  INTEGER NOT NULL DEFAULT 0 CHECK (closed_all_day IN (0, 1)),
    opens_local     TEXT,
    closes_local    TEXT,
    source_link_id  INTEGER REFERENCES place_sources(id) ON DELETE SET NULL,
    CHECK (closed_all_day = 1 OR (opens_local IS NOT NULL AND closes_local IS NOT NULL AND opens_local < closes_local)),
    UNIQUE (place_id, local_date)
);

-- Price is an estimate, scoped to one unit (person, ticket, meal, room...).
CREATE TABLE IF NOT EXISTS price_estimates (
    id              INTEGER PRIMARY KEY,
    place_id        INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    price_type      TEXT NOT NULL CHECK (price_type IN ('entry', 'meal', 'drink', 'room', 'activity', 'other')),
    unit            TEXT NOT NULL CHECK (unit IN ('person', 'ticket', 'meal', 'drink', 'room_night', 'group')),
    min_vnd         INTEGER NOT NULL CHECK (min_vnd >= 0),
    max_vnd         INTEGER NOT NULL CHECK (max_vnd >= min_vnd),
    source_link_id  INTEGER REFERENCES place_sources(id) ON DELETE SET NULL,
    observed_at     TEXT NOT NULL,
    valid_until     TEXT,
    notes           TEXT
);

-- Star ratings are source-specific snapshots, not invented by the planner.
-- A place can have different ratings on different permitted sources.
CREATE TABLE IF NOT EXISTS place_ratings (
    id              INTEGER PRIMARY KEY,
    place_id        INTEGER NOT NULL,
    source_link_id  INTEGER NOT NULL,
    rating_stars    REAL NOT NULL CHECK (rating_stars BETWEEN 0 AND 5),
    rating_count    INTEGER CHECK (rating_count >= 0),
    observed_at     TEXT NOT NULL,
    FOREIGN KEY (source_link_id, place_id) REFERENCES place_sources(id, place_id) ON DELETE CASCADE,
    UNIQUE (source_link_id, observed_at)
);

-- Candidate match proposals are NOT merged automatically.
CREATE TABLE IF NOT EXISTS dedupe_candidates (
    left_place_id   INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    right_place_id  INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    score           REAL NOT NULL CHECK (score BETWEEN 0 AND 1),
    reason          TEXT,
    decision        TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'same', 'different')),
    reviewed_at     TEXT,
    PRIMARY KEY (left_place_id, right_place_id),
    CHECK (left_place_id < right_place_id)
) WITHOUT ROWID;

-- Indexes for region/category search, review queue and polite crawl scheduling.
CREATE INDEX IF NOT EXISTS idx_places_destination_kind_quality
    ON places(destination_id, kind, quality_status);
CREATE INDEX IF NOT EXISTS idx_places_name
    ON places(destination_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_raw_review
    ON raw_place_records(review_status, run_id);
CREATE INDEX IF NOT EXISTS idx_pages_queue
    ON source_pages(source_id, status, next_eligible_at);
CREATE INDEX IF NOT EXISTS idx_place_sources_place
    ON place_sources(place_id);
-- Also establishes the composite parent key when upgrading a v0.1 database
-- whose existing place_sources table predates the UNIQUE(id, place_id) rule.
CREATE UNIQUE INDEX IF NOT EXISTS uq_place_sources_id_place
    ON place_sources(id, place_id);
CREATE INDEX IF NOT EXISTS idx_opening_place_day
    ON opening_intervals(place_id, weekday);
CREATE INDEX IF NOT EXISTS idx_prices_place_type
    ON price_estimates(place_id, price_type);
CREATE INDEX IF NOT EXISTS idx_ratings_place_observed
    ON place_ratings(place_id, observed_at DESC);

-- Convenient read model: one row per place and weekday opening interval.
-- Several rows on one weekday represent separate shifts (e.g. lunch/dinner).
-- No row is not the same as closed: consult opening_hours_unknown and exceptions.
CREATE VIEW IF NOT EXISTS v_place_opening_hours AS
SELECT p.id AS place_id,
       p.display_name,
       p.opening_hours_unknown,
       oi.weekday,
       oi.opens_local AS opening_time,
       oi.closes_local AS closing_time,
       oi.last_checked_at
FROM places AS p
LEFT JOIN opening_intervals AS oi ON oi.place_id = p.id;

-- Convenient read model for maps/cards. Ratings from different sources are
-- NOT averaged together; latest observed snapshot is shown with its source.
CREATE VIEW IF NOT EXISTS v_place_overview AS
SELECT p.id AS place_id,
       p.display_name,
       p.destination_id,
       p.latitude,
       p.longitude,
       p.kind,
       p.opening_hours_unknown,
       p.quality_status,
       (SELECT r.rating_stars FROM place_ratings AS r
        WHERE r.place_id = p.id ORDER BY r.observed_at DESC, r.id DESC LIMIT 1) AS rating_stars,
       (SELECT r.rating_count FROM place_ratings AS r
        WHERE r.place_id = p.id ORDER BY r.observed_at DESC, r.id DESC LIMIT 1) AS rating_count,
       (SELECT s.name FROM place_ratings AS r
        JOIN place_sources AS ps ON ps.id = r.source_link_id
        JOIN sources AS s ON s.id = ps.source_id
        WHERE r.place_id = p.id ORDER BY r.observed_at DESC, r.id DESC LIMIT 1) AS rating_source
FROM places AS p;

INSERT OR IGNORE INTO destinations (slug, display_name, target_places) VALUES
    ('ha-noi', 'HÃ  Ná»™i', 300),
    ('ninh-binh', 'Ninh BÃ¬nh', 300),
    ('tp-ho-chi-minh', 'TP. Há»“ ChÃ­ Minh', 300),
    ('da-lat', 'ÄÃ  Láº¡t', 300);

COMMIT;

-- Review queries (run separately):
-- SELECT d.display_name, COUNT(p.id) AS places,
--        SUM(CASE WHEN p.quality_status IN ('schedulable','verified') THEN 1 ELSE 0 END) AS usable
-- FROM destinations d LEFT JOIN places p ON p.destination_id = d.id
-- GROUP BY d.id ORDER BY d.id;
-- SELECT quality_status, COUNT(*) FROM places GROUP BY quality_status;
-- SELECT * FROM v_place_opening_hours WHERE place_id = 1 ORDER BY weekday, opening_time;
-- SELECT place_id, display_name, rating_stars, rating_count, rating_source
-- FROM v_place_overview WHERE destination_id = 1;
-- SELECT * FROM raw_place_records WHERE review_status = 'needs_review';
-- PRAGMA foreign_key_check;



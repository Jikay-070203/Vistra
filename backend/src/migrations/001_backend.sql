CREATE TABLE trips (
    id TEXT PRIMARY KEY,
    destination_id INTEGER NOT NULL REFERENCES destinations(id),
    request_json TEXT NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 0 CHECK(current_version >= 0),
    created_at TEXT NOT NULL
);
CREATE TABLE itinerary_versions (
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    version INTEGER NOT NULL CHECK(version > 0),
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(trip_id, version)
);
CREATE TABLE revision_previews (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    base_version INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    committed INTEGER NOT NULL DEFAULT 0 CHECK(committed IN (0,1))
);
CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK(category IN ('transport','food','stay','tickets','other')),
    amount_vnd INTEGER NOT NULL CHECK(amount_vnd >= 0),
    occurred_at TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE INDEX idx_expenses_trip ON expenses(trip_id, occurred_at);
CREATE TABLE service_cache (
    cache_key TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    expires_at TEXT NOT NULL
);
CREATE TABLE crawl_requests (
    id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    requested_at TEXT NOT NULL
);
CREATE INDEX idx_crawl_requests_source_time ON crawl_requests(source_id, requested_at);
CREATE TABLE place_reviews (
    id INTEGER PRIMARY KEY,
    place_id INTEGER NOT NULL REFERENCES places(id),
    payload_json TEXT NOT NULL,
    reviewed_at TEXT NOT NULL
);

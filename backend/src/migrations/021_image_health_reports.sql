CREATE TABLE IF NOT EXISTS image_health_reports (
    id TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'place',
    entity_id TEXT,
    status TEXT NOT NULL DEFAULT 'broken',
    decision TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS image_health_url_idx ON image_health_reports(image_url);

ALTER TABLE places ADD COLUMN source_place_id TEXT;
ALTER TABLE places ADD COLUMN source_category TEXT;
ALTER TABLE places ADD COLUMN source_metadata_json TEXT;
ALTER TABLE places ADD COLUMN source_updated_at TEXT;
ALTER TABLE places ADD COLUMN vector_collection TEXT;
ALTER TABLE places ADD COLUMN vector_point_id TEXT;

CREATE UNIQUE INDEX places_source_place_idx
ON places(source_place_id)
WHERE source_place_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS place_images (
    id TEXT PRIMARY KEY,
    place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    source_image_id TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    source TEXT NOT NULL DEFAULT 'unknown',
    license TEXT,
    author TEXT,
    width INTEGER,
    height INTEGER,
    file_size_bytes INTEGER,
    sha256 TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX place_images_source_idx
ON place_images(source_image_id)
WHERE source_image_id IS NOT NULL;

CREATE INDEX place_images_place_idx
ON place_images(place_id, created_at);

ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN default_origin TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN preferred_pace TEXT;
ALTER TABLE users ADD COLUMN preferred_stay TEXT;
ALTER TABLE users ADD COLUMN dietary_preference TEXT;
ALTER TABLE users ADD COLUMN joined_at TEXT;

CREATE TABLE IF NOT EXISTS travel_dna_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    metrics_json TEXT NOT NULL DEFAULT '{}',
    pace TEXT,
    scenery_focus TEXT,
    cuisine_priority TEXT,
    updated_at TEXT NOT NULL
);

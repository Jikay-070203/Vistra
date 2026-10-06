ALTER TABLE trips ADD COLUMN owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE trips ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE trips ADD COLUMN is_published INTEGER NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN confirmed_at TEXT;
ALTER TABLE trips ADD COLUMN published_at TEXT;

CREATE TABLE IF NOT EXISTS community_plan_likes (
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY(trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS trips_community_idx ON trips(is_published, status, created_at);

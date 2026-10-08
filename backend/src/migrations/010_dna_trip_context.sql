CREATE TABLE IF NOT EXISTS dna_analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL DEFAULT '',
    derived_dna_json TEXT NOT NULL,
    confidence REAL,
    sources_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dna_analysis_files (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL REFERENCES dna_analyses(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT
);

ALTER TABLE trips ADD COLUMN dna_analysis_id TEXT;
ALTER TABLE trips ADD COLUMN travel_dna_json TEXT;
ALTER TABLE trips ADD COLUMN notes TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN updated_at TEXT;
UPDATE trips SET updated_at = created_at WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS dna_analyses_user_idx ON dna_analyses(user_id, created_at);
CREATE INDEX IF NOT EXISTS dna_analysis_files_analysis_idx ON dna_analysis_files(analysis_id);

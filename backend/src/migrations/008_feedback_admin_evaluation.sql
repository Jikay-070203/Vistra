CREATE TABLE IF NOT EXISTS feedback_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    route_origin TEXT NOT NULL,
    category TEXT,
    severity TEXT,
    status TEXT NOT NULL DEFAULT 'unassigned',
    user_answer_rating INTEGER,
    rating_comment TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback_replies (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES feedback_tickets(id) ON DELETE CASCADE,
    sender_user_id TEXT NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_items (
    id TEXT PRIMARY KEY,
    collection TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluation_datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_builtin INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS evaluation_cases (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL REFERENCES evaluation_datasets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    input_json TEXT NOT NULL,
    expected_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS evaluation_runs (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL REFERENCES evaluation_datasets(id),
    status TEXT NOT NULL DEFAULT 'queued',
    summary_json TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS system_traces (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    trace_type TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms INTEGER,
    confidence REAL,
    context_json TEXT NOT NULL DEFAULT '{}',
    details_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback_tickets(status, updated_at);
CREATE INDEX IF NOT EXISTS traces_created_idx ON system_traces(created_at);

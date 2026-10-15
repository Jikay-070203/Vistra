CREATE TABLE IF NOT EXISTS system_prompt_settings (
    id INTEGER PRIMARY KEY,
    prompt TEXT NOT NULL,
    updated_by TEXT,
    updated_at TEXT NOT NULL
);
INSERT INTO system_prompt_settings(id, prompt, updated_at)
SELECT 1, 'You are a Vietnamese travel agent. Reply in Vietnamese. Use only verified trip context and never invent facts.', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM system_prompt_settings WHERE id = 1);

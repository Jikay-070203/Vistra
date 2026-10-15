ALTER TABLE chat_messages ADD COLUMN qdrant_synced INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_chat_messages_qdrant_sync ON chat_messages(qdrant_synced, created_at);

ALTER TABLE crawl_requests ADD COLUMN run_id INTEGER REFERENCES crawl_runs(id);
ALTER TABLE crawl_requests ADD COLUMN endpoint TEXT;
ALTER TABLE crawl_requests ADD COLUMN http_status INTEGER;
ALTER TABLE crawl_requests ADD COLUMN error_message TEXT;

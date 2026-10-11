-- Legacy crawler tables are not used by the current runtime or admin import APIs.
-- The supported import flow writes to sources, places, place_sources,
-- place_images and data_import_batches instead.
ALTER TABLE IF EXISTS place_sources
    DROP CONSTRAINT IF EXISTS place_sources_last_raw_record_id_fkey;
DROP TABLE IF EXISTS crawl_requests;
DROP TABLE IF EXISTS raw_place_records;
DROP TABLE IF EXISTS source_pages;
DROP TABLE IF EXISTS crawl_runs;

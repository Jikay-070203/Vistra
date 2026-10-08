ALTER TABLE destinations ADD COLUMN province_code TEXT;
ALTER TABLE destinations ADD COLUMN source_name TEXT;
ALTER TABLE destinations ADD COLUMN updated_at TEXT;

CREATE UNIQUE INDEX destinations_province_code_idx
ON destinations(province_code)
WHERE province_code IS NOT NULL;

UPDATE destinations SET province_code='ha-noi', source_name='Hà Nội', updated_at=CURRENT_TIMESTAMP
WHERE slug='ha-noi';
UPDATE destinations SET province_code='ninh-binh', source_name='Ninh Bình', updated_at=CURRENT_TIMESTAMP
WHERE slug='ninh-binh';
UPDATE destinations SET province_code='ho-chi-minh', source_name='Hồ Chí Minh', updated_at=CURRENT_TIMESTAMP
WHERE slug='tp-ho-chi-minh';
UPDATE destinations SET province_code='da-lat', source_name='Đà Lạt', updated_at=CURRENT_TIMESTAMP
WHERE slug='da-lat';

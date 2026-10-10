-- Destination hierarchy: Da Lat is a city destination inside Lam Dong province.
ALTER TABLE destinations ADD COLUMN parent_destination_id INTEGER REFERENCES destinations(id);
ALTER TABLE destinations ADD COLUMN destination_type TEXT NOT NULL DEFAULT 'province';

UPDATE destinations
SET destination_type = 'city',
    parent_destination_id = (SELECT id FROM destinations WHERE slug = 'lam-dong')
WHERE slug = 'da-lat';

-- Assign the Da Lat urban-area records imported under the Lâm Đồng province
-- destination to the dedicated Đà Lạt destination. The coordinate bounds
-- intentionally exclude the rest of Lâm Đồng (for example Đơn Dương and Bảo Lộc).
UPDATE places
SET destination_id = (SELECT id FROM destinations WHERE slug = 'da-lat')
WHERE destination_id = (SELECT id FROM destinations WHERE slug = 'lam-dong')
  AND latitude BETWEEN 11.80 AND 12.10
  AND longitude BETWEEN 108.30 AND 108.55;

-- Idempotent destination catalog for VISTRA province imports.
BEGIN;
INSERT INTO destinations (slug, display_name, target_places, enabled) VALUES
 ('an-giang','An Giang',300,1),('bac-ninh','Bắc Ninh',300,1),('cao-bang','Cao Bằng',300,1),
 ('ca-mau','Cà Mau',300,1),('can-tho','Cần Thơ',300,1),('gia-lai','Gia Lai',300,1),
 ('hue','Huế',300,1),('ha-tinh','Hà Tĩnh',300,1),('hung-yen','Hưng Yên',300,1),
 ('hai-phong','Hải Phòng',300,1),('khanh-hoa','Khánh Hòa',300,1),('lai-chau','Lai Châu',300,1),
 ('lao-cai','Lào Cai',300,1),('lam-dong','Lâm Đồng',300,1),('lang-son','Lạng Sơn',300,1),
 ('nghe-an','Nghệ An',300,1),('phu-tho','Phú Thọ',300,1),('quang-ngai','Quảng Ngãi',300,1),
 ('quang-ninh','Quảng Ninh',300,1),('quang-tri','Quảng Trị',300,1),('son-la','Sơn La',300,1),
 ('thanh-hoa','Thanh Hóa',300,1),('thai-nguyen','Thái Nguyên',300,1),('tuyen-quang','Tuyên Quang',300,1),
 ('tay-ninh','Tây Ninh',300,1),('vinh-long','Vĩnh Long',300,1),('dien-bien','Điện Biên',300,1),
 ('da-nang','Đà Nẵng',300,1),('dak-lak','Đắk Lắk',300,1),('dong-nai','Đồng Nai',300,1),
 ('dong-thap','Đồng Tháp',300,1)
ON CONFLICT (slug) DO UPDATE SET display_name=EXCLUDED.display_name, enabled=1;

UPDATE destinations SET province_code=slug, source_name=display_name, updated_at=CURRENT_TIMESTAMP
WHERE slug IN ('an-giang','bac-ninh','cao-bang','ca-mau','can-tho','gia-lai','hue','ha-tinh','hung-yen','hai-phong','khanh-hoa','lai-chau','lao-cai','lam-dong','lang-son','nghe-an','phu-tho','quang-ngai','quang-ninh','quang-tri','son-la','thanh-hoa','thai-nguyen','tuyen-quang','tay-ninh','vinh-long','dien-bien','da-nang','dak-lak','dong-nai','dong-thap');
UPDATE destinations SET province_code='ho-chi-minh', source_name='Hồ Chí Minh', updated_at=CURRENT_TIMESTAMP WHERE slug='tp-ho-chi-minh';
UPDATE destinations SET province_code='ha-noi', source_name='Hà Nội', updated_at=CURRENT_TIMESTAMP WHERE slug='ha-noi';
UPDATE destinations SET province_code='ninh-binh', source_name='Ninh Bình', updated_at=CURRENT_TIMESTAMP WHERE slug='ninh-binh';
UPDATE destinations SET province_code='da-lat', source_name='Đà Lạt', updated_at=CURRENT_TIMESTAMP WHERE slug='da-lat';
COMMIT;

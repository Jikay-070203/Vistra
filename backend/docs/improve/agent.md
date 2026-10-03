Đúng hướng bạn muốn nên là:

```text
Crawler Docker local
    ↓
crawl.db riêng
    ↓
Crawler Admin UI
    ├── xem log
    ├── chỉnh sửa
    ├── approve/reject
    └── import khi cần
             ↓
Backend production
    ↓
backend.db
    ↓
Frontend sản phẩm
```

## Hiện trạng

Crawler hiện có thể chạy riêng bằng Docker:

```text
http://localhost:8090
```

Crawler dùng database riêng:

```text
crawl_data_py_playwright/data/crawl.db
```

Backend vẫn dùng database sản phẩm:

```text
data/yourtripyourtry.db
```

Như vậy crawler không làm ảnh hưởng trực tiếp đến backend đang chạy sản phẩm.

Khi dữ liệu đã được duyệt, admin bấm:

```text
Import approved vào backend
```

thì dữ liệu mới được nạp vào database backend.

## Điểm cần cải tiến quan trọng

Bản import hiện tại mới ở mức MVP đơn giản: chủ yếu import thông tin chính của `places`.

Nó chưa import đầy đủ:

- `sources`
- `source_pages`
- `place_sources`
- `raw_place_records`
- `opening_intervals`
- `opening_exceptions`
- `price_estimates`
- `place_ratings`
- `dedupe_candidates`
- lịch sử người duyệt
- bằng chứng nguồn dữ liệu

Điều này có thể làm mất liên kết nguồn và khiến dữ liệu imported chưa đủ điều kiện để chuyển thành `verified`.

## Đề xuất database tốt hơn

### Database crawler

Nên có thêm các bảng riêng:

```text
crawl_jobs
crawl_logs
crawl_places
crawl_reviews
crawl_imports
```

Ví dụ `crawl_places`:

```text
id
crawl_job_id
external_id
name
address
latitude
longitude
kind
raw_json
status
review_note
reviewed_by
reviewed_at
imported_at
backend_place_id
```

Trạng thái:

```text
pending
approved
rejected
imported
```

### Database backend

Giữ nguyên schema hiện tại, vì đã khá đầy đủ:

```text
destinations
sources
source_pages
raw_place_records
places
place_sources
opening_intervals
price_estimates
place_reviews
dedupe_candidates
trips
itinerary_versions
expenses
```

Nhưng nên bổ sung:

```text
import_batches
audit_logs
```

Để biết:

- Ai import.
- Import lúc nào.
- Import bao nhiêu bản ghi.
- Bản ghi crawler nào tạo ra backend place nào.
- Có lỗi import nào không.

## Flow import nên dùng

```text
Crawler lấy dữ liệu
    ↓
Lưu raw vào crawl.db
    ↓
Admin chỉnh sửa
    ↓
Admin approve
    ↓
Kiểm tra duplicate
    ↓
Kiểm tra tọa độ
    ↓
Kiểm tra nguồn
    ↓
Import sang backend.db
    ↓
Tạo place_sources
    ↓
Tạo raw_place_records
    ↓
Đặt trạng thái discovered/schedulable
    ↓
Admin backend review tiếp
    ↓
Đặt verified nếu đủ dữ liệu
```

Không nên import trực tiếp thành `verified`.

## Quy tắc chất lượng đề xuất

### Được import

- Có tên.
- Có tọa độ.
- Có loại địa điểm.
- Có destination hợp lệ.
- Có external ID.
- Có source URL.
- Không trùng pending.
- Được admin approve.

### Được dùng để lập lịch

```text
quality_status = schedulable
```

### Được xem là dữ liệu tin cậy

```text
quality_status = verified
```

Chỉ nên đặt `verified` khi có:

- Nguồn giá.
- Nguồn giờ mở cửa.
- Thời gian tham quan hợp lý.
- Đã xử lý duplicate.

## Kiến trúc triển khai phù hợp

### Local crawler

```text
crawler container
crawler.db
crawler admin UI
```

Dùng để:

- Crawl.
- Kiểm duyệt.
- Chuẩn hóa.
- Theo dõi log.

### Backend sản phẩm

```text
backend API
backend.db
frontend
```

Dùng để:

- Phục vụ user.
- Tạo lịch.
- Quản lý trip.
- Chạy agent.
- Không chạy crawler trực tiếp.

## Kết luận

Database hiện tại đủ tốt cho MVP backend, nhưng cơ chế import cần cải tiến trước khi sử dụng lâu dài.

Ưu tiên nên làm:

1. Crawler chỉ ghi vào `crawl.db`.
2. Admin duyệt trước khi import.
3. Import đầy đủ nguồn và raw evidence.
4. Lưu lịch sử import.
5. Không tự động đặt dữ liệu thành `verified`.
6. Backend chỉ dùng dữ liệu đã import hợp lệ.
7. Có rollback nếu một batch import bị lỗi.

Mô hình này sẽ giúp crawler local độc lập, backend ổn định và dữ liệu sản phẩm không bị dữ liệu crawl thô làm bẩn.
Có thể làm, nhưng cần lưu ý: không nên chuyển toàn bộ dữ liệu `places` khỏi SQLite sang Qdrant.

Qdrant phù hợp để lưu:

- Vector embedding.
- Nội dung mô tả địa điểm.
- Tags.
- Search semantic.
- Context cho Gemini.

SQLite vẫn nên giữ dữ liệu có tính giao dịch:

- `destinations`
- `trips`
- `itinerary_versions`
- `expenses`
- `place_reviews`
- `dedupe_candidates`
- `crawl_runs`
- Mapping `place_id ↔ qdrant_point_id`

Kiến trúc nên là:

```text
Crawler
    ↓
crawl.db riêng
    ↓
Admin UI: src/admin
    ↓ approve
SQLite backend
    ├── trips
    ├── expenses
    ├── reviews
    └── place metadata chính
          ↓ index
Qdrant
    ├── embeddings
    ├── place content
    ├── coordinates
    ├── opening hours
    ├── prices
    └── source references
          ↓
Gemini Agent semantic search
```

## Cấu trúc đề xuất

```text
src/
├── admin/
│   ├── index.html
│   ├── admin.js
│   └── admin.css
├── backend/
│   ├── qdrant.py
│   ├── embeddings.py
│   └── ...
├── crawl_data_py_playwright/
│   └── data/crawl.db
├── data/
│   └── yourtripyourtry.db
└── docker-compose.yml
```

## Cần bổ sung

### Qdrant service

```yaml
qdrant:
  image: qdrant/qdrant:latest
  ports:
    - "6333:6333"
  volumes:
    - ./data/qdrant:/qdrant/storage
```

Backend sẽ kết nối:

```env
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=places
```

### SQLite mapping

Nên thêm migration:

```sql
CREATE TABLE place_search_index (
    place_id INTEGER PRIMARY KEY,
    qdrant_point_id TEXT NOT NULL UNIQUE,
    indexed_at TEXT NOT NULL,
    embedding_model TEXT NOT NULL,
    content_hash TEXT NOT NULL
);
```

### Admin UI

`src/admin` nên có:

- Danh sách crawl jobs.
- Log crawl.
- Danh sách places pending.
- Approve/reject.
- Chỉnh sửa place.
- Import vào backend.
- Nút `Index to Qdrant`.
- Trạng thái:

```text
pending
approved
imported
indexed
rejected
```

## Flow dữ liệu đề xuất

```text
Crawl
  ↓
crawl.db
  ↓
Admin review
  ↓
Approved
  ↓
Import backend SQLite
  ↓
Generate embedding
  ↓
Upsert Qdrant
  ↓
Gemini search Qdrant
  ↓
Planner dùng dữ liệu đã xác thực
```

Không nên để Gemini đọc trực tiếp toàn bộ Qdrant mà không qua filter. Agent cần lọc theo:

- Destination.
- Kind.
- Quality status.
- Coordinates.
- Opening hours.
- Duplicate status.
- Source status.

## Đánh giá database hiện tại

Database hiện tại đã đủ tốt cho phần trip/planner, nhưng chưa nên rút gọn quá mạnh. Nếu xóa các bảng place khỏi SQLite ngay, các chức năng hiện tại sẽ hỏng:

- `/places`
- `/places/{id}`
- Review admin.
- Duplicate resolution.
- Planner.
- Recommendations.
- Opening hours.
- Price calculation.

Nên thực hiện theo 3 giai đoạn:

1. Thêm Qdrant và lập index song song, chưa xóa bảng SQLite.
2. Chuyển agent sang semantic search Qdrant.
3. Sau khi ổn định mới cân nhắc giảm dữ liệu place trong SQLite.

Đây là thay đổi kiến trúc lớn, nên không nên xóa trực tiếp schema hiện tại. Bước an toàn nhất là tạo `src/admin` và tích hợp Qdrant song song với database hiện tại trước.
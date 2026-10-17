# BÁO CÁO DỰ ÁN BUILD PHASE · ĐỘI P-103
# PHẦN 3: TÀI LIỆU ĐẶC TẢ YÊU CẦU & THIẾT KẾ HỆ THỐNG (SRS & SDD)

---

## PHẦN A: ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)

### 1. MỤC TIÊU & PHẠM VI HỆ THỐNG (SYSTEM OBJECTIVES & SCOPE)
* **Mục tiêu**: Xây dựng nền tảng trợ lý du lịch AI thế hệ mới (**VISTRA**), xóa bỏ tình trạng phân mảnh thông tin, giải quyết triệt để vấn đề "ảo giác" (hallucination) của các mô hình ngôn ngữ lớn, đồng thời cá nhân hóa lịch trình theo gu thẩm mỹ thị giác độc bản của từng du khách.
* **Phạm vi địa lý MVP**: Chuẩn hóa dữ liệu sâu tại 4 trung tâm du lịch lớn của Việt Nam: **Hà Nội**, **Ninh Bình**, **TP. Hồ Chí Minh**, **Đà Lạt**; hỗ trợ danh mục điểm đến mở rộng tại 32+ tỉnh thành trên toàn quốc.

### 2. ĐỐI TƯỢNG SỬ DỤNG HỆ THỐNG (USER PERSONAS)
1. **Khách du lịch tự túc (Solo / Couple Traveler - "The Explorer")**:
   * *Nhu cầu*: Muốn có lịch trình linh hoạt theo nhịp độ thư thái (`relaxed`), thích khám phá các góc quán cafe và cảnh đẹp thiên nhiên dựa trên các bức ảnh cảm hứng sưu tầm được.
2. **Gia đình / Nhóm bạn đông người ("The Coordinator")**:
   * *Nhu cầu*: Cần kiểm soát ngân sách chặt chẽ (`budget_vnd`), tối ưu quãng đường di chuyển bằng ô tô (`car`), yêu cầu các điểm đến phù hợp cho mọi lứa tuổi và không bị ảnh hưởng bởi thời tiết xấu.
3. **Quản trị viên hệ thống ("System Administrator")**:
   * *Nhu cầu*: Duyệt chất lượng dữ liệu cào về, hợp nhất các địa điểm trùng lặp (`dedupe_candidates`), giám sát chất lượng phản hồi của AI và cấu hình linh hoạt nhà cung cấp mô hình (Google Gemini / OpenAI).

---

### 3. ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

| Mã FR | Tên chức năng | Mô tả chi tiết & Tiêu chuẩn nghiệm thu (Acceptance Criteria) | Mức độ ưu tiên |
| :---: | :--- | :--- | :---: |
| **FR1** | **Xác thực & Quản lý người dùng** | Cho phép đăng ký, đăng nhập an toàn qua email và mật khẩu mã hóa (Argon2/Bcrypt). Quản lý phiên làm việc thông qua cookie an toàn `vistra_session` (thời hạn 30 phút, HttpOnly) và cơ chế làm mới `vistra_refresh` (1 ngày). | **Bắt buộc (P0)** |
| **FR2** | **Tra cứu Điểm đến & Địa điểm** | Cung cấp danh mục điểm đến chuẩn hóa kèm tọa độ tâm. Hỗ trợ tìm kiếm, phân trang và lọc địa điểm theo danh mục (`attraction`, `food`, `cafe`, `stay`, `activity`), mức độ nhạy cảm thời tiết và trạng thái chất lượng (`schedulable`, `verified`). | **Bắt buộc (P0)** |
| **FR3** | **Phân tích Gu du lịch qua ảnh (Travel DNA)** | Tiếp nhận từ 1 đến 3 ảnh tải lên từ người dùng (dung lượng $\le 5\text{MB}$/ảnh, định dạng JPEG/PNG/WebP). Sử dụng mô hình thị giác **Google SigLIP2** trích xuất vector và ánh xạ thành 12 chiều thẩm mỹ (thiên nhiên, văn hóa, ẩm thực, nhịp độ). | **Bắt buộc (P0)** |
| **FR4** | **Khởi tạo & Quản lý Chuyến đi** | Cho phép người dùng tạo chuyến đi với các tham số: điểm đến, ngày bắt đầu, số ngày (tối thiểu 1 ngày), số người, ngân sách (tổng cộng hoặc trên mỗi người), phương tiện di chuyển, nhịp độ và danh sách điểm bắt buộc ghé thăm (`must_visit`). | **Bắt buộc (P0)** |
| **FR5** | **Sinh Lịch trình Tự động (Planner)** | Thuật toán tối ưu hóa phân cụm địa lý và sắp xếp các mốc tham quan hợp lý theo ngày. Đảm bảo thời gian di chuyển giữa các điểm thực tế, không vượt quá khung thời gian hoạt động trong ngày của người dùng. | **Bắt buộc (P0)** |
| **FR6** | **Thẩm định & Tự sửa lỗi (Critic Loop)** | Critic Agent tự động kiểm tra xung đột: (1) Giờ mở cửa thực tế của địa điểm, (2) Dự báo thời tiết có mưa không phù hợp với điểm ngoài trời, (3) Vượt định mức ngân sách. Nếu vi phạm, tự động hoán đổi địa điểm thay thế. | **Bắt buộc (P0)** |
| **FR7** | **Quản lý Chi tiêu & Ngân sách** | Ghi nhận các khoản chi phát sinh thực tế theo phân loại (`transport`, `food`, `stay`, `tickets`, `other`). Tính toán tổng chi tiêu lũy kế và so sánh trực quan với trần ngân sách dự kiến ban đầu. | **Quan trọng (P1)** |
| **FR8** | **Quản trị Địa điểm & Cấu hình AI** | Cung cấp giao diện và API cho Admin: duyệt chất lượng địa điểm (`discovered` $\rightarrow$ `schedulable`), xử lý trùng lặp (`same`/`different`), và chuyển đổi runtime giữa Google Gemini 3.5 Flash Lite và OpenAI. | **Quan trọng (P1)** |

---

### 4. ĐẶC TẢ YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

1. **Hiệu năng & Độ trễ (NFR1 - Performance & Latency)**:
   * Thời gian phản hồi cho các API tra cứu dữ liệu (Destinations, Places, Trips): $P95 < 500\text{ ms}$.
   * Toàn bộ chu trình sinh lịch trình Multi-Agent phức tạp (bao gồm tra cứu thời tiết, định tuyến ORS và Gemini LLM): $P95 < 5.0\text{ giây}$.
2. **Chống ảo giác & Tính minh bạch (NFR2 - Zero Hallucination & Grounding)**:
   * 100% các địa điểm trong lịch trình phải tồn tại trong cơ sở dữ liệu đã chuẩn hóa (`places`). Hệ thống nghiêm cấm tự ý tạo ra địa danh hoặc địa chỉ ảo không có tọa độ GPS.
   * Tất cả dữ liệu hiển thị phải đính kèm thông tin bản quyền: `© OpenStreetMap contributors` (ODbL 1.0).
3. **Bảo mật & Toàn vẹn dữ liệu (NFR3 - Security & Privacy)**:
   * Cookie xác thực phải sử dụng các thuộc tính `HttpOnly`, `SameSite=Lax` và `Secure` trên môi trường sản xuất.
   * Toàn bộ API nhận JSON đều phải kiểm tra tính hợp lệ bằng Pydantic với cờ `extra="forbid"`, loại bỏ nguy cơ injection.
4. **Khả năng chuyển đổi cơ sở dữ liệu (NFR4 - Database Portability)**:
   * Lớp cơ sở dữ liệu phải hoạt động trơn tru trên cả **SQLite** (cho môi trường local/offline nhẹ) và **PostgreSQL** (cho môi trường Cloud Production) thông qua lớp adapter thống nhất `PostgresConnection` trong `db.py`.
5. **Đạo đức thu thập dữ liệu (NFR5 - Ethical Crawling)**:
   * Trình thu thập dữ liệu tôn trọng tuyệt đối tệp `robots.txt` của nguồn tin, độ trễ tối thiểu giữa các lần gọi trang là 5.000 ms, giới hạn tối đa 40 truy vấn/ngày cho các API công cộng (Overpass API).

---

## PHẦN B: TÀI LIỆU THIẾT KẾ PHẦN MỀM (SOFTWARE DESIGN DOCUMENT - SDD)

### 1. THIẾT KẾ CHI TIẾT CƠ SỞ DỮ LIỆU (DATABASE SCHEMA DESIGN)

Hệ thống triển khai 22 bảng dữ liệu quan hệ được chuẩn hóa theo dạng chuẩn 3NF:

#### 1.1. Bảng `destinations` (Danh mục Điểm đến sản phẩm)
```sql
CREATE TABLE destinations (
    id              BIGSERIAL PRIMARY KEY,
    slug            TEXT NOT NULL UNIQUE,          -- Định danh URL: ha-noi, ninh-binh...
    display_name    TEXT NOT NULL,                 -- Tên hiển thị tiếng Việt
    admin_name      TEXT,                          -- Đơn vị hành chính
    center_lat      DOUBLE PRECISION,              -- Tọa độ vĩ độ tâm điểm đến
    center_lon      DOUBLE PRECISION,              -- Tọa độ kinh độ tâm điểm đến
    target_places   INTEGER NOT NULL DEFAULT 300,  -- Chỉ tiêu dữ liệu (300 places/destination)
    enabled         INTEGER NOT NULL DEFAULT 1     -- Trạng thái kích hoạt (0/1)
);
```

#### 1.2. Bảng `places` (Thực thể Địa điểm chuẩn hóa Canonical)
```sql
CREATE TABLE places (
    id                      BIGSERIAL PRIMARY KEY,
    destination_id          BIGINT NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    display_name            TEXT NOT NULL,
    normalized_name         TEXT NOT NULL,         -- Tên viết thường không dấu để tìm kiếm nhanh
    address                 TEXT,
    latitude                DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude               DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    kind                    TEXT NOT NULL CHECK (kind IN ('attraction','food','cafe','stay','activity','other')),
    indoor_outdoor          TEXT NOT NULL DEFAULT 'unknown' CHECK (indoor_outdoor IN ('indoor','outdoor','mixed','unknown')),
    rain_sensitivity        INTEGER CHECK (rain_sensitivity BETWEEN 0 AND 3), -- 0: không sợ mưa, 3: hủy nếu mưa
    suggested_duration_min  INTEGER CHECK (suggested_duration_min BETWEEN 5 AND 1440),
    quality_status          TEXT NOT NULL DEFAULT 'discovered' CHECK (quality_status IN ('discovered','schedulable','verified','archived')),
    price_unknown           INTEGER NOT NULL DEFAULT 1,
    opening_hours_unknown   INTEGER NOT NULL DEFAULT 1,
    last_verified_at        TEXT,
    created_at              TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_places_destination_kind_quality ON places(destination_id, kind, quality_status);
CREATE INDEX idx_places_name ON places(destination_id, normalized_name);
```

#### 1.3. Bảng `opening_intervals` (Khung giờ mở cửa hàng tuần)
```sql
CREATE TABLE opening_intervals (
    id              BIGSERIAL PRIMARY KEY,
    place_id        BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    weekday         INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0: Thứ 2 ... 6: Chủ nhật
    opens_local     TEXT NOT NULL,                 -- Giờ mở cửa định dạng HH:MM (giờ địa phương)
    closes_local    TEXT NOT NULL,                 -- Giờ đóng cửa định dạng HH:MM
    source_link_id  BIGINT REFERENCES place_sources(id) ON DELETE SET NULL,
    last_checked_at TEXT,
    UNIQUE (place_id, weekday, opens_local, closes_local)
);
CREATE INDEX idx_opening_place_day ON opening_intervals(place_id, weekday);
```

#### 1.4. Bảng `trips` (Hồ sơ Chuyến đi của người dùng)
```sql
CREATE TABLE trips (
    id                  TEXT PRIMARY KEY,              -- Mã định danh UUID
    user_id             TEXT REFERENCES users(id) ON DELETE SET NULL,
    destination_id      BIGINT NOT NULL REFERENCES destinations(id),
    request_json        TEXT NOT NULL,                 -- Snapshot toàn bộ yêu cầu TripCreate ban đầu
    current_version     INTEGER NOT NULL DEFAULT 0,    -- Phiên bản lịch trình hiện tại
    dna_analysis_id     TEXT,                          -- Tham chiếu phân tích Travel DNA liên quan
    travel_dna_json     TEXT,                          -- Vector và chỉ số DNA áp dụng riêng cho trip
    notes               TEXT NOT NULL DEFAULT '',
    is_deleted          INTEGER NOT NULL DEFAULT 0,    -- Xóa mềm (Thùng rác)
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
);
```

#### 1.5. Bảng `itinerary_versions` & `revision_previews` (Lịch trình đa phiên bản)
```sql
CREATE TABLE itinerary_versions (
    trip_id         TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    version         INTEGER NOT NULL CHECK (version > 0),
    payload_json    TEXT NOT NULL,                 -- JSON chứa toàn bộ ngày, mốc thời gian và chi tiết POI
    created_at      TEXT NOT NULL,
    PRIMARY KEY (trip_id, version)
);

CREATE TABLE revision_previews (
    id              TEXT PRIMARY KEY,              -- Token xem trước thay đổi
    trip_id         TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    base_version    INTEGER NOT NULL,
    payload_json    TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    expires_at      TEXT NOT NULL,
    committed       INTEGER NOT NULL DEFAULT 0 CHECK (committed IN (0, 1))
);
```

#### 1.6. Bảng `dna_analyses` (Lưu vết Phân tích Travel DNA từ ảnh)
```sql
CREATE TABLE dna_analyses (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description         TEXT NOT NULL DEFAULT '',
    derived_dna_json    TEXT NOT NULL,             -- Chỉ số trích xuất từ mô hình SigLIP2
    confidence          REAL,                      -- Độ tin cậy (0.0 đến 1.0)
    sources_json        TEXT NOT NULL DEFAULT '[]',-- Danh sách metadata ảnh Cloudinary
    status              TEXT NOT NULL DEFAULT 'completed',
    created_at          TEXT NOT NULL,
    expires_at          TEXT NOT NULL              -- Tự động hết hạn sau 24 giờ
);
```

#### 1.7. Bảng `expenses` (Theo dõi Chi tiêu thực tế)
```sql
CREATE TABLE expenses (
    id              TEXT PRIMARY KEY,
    trip_id         TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    category        TEXT NOT NULL CHECK (category IN ('transport','food','stay','tickets','other')),
    amount_vnd      BIGINT NOT NULL CHECK (amount_vnd >= 0),
    occurred_at     TEXT NOT NULL,                 -- Thời điểm phát sinh có múi giờ ISO-8601
    note            TEXT NOT NULL DEFAULT '',
    created_at      TEXT NOT NULL
);
CREATE INDEX idx_expenses_trip ON expenses(trip_id, occurred_at);
```

---

### 2. THIẾT KẾ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API CONTRACT SPECIFICATIONS)

Toàn bộ hệ thống tuân thủ chuẩn RESTful API, tài liệu hóa tự động qua OpenAPI 3.1:

| Method | Đường dẫn Endpoint | Mô tả chức năng | Yêu cầu quyền / Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/health` | Kiểm tra tình trạng hoạt động của dịch vụ | Công khai |
| `GET` | `/destinations` | Lấy danh sách điểm đến đã kích hoạt và tọa độ tâm | Công khai |
| `GET` | `/places` | Tìm kiếm và lọc danh mục địa điểm (phân trang, theo tỉnh) | Công khai |
| `GET` | `/places/{id}` | Lấy chi tiết một địa điểm kèm nguồn dữ liệu ODbL | Công khai |
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản người dùng mới | Công khai |
| `POST` | `/api/v1/auth/login` | Đăng nhập và thiết lập cookie HttpOnly | Công khai |
| `POST` | `/api/v1/dna/analyze` | Gửi 1-3 ảnh Cloudinary để phân tích Travel DNA | Session / Cookie |
| `POST` | `/trips` | Tạo chuyến đi mới kèm cấu hình Travel DNA | Session / Token |
| `GET` | `/trips` | Lấy danh sách chuyến đi của người dùng | Session / Token |
| `GET` | `/trips/{id}` | Lấy chi tiết chuyến đi và phiên bản lịch trình hiện hành | Session / Token |
| `POST` | `/trips/{id}/generate` | Kích hoạt AI Agent sinh lịch trình chi tiết | Session / Token |
| `POST` | `/trips/{id}/revisions/preview` | Xem trước bản sửa đổi lịch trình (chuyển đổi địa điểm) | Session / Token |
| `POST` | `/trips/{id}/revisions/commit` | Xác nhận và lưu phiên bản lịch trình mới | Session / Token |
| `POST` | `/trips/{id}/expenses` | Ghi nhận một khoản chi tiêu mới cho chuyến đi | Session / Token |
| `GET` | `/trips/{id}/budget` | Xem tổng kết ngân sách, chi tiêu và số dư còn lại | Session / Token |
| `GET` | `/admin/duplicates` | Danh sách các cặp địa điểm nghi vấn trùng lặp | Quyền Admin |
| `POST` | `/admin/duplicates/{l_id}/{r_id}` | Quyết định gộp hoặc tách địa điểm (`same`/`different`) | Quyền Admin |
| `PUT` | `/admin/ai/provider` | Cập nhật cấu hình mô hình AI (Gemini / OpenAI) | Quyền Admin |

#### Ví dụ Request & Response chuẩn: `POST /trips/{id}/generate`
* **Response `200 OK`**:
```json
{
  "trip_id": "trip-89a1f2b4-5231-4c12",
  "version": 1,
  "destination": "ninh-binh",
  "total_days": 3,
  "budget_summary": {
    "planned_vnd": 5000000,
    "estimated_cost_vnd": 3850000,
    "status": "within_budget"
  },
  "days": [
    {
      "day_number": 1,
      "date": "2026-11-10",
      "weather_forecast": { "condition": "sunny", "temp_c": 28, "rain_risk": "low" },
      "stops": [
        {
          "order": 1,
          "place_id": 12,
          "name": "Khu du lịch sinh thái Tràng An",
          "start_time": "08:30",
          "end_time": "11:30",
          "kind": "attraction",
          "estimated_cost_vnd": 250000,
          "indoor_outdoor": "outdoor"
        },
        {
          "order": 2,
          "place_id": 45,
          "name": "Nhà hàng Dê núi Ba Cửa",
          "start_time": "12:00",
          "end_time": "13:30",
          "kind": "food",
          "estimated_cost_vnd": 300000,
          "indoor_outdoor": "indoor"
        }
      ]
    }
  ]
}
```

---

### 3. THIẾT KẾ THUẬT TOÁN ĐIỀU PHỐI & LẬP LỊCH (ALGORITHM & SCHEDULING ENGINE)

Thuật toán lập lịch trình của VISTRA dựa trên bài toán tối ưu hóa đa mục tiêu có ràng buộc (**Constrained Multi-Objective Optimization**):

1. **Hàm mục tiêu (Objective Function)**:
   $$\max \quad \text{Score} = \alpha \cdot S_{DNA} + \beta \cdot S_{Rating} - \gamma \cdot \sum D_{Haversine} - \delta \cdot \text{Penalty}_{Rain}$$
   *Trong đó: $S_{DNA}$ là điểm phù hợp với gu thẩm mỹ của khách, $S_{Rating}$ là uy tín điểm đến, $D_{Haversine}$ là tổng cự ly di chuyển, $\text{Penalty}_{Rain}$ là điểm phạt nếu xếp điểm ngoài trời vào giờ mưa.*

2. **Ràng buộc cứng (Hard Constraints - Bắt buộc thỏa mãn)**:
   * Giờ ghé thăm $[T_{start}, T_{end}]$ phải nằm trọn trong khung giờ mở cửa của ngày hôm đó:
     $$[T_{start}, T_{end}] \subseteq [\text{opens\_local}, \text{closes\_local}]$$
   * Không có 2 địa điểm nào bị xếp trùng lặp thời gian trong cùng một ngày.
   * Thời gian di chuyển giữa 2 điểm liên tiếp $A \rightarrow B$ phải lớn hơn thời gian tối thiểu tính toán từ OpenRouteService.
   * Tổng chi phí vé tham quan không được vượt quá hạn mức ngân sách cam kết.

3. **Cơ chế Vòng lặp tự sửa lỗi (Critic Repair Loop)**:
   * Nếu **Critic Agent** phát hiện vi phạm (ví dụ: trời mưa trên $70\%$ vào khung giờ chiều nhưng lại xếp đi thuyền Tràng An), Agent kích hoạt hành động sửa đổi:
   * Tìm kiếm trong bảng `places` các địa điểm lân cận có `kind IN ('attraction', 'activity')` và `indoor_outdoor = 'indoor'` (ví dụ: Bảo tàng Ninh Bình hoặc Cố đô Hoa Lư - khu trưng bày).
   * Thực hiện hoán đổi vị trí và thẩm định lại toàn bộ chuỗi thời gian. Giới hạn tối đa **3 lượt sửa lỗi** (`max_repairs=3`) để chống vòng lặp vô hạn.

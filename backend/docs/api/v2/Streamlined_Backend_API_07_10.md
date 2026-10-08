# VISTRA — Danh Sách API Backend Đã Tinh Gọn & Gom Nhóm (Theo Yêu Cầu UI/UX)

Ngày review: 07/10/2026  
Mục tiêu: Chuẩn hóa, loại bỏ phân mảnh endpoint, gom các tác vụ tương đồng nghiệp vụ thành RESTful resource thống nhất.

---

## 1. Bảng Phân Tích Gom Cụm Nghiệp Vụ

| Nhóm nghiệp vụ | Các mã FE bị phân mảnh | Giải pháp gom & Tinh gọn | Endpoint chuẩn hóa |
|---|---|---|---|
| **Khám phá & Gợi ý điểm đến** | `API-10`, `API-11`, `API-12`, `API-25` | Gom catalog tĩnh vào route chung `/catalog/{type}`; gộp gợi ý, chi tiết và so sánh điểm đến vào 2 route `/destinations` (hỗ trợ query param `?ids=1,2,3`). | `GET /catalog/{type}`<br>`GET /destinations/recommendations`<br>`GET /destinations/{id}` |
| **Vòng đời & Sửa đổi Trip** | `API-14`, `API-15`, `API-16`, `API-18`, `API-19`, `API-20` | Tạo trip kèm sinh lịch trình luôn trong `POST`; đọc detail trả full dữ liệu (kèm budget, stops, warnings); gom sửa thứ tự kéo thả, đổi ràng buộc, chốt trip (`confirmed`) và publish vào `PATCH`. | `POST /trips`<br>`GET /trips/{id}`<br>`PATCH /trips/{id}` |
| **Quản trị CMS Nội dung** | `API-40` đến `API-47` (Intro, Hero, Dị ứng) | Không xé lẻ API theo từng bảng nội dung. Gom về RESTful Collection động `/admin/content/{collection}` với thao tác CRUD + toggle active/inactive chung. | `GET/POST /admin/content/{collection}`<br>`PATCH/DELETE /admin/content/{collection}/{id}` |
| **Quản trị Thực thể & Import** | `API-48` đến `API-54` | Dùng pattern Dynamic Entity cho CRUD metadata/data; gom 2 bước Preview và Commit của Import JSON qua cờ `?dry_run=true`. | `GET/POST/PATCH/DELETE /admin/entities/{entity}`<br>`POST /admin/entities/{entity}/import?dry_run={bool}` |
| **Hộp thư Phản hồi & Đánh giá** | `API-26` đến `API-28`, `API-33` đến `API-35` | Chuẩn hóa tài nguyên `/feedback` cho cả luồng Guest/User và luồng Admin; reply và rating tổ chức thành sub-resource. | `/feedback`<br>`/feedback/{id}/replies`<br>`/feedback/{id}/rating` |

---

## 2. Danh Sách API Đã Chuẩn Hóa (52 Endpoints)

### I. Tài Khoản & Hồ Sơ (Auth & Profile)

| STT | Method | Endpoint | Nghiệp vụ cốt lõi | Mã FE gốc | UI sử dụng |
|:---:|:---:|---|---|---|---|
| 1 | `POST` | `/api/v1/auth/login` | Đăng nhập dùng chung du khách/admin; cấp session & role | API-01 | `/login`, `/admin/login` |
| 2 | `POST` | `/api/v1/auth/register` | Đăng ký tài khoản (ngày sinh, điều khoản) | API-02 | `/register` |
| 3 | `POST` | `/api/v1/auth/logout` | Đăng xuất và hủy session server | API-04 | Toàn bộ hệ thống |
| 4 | `GET` | `/api/v1/auth/me` | Lấy thông tin user hiện tại, role, avatar, badge | API-03 | Navbar, Header |
| 5 | `PATCH` | `/api/v1/users/me` | Cập nhật thông tin cá nhân & điểm xuất phát | API-05 | `/profile` |
| 6 | `GET` | `/api/v1/users/me/dna` | Đọc Travel DNA, trọng số và nguồn tín hiệu | API-06 | `/profile`, `/create-trip` |
| 7 | `PUT` | `/api/v1/users/me/dna` | Cập nhật trọng số và sở thích Travel DNA | API-07 | `/profile` |
| 8 | `GET` | `/api/v1/users/me/subscription` | Đọc gói dịch vụ, hạn mức và lịch sử giao dịch/hóa đơn | API-08 | `/profile` |

---

### II. Danh Mục, Khám Phá & Phân Tích (Public / Common)

| STT | Method | Endpoint | Nghiệp vụ cốt lõi | Mã FE gốc | UI sử dụng |
|:---:|:---:|---|---|---|---|
| 9 | `GET` | `/api/v1/public/landing` | Đọc nội dung trang chủ (Hero active, Intro, Stats) | API-09 | `/` |
| 10 | `GET` | `/api/v1/catalog/{type}` | Đọc danh mục tĩnh dùng chung (`provinces`, `allergies`, `moodboard`) | API-10, API-11, API-12 | `/create-trip`, `/community` |
| 11 | `POST` | `/api/v1/dna/analyze` | Phân tích ảnh và mô tả văn bản thành Travel DNA | API-13 | `/create-trip` |
| 12 | `GET` | `/api/v1/destinations/recommendations` | Gợi ý 5 điểm đến phù hợp kèm thông tin mùa vụ, chi phí | API-25 | `/destinations` |
| 13 | `GET` | `/api/v1/destinations/{id}` | Chi tiết điểm đến (hỗ trợ `?ids=1,2,3` để so sánh trực tiếp) | API-25 | `/destinations` |

---

### III. Hành Trình & Lập Kế Hoạch (Trips & Planner)

| STT | Method | Endpoint | Nghiệp vụ cốt lõi | Mã FE gốc | UI sử dụng |
|:---:|:---:|---|---|---|---|
| 14 | `POST` | `/api/v1/trips` | Tạo bản nháp và sinh lịch trình hoàn chỉnh (≥ 4 ngày, ảnh, DNA) | API-14 | `/create-trip` |
| 15 | `GET` | `/api/v1/trips/{trip_id}` | Đọc hồ sơ hành trình đầy đủ (lịch trình, stops, warnings, ngân sách) | API-15 | `/planner`, `/trip-plan` |
| 16 | `PATCH` | `/api/v1/trips/{trip_id}` | Cập nhật trip: đổi ràng buộc, đổi thứ tự stops, hoặc đổi status (`confirmed`/`published`) | API-16, API-18, API-19, API-20 | `/planner`, `/trip-plan` |
| 17 | `POST` | `/api/v1/trips/{trip_id}/chat` | Hội thoại cùng AI Vistra và tự động đồng bộ lịch trình | API-17 | `/planner` |
| 18 | `GET` | `/api/v1/trips/me` | Danh sách chuyến đi cá nhân (phân trang, lọc, thống kê) | API-21 | `/my-trips`, `/profile` |
| 19 | `GET` | `/api/v1/community/trips` | Tìm kiếm & khám phá hành trình công khai của cộng đồng | API-22 | `/community` |
| 20 | `POST` | `/api/v1/community/trips/{trip_id}/like` | Thích / Bỏ thích hành trình cộng đồng (Idempotent) | API-23 | `/community` |
| 21 | `POST` | `/api/v1/community/trips/{trip_id}/fork` | Sao chép hành trình cộng đồng thành bản nháp cá nhân | API-24 | `/community` |

---

### IV. Phản Hồi Người Dùng (Feedback & Tickets)

| STT | Method | Endpoint | Nghiệp vụ cốt lõi | Mã FE gốc | UI sử dụng |
|:---:|:---:|---|---|---|---|
| 22 | `POST` | `/api/v1/feedback` | Gửi phiếu phản hồi / báo lỗi (hỗ trợ cả Guest và Auth) | API-26 | Nút Phản hồi & Báo lỗi |
| 23 | `GET` | `/api/v1/feedback/me` | Đọc danh sách phản hồi của cá nhân kèm câu trả lời của staff | API-27 | `/profile` |
| 24 | `POST` | `/api/v1/feedback/{id}/rating` | Đánh giá chất lượng câu trả lời hỗ trợ | API-28 | `/profile` |

---

### V. Dashboard & Quản Trị Hệ Thống (Admin Core)

| STT | Method | Endpoint | Nghiệp vụ cốt lõi | Mã FE gốc | UI sử dụng |
|:---:|:---:|---|---|---|---|
| 25 | `GET` | `/api/v1/admin/dashboard` | 5 KPI tổng quan, biểu đồ 12 tháng, 4 trace gần nhất | API-29 | `/admin` |
| 26 | `GET` | `/api/v1/admin/users` | Danh sách/thống kê người dùng (chart, donut, bảng phân trang) | API-30 | `/admin/users` |
| 27 | `PATCH` | `/api/v1/admin/users/{user_id}/status` | Khóa hoặc mở khóa tài khoản người dùng | API-31 | `/admin/users` |
| 28 | `GET` | `/api/v1/admin/revenue` | Báo cáo doanh thu thật, donut tỷ trọng, bảng giao dịch | API-32 | `/admin/revenue` |
| 29 | `GET` | `/api/v1/admin/feedback` | Hộp thư phản hồi, KPI, danh sách ticket & badge chưa xử lý | API-33 | `/admin/feedback` |
| 30 | `PATCH` | `/api/v1/admin/feedback/{id}` | Phân loại danh mục hoặc cập nhật trạng thái phiếu hỗ trợ | API-34 | `/admin/feedback` |
| 31 | `POST` | `/api/v1/admin/feedback/{id}/replies` | Gửi câu trả lời chính thức từ staff cho người dùng | API-35 | `/admin/feedback` |
| 32 | `GET` | `/api/v1/admin/traces` | Danh sách trace logs hệ thống (lọc, phân trang) | API-36 | `/admin/system` |
| 33 | `GET` | `/api/v1/admin/traces/{trace_id}` | Xem chi tiết 1 trace (hỗ trợ deep link từ Dashboard) | API-37 | `/admin/system` |
| 34 | `GET` | `/api/v1/admin/system/metrics` | Đọc 4 KPI hệ thống và 2 nhóm Benchmark | API-39 | `/admin/system` |

---

### VI. Quản Trị Nội Dung & Thực Thể (CMS & Dynamic Entities)

| STT | Method | Endpoint | Nghiệp vụ cốt lõi | Mã FE gốc | UI sử dụng |
|:---:|:---:|---|---|---|---|
| 35 | `GET` | `/api/v1/admin/content/{collection}` | Đọc danh sách nội dung CMS (`hero`, `intro`, `allergies`) | API-40 | `/admin/content` |
| 36 | `POST` | `/api/v1/admin/content/{collection}` | Thêm mới item vào collection CMS tương ứng | API-42, API-45 | `/admin/content` |
| 37 | `PATCH` | `/api/v1/admin/content/{collection}/{id}` | Sửa nội dung hoặc bật/tắt hiển thị (active/inactive) | API-41, API-43, API-46 | `/admin/content` |
| 38 | `DELETE` | `/api/v1/admin/content/{collection}/{id}` | Xóa item khỏi collection CMS | API-44, API-47 | `/admin/content` |
| 39 | `GET` | `/api/v1/admin/entities/metadata` | Lấy metadata 5 thực thể (37 trường form, FK, validation) | API-48 | `/admin/system` |
| 40 | `GET` | `/api/v1/admin/entities/{entity}` | Lấy danh sách bản ghi thực thể (tìm kiếm, phân trang) | API-49 | `/admin/system` |
| 41 | `POST` | `/api/v1/admin/entities/{entity}` | Thêm bản ghi thực thể mới | API-50 | `/admin/system` |
| 42 | `PATCH` | `/api/v1/admin/entities/{entity}/{id}` | Chỉnh sửa bản ghi thực thể | API-51 | `/admin/system` |
| 43 | `DELETE` | `/api/v1/admin/entities/{entity}/{id}` | Xóa bản ghi thực thể (kiểm tra toàn vẹn FK) | API-52 | `/admin/system` |
| 44 | `POST` | `/api/v1/admin/entities/{entity}/import` | Import JSON (`?dry_run=true` để kiểm tra/preview, `false` để nạp thật) | API-53, API-54 | `/admin/system` |

---

### VII. Golden Dataset & Kiểm Thử Hệ Thống

| STT | Method | Endpoint | Nghiệp vụ cốt lõi | Mã FE gốc | UI sử dụng |
|:---:|:---:|---|---|---|---|
| 45 | `GET` | `/api/v1/admin/golden-datasets` | Đọc danh sách bộ dataset kèm kết quả thực thi | API-55 | `/admin/system` |
| 46 | `POST` | `/api/v1/admin/golden-datasets` | Tạo/Nạp mới bộ Golden Dataset | API-56 | `/admin/system` |
| 47 | `POST` | `/api/v1/admin/golden-datasets/{id}/run` | Chạy kiểm thử bộ dataset thực tế (đồng bộ theo hợp đồng FE) | API-57 | `/admin/system` |

---

### VIII. Các API Có Điều Kiện (Chờ Thống Nhất Luồng Nghiệp Vụ)

| STT | Method | Endpoint | Nghiệp vụ cốt lõi | Mã FE gốc | UI sử dụng |
|:---:|:---:|---|---|---|---|
| 48 | `GET` | `/api/v1/admin/safety/catalog` | Đọc catalog Safety Guardrails (nếu BE quản lý dynamic) | API-58 | `/admin/system` |
| 49 | `POST` | `/api/v1/admin/safety/evaluate` | Đánh giá prompt thực tế qua guardrail engine | API-59 | `/admin/system` |
| 50 | `GET` | `/api/v1/auth/oauth/{provider}/url` | Lấy Auth URL nếu chọn luồng Client JSON Redirect | API-60 | `/login`, `/register` |
| 51 | `POST` | `/api/v1/auth/oauth/{provider}/callback` | Đổi code lấy session nếu chọn luồng Client JSON Callback | API-61 | `/login`, `/register` |
| 52 | `POST` | `/api/v1/auth/forgot-password` | Tiếp nhận yêu cầu quên mật khẩu | API-62 | `/login` |
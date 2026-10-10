# Báo Cáo Đối Chiếu & Khoảng Trống API Quản Trị Backend (API-02 / AUDIT-ADMIN)

- **Mã Kiểm Toán:** API-02
- **Thời Điểm Kiểm Toán (Asia/Ho_Chi_Minh):** 2026-10-09 08:35:00 +07:00
- **Phạm Vi:** Toàn bộ component thuộc phân hệ Admin (`/admin`), đối chiếu trực tiếp với mã nguồn backend `backend/src/main.py`, OpenAPI contracts và Git history (`e9c9f1d`, `5889933`).
- **Mục Tiêu:** Cung cấp danh sách đối chiếu chính xác, có bằng chứng mã nguồn về các endpoint đã có, còn thiếu, hoặc không khớp để đội ngũ Backend hoàn thiện.

---

## 1. Nguồn Gốc Lịch Sử Git (Git History Context: Commits `e9c9f1d` & `5889933`)

Khi phân tích sự thay đổi giao diện Admin giữa các đợt cập nhật:
1. **Commit `e9c9f1d` ("refactor(api): integrate backend APIs across client applications"):**
   - Loại bỏ 14,433 dòng code trên toàn bộ ứng dụng, trong đó xóa hoàn toàn kho lưu trữ dữ liệu giả lập phía client (`lib/adminDataStore.ts`, `DemoPlanContext.tsx`, v.v.).
   - Vì Backend lúc đó chưa có các API Quản lý người dùng, Doanh thu, Lược đồ thực thể, nên các màn hình Admin bị cắt giảm mạnh mẽ thành các khung trống (unavailable states) thưa thớt, gây suy giảm trải nghiệm thị giác nghiêm trọng.
2. **Commit `5889933` ("feat(ui-ux): integrate UI/UX remediation plan fixes into BinhNT"):**
   - Khôi phục lại 3,472 dòng code giao diện nhằm lấy lại bố cục phong phú, bảng biểu và biểu đồ trực quan đã được phê duyệt trong thiết kế.
   - Để giao diện hiển thị được số liệu trực quan trong lúc chờ Backend, commit này đã bổ sung tệp `frontend/src/components/admin/demo/adminDemoData.ts` chứa các hằng số `ADMIN_MOCK_USERS`, `ADMIN_MOCK_REVENUE`, `ADMIN_MOCK_PLAN_TRENDS`, `ADMIN_MOCK_PLAN_STATUS_DISTRIBUTION`.
   - **Đánh giá:** Đây là lý do trực tiếp khiến giao diện Admin tái xuất hiện dữ liệu mock. Giải pháp cho `ADM-01` là giữ trọn vẹn bố cục cấu trúc giao diện đã duyệt, kết nối API thật ở các module đã có contract, và hiển thị trạng thái trung thực (honest empty / unavailable state) cho các phần Backend còn thiếu; tuyệt đối không dùng số liệu mock giả vờ làm dữ liệu vận hành.

---

## 2. Bảng Đối Chiếu Thành Phần Admin UI với Backend Routes

| Màn Hình Admin | Thành Phần / Hành Động UI | Dữ Liệu Cần Hiển Thị | Endpoint Frontend Gọi | Tuyến Backend Thực Tế (`main.py`) | Trạng Thái Hợp Đồng | Ghi Chú & Sai Khác (Mismatch / Missing) |
|---|---|---|---|---|---|---|
| `/admin` (Overview) | Thẻ KPI Tổng số phản hồi | `counts.total`, `counts.unassigned` | `useFeedback()` | `GET /admin/feedback/tickets` | **Available** | Đã kết nối, dữ liệu thật từ bảng feedback |
| `/admin` (Overview) | Bảng Trace gần nhất (4 bản ghi) | `traces` list | `getTraces({ page: 1, pageSize: 4 })` | `GET /admin/traces` & `GET /api/v1/admin/traces` | **Available** | Đã kết nối qua proxy `/api/v1/admin/traces` |
| `/admin` (Overview) | Xu hướng kế hoạch (Biểu đồ 6 tháng) | Tháng, số lượng khởi tạo, số lượng chốt | Không có service | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Hiện dùng `ADMIN_MOCK_PLAN_TRENDS`. Backend chưa có route tính toán xu hướng kế hoạch theo tháng |
| `/admin` (Overview) | Cơ cấu trạng thái hành trình | Đang trao đổi, đã chốt, đã chia sẻ | Không có service | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Hiện dùng `ADMIN_MOCK_PLAN_STATUS_DISTRIBUTION`. Backend chưa có route phân bố trạng thái trip |
| `/admin/users` | Danh sách tài khoản người dùng | ID, Họ tên, Email, Vai trò, Trạng thái, Số chuyến đi, Ngày tham gia, Hoạt động cuối | Không có service | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Hiện dùng `ADMIN_MOCK_USERS` (12 mẫu). `backend/src/main.py` không có route `/admin/users` hay `/api/v1/admin/users` |
| `/admin/users` | Bộ lọc vai trò & tìm kiếm | Lọc theo traveler, staff, admin, active/suspended | Filter local | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Cần query params: `search`, `role`, `status`, `page`, `page_size` |
| `/admin/users` | Thẻ KPI người dùng | Tổng số, số travelers, số staff, số admin | Computed local | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Cần trường tổng hợp trong metadata hoặc endpoint riêng |
| `/admin/revenue` | Thẻ KPI Doanh thu | Tổng doanh thu, Doanh thu tháng, Giá trị TB/đơn, Tăng trưởng % | Không có service | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Hiện dùng `ADMIN_MOCK_REVENUE_METRICS`. `backend/src/main.py` không có route tính toán doanh thu |
| `/admin/revenue` | Phân bố doanh thu theo gói | Gói Cơ bản, Nâng cao, Chuyên sâu | Không có service | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Cần thống kê doanh thu theo subscription / tier |
| `/admin/revenue` | Bảng lịch sử giao dịch | Mã đơn, Khách hàng, Gói, Số tiền, Thời gian, Trạng thái, Cổng TT | Không có service | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Hiện dùng `ADMIN_MOCK_REVENUE` (8 đơn). Backend chưa có bảng lưu trữ giao dịch cổng thanh toán |
| `/admin/feedback` | Danh sách vé phản hồi | Danh sách tickets phân trang | `getFeedbackTickets()` | `GET /admin/feedback/tickets` | **Available** | Đã kết nối đầy đủ |
| `/admin/feedback` | Cập nhật trạng thái / mức độ ưu tiên | Trạng thái (open, in_progress, resolved), priority | `updateFeedbackTicket()` | `PATCH /admin/feedback/tickets/{id}` | **Available** | Đã kết nối |
| `/admin/feedback` | Phản hồi vé (Reply) | Thêm câu trả lời từ admin | `replyFeedbackTicket()` | `POST /admin/feedback/tickets/{id}/replies` | **Available** | Đã kết nối |
| `/admin/content` | Danh mục nội dung quản trị | hero-plans, intro-destinations, allergy-options | `getContentCollections()` | `GET /admin/content` | **Available** | Đã kết nối |
| `/admin/content` | Thêm / Sửa / Xóa mục nội dung | Tạo, cập nhật, xóa item trong collection | `createContentItem`, `updateContentItem`, `deleteContentItem` | `POST /admin/content/{collection}`, `PATCH ...`, `DELETE ...` | **Available** | Đã kết nối |
| `/admin/system` | Thống kê hiệu năng hệ thống | latency, active sessions, error rates | `getSystemSummary()`, `getSystemMetrics()` | `GET /admin/system/summary`, `GET /api/v1/admin/system/metrics` | **Available** | Đã kết nối |
| `/admin/system` | Danh sách & chi tiết Trace Logs | Danh sách trace, chi tiết trace | `getTraces()`, `getTraceDetail()` | `GET /api/v1/admin/traces`, `GET /api/v1/admin/traces/{id}` | **Available** | Đã kết nối |
| `/admin/system` | Golden Datasets & Evaluation Runs | Quản lý bộ dữ liệu đánh giá và kích hoạt run | `getEvalDatasets()`, `createEvalDataset()`, `triggerEvalRun()` | `GET /admin/evaluation/datasets`, `POST ...`, `POST /admin/evaluation/runs`, `GET ...` | **Available** | Đã kết nối |
| `/admin/system` | Tab Quản trị Dữ liệu Thực thể (Data Management) | Quản lý schema 63 tỉnh thành, 128 POI, Import JSON | `demoSchema.ts` | **KHÔNG CÓ TRONG BACKEND** | **Missing (Blocked by BE)** | Giao diện mô phỏng cấu trúc schema du lịch. Backend chỉ có endpoint CRUD địa điểm cụ thể (`/places/{id}` review), chưa có schema explorer hay generic JSON importer |

---

## 3. Danh Sách Endpoint Cần Đề Nghị Backend Triển Khai (Backend Action Items)

Để phân hệ Admin có thể chuyển đổi 100% sang dữ liệu thật mà không dùng bất kỳ mock nào:

1. **API Quản lý Người dùng (`GET /api/v1/admin/users`):**
   - Query: `page`, `page_size`, `role` (traveler, staff, admin), `status` (active, suspended), `search`.
   - Response:
     ```json
     {
       "items": [
         {
           "id": "string",
           "full_name": "string",
           "email": "string",
           "role": "traveler | staff | admin",
           "status": "active | suspended",
           "trips_count": 0,
           "joined_at": "ISO string",
           "last_active": "ISO string"
         }
       ],
       "total": 0,
       "summary": { "travelers": 0, "staff": 0, "admin": 0 }
     }
     ```
2. **API Báo cáo Doanh thu & Giao dịch (`GET /api/v1/admin/revenue`):**
   - Query: `time_range`, `tier`, `status`.
   - Response:
     ```json
     {
       "metrics": {
         "total_revenue_vnd": 0,
         "monthly_revenue_vnd": 0,
         "average_order_value_vnd": 0,
         "growth_rate_pct": 0.0,
         "tier_distribution": [
           { "label": "string", "count": 0, "percentage": 0, "revenue_vnd": 0 }
         ]
       },
       "transactions": [
         {
           "id": "string",
           "order_code": "string",
           "user_name": "string",
           "email": "string",
           "plan_title": "string",
           "tier": "string",
           "amount_vnd": 0,
           "created_at": "ISO string",
           "status": "success | pending | refunded",
           "payment_method": "string"
         }
       ]
     }
     ```
3. **API Thống kê Xu hướng Kế hoạch (`GET /api/v1/admin/plans/stats`):**
   - Response: xu hướng kế hoạch theo các tháng gần nhất (`created`, `confirmed`) và cơ cấu phân bố theo trạng thái (`drafting`, `confirmed`, `shared`).

---

## 4. Hướng Xử Lý Phía Frontend Cho Task ADM-01

- Giữ nguyên toàn bộ cấu trúc giao diện, thẻ KPI, layout lưới, tương tác tab và dialog đã được phê duyệt.
- Xóa bỏ triệt để các biến `ADMIN_MOCK_*` khỏi `AdminOverviewScreen.tsx`, `AdminUsersScreen.tsx`, `AdminRevenueScreen.tsx`.
- Thay thế các phần chưa có API bằng trạng thái thông báo trung thực:
  - Hiển thị Empty / Unavailable state lịch sự, ghi rõ: *"Dữ liệu đang chờ kết nối từ dịch vụ Backend"* hoặc *"Chưa có dữ liệu giao dịch"*.
  - Giữ nguyên các phần đã có API thật (`counts`, `traces`, `feedback`, `content`, `system metrics`).
- Ghi nhận trạng thái hoàn thành là **Done (với các trường có API)** và **Blocked by BE (với các trường phụ thuộc API chưa có)**.

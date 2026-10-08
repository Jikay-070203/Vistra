# BÁO CÁO PHÂN TÍCH, KẾ HOẠCH VÀ HƯỚNG DẪN CHUẨN HÓA BACKEND API THEO YÊU CẦU UI/UX VISTRA

- **Ngày ban hành:** 07/10/2026  
- **Mục tiêu:** Cung cấp tài liệu chỉ dẫn hành động (Agent Execution Plan) để Backend Agent hiểu rõ sai lệch hiện tại, danh sách API mục tiêu và các bước kỹ thuật cần thực hiện nhằm đồng bộ hoàn toàn với Frontend UI-first.

---

## 1. TỔNG QUAN TÌNH TRẠNG & NGUYÊN TẮC CHUẨN HÓA

### 1.1. Hiện trạng Backend đối chiếu với Frontend UI
1. **Thiếu tiền tố toàn cục:** Hầu hết endpoint hiện tại đều gắn ở root domain (như `/auth/*`, `/trips/*`, `/destinations/*`), trong khi giao thức FE yêu cầu chuẩn hóa toàn bộ về `/api/v1/*`[cite: 1].
2. **Phân mảnh nghiệp vụ (Over-fragmentation):**
   * *Hành trình (Trips):* Đang xé nhỏ việc tạo trip, generate lịch trình, preview/commit kéo thả, cập nhật ràng buộc, chốt trip (`confirm`), xuất bản (`publication`), và tính chi phí (`budget`/`expenses`) thành các endpoint riêng rẽ[cite: 1].
   * *Khám phá (Destinations):* Chia tách recommendation, catalog điểm đến, mùa vụ và places khiến FE phải gọi nhiều lần để ghép thành 1 màn hình[cite: 1].
3. **Mô hình tương tác chưa khớp UI:**
   * Gửi phản hồi (`/feedback/tickets`) đang ép buộc đăng nhập (`vistra_session`), trong khi nút báo lỗi trên UI cho phép cả khách vãng lai (Guest) gửi[cite: 1].
   * Đổi trạng thái like đang dùng `PUT /community/plans/{id}/like` thay vì RESTful action `POST`[cite: 1].
   * Golden Dataset chạy bất đồng bộ chờ worker (`202 queued`), trong khi CTA trên modal UI cần nhận kết quả thực thi[cite: 1].
4. **Nhiều màn hình Admin chưa có API:** Thiếu hoàn toàn các endpoint thống kê Dashboard, danh sách người dùng, báo cáo doanh thu độc lập, và module Quản trị dữ liệu thực thể (Data Management)[cite: 1].

### 1.2. 5 Nguyên tắc triển khai dành cho Agent
1. **Single Source of Truth cho Trip:** Mỗi khi đọc một hành trình (`GET /api/v1/trips/{trip_id}`), BE phải trả về trọn gói bao gồm lịch trình (hỗ trợ $\ge 4$ ngày), danh sách stops, cảnh báo (warnings), chi phí tổng thể và chi tiết mà không bắt FE gọi thêm endpoint phụ[cite: 1].
2. **Gom cụm thao tác thay đổi trạng thái vào `PATCH`:** Việc cập nhật ràng buộc, kéo thả thay đổi thứ tự điểm dừng, xác nhận chốt trip (`confirmed`) hoặc xuất bản cộng đồng (`published`) đều gom về `PATCH /api/v1/trips/{trip_id}`.
3. **Mô hình Dynamic Resource cho Admin:** 
   * Module CMS nội dung dùng chung template route `/api/v1/admin/content/{collection}`[cite: 1].
   * Module quản trị 5 thực thể hệ thống dùng chung template route `/api/v1/admin/entities/{entity}` và hỗ trợ nạp JSON có cờ `?dry_run=true` để preview trước khi ghi thật.
4. **Không suy diễn sai lệch dữ liệu:** Doanh thu hệ thống (`/admin/revenue`) phải lấy từ bảng lịch sử thanh toán/nâng gói, tuyệt đối không lấy tổng dự toán ngân sách của các chuyến đi để tính doanh thu.
5. **Bảo tồn xác thực phiên:** Giữ nguyên cơ chế bảo mật Cookie `HttpOnly` (`vistra_session`) và `credentials: "include"`, không truyền Role hay User ID từ Client[cite: 1].

---

## 2. KẾ HOẠCH HÀNH ĐỘNG KỸ THUẬT (EXECUTION PLAN CHO AGENT)

Agent cần thực hiện việc refactor và bổ sung theo 4 giai đoạn tuần tự:
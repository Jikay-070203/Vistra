# Báo Cáo Kiểm Toán Dữ Liệu Runtime / Business (DATA-00)

- **Mã Kiểm Toán:** DATA-00
- **Thời Điểm Kiểm Toán (Asia/Ho_Chi_Minh):** 2026-10-09 08:35:00 +07:00
- **Phạm Vi:** Toàn bộ component mounted, hook/controller, domain services, endpoint constants và backend route contracts trong frontend VISTRA.
- **Tiêu Chí Phân Loại:**
  - `API-backed`: Trường dữ liệu thực tế được cung cấp bởi API backend đang hoạt động.
  - `static copy/config/media`: Bản sao chữ, cấu hình giao diện cục bộ, icon hoặc hình ảnh tĩnh được chỉ định (bao gồm ảnh tại `public/landing/place_sample`).
  - `mock/fallback`: Dữ liệu giả lập hoặc fallback tĩnh thay thế khi không có kết nối API.
  - `Blocked by BE`: Nghiệp vụ hoặc màn hình cần dữ liệu từ backend nhưng backend hiện chưa có endpoint hoặc response thiếu trường dữ liệu. Tuyệt đối không tạo mock giả định.
  - `Not verified`: Chưa thể đối chiếu đầy đủ với runtime response thực tế.

---

## 1. Danh Sách Tệp Đã Đọc & Nguồn Bằng Chứng

### Frontend Source
- `frontend/src/constants/endpoints.ts`
- `frontend/src/config/backendConfig.ts`
- `frontend/src/config/apiConfig.ts`
- `frontend/src/config/appConfig.ts`
- `frontend/src/app/api/backend/[...path]/route.ts`
- `frontend/src/services/apiClient.ts`
- `frontend/src/services/publicLandingService.ts`
- `frontend/src/services/catalogService.ts`
- `frontend/src/services/dnaAnalysisService.ts`
- `frontend/src/services/tripService.ts`
- `frontend/src/services/profileService.ts`
- `frontend/src/services/feedbackService.ts`
- `frontend/src/services/systemService.ts`
- `frontend/src/services/contentService.ts`
- `frontend/src/components/landing/LandingPage.tsx`
- `frontend/src/components/landing/hero/LandingHero.tsx`
- `frontend/src/components/landing/sections/HeroPlanCarousel.tsx`
- `frontend/src/components/landing/sections/IntroDestinationsSection.tsx`
- `frontend/src/components/landing/sections/ConfirmSection.tsx`
- `frontend/src/components/landing/landingDemo.ts`
- `frontend/src/components/auth/LoginScreen.tsx`
- `frontend/src/components/auth/RegisterScreen.tsx`
- `frontend/src/components/create-trip/CreateTripScreen.tsx`
- `frontend/src/components/create-trip/useCreateTripController.ts`
- `frontend/src/components/create-trip/CreateTripComposer.tsx`
- `frontend/src/components/shared/BudgetRangeField.tsx`
- `frontend/src/components/profile/ProfileScreen.tsx`
- `frontend/src/components/profile/useProfileController.ts`
- `frontend/src/components/profile/ProfileInfoTab.tsx`
- `frontend/src/components/profile/ProfileDnaTab.tsx`
- `frontend/src/components/admin/AdminOverviewScreen.tsx`
- `frontend/src/components/admin/AdminUsersScreen.tsx`
- `frontend/src/components/admin/AdminRevenueScreen.tsx`
- `frontend/src/components/admin/AdminFeedbackScreen.tsx`
- `frontend/src/components/admin/AdminContentScreen.tsx`
- `frontend/src/components/admin/AdminSystemScreen.tsx`
- `frontend/src/components/admin/demo/adminDemoData.ts`

### Backend Source & Contract Evidence
- `backend/src/main.py`: Các route định nghĩa trực tiếp trên FastAPI (@app.get/post/patch/delete/put).
- Git commits: `e9c9f1d` (API refactoring) và `5889933` (remediation merge reintroducing admin demo mocks).

---

## 2. Ma Trận Truy Xuất Dữ Liệu Runtime / Business (Data Trace Matrix)

| Tuyến / Màn Hình | Component / Phần Tử | Trường Dữ Liệu Hiển Thị | Nguồn Hiện Tại (Service / Caller) | Endpoint / Method Backend | Phân Loại | Trạng Thái Fallback Hiện Có | Ghi Chú & Tác Động Remediation |
|---|---|---|---|---|---|---|---|
| `/` (Landing) | `LandingHero` | `stats.destinations` | `useLandingContent` → `publicLandingService` | `GET /api/v1/public/landing` | **API-backed** | Hiển thị `—` khi null | Dữ liệu thật từ backend |
| `/` (Landing) | `LandingHero` | `stats.places` | `useLandingContent` → `publicLandingService` | `GET /api/v1/public/landing` | **Blocked by BE** | Hiển thị `Chưa có số liệu` | Backend trả `"places": null` trong `v1_landing()`. Không bịa số liệu |
| `/` (Landing) | `HeroPlanCarousel` | Danh sách plan nổi bật (title, image, duration, budget, destination) | `useLandingContent` → `publicLandingService` | `GET /api/v1/public/landing` | **API-backed** (nhưng cần refactor hình ảnh) | Empty state: "Chưa có hành trình nổi bật nào" | **LP-01**: Thay carousel các thẻ gợi ý kế hoạch bằng bộ ảnh thực địa địa phương `public/landing/place_sample/*`, không bịa số liệu plan/ngân sách |
| `/` (Landing) | `LandingHero` | Chiều cao hero | Layout CSS (`landing-hero.module.css`) | — | **static copy/config/media** | — | **LP-02**: Điều chỉnh chiều cao chiếm toàn bộ viewport đầu (full-height) |
| `/` (Landing) | `IntroDestinationsSection` | `dest.provinceCode` ("Mã vùng XX") | `useLandingContent` → `publicLandingService` | `GET /api/v1/public/landing` | **static copy/config/media** | — | **LP-03**: Xóa bỏ hiển thị mã vùng trên cả thẻ desktop và mobile |
| `/` (Landing) | `LandingPage` | Câu dẫn trước Overview | JSX tĩnh trong `LandingPage.tsx` | — | **static copy/config/media** | — | **LP-04**: Thay bằng câu dẫn súc tích mời cuộn xuống khám phá |
| `/` (Landing) | `ConfirmSection` | Thời gian chuyển phương án (autoplay cycle) | `appConfig.confirm.optionCycleMs` | — | **static copy/config/media** | Fallback cũ 7.5s | **LP-05**: Đặt cố định chu kỳ 10 giây (10,000ms), bỏ fallback 7.5s |
| `/login` | `LoginScreen` | Thông báo điều hướng tài khoản | JSX tĩnh | — | **static copy/config/media** | — | **AUTH-01**: Xóa bỏ banner giải thích điều hướng theo role |
| `/login` | `LoginScreen` | Tùy chọn Google, Facebook, Quên mật khẩu | JSX tĩnh / disabled buttons | Không có endpoint backend | **Blocked by BE** | Đoạn văn bản tĩnh dưới nút | **AUTH-02**: Xóa ghi chú tĩnh, hiển thị modal thông báo với đúng nội dung `Comming soon` |
| `/register` | `RegisterScreen` | Gợi ý quy tắc mật khẩu & notice | State `passwordNotice` + banner tĩnh | — | **static copy/config/media** | Toast cố định góc dưới màn hình sau submit lỗi | **AUTH-03**: Xóa notice/toast cũ; hiển thị helper dạng bubble luôn hiện bên cạnh trường mật khẩu |
| `/create-trip` | `CreateTripScreen` | Danh mục tỉnh thành | `catalogService.getProvinceCatalog()` | `GET /api/v1/catalog/provinces` | **API-backed** | Error alert + nút Thử lại | Đã kết nối API |
| `/create-trip` | `CreateTripScreen` | Danh mục Dị ứng (`AllergySelect`) | Mảng tĩnh `COMMON_ALLERGIES` | `GET /api/v1/catalog/allergies` đã có trên backend | **mock/fallback** | Mảng tĩnh 8 phần tử trong file | **CT-01**: Chuyển sang nạp từ `GET /api/v1/catalog/allergies` qua `catalogService`. Xóa bỏ `COMMON_ALLERGIES` |
| `/create-trip` | `CreateTripScreen` | Thể lực (`FITNESS_OPTIONS`) | Mảng tĩnh `FITNESS_OPTIONS` | Backend không có `/api/v1/catalog/fitness` | **Blocked by BE** | 5 mức thể lực tĩnh trong file | **CT-02**: Báo blocker cho backend; không giả vờ danh sách là API-backed |
| `/create-trip` | `CreateTripScreen` | Giải thích nhịp độ di chuyển (`Pace`) | Dropdown option label | — | **static copy/config/media** | Chỉ hiện text dài trong menu | **CT-03**: Hiển thị tooltip/giải thích khi hover và focus bàn phím |
| `/create-trip` | `BudgetRangeField` | Ước tính ngân sách / người | Hàm tính toán cục bộ: `(min + max) / 2 / count` | — | **static copy/config/media** | — | **CT-04**: Đổi công thức thành `max / participant count` |
| `/create-trip` | `CreateTripComposer` | Badge "Đã tải" trên thumbnail ảnh | JSX trong `CreateTripComposer.tsx` | — | **static copy/config/media** | — | **CT-05**: Xóa badge "Đã tải", giữ lại preview, remove, progress và retry |
| `/create-trip` | `CreateTripComposer` | Thông báo từ chối upload ảnh (>3 ảnh, >5MB, sai định dạng) | `attachmentError` inline dưới composer | — | **static copy/config/media** | Banner cảnh báo cục bộ bên trong form | **CT-06**: Báo lỗi ngoài form qua Toast toàn cục với thông điệp: `Để đảm bảo tối đa sự ăn khớp với ý tưởng của bạn, chúng tôi xin tối đa chỉ 3 hình.` |
| `/create-trip` | `CreateTripScreen` | Bố cục Thể lực & Dị ứng | Layout JSX | — | **static copy/config/media** | Xếp chồng 2 hàng | **CT-07**: Gom Thể lực và Dị ứng chung 1 hàng trên desktop (2 cột) |
| `/create-trip` | `CreateTripScreen` | Chip tóm tắt dị ứng đã chọn | JSX trong `AllergySelect` | — | **static copy/config/media** | Chip hiển thị ngoài trigger | **CT-08**: Ẩn danh sách tóm tắt dị ứng ở trạng thái đóng, giữ nguyên tick chọn trong menu mở |
| `/create-trip` | `dnaAnalysisService` | Phân tích Travel DNA từ ảnh | `dnaAnalysisService.analyzeTripImages` | `POST /api/v1/dna/analyze` | **API-backed** (nhưng lỗi Transport 401 & BE chưa gắn vision model) | Báo lỗi hoặc không gửi được cookie auth | **API-01**: Chuyển endpoint sang session proxy (`getSessionProxyBaseUrl()`), thêm vào allowlist POST của `backendConfig.ts`. Backend trả DNA rỗng do chưa có vision model |
| `/profile` | `ProfileScreen` | Bảo vệ đăng nhập trang cá nhân | `useProfileController` | — | **static copy/config/media** | Chưa có guard, khách ẩn danh truy cập bị form rỗng | **PROF-01**: Kiểm tra auth hydration (`isLoaded`), chuyển hướng đến `/login?next=/profile` nếu chưa đăng nhập |
| `/profile` | `ProfileInfoTab` | Thông tin cá nhân & điểm xuất phát | `profileService.getProfile()` | `GET /api/v1/users/me` | **API-backed** | Loading spinner + Error alert | **PROF-02**: Xác thực nạp dữ liệu từ API thật, không để placeholder giả mạo dữ liệu |
| `/profile` | `ProfileDnaTab` | Chỉ số Radar Travel DNA | `profileService.getTravelDna()` | `GET /api/v1/users/me/dna` | **API-backed** | Empty state khi chưa có dữ liệu | Đã kết nối API |
| `/profile` | `ProfileDnaTab` | "Thiết lập ghi đè nhanh cho các chuyến đi tới" | State tĩnh `pacePreference`, `sceneryFocus`, `cuisinePriority` | `PUT /api/v1/users/me/dna` | **static copy/config/media** | UI điều khiển trực tiếp trên màn hình | **PROF-03**: Ẩn phần điều khiển ghi đè nhanh khỏi MVP |
| `/admin/overview` | `AdminOverviewScreen` | KPI phản hồi & Traces | `useFeedback`, `systemService.getTraces` | `GET /admin/feedback/tickets`, `GET /api/v1/admin/traces` | **API-backed** | Empty state | Đã kết nối API thật |
| `/admin/overview` | `AdminOverviewScreen` | Biểu đồ xu hướng kế hoạch & phân bố | `ADMIN_MOCK_PLAN_TRENDS`, `ADMIN_MOCK_PLAN_STATUS_DISTRIBUTION` | Backend KHÔNG có API xu hướng kế hoạch | **Blocked by BE** | Mock dữ liệu 6 tháng và 3 trạng thái | **ADM-01**: Bỏ `ADMIN_MOCK_*`, hiển thị trạng thái chưa có dữ liệu (honest empty/unavailable state) |
| `/admin/users` | `AdminUsersScreen` | Danh sách người dùng & thống kê user | `ADMIN_MOCK_USERS` | Backend KHÔNG có API quản lý người dùng (`/admin/users`) | **Blocked by BE** | 12 bản ghi mock user | **ADM-01**: Bỏ `ADMIN_MOCK_USERS`, hiển thị trạng thái tính năng chưa khả dụng / chờ backend |
| `/admin/revenue` | `AdminRevenueScreen` | Báo cáo doanh thu & giao dịch | `ADMIN_MOCK_REVENUE`, `ADMIN_MOCK_REVENUE_METRICS` | Backend KHÔNG có API doanh thu (`/admin/revenue`) | **Blocked by BE** | 8 giao dịch mock và chỉ số doanh thu giả | **ADM-01**: Bỏ `ADMIN_MOCK_*`, hiển thị trạng thái chưa có dữ liệu / chờ backend |
| `/admin/system` | `SchemaMapViewer` | Quản trị dữ liệu thực thể & import JSON | `demoSchema.ts`, `JsonImportModal.tsx` | Backend KHÔNG có API quản lý schema thực thể du lịch | **Blocked by BE** | Dữ liệu schema mô phỏng 63 tỉnh, 128 POI | Giữ nguyên MockBadge thông báo tính năng mô phỏng hoặc hiển thị unavailable |

---

## 3. Tổng Hợp Các Blockers Phía Backend (Blocked by BE)

1. **Fitness Catalog:** Backend thiếu endpoint `GET /api/v1/catalog/fitness`. Route `/api/v1/catalog/{catalog_type}` hiện chỉ hỗ trợ `provinces`, `allergies`, `moodboard`.
2. **Vision Model cho DNA Analysis:** `POST /api/v1/dna/analyze` đã tồn tại và ghi nhận ảnh hợp lệ, nhưng trả về `notice: "Images validated; no vision model is configured yet."` cùng chỉ số rỗng. Frontend không tự suy diễn chỉ số DNA.
3. **Admin User Management:** Không có route `/admin/users` hoặc `/api/v1/admin/users` trong `backend/src/main.py`.
4. **Admin Revenue & Transactions:** Không có route `/admin/revenue` hoặc `/api/v1/admin/revenue` trong mã nguồn backend.
5. **Admin Plan Statistics:** Không có route thống kê xu hướng khởi tạo và phân bố trạng thái kế hoạch theo tháng.
6. **Landing Stats Places:** `GET /api/v1/public/landing` trả về `"places": null`.

---

## 4. Kết Luận & Phân Định Trách Nhiệm Coding

Audit xác nhận toàn bộ các phát hiện khớp với kế hoạch `2026-10-09_08-17-00_product-review-feedback-remediation-plan.md`. Không phát hiện mock data ngầm nào ngoài phạm vi đã phân loại. Không có tình trạng tạo response giả cho các trường thiếu. Giai đoạn 2 có thể tiến hành theo đúng phân nhóm tệp sở hữu đã định.

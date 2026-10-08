# Chuyển frontend sang dữ liệu backend — kết quả triển khai

> Cập nhật 2026-10-07 21:10 +07:00: user đã thay quyết định giữ `/planner` và `/trip-plan` chờ BE. Hai page đã được nối API hiện có với owner guard tại proxy; xem [report follow-up](../../planner-trip-plan-api/2026-10-07_20-55-05/report.md). Các trạng thái trong bản báo cáo bên dưới là snapshot tại thời điểm task trước, không phải trạng thái hiện tại của hai page.

- Ngày: 2026-10-07, Asia/Ho_Chi_Minh.
- Repository: `C:\Users\yuuki\Documents\ChatGPT\CodexWithChatGPT\P-103`.
- Worktree: `P-103\.kilo\worktrees\backend-only-ui`.
- Branch: `codex/backend-only-ui`, bắt đầu từ `BinhNT` tại `ee17477`.
- Codex thực hiện toàn bộ, gồm ba agent Codex có phạm vi file riêng: `backend_public`, `backend_admin`, `backend_profile_landing`. Không sử dụng Antigravity.
- Chưa commit, merge, push hoặc deploy. Không sửa backend. Checkout `BinhNT` không có thay đổi tracked/staged do task này.
- Chốt của user: `/planner` và `/trip-plan` **giữ chờ backend, bỏ dữ liệu mock**; không tự sửa ownership trong backend.

## Kết luận và giới hạn

Các luồng dữ liệu ứng dụng có contract được chuyển sang service gọi backend thật hoặc giữ service thật đã có. Đã bỏ seed chuyến đi, hội thoại giả, local CRUD, chỉ số quản trị giả, subscription/billing giả, hành động OAuth giả và fallback âm thầm. Response rỗng, null hoặc lỗi không được thay bằng dữ liệu mẫu.

**Done** dưới đây là triển khai và kiểm tra source/contract đạt; không đồng nghĩa mọi thao tác đã được kiểm chứng trên backend production bằng tài khoản thật. Chức năng thiếu API được thay bằng trạng thái chưa khả dụng, vì vậy giao diện sẽ có ít chức năng/dữ liệu hơn bản dùng mock trước đây.

Các đoạn diễn giải bằng bản đồ, hội thoại và chuyển trạng thái trên landing vẫn là **hình minh họa tĩnh được ghi rõ**. Chúng không gọi API mock, không lưu/xác nhận trip, không tạo ticket hoặc đăng nhập. Hero, intro và số liệu landing lấy từ API public; không có seed fallback.

## Ma trận UI → API và tình trạng

| Task | UI/field/action | API thực tế | Triển khai | Runtime / giới hạn |
|---|---|---|---|---|
| BE-01 | Khung gọi API | endpoint constants → config/client → types/schema → domain service → hook/context → UI | Done; caller scan không còn fetch/axios trong component | Server handlers/SSR đọc backend trực tiếp; không có origin Vercel hardcode làm backend |
| BE-02 | Login/register/session/logout | POST `/api/v1/auth/login`, `/register`, `/logout`; GET `/api/v1/auth/me` | Service thật giữ nguyên; loại bỏ xác thực admin bằng env/HMAC cũ và OAuth success giả | GET me trả 401 khi anonymous, phù hợp; login/register/logout có credential: **Not verified** |
| BE-03 | Google/Facebook, quên mật khẩu | OAuth backend chưa cấu hình; chưa có API khôi phục mật khẩu | Done: nút disabled, có giải thích; không có handler thành công giả | **Blocked by BE** |
| BE-04 | Hero plans, intro destinations, số điểm đến/địa điểm | GET `/api/v1/public/landing` | Done: schema, service, hook, loading/error/retry; ảnh/null/empty giữ đúng nguồn | HTTP read-only trả 200; `heroPlans=[]`, intro `imageUrl=null`, `stats.places=null`; browser local bị CORS |
| BE-05 | Catalog tỉnh và bộ lọc cộng đồng | GET `/api/v1/catalog/provinces`; GET `/community/plans` | Done: `{id,slug,name}`, gửi **slug** vào `province`; search/duration/tag/budget/liked/page/page_size gửi server | Catalog HTTP 200; browser local CORS. Cộng đồng trả 200 rỗng. Lọc đổi kết quả qua nhiều trang: **Not verified**, chưa có fixture server phù hợp |
| BE-06 | Like và sao chép community plan | PUT `/community/plans/{id}/like`, POST `/community/plans/{id}/clone` | Done: validate camelCase legacy DTO; chỉ cập nhật sau response; chống thao tác lặp/race; clone chuyển `/my-trips` | **Not verified** trên tài khoản thật; không điều hướng vào private detail đang chặn |
| BE-07 | Điểm đến, detail public, so sánh tối đa ba điểm đến | GET `/api/v1/destinations/recommendations`; GET `/api/v1/destinations/{id}?ids=...` | Done: dữ liệu catalog thật; bỏ ảnh, thời tiết, giá, điểm DNA và lịch trình giả | Recommendations HTTP 200; browser local CORS. Chưa có personalized plan, weather/cost/DNA để hiển thị; không khẳng định API đã cung cấp |
| BE-08 | `/my-trips`, nhật ký profile | GET `/api/v1/trips/me?page=...&page_size=...` | Done: dữ liệu theo account, pagination server; anonymous không có card giả; số chưa biết hiển thị `—` | Anonymous đã kiểm tra; authenticated list/activity: **Not verified**. Search/status/date/budget toàn cục **Blocked by BE** vì API hiện chỉ hỗ trợ pagination |
| BE-09 | Tạo trip | POST `/api/v1/trips?generate_itinerary=true` | Done: province slug, ngày/duration, people, tổng budget, pace, car; success lấy ID máy chủ; giữ generation_error thật | **Not verified** mutation bằng tài khoản thật. API chưa nhận image/narrative/DNA/allergies/fitness/demographic ages; không gửi trường không được hỗ trợ |
| BE-10 | `/planner`, `/trip-plan`, private detail/budget | GET trip detail còn thiếu owner check | Done: thay UI dữ liệu giả bằng trạng thái chờ; xóa controller, chat/itinerary/summary mock; proxy không forward `/trips/{id}`/budget | **Blocked by BE**, đúng lựa chọn user. Browser không có request private detail; proxy GET thử trả 404 |
| BE-11 | Profile cơ bản, DNA | GET/PATCH `/api/v1/users/me`; GET/PUT `/api/v1/users/me/dna` | Giữ luồng thật, bỏ persona/avatar/stats/guest DNA giả; identity reset và loading/error | Anonymous đã kiểm tra không gọi API dữ liệu private; authenticated reads/updates: **Not verified** |
| BE-12 | Subscription, billing | Chưa có API | Done: bỏ gói/giá/hóa đơn/upgrade success giả | **Blocked by BE** |
| BE-13 | Feedback user/admin | POST `/api/v1/feedback`; GET `/api/v1/feedback/me`; rating; GET/PATCH `/admin/feedback/tickets`; POST replies | Giữ service/context thật, yêu cầu login, bỏ fixture; reset form/rating và chặn response của identity cũ | Authenticated create/reply/classify/rate: **Not verified**. Không giả lập guest ticket |
| BE-14 | System metrics, health, traces | GET `/api/v1/admin/system/metrics`, `/health`, `/api/v1/admin/traces` và detail | Done: nullable metric hiển thị chưa có dữ liệu; health đo request thật; overview trace từ server | `/health` HTTP 200; admin authenticated runtime: **Not verified**; anonymous `/admin` redirect login |
| BE-15 | Admin users/revenue, entity CRUD/JSON, safety/benchmark scores | Chưa có API đủ dữ liệu/thao tác | Done: bỏ list/chart/transaction/schema/local DB/safety score giả; disabled actions và trạng thái chưa khả dụng | **Blocked by BE** |
| BE-16 | Dataset import, chạy/poll evaluation | GET/POST `/admin/evaluation/datasets`; POST `/admin/evaluation/runs`; GET `/admin/evaluation/runs/{id}` | Done: schema input JSON, metadata/pagination; real run ID/status; poll có hủy khi unmount/account đổi; retry khi lỗi | **Not verified** authenticated mutation. Backend chỉ queued, chưa có worker/result; không tạo pass/fail/score giả |
| BE-17 | Admin CMS hero/intro/allergies | GET `/admin/content`; POST/PATCH/DELETE content collections | Giữ CRUD thật; bỏ store seed/listener/persistContent giả; status chỉ báo lưu CMS | **Not verified** authenticated CRUD. Public landing đọc catalog, CMS đọc `content_items`: chưa đồng bộ. Upload file vào project và thay mã tỉnh hành chính chưa có contract đủ |

## Request tạo trip đang gửi

Ví dụ hình dạng request theo source backend, **không phải dữ liệu được tạo trên production trong lần kiểm tra này**:

```json
{
  "destination": "ninh-binh",
  "start_date": "2026-11-01",
  "days": 2,
  "people": 2,
  "budget_vnd": 3000000,
  "budget_scope": "total",
  "transport": "car",
  "pace": "normal"
}
```

UI dùng ngày về để tính `days`. API hiện chỉ nhận một budget; mức tối đa của budget control được gửi làm giới hạn tổng, không tuyên bố ngân sách tối thiểu đã được backend áp dụng. Đã lưu ID nhưng generation thất bại vẫn hiện trạng thái lưu draft + lỗi sinh lịch trình; không đổi thành success giả.

## URL, cookie và CORS

- Request public dùng `getApiBaseUrl()` đọc `NEXT_PUBLIC_API_URL`, ghép endpoint constants. URL backend đang kiểm chứng: `https://vistra-backend-production.up.railway.app`.
- Request có session vẫn dùng **proxy tạm có chủ đích** `/api/backend/{endpoint}`. Route Handler luôn tạo upstream bằng `NEXT_PUBLIC_API_URL + endpoint`, forward duy nhất cookie `vistra_session`, giữ HttpOnly session và SSR admin guard. Proxy này gọi backend thật, **không phải API mock**.
- Chưa đổi auth/private/admin sang browser direct vì cookie host-only/SameSite=Lax và guard Next SSR chưa có contract cho cách đó. Không fallback về frontend origin khi thiếu env.
- URL Next `/my-trips?_rsc=...`, `/trip-plan?...&_rsc=...` là navigation/RSC frontend, không phải data endpoint backend.

| URL/kiểm tra thực tế | Kết quả |
|---|---|
| Browser GET `http://localhost:3001/api/backend/api/v1/auth/me` | 401 anonymous, không có tài khoản giả |
| Browser GET `http://localhost:3001/api/backend/community/plans?page=1&page_size=9` | 200, danh sách rỗng |
| Browser GET backend `/api/v1/catalog/provinces`, `/api/v1/destinations/recommendations`, `/api/v1/public/landing` | Lỗi CORS: thiếu `Access-Control-Allow-Origin` cho origin `http://localhost:3001`; UI có error/retry, không fallback |
| HTTP read-only GET `/health`, ba endpoint public trên, với Origin localhost:3001 | Cả bốn trả 200; không có ACAO cho origin này. Đây không phải endpoint 404 |
| HTTP read-only GET `/api/v1/catalog/provinces`, với Origin `https://c4-app-103.vercel.app` | 200; ACAO đúng frontend production, `Access-Control-Allow-Credentials: true` |
| Browser GET `/api/backend/trips/not-authorized` trên build cuối | 404 từ gate proxy; không gửi trip detail upstream |
| Browser `/admin` không có cookie | Redirect `/login?next=%2Fadmin`, không render dữ liệu quản trị |

**CORS local không chứng minh production hỏng.** Backend cần cho phép origin local dùng để QA hoặc QA cần chạy tại origin đã được backend cho phép. Chưa deploy nhánh này nên không tuyên bố kiểm tra production UI đã đạt. Chưa có dữ liệu community đủ để chứng minh lọc province thay đổi đúng mọi trang.

## Backend còn cần hoàn thiện

1. Kiểm tra owner ở private trip detail và các mutation liên quan trước khi mở planner/trip-plan. Frontend giữ chặn đúng yêu cầu user.
2. Đồng bộ Admin CMS với nguồn public landing; hiện public hero luôn rỗng và intro thiếu ảnh/tagline. Frontend không bù seed.
3. Cấp dữ liệu còn null nếu muốn hiển thị cost/weather/images/DNA/subscription/revenue/user metrics/benchmark; không yêu cầu frontend tự suy ra giá trị.
4. Bổ sung contract trường tạo trip còn thiếu nếu cần mở image/narrative/DNA/allergies/fitness; không giả payload được hỗ trợ.
5. Backend worker xử lý evaluation và cung cấp kết quả/testcases thực; UI giữ queued cho tới khi có kết quả.
6. API user management, revenue, entity schema/CRUD, prompt-injection runner và bộ lọc chuyến đi cá nhân toàn cục; hiện disabled.
7. OAuth/password recovery và cơ chế auth direct/SSR nếu muốn bỏ proxy tạm.
8. Cho phép origin local QA (`http://localhost:3001`) khi cần browser QA local; production catalog đã có header CORS phù hợp.

## Kiểm tra và evidence

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | Pass |
| `npm run lint` | Pass, không error/warning sau cleanup |
| `npm run build` | Pass trên source cuối; 22 pages. Cảnh báo convention middleware deprecated; không đổi ngoài phạm vi task |
| API checks tạm | Root 11, public agent 12, admin agent 10, profile/landing agent 8 schema + 4 hook, independent feedback reviewer 3: **48/48**. Đây là kiểm tra contract/transport/hooks, không phải 48 request production |
| Test landing illustration có sẵn | 5/5 pass sau bỏ test của helper giả đã xóa; không tạo test API lâu dài |
| Cleanup test | Không còn script trong `.api-test-tmp`. API cases không thất bại nên không tạo `fallure.md` |
| Caller/source scan | Không còn runtime reference `mockData`, `mockFeedback`, `DemoPlanContext`, localStorage/sessionStorage/random. Server fetch còn lại đều là backend forwarding/session; component không raw fetch |
| `git diff --check` | Pass |
| Browser production preview | Playwright MCP, 1920×1080 và 390×844; anonymous loading/error/empty/login-required/private-blocked/admin-redirect; không overflow ngang ở route/state đã kiểm tra |
| Authenticated runtime | **Not verified**: không dùng credential hoặc tạo dữ liệu production trong phiên này |

Build/start trong sandbox Windows ban đầu bị SWC `Access is denied` khi canonicalize đường dẫn. Chạy lại với quyền truy cập đã được duyệt đạt. Lint có lần bắt file test CommonJS tạm; sau API tests pass, dọn test theo rule và lint lại đạt. Đây không phải lỗi API testcase.

Evidence: `frontend/docs/evidence/playwright/2026-10-07_20-14-50/run-info.md` và mười screenshot, trong đó ảnh 09 là capture `about:blank` không hợp lệ, được giữ để trace và thay bằng ảnh 10; không dùng ảnh 09 làm bằng chứng đạt. Không ghi token/credential. Preview khởi động lại từ build cuối để kiểm tra count unknown và proxy private gate.

Independent reviewer xác nhận evaluation/metrics khớp backend, trace URL không bị mất khi auth hydrate. Reviewer phát hiện hai câu CMS hứa đồng bộ public sai thực tế; đã sửa thành lưu CMS riêng và nhắc đang chờ BE đồng bộ. Reviewer feedback xác nhận ba tình huống reply/rating hoàn tất sau logout/account switch đều từ chối stale success; harness đã dọn. Đây là kiểm tra source/hook giả lập, không phải authenticated browser proof.

## File trọng tâm để review

- `src/config/backendConfig.ts`, `src/constants/endpoints.ts`, constants discovery/evaluation: route thật, URL env và allowlist/gate.
- `src/services/{tripService,communityService,catalogService,contentService,evaluationService,publicLandingService,adminMetricsService}.ts`: API domain/service/schema.
- `src/components/{community,my-trips,destinations,create-trip,profile,admin,feedback}` và `src/context/FeedbackContext.tsx`: UI data/actions thật, unavailable states, identity guards.
- `src/components/shared/TripAccessPending.tsx`, planner/trip-plan screens: gate chờ BE.
- Xóa `DemoPlanContext`, seed CMS frontend, helper đăng nhập admin local, controller và leaf UI chỉ dùng mock. Các file data seed ignore được copy để baseline đã được dọn trong worktree; không xóa dữ liệu riêng trong checkout chính.

Khi tích hợp sau khi được duyệt, chỉ lấy code/report/evidence thuộc task. `docs/guides` được copy từ checkout chính để đọc instruction, không phải tài liệu mới của task. Các file untracked cá nhân trong checkout chính được giữ nguyên.

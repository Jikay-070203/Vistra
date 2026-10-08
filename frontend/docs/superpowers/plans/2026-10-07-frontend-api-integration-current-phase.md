# Frontend API Integration — Current Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Frontend implementation phải giao Antigravity theo AGENTS.md; Codex lập task và review.

**Goal:** Nối các field 🟩, 🟨 có mapping bảo toàn ý nghĩa và ⬜ FE tính được vào frontend, giữ nguyên giao diện đã duyệt.

**Architecture:** Tái sử dụng endpoint constants → shared client → raw DTO/runtime schema → domain service/mapper → hook/context → UI. Schema giao tiếp dùng tên/kiểu Backend thực tế; model hiển thị tiếp tục phục vụ cùng component, nhãn, bố cục. API còn field 🟥 được tích hợp theo phần có nguồn thật, với điều kiện riêng trước khi bật toàn bộ action.

**Tech Stack:** Next.js 16.3.5, React 19.2.8, TypeScript 5, native fetch, parser thủ công hiện có; không thêm Axios/Zod/state library.

**Spec:** [Report field gaps](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1), [UI-first contract](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:1).

**Ngày lập:** 2026-10-07. Đây là plan; chưa triển khai source, chưa gọi API runtime.

## 1. Global Constraints

- Scope đã được user xác nhận: giữ hoãn API-08, API-13, API-30–32, API-48–54; API-29 dùng các API hiện có, không tạo API overview riêng.
- Chỉ ⬜ có thể tính từ dữ liệu thật mới đưa vào integration. ⬜ thuộc phase hoãn vẫn hoãn; field tính được nhưng phụ thuộc field 🟥 vẫn phải chờ nguồn.
- 🟨 đổi tên/cấu trúc/kiểu tương đương ở raw DTO và mapper; không sửa tên nhãn, đơn vị, thứ tự bước hoặc ý nghĩa lựa chọn trên UI.
- 🟨 có vấn đề validation/enum/nghiệp vụ chưa được bảo đảm không tự trở thành “đủ” chỉ nhờ đổi schema. Ghi điều kiện chốt ở task sở hữu field đó.
- 🟥 không được lấp bằng số giả, ảnh mock, tên người giả, request local đã “lưu”, hoặc giá trị mặc định gây hiểu sai.
- Giữ layout, CSS, responsive, icon, map, modal và component hiển thị. Chỉ bổ sung wiring, state loading/error/empty theo kiểu hiện có; thông báo phải phản ánh kết quả thật.
- GET dùng path/query, không JSON body; model strict không nhận field dư. Không gửi wrapper mô tả `{path,query,body}` xuống BE.
- Không đổi code Backend/database trong plan này. Field đỏ cần BE vẫn được giữ là dependency trong report.
- Không dùng fixture fallback sau lỗi của API live. Demo chưa chuyển đổi giữ nguồn và phạm vi riêng; không trộn bản ghi/ID mock với bản ghi thật.
- Không đọc token HttpOnly bằng JS, không đưa API key vào NEXT_PUBLIC_, không dùng localStorage làm bằng chứng đăng nhập.
- Frontend implementation phải do Antigravity thực hiện trong worktree/task branch riêng. Không commit/push/integrate/deploy nếu chưa được user cho phép.
- Khi thực thi, đọc tài liệu Next cài trong `node_modules/next/dist/docs/` theo frontend/AGENTS.md trước sửa API/framework code.
- Test API tạm tuân thủ frontend/AGENTS.md: `.api-test-tmp/<task-id>/`, chạy sau implement; pass thì dọn, fail ghi `fallure.md`, giữ script và dừng chờ review. Giữ mọi test có sẵn.
- Screenshot/UI verification theo frontend/AGENTS.md: Antigravity IDE + Playwright MCP, evidence task riêng và run-info; không ghi đè evidence cũ.

## 2. Review Focus

1. Session hết hạn/401/network error: không đăng nhập thành công, không còn dữ liệu của user trước; lỗi mạng không được coi là logout đã revoke.
2. HTTP204 và response root/wrapper khác nhau: không parse JSON ở 204, không ép mọi API vào envelope `data`.
3. Field thiếu/null, giá chưa đủ, JSON details sai kiểu: không biến thành 0/điểm tốt/schema “đủ” hoặc thay bằng mock.
4. Pagination/filter/race: kết quả từ request cũ không ghi đè mới; không lọc trang hiện tại hoặc cộng page để giả thống kê toàn hệ thống.
5. Mutation thất bại/version409/preview: không báo lưu/chốt thành công, không bỏ input; preview chưa commit không phải Plan đã thay đổi.

## 3. Cách áp dụng quyết định theo màu

**Màu là trạng thái field, không phải trạng thái toàn bộ API.** Ví dụ API-15 có ID xanh nhưng Plan còn nhiều field đỏ và detail chưa có projection quyền; không thể chỉ đổi type rồi tuyên bố Planner đã tích hợp đầy đủ.

| Nhóm thực thi | Ý nghĩa | Deliverable |
|---|---|---|
| A | Luồng hoặc thao tác đủ dữ liệu để nối ngay, sau dependency chung | Request/response schema, service, caller UI và xác minh runtime. |
| B | API có phần nối được nhưng còn field hoặc semantics chưa đủ | Nối phần thật; chỉ gắn section/action khi đủ dữ liệu và điều kiện; phần còn lại ghi dependency. |
| C | Nghiệp vụ UI chưa được handler thực hiện hoặc payload hữu ích chưa có | Chưa thay luồng UI bằng API; không tạo service placeholder chỉ để tăng số API đã nối. |
| A/B, B/C | Một yêu cầu FE gồm nhiều phần với mức sẵn sàng khác nhau | Review theo thao tác/section cụ thể, không duyệt theo cả trang. |

**Đổi schema ở FE:** raw `full_name/avatar_url/expires_at/page_size/total_records` khớp BE; mapper đưa về `fullName/avatarUrl/expiresAt/pageSize/totalCount` nếu component đang dùng. Không đổi ngược UI sang snake_case và không cast response chưa parse.

### Mapping đã có căn cứ để triển khai

| Nguồn / trường hợp | Mapping / cách xử lý |
|---|---|
| Auth v1 user/session | `full_name → fullName`, `avatar_url → avatarUrl`, `expires_at → expiresAt`; role dùng làm nguồn nhãn/điều hướng. |
| Profile PATCH | `fullName → full_name`, `defaultOrigin → default_origin`, `preferredPace → preferred_pace`, `preferredStay → preferred_stay`, `dietaryPreference → dietary_preference`; phone/email/bio giữ tên. |
| DTO raw is_published | Chỉ nhận boolean hoặc 0/1 theo route; chuyển 0/1 tường minh, không `Boolean("0")`. |
| Like | `trip_id → tripId`, `liked → likedByMe`, `total_likes → likesCount`; method thực tế POST. |
| Feedback | `replies → staffReplies`, `createdAt → timestamp` ở reply, `ratingComment → ratingFeedback`; không map closed thành resolved. |
| Pagination | `page_size → pageSize`, `total_records → totalCount`; totalPages = ceil(totalCount/pageSize). Legacy trả pageSize/total/totalPages thì dùng đúng shape legacy. |
| Trip date/duration | endDate = start_date + days − 1; nights = max(days − 1, 0). Tính ngày lịch theo Asia/Ho_Chi_Minh, không parse UTC rồi trừ ms gây lệch ngày. |
| Pace của TripCreate | `slow → relaxed`, `balanced → normal`, `fast → busy`; map ngược giữ cùng nhãn UI. DNA/profile phải theo enum riêng của route, không dùng chung mù quáng. |
| Budget basis | `group_total → total`, `per_person → per_person`; budget_vnd chỉ map trần, không giữ được min. known_max_vnd chỉ là phần giá biết khi complete=false. |
| UUID/server ID | Dùng ID thật cho path/mutation; mã hiển thị FE có thể derive nếu quy ước rõ. Không dùng vị trí mảng làm identity. |
| Content response | Unwrap `item`, lấy active/order thật; không tự suy thiếu provinceCode/highlights. |
| DELETE success | 204 → success theo HTTP và ID request, không đòi body `deleted`. |
| Trace context/details | Parse theo kiểu thật; context object chỉ stringify có format khi không có summary và phù hợp khung hiện có; details không đúng schema phải giữ unavailable. |

## 4. Inventory 44 yêu cầu FE → phần thực thi

Tất cả route dưới là route BE đã đối chiếu; không gọi route đề xuất ở report nếu BE chưa định nghĩa. Link mỗi API trỏ trực tiếp đến ma trận field chi tiết.

| API / report | Page sử dụng | Route thực tế | Nhóm | Phạm vi nối / dependency | Task |
|---|---|---|---|---|---|
| [API-01](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:234) | /login; /admin/login | `POST /api/v1/auth/login` | A | User/session; role → nhãn, quyền điều hướng FE. Xóa fallback lỗi → đăng nhập demo. | T1–T2 |
| [API-02](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:294) | /register | `POST /api/v1/auth/register` | B | Nối full_name/date_of_birth/email/password. Không gửi confirmPassword; chờ acceptedTerms được xử lý và chốt phiên sau đăng ký. | T2 |
| [API-03](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:354) | Navbar; /profile | `GET /api/v1/auth/me + GET /api/v1/users/me` | A/B | Session/profile hiện có; DOB chưa trả thì không suy ra. membershipLabel vẫn demo/defer API-08. | T2–T3 |
| [API-04](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:416) | Sidebar /admin | `POST /api/v1/auth/logout` | A | Dùng success=true; revoke cookie rồi reset state tài khoản. | T2 |
| [API-05](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:454) | /profile/info | `PATCH /api/v1/users/me` | A | Map 8 field form sang snake_case; đọc profile wrapper; emailChangePending=false. | T3 |
| [API-06](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:534) | /profile/dna; /create-trip | `GET /api/v1/users/me/dna` | B | Nối metrics và preferences có nguồn; thiếu nguồn phân tích/version; cuisinePriority số ≠ preference chuỗi. | T3 |
| [API-07](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:662) | /profile/dna | `PUT /api/v1/users/me/dna` | B | Lưu metrics/pace/scenery_focus theo subset hiện có; không gửi cuisinePriority chưa chốt cách bảo toàn slider. | T3 |
| [API-09](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:844) | Landing | `GET /api/v1/public/landing` | B | Nối projection hiện có ở service; Hero/image/tagline/mã tỉnh và đồng bộ CMS chưa đủ để thay toàn bộ landing. | T4 |
| [API-10](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:988) | Catalog tỉnh trên 3 màn | `GET /api/v1/catalog/provinces` | B | Nối items id/slug/name như danh mục destination. Không đổi id thành province code hoặc bỏ danh sách tỉnh đang dùng. | T4 |
| [API-11](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1034) | Moodboard | `GET /api/v1/catalog/moodboard` | C | items=[] cố định; không có item nào đủ để thay moodboard. Chờ BE cấp dữ liệu. | T4 |
| [API-12](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1097) | /create-trip/allergies | `GET /api/v1/catalog/allergies` | A/B | Nối id/label/active hiện có; loại active=false khi hiển thị. Chưa hứa catalog này đồng bộ CRUD admin. | T4 |
| [API-14](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1142) | Tạo trip; chọn destination | `POST /api/v1/trips?generate_itinerary=true` | B | Map phần có dữ liệu; muốn gắn submit thật cần bảo toàn đủ ràng buộc form và itinerary sinh thành công. | T7 |
| [API-15](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1260) | Planner; trip-plan | `GET /api/v1/trips/{trip_id}` | B | Nối DTO và Plan field xanh/vàng/trắng; activation phụ thuộc owner/public projection và field đỏ bắt buộc. | T7 |
| [API-16](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1292) | Đổi ràng buộc | `PATCH /api/v1/trips/{trip_id}` | C | Handler chưa áp dụng request constraints. Không gọi PATCH này thay cho cập nhật ràng buộc. | T7 |
| [API-17](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1352) | Planner/chat | `POST /api/v1/trips/{trip_id}/chat` | B | Map text/base_version, reply/tools_used/preview. Chờ owner guard, lưu lịch sử và semantics commit trước gắn luồng hoàn chỉnh. | T7 |
| [API-18](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1411) | Planner/reorder | `POST /trips/{trip_id}/revisions/preview → POST /trips/{trip_id}/revisions/commit` | B | Map stable IDs → full stops, giữ ngày khác, <=18 stops; chờ owner enforcement và nguồn Plan hợp lệ. | T7 |
| [API-19](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1472) | Chốt bản nháp | `POST /trips/{trip_id}/confirm` | B | Gửi base_version từ Plan; chưa có kiểm tra version thật ở handler. Chờ BE trước activation có đảm bảo concurrency. | T7 |
| [API-20](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1510) | Xuất bản/gỡ xuất bản | `PATCH /trips/{trip_id}/publication` | A/B | Gửi is_published + base_version; dùng isPublished thật. Không đổi created_at thành lastUpdated. | T7 |
| [API-21](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1562) | /my-trips; /profile/activity | `GET /api/v1/trips/me` | B | Nối ownership/pagination/card field đủ; chưa filter/sort/counts. Không filter một trang rồi gọi là toàn bộ kết quả. | T6 |
| [API-22](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1674) | /community; landing link | `GET /community/plans (legacy có filter)` | B | Dùng q/province/duration/tag/budget_min_vnd/budget_max_vnd/liked_by_me theo nguồn thật; card thiếu field vẫn chờ. | T6 |
| [API-23](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1818) | Thích/bỏ thích | `POST /api/v1/community/trips/{trip_id}/like` | A | liked; map trip_id/total_likes. Chỉ chạy với ID trip thật đã lấy từ BE. | T6 |
| [API-24](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1866) | Tái sử dụng | `POST /api/v1/community/trips/{trip_id}/fork` | B | Nối new_trip_id/status/base_version; version0 chưa có itinerary, không điều hướng như Plan đã sinh. | T7 |
| [API-25](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:1945) | /destinations/card/detail/compare | `GET /api/v1/destinations/recommendations; GET /api/v1/destinations/{id}` | B/C | Nối identity/detail có dữ liệu; query chưa áp dụng và score/forecast/cost thiếu. Chưa thay flow recommendation đã duyệt. | T6 |
| [API-26](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:2418) | Feedback launcher | `POST /api/v1/feedback` | B | Nối subject/description/route_origin cho session hợp lệ. Contact/category/severity của form không được silently discard. | T5 |
| [API-27](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:2498) | /profile/feedback | `GET /api/v1/feedback/me` | A/B | Nối phiếu/replies/pagination; người gửi phiếu của tôi có thể lấy session/profile cùng user. Tên staff vẫn thiếu. | T5 |
| [API-28](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:2572) | Đánh giá hỗ trợ | `POST /api/v1/feedback/{ticket_id}/rating` | A | rating/comment; dùng ticketId/userAnswerRating/ratingComment/updatedAt thực. | T5 |
| [API-33](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:2622) | Admin inbox/KPI/badge | `GET /admin/feedback/tickets (legacy có q/status)` | A/B | Nối list/counts và q/status; category/global rating KPI chưa đủ. Không tính global KPI từ page hiện tại. | T5 |
| [API-34](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:2734) | Admin phân loại/trạng thái | `PATCH /api/v1/admin/feedback/{ticket_id}` | A/B | category/severity/status enum BE; ticket wrapper. Không map closed thành resolved. | T5 |
| [API-35](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:2820) | Admin trả lời | `POST /api/v1/admin/feedback/{ticket_id}/replies` | A/B | Gửi message, đọc ticket; server tự đặt answered. Không tạo tên staff giả để lấp field đỏ. | T5 |
| [API-36](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:2909) | Trace table; /admin | `GET /api/v1/admin/traces` | B | Nối list/pagination/context hợp lệ; status filter và spike threshold không có. Chờ ngưỡng để tô cảnh báo tương ứng. | T8 |
| [API-37](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:2983) | Trace detail/deep link | `GET /api/v1/admin/traces/{trace_id}` | B | Nối trace hiện có; parse details theo key/kiểu đã kiểm chứng, thiếu thì unavailable. Không cast JSON any thành đủ DTO. | T8 |
| [API-38](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3046) | Kiểm tra API health | `GET /health` | A | Tái sử dụng service/schema/caller hiện có, kiểm tra regression; không viết client thứ hai. | T1–T8 |
| [API-39](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3078) | System KPI/Benchmark | `GET /api/v1/admin/system/metrics` | C | checkedAt không đủ KPI; còn null/[] cố định. Giữ phần demo độc lập, chờ BE metrics thật. | T8 |
| [API-40](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3160) | Admin CMS list | `GET /admin/content` | A/B | Parse từng collection theo payload thực; missing key không lấy seed ghi đè. Chỉ gắn item đáp ứng form/read DTO. | T4 |
| [API-41](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3295) | Sửa Intro | `PATCH /admin/content/intro-destinations/{item_id}` | A | Map item wrapper, validate field form ở FE; yêu cầu item đã có và provinceCode hợp lệ từ nguồn tỉnh hiện tại. | T4 |
| [API-42](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3361) | Thêm Hero | `POST /admin/content/hero-plans` | B | Nối field form đã có, nhận UUID/active/order; provinceCode/highlights không tự tạo. Không hứa public đã cập nhật. | T4 |
| [API-43](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3434) | Sửa/bật/tắt Hero | `PATCH /admin/content/hero-plans/{item_id}` | B | Nối field hiện có và active/order; giữ missing provinceCode/highlights là chưa có dữ liệu. | T4 |
| [API-44](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3511) | Xóa Hero | `DELETE /admin/content/hero-plans/{item_id}` | A | HTTP204 không JSON body; xóa theo ID sau success. | T4 |
| [API-45](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3553) | Thêm allergy | `POST /admin/content/allergy-options` | A | Gửi label; dùng server UUID/active=true. | T4 |
| [API-46](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3597) | Sửa/bật/tắt allergy | `PATCH /admin/content/allergy-options/{item_id}` | A | label/active; không gửi nhãn rỗng; đọc item thật. | T4 |
| [API-47](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3647) | Xóa allergy | `DELETE /admin/content/allergy-options/{item_id}` | A | HTTP204; dùng ID request để cập nhật UI sau success. | T4 |
| [API-55](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3689) | Golden dataset list/detail | `GET /admin/evaluation/datasets; GET /admin/evaluation/runs/{run_id}` | B | Nối metadata/counts/pagination; testcase hydrate/search/lastRunDate thiếu. Không thay modal bằng testcase mock của dataset thật. | T8 |
| [API-56](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3767) | Golden import | `POST /admin/evaluation/datasets` | B | Map testCases → test_cases; nhận server dataset ID. Client/case IDs và khả năng đọc lại đầy đủ chưa đáp ứng import UI. | T8 |
| [API-57](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:3847) | Chạy Golden | `POST /admin/evaluation/runs; GET /admin/evaluation/runs/{run_id}` | B/C | Nối shape enqueue/read run; queued không có worker/result. Không kích hoạt trải nghiệm chạy thật khi chưa có tiến triển/kết quả. | T8 |

## 5. Cấu trúc file và interfaces

Mọi path dưới tính từ frontend root. Tên file mới là quyết định trong plan; chỉ tạo khi task có consumer thật, không scaffold sẵn các task C.

| Phạm vi | Tái sử dụng / sửa | Tạo khi cần |
|---|---|---|
| Transport/config | `src/config/apiConfig.ts`, `src/config/appConfig.ts`, `src/constants/endpoints.ts`, `src/types/api.ts`, `src/services/apiClient.ts`, `src/schemas/apiSchemaHelpers.ts` | `src/app/api/backend/[...path]/route.ts` cho proxy cùng origin. |
| Auth/session | `src/lib/userAuth.ts`, `src/lib/adminAuth.ts`, `src/middleware.ts`, `src/app/admin/layout.tsx`, auth controllers, Navbar, ProfileHeader, AdminNavigation, adminAuthService + internal auth routes | `src/types/auth.ts`, `src/schemas/authSchema.ts`, `src/services/authService.ts`. |
| Profile/DNA | Profile controller/info/DNA/header | `src/types/profileApi.ts`, `src/schemas/profileApiSchema.ts`, `src/services/profileService.ts` (cả profile và DNA). |
| Catalog/CMS | `src/services/contentService.ts`, `src/types/content.ts`, provinceService/schema hiện có, AdminContentScreen, landing content callers, TripConstraintsSection | `src/types/catalogApi.ts`, `src/schemas/catalogApiSchema.ts`, `src/services/catalogService.ts`, `src/schemas/contentSchema.ts`. |
| Feedback | `src/types/feedback.ts`, `src/context/FeedbackContext.tsx`, FeedbackLauncher, ProfileFeedbackTab, AdminFeedbackScreen, AdminNavigation | `src/types/feedbackApi.ts`, `src/schemas/feedbackSchema.ts`, `src/services/feedbackService.ts`. |
| Trip/community/destination | tripService/tripApi/tripApiSchema, destinationService/destinationApi/destinationApiSchema, DemoPlanContext, my-trips/community/destinations/planner/trip-plan controllers | `src/types/communityApi.ts`, `src/schemas/communitySchema.ts`, `src/services/communityService.ts`; Plan mapper trong `src/lib/planUtils.ts` khi đủ điều kiện. |
| Trace/evaluation | systemService/systemSchema/system types, useAdminController, TraceTable/TraceDetailDialog, GoldenDatasetPanel/JsonImportModal, AdminOverviewScreen/Kpi/Benchmark | `src/types/adminSystemApi.ts`, `src/schemas/adminSystemSchema.ts`, `src/services/evaluationService.ts` cho phần có consumer. |

**Phân biệt nguồn:** `provinceService.ts` đang gọi catalog tỉnh ngoài BE. `tripService.ts` và `destinationService.ts` hiện có vài hàm gọi legacy nhưng không thấy caller UI trong scan hiện tại. `contentService.ts` đang in-memory; nhiều Plan/Feedback/Dataset đang mock/localStorage. Có service không đồng nghĩa đã nối UI.

## 6. Thứ tự và task triển khai

Thực hiện tuần tự để ổn định session và tránh hai task cùng sửa shared client/context.

| Đợt | Task | Kết quả |
|---|---|---|
| 1 | T1 → T2 | Transport/session thật, login/logout/admin guard. |
| 2 | T3 → T4 → T5 | Profile, field DNA khả dụng, catalog/CMS, feedback. |
| 3 | T6 → T7 | List/community và phần Plan có nguồn; action thiếu nghiệp vụ vẫn chờ. |
| 4 | T8 → T9 | Trace/evaluation khả dụng, dashboard compose, review xuyên luồng. |

### T1 — Shared transport, cookie và schema nền

**Files:** sửa nhóm transport ở mục 5; tạo proxy route; mở rộng `.env.example` nếu repo có, không đọc/in giá trị secret.

**Interfaces:** giữ `apiRequest(endpoint, baseUrl, options): Promise<ApiRequestResult>`; `ApiRequestResult<T>` chấp nhận data không có body cho 204. Domain schema vẫn chịu trách nhiệm parse JSON.

- [ ] Đọc tất cả caller của apiRequest/getApiBaseUrl, lập baseline endpoint/method/nguồn; giữ health và catalog tỉnh bên ngoài hoạt động.
- [ ] Chọn **proxy cùng origin** `/api/backend/<BE path>` cho luồng VISTRA: server đọc `BACKEND_API_URL`, browser dùng base proxy; không cần thay cookie BE thành token JS. Server auth dùng backend URL và forward riêng cookie phiên.
- [ ] Proxy chỉ nhận host backend cố định và allowlist method/path đã triển khai; chặn URL tùy ý/path traversal. Forward `vistra_session`, status, Content-Type và Set-Cookie login/logout; không trả API key ra browser. Nếu root route cần API_TOKEN thì dùng biến server-only đã được cấu hình.
- [ ] Mở proxy từng route đủ điều kiện; chưa mở detail/chat/revision thiếu owner guard chỉ vì service đã viết. Kiểm tra Origin cho mutation qua proxy theo deployment cùng origin.
- [ ] Sửa client để xử lý 204 không json(), JSON error detail string/object/Pydantic, AbortSignal; phân biệt aborted request với lỗi mạng cần hiển thị. Không tự retry POST.
- [ ] Thêm parser đúng response root/user/profile/item/ticket ở domain; không tạo schema envelope giả cho BE.
- [ ] Check khi thực thi: raw JSON, nested errors/422, 204, malformed JSON, network, abort, query serialization, cookie login/logout qua proxy; secret không có trong browser bundle/network response.

**Đủ để sang T2:** client không phá caller cũ; cookie same origin tồn tại và server đọc được; lỗi được giữ HTTP status/field path.

### T2 — Login/logout, hydrate session và quyền admin (API-01–04)

**Files:** auth group mục 5. Internal `/api/admin/auth/login/logout` chỉ giữ alias tới BE trong giai đoạn chuyển đổi nếu còn consumer; bỏ việc xác thực ADMIN_EMAIL/PASSWORD riêng ở flow đã chuyển.

**Interfaces:** authService xuất `login({email,password})`, `register(RegisterRequestDto)`, `getSession(options?)`, `logout()`. getSession nhận base URL/header override **server-only tại caller server**, không lấy từ query user. Session model: status loading/authenticated/unauthenticated/error, user, expiresAt; mở rộng state/useSyncExternalStore trong userAuth, không thêm state library.

- [ ] Khai báo DTO/schema khớp snake_case v1; chỉ hydrate authenticated sau parse user/session thành công. 401/suspended/lỗi mạng không có fallback thành traveler.
- [ ] Dùng role thật để redirect; admin → /admin, traveler → /community mặc định. Staff không tự nhận quyền admin: require_admin BE chỉ cấp admin; staff về khu vực user khi chưa có route dành riêng. Sanitize next về path nội bộ được phép theo role.
- [ ] Thay localStorage boolean/token bằng session đã xác minh; hydrate một lần trong chrome/state hiện có, cập nhật Navbar/ProfileHeader; xóa state của user cũ khi đổi tài khoản.
- [ ] Cập nhật middleware/layout/adminAuth đồng bộ: middleware giữ pathname/redirect alias; layout xác minh backend session + role admin trên server trước render. Không còn yêu cầu cookie HMAC cũ để user BE admin vào /admin. BE vẫn enforce từng API.
- [ ] Logout chờ revoke success rồi reset session + dữ liệu private + điều hướng. Nếu lỗi, hiển thị thất bại và cho thử lại, không báo đã logout BE.
- [ ] Register nối request DTO hợp lệ nhưng chưa bật flow hoàn chỉnh khi acceptedTerms đỏ chưa chốt. Đề xuất giữ UX register → login: sau register thành công phải revoke phiên BE tự cấp rồi chuyển login; chỉ báo hoàn thành luồng khi revoke thành công. Quyết định này và lưu/chấp thuận terms cần được review trước activation.
- [ ] Check khi thực thi: login đúng/sai, 403 suspended, hydrate reload, expired401, logout/reload, chuyển user, next độc hại, traveler/staff truy cập admin, lỗi mạng không đăng nhập; đăng ký trùng409 và yêu cầu chốt terms.

**Đủ:** login/logout/session/admin access dùng cùng phiên BE. Register pending được báo riêng, không kéo chậm login.

### T3 — Profile và DNA khả dụng (API-03,05–07)

**Files:** profile group mục 5.

**Interfaces:** `getProfile()`, `updateProfile(ProfilePatchDto)`, `getTravelDna()`, `updateTravelDna(TravelDnaPatchDto)` trong profileService. Raw DTO separate khỏi ProfileFormData/nhãn hiển thị.

- [ ] Ghép session/profile theo cùng userId; map đúng form 8 field. Null text field dùng empty form value, không dùng thông tin người mẫu.
- [ ] Save form async; đọc profile response sau save; giữ input và lỗi theo field nếu thất bại. Email cập nhật ngay theo API, không báo “đang chờ xác minh”.
- [ ] DNA nối metrics key/score 0–100, pace/scenery có nguồn; label/rating derive theo bảng metric FE hiện có khi key khớp.
- [ ] PUT subset theo source hiện tại; không gửi field UI/nhãn dư và không giả có version. Ghi rõ chưa có optimistic concurrency cho DNA.
- [ ] Cuisine slider/source analysis đỏ chưa được bảo toàn: không gửi Number/String conversion tùy ý hoặc báo tất cả preference đã lưu. Chỉ bật save section khi mọi field user đã đổi đều có mapping; nếu cuisine bị đổi thì giữ draft và phản hồi dependency bằng state hiện có.
- [ ] DOB/source analytics/membership thiếu không lấp từ seed; subscription giữ phase demo riêng. Không gọi API-13.
- [ ] Check khi thực thi: read/save/reload, user switch, email409, null fields, invalid DNA scores, metric key lạ, cập nhật subset giữ metrics khác; cuisine thay đổi không bị báo lưu giả.

### T4 — Catalog và CMS (API-09–12,40–47)

**Files:** catalog/content group mục 5; scan mọi caller contentService trước đổi hàm sync → async.

**Interfaces:** catalogService `getDestinationCatalog()`, `getAllergyCatalog()`; contentService `getAdminContent()`, `updateIntro(id,payload)`, `createHero(payload)`, `updateHero(id,payload)`, `deleteHero(id)`, `createAllergy(payload)`, `updateAllergy(id,payload)`, `deleteAllergy(id)`. Giữ API subscribe hiện có nếu còn cần cho state, chỉ notify sau response thành công.

- [ ] Parse DTO backend destinations riêng; giữ province code từ nguồn provinceService hiện tại. Không lấy DB id/slug làm numeric code hoặc map theo vị trí thứ tự.
- [ ] Nối allergy public hiện có vào component; giữ ID option thật. Chưa sync CMS thì ghi rõ dependency; trip submission chưa gửi allergies nếu BE chưa nhận.
- [ ] Thay CMS in-memory read/write bằng async BE ở section đủ field; FE kiểm tra label/title/ảnh required và URL đúng form. Validation FE không được ghi là BE đã enforce.
- [ ] Form Intro dùng item đã tồn tại; không invent API tạo Intro. Hero tạo/sửa chỉ field form đã có; không generate highlights/provinceCode ngoài dữ liệu được xác minh.
- [ ] HTTP204 xóa đúng ID; lỗi không mất item. Sau save lấy response/refresh CMS; không báo landing/catalog public đã đồng bộ khi hai nguồn còn khác.
- [ ] Landing/catalog moodboard: service chỉ nối phần có nguồn/consumer; Hero/image missing và items=[] cố định chưa bật thay thế UI. Demo tương tác landing đã duyệt vẫn trong phạm vi demo.
- [ ] Check khi thực thi: CRUD allergy, sửa Intro, tạo/sửa/bật/tắt/xóa Hero, empty collection, thiếu key cũ, reload; 204 không lỗi JSON; public data vẫn lệch nguồn được ghi pending.

### T5 — Feedback user/admin và counts (API-26–28,33–35)

**Files:** feedback group mục 5; đổi Context mutation sync → Promise và cập nhật tất cả caller.

**Interfaces:** feedbackService `getMyFeedback({page,pageSize})`, `createFeedback(FeedbackCreateDto)`, `rateFeedback(id,{rating,comment})`, `getAdminFeedback({page,pageSize,q,status})`, `classifyFeedback(id,AdminFeedbackPatchDto)`, `replyFeedback(id,{message})`.

- [ ] Parse ticket/replies/pagination và enum chính thức; label Việt giữ tại presentation. SenderName thiếu dùng trạng thái chưa có theo UI hiện hữu, không lấy tên admin đang xem cho mọi reply.
- [ ] Nối danh sách của tôi/rating; kiểm tra đã có reply và thuộc user; update từ response rồi refresh dữ liệu liên quan.
- [ ] Admin list dùng legacy `/admin/feedback/tickets` để q/status có tác dụng; category filter chưa được handler hỗ trợ vẫn pending, không giả filter đúng.
- [ ] Nối classify/reply với ID BE; payload chỉ enum BE cho phép. `closed` chưa có thì thao tác đó chưa active; không đổi thành resolved.
- [ ] Badge/KPI lấy counts toàn bộ trả bởi BE: total = tổng 4 trạng thái, answeredOrResolved = answered + resolved. Không lấy tickets.length/page để tính global; average/ratedCount vẫn chờ.
- [ ] Create feedback chỉ action có session và fields được BE lưu; giữ form guest/contact/category/severity chưa nối đầy đủ là dependency. Không bỏ input người dùng rồi hiển thị “đã gửi toàn bộ”.
- [ ] Check khi thực thi: read-own, user switch, rating1–5 và chưa có reply, admin search/status, quyền403, classify/reply/reload, closed unsupported, counts không đổi sai theo page, create thất bại không đóng modal/xóa draft.

### T6 — List/community và destination partial (API-21–23,25)

**Files:** my-trips/community/destination group mục 5; chưa thay Plan context bằng real collection thiếu contract.

**Interfaces:** tripService `getMyTrips({page,pageSize})`; communityService `getCommunityTrips(CommunityQueryDto)`, `setTripLike(id,{liked})`; destinationService mở rộng `getRecommendations()`, `getDestinationDetails(ids)` cho phần DTO thật.

- [ ] Nối pagination và card đủ field; sửa endDate tại mapper bằng startDate+durationDays−1 nếu nguồn start/duration đã có. Field đỏ lastUpdated/cost/author/image/origin không lấy mock/createdAt thế chỗ.
- [ ] Community chọn legacy route có filter; map province slug từ mapping đã xác minh, theme→tag, durationDays→duration, favoritesOnly→liked_by_me. V1 list không đủ filter nên chưa dùng cho full filter flow.
- [ ] My-trips chưa có server filter/sort/counts; giữ các thao tác đó pending. Không tải vô hạn mọi page để thay BE query.
- [ ] Like gọi POST với liked mong muốn, chống double click; update likesCount/likedByMe từ response. Nếu optimistic UI được giữ thì rollback đúng khi lỗi, không toggle mù.
- [ ] Recommendation chỉ parse data identity/detail hiện có. Không gửi UI filters mà route bỏ qua rồi gọi đó là filtered recommendations; score/forecast/compare còn thiếu vẫn pending.
- [ ] Trong live mode, card thiếu required display data chỉ dùng empty/unavailable state hiện có nếu thể hiện đúng; nếu không có state phù hợp thì chưa thay section bằng API.
- [ ] Check khi thực thi: server paging, q/status/filter thực có tác dụng, like lại cùng giá trị không tăng đúp, lỗi401/403 rollback, stale search response, unknown cost không=0, start/end qua tháng.

### T7 — Plan DTO/mapper và action đủ điều kiện (API-14–20,24)

**Files:** trip group mục 5, DemoPlanContext và mọi caller Plan; dùng [ma trận Plan 113 field](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md:48) làm checklist, không tạo 6 model Plan trùng nhau.

**Interfaces dự kiến:** tripService `createTrip(TripCreateDto,{generateItinerary:true})`, `getTrip(id)`, `sendTripMessage(id,{text,base_version})`, `previewRevision(id,PreviewRequestDto)`, `commitRevision(id,{preview_id,base_version})`, `confirmTrip(id,{base_version})`, `setPublication(id,{is_published,base_version})`; communityService `forkTrip(id)`. Chỉ thêm hàm có caller hợp lệ; service chưa có điều kiện production không được tự mở proxy/caller live.

- [ ] Định nghĩa typed request/activity/route/weather/budget thay Record<string,unknown> ở field được consume; giữ raw DTO và map Plan hiển thị riêng, null/optional thật cho field chưa cấp.
- [ ] Derive date/duration/day IDs, cả ngày trống; activity ID ổn định từ invariant trip/place được xác minh, không array index. Group activities theo day, label/format dựa dữ liệu nguồn.
- [ ] Map pace/budget basis/people tổng đúng ý nghĩa; aggregate forecast đúng ngày khi có. Không reconstruct nhóm tuổi, budgetMin, allergies, narrative, cuisine/DNA hay summary từ tổng/chuỗi khác.
- [ ] Create thực dùng generate_itinerary=true nhưng phải xử lý generation_error/itinerary=null/version0. Không mở Planner như đã sinh thành công; full submit chờ BE lưu đủ field bắt buộc.
- [ ] GET detail/chat chỉ activation sau owner/private/public projection BE đáp ứng. UI permission flags hay proxy không thay server owner enforcement.
- [ ] Không nối edit constraints vào PATCH hiện tại: request.* bị bỏ qua. Handler status/publication không phải edit constraints.
- [ ] Reorder dùng full stops của mọi ngày và map place_id/day/start_time; preview → commit chỉ update state sau commit. Điều kiện: stable ID thật, <=18 stops, thời gian hợp lệ, đủ owner enforcement, rollback409/expired preview. Source đọc thêm ở lượt lập plan cho thấy root preview/commit chỉ kiểm tra API key/version, chưa session/owner; ghi dependency BE này trước activation.
- [ ] Chat reply/preview không tự commit hoặc thêm UI preview mới. Full chat-edit chỉ bật sau semantics thay đổi/persist/history được chốt đúng flow đã duyệt.
- [ ] Confirm chờ BE enforce base_version thật; GET version trước submit không thay atomic concurrency. Publication có thể nối với version nguồn thật; bỏ field lastUpdated giả.
- [ ] Fork dùng new_trip_id nhưng version0 cần bước generate đã chốt; không clone itinerary mock sang ID thật.
- [ ] Check khi thực thi đủ điều kiện: create4 ngày/ngày trống, generate failed, private plan403, public projection, reload persisted edit, reorder commit409/expired/19stops, chat preview≠saved, confirm stale version, publish draft422, fork version0.

**Đủ:** chỉ action đạt điều kiện mới live; danh sách field/action pending phải nêu rõ. Không tuyên bố Planner đủ API bằng số field xanh.

### T8 — Health, trace, Golden metadata và dashboard composition (API-36–39,55–57; nguồn thay API-29)

**Files:** system/evaluation/admin group mục 5.

**Interfaces:** systemService `getSystemHealth()` hiện có, `getTraces({page,pageSize})`, `getTrace(id)`; evaluationService `getDatasets({page,pageSize})`, `createDataset(DatasetCreateDto)`, `startRun({datasetId})`, `getRun(runId)` chỉ khi có phần caller đủ điều kiện.

- [ ] Giữ health raw {status,version}; kiểm tra default proxy và custom base URL của nút health hiện có.
- [ ] Nối trace fields có schema thật; details thiếu/sai kiểu giữ unavailable. Status enum/latency threshold chưa chốt thì không invent hoặc filter page hiện tại như server filter.
- [ ] Golden list nối metadata/counts/page. Modal không hydrate testCases thì chờ; không dùng testcase demo cho UUID BE.
- [ ] Import map test_cases, input/expected JSON; không khẳng định server lưu client dataset/case ID. Full import UI chờ quyết định cho ô mã ID hiện có và khả năng read-back cases.
- [ ] Run shape queued có thể dùng cho transport integration có kiểm soát; không kích hoạt CTA chạy thật/poll vô hạn khi BE chưa có worker và kết quả. Chỉ poll sau khi contract tiến triển/terminal states thật có; dừng khi unmount/lỗi/timeout, không hiển thị passed từ queued.
- [ ] System metrics null/empty cố định chưa đưa vào KPI thật. Không dùng availability null như0%, không hardcode benchmark scores.
- [ ] /admin overview compose health + counts API-33 + trace list; fetch trong controller theo quyền, xử lý lỗi từng section. Revenue/users/benchmarks đã defer/thiếu vẫn giữ scope riêng; không thêm API-29.
- [ ] Check khi thực thi: health ok/down, trace missing404/deep link/schema, dataset metadata+cases rỗng, run queued không thành completed, error một section dashboard không reset section đã có data.

### T9 — Review tích hợp, evidence và handoff trạng thái

**Files:** chỉ report trạng thái/evidence task; không dọn unrelated source.

- [ ] Codex review diff từ Antigravity: endpoint constants, shared client, type/runtime schema/service/caller đều có; scope UI giữ nguyên; không credential/fixture fallback/cross-user cache.
- [ ] Khi thực thi, chạy typecheck `npx tsc --noEmit`, lint `npm run lint`, build `npm run build` và `git diff --check` trong frontend worktree; baseline lỗi có sẵn được ghi riêng. Theo quy định test API của repo, thực hiện qua kênh được phép của Antigravity; không chạy chúng trong lượt chỉ viết plan.
- [ ] Check direct caller bằng `rg -n "fetch\\(|axios|NEXT_PUBLIC_API_URL|API_ENDPOINTS" src`; HTTP transport chỉ ở shared client hoặc route proxy server có trách nhiệm forwarding được ghi rõ.
- [ ] Chạy checks tạm các case đã ghi ở T1–T8 cho phần thật sự implement; pass thì dọn folder task, fail append fallure.md + giữ script + chờ review.
- [ ] Playwright MCP qua Antigravity IDE kiểm tra đường đi auth → profile → feedback; CMS CRUD; các flow community/Plan đủ điều kiện; desktop/mobile. Screenshot cùng viewport đối chiếu trước/sau để xác nhận giữ presentation.
- [ ] Handoff thêm trạng thái theo mỗi API: service ready / UI wired / runtime verified / partial / blocked / deferred, endpoint thực, field đang dùng, check pass/fail, dependency và evidence.
- [ ] Chưa runtime verified thì ghi đúng “source/contract đã nối”, không ghi “API hoàn tất”. Không tích hợp branch/commit/push/deploy tự động.

## 7. Handoff cho Antigravity

Mỗi task T1–T9 khi thực thi phải có:

- **Objective:** deliverable đúng task trên, chỉ field được phép và action đủ điều kiện.
- **Context and constraints:** report field gaps, plan, user scope; raw schema theo BE, UI giữ nguyên.
- **Files to inspect:** nhóm file task ở mục 5 và toàn bộ caller thật của service/context được sửa.
- **Required changes:** checkbox task và mapping đã chốt; không mở rộng sang Backend.
- **Acceptance criteria:** check của task, loading/error/persistence thật, không lấp field đỏ, không giao diện mới.
- **Do not change:** phase hoãn, CSS/layout/visual, fixture dùng bởi demo khác, unrelated changes.
- Trước launch ghi repo/worktree/task branch `codex/<task>`, Antigravity session/channel/task ID; sau run kiểm tra status/diff/check results. Worktree phải có đúng các source/report hiện tại; tài liệu ignored/untracked cần được đưa vào workspace task theo cách có kiểm soát.

## 8. Điều kiện cần chốt trước action phụ thuộc

Các mục này không cản T1/login hoặc task độc lập; dừng đúng phần phụ thuộc, không dừng cả plan.

| Quyết định / thiếu dữ liệu | API chịu ảnh hưởng | Đề xuất mặc định trong plan |
|---|---|---|
| Terms được BE lưu/enforce; register tự login | 02 | Giữ UX chuyển login, revoke phiên tự cấp; full register chờ terms/policy. |
| Cuisine chuỗi vs slider0–100; sources/version | 06–07 | Nối metrics/pace/scenery; không conversion mất nghĩa, không báo toàn bộ đã lưu. |
| Full catalog province và mapping destination | 09–10,14,22,40–43 | Giữ provinceService thật hiện có, catalog BE thành destination DTO riêng; mapping thiếu vẫn pending. |
| CMS và public khác nguồn | 09,12,40–47 | CRUD admin có thể live; chưa báo public đã đồng bộ. |
| Contact/guest/classification ở launcher | 26 | Không discard input; full send chờ BE/contract cho form hiện có. |
| closed/category filter và KPI chưa có | 33–35 | Nối q/status/counts/enum có thật; phần còn lại pending. |
| Trip field đỏ, owner projection, concurrency, preview/commit/history | 14–20,24 | DTO/mapper phần khả dụng; bật action theo điều kiện T7. |
| Filters/score/cost/cards chưa đủ | 21–22,25 | Query hỗ trợ thì nối; section không đủ required data chưa thay demo bằng live. |
| Trace schema/ngưỡng; metrics producers | 36–39 | Schema đúng nguồn, unavailable thật; không tạo ngưỡng/metrics tùy ý. |
| Golden ID/cases/worker/result | 55–57 | Metadata và DTO khả dụng; full import/test modal/run chờ đủ workflow. |

## 9. Phạm vi xác minh của lượt lập plan

- Đã đọc report, guide tích hợp API, frontend/AGENTS.md, manifest, shared client/schema/config, auth/session/admin guards, các nguồn mock/context/controller và route Backend liên quan.
- Đã scan caller để phân biệt service tồn tại với UI thực sự đã gọi.
- Chưa thực hiện Antigravity handoff, chưa tạo worktree triển khai, chưa sửa implementation, chưa chạy test/lint/build hoặc API runtime.
- Trạng thái trong inventory là quyết định triển khai dựa trên source/report tại thời điểm lập plan, không phải chứng nhận hoạt động.


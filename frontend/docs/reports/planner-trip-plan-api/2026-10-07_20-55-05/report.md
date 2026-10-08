# Nối API cho `/planner` và `/trip-plan`

- Ngày: 2026-10-07, Asia/Ho_Chi_Minh.
- Repo: `C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103`.
- Worktree: `P-103/.kilo/worktrees/backend-only-ui`.
- Branch: `codex/backend-only-ui`, base `BinhNT` tại `ee17477`.
- Codex trực tiếp thực hiện theo yêu cầu thay Antigravity. Không sửa backend, không tạo endpoint giả, không thêm dependency.
- Chưa commit, merge, push hoặc deploy. Không thay đổi tracked/staged trong checkout `BinhNT`.
- Yêu cầu mới thay quyết định giữ hai page chờ backend của báo cáo trước: nối những API đã có contract đủ, bỏ dữ liệu mock; data thực sẽ bổ sung sau.

## Kết quả

Hai page lấy dữ liệu qua `UI → useTripWorkspace → tripService → apiClient → schema`. Constants chứa toàn bộ endpoint; service không khai báo endpoint tại chỗ. UI không gọi fetch trực tiếp và không hydrate plan/hội thoại từ seed, localStorage hay DemoPlanContext.

`Done` ở báo cáo này nghĩa là đã triển khai, kiểm tra contract/controller và build; **không đồng nghĩa luồng có dữ liệu đã được kiểm chứng trên backend production bằng tài khoản thật**.

## API → UI → field

| API đã nối | Request FE | Response dùng | UI | Trạng thái |
| --- | --- | --- | --- | --- |
| GET `/api/v1/trips/{id}` | ID từ query URL, không dùng ID mẫu mặc định | `id`, `owner_user_id`, `status`, `is_published`, `current_version`, `request`, `generation_error`, `itinerary`, `recommendations` | Cả hai page: dữ liệu hành trình, nháp/đã chốt, ngày đi/số ngày/số người/ngân sách; tiêu đề dùng `request.destination` thực, không bịa title | Done; dữ liệu production Not verified |
| GET `/trips/{id}/budget` | ID chuyến đi | `planned`, `categories.*.actual_vnd`, `actual_total_vnd`, `version` | `/trip-plan`: dự toán từng nhóm và chi phí đã ghi nhận; lỗi chi phí tách khỏi lỗi tải lịch trình | Done; dữ liệu production Not verified |
| POST `/api/v1/trips/{id}/chat` | `text`, `base_version` | `reply`, `preview`, `tools_used`, `base_version` | `/planner`: hội thoại; trả preview thì cập nhật lịch trình/bản đồ dưới trạng thái chưa lưu. `tools_used` được validate, không giả lập AI thinking từ nó | Done; Gemini/session production Not verified |
| POST `/trips/{id}/generate` | Không body; backend dùng request đã lưu | Itinerary có `trip_id`, `version` | `/planner`: tạo/thử lại lịch trình cho trip phiên bản 0; hiển thị lỗi thật | Done; routing/provider production Not verified |
| POST `/trips/{id}/revisions/preview` | `base_version`, toàn bộ `stops` có `place_id`, `day`; bỏ `start_time` để BE xếp giờ lại | `preview_id`, `base_version`, `itinerary`, `known_cost_delta_vnd` | `/planner`: kéo thả hoặc nút lên/xuống đổi thứ tự trong ngày; xem trước tuyến, giờ, chi phí và cảnh báo | Done; tính khả thi lịch production Not verified |
| POST `/trips/{id}/revisions/commit` | `preview_id`, `base_version` | Itinerary mới với `trip_id`, `version` | Nút Lưu thay đổi; chỉ sau success mới cập nhật lịch đã lưu, xóa preview | Done; mutation production Not verified |
| POST `/trips/{id}/confirm` | `base_version` hiện tại | `plan`, `confirmedAt`, `version` | Modal Chốt lịch trình; trạng thái UI lấy từ `plan.status`, không tự báo thành công trước response | Done; mutation production Not verified; giới hạn version xem phần auth |
| PATCH `/trips/{id}/publication` | `base_version`, `is_published` | `id`, `isPublished`, `publishedAt`, `version` | `/trip-plan`: xuất bản/gỡ khỏi cộng đồng, chỉ mở khi plan confirmed | Done; mutation production Not verified |
| GET `/places/{id}` | Điểm dừng đang chọn | `display_name`, `address`, `last_verified_at`, `sources[].source_url`, `sources[].name` | `/planner`: dropdown nguồn đối chiếu; fetch khi mở, có loading/error/retry | Done; dữ liệu và CORS của request direct Not verified |

### Dữ liệu lịch trình đã gắn

- `itinerary.activities`: `place_id`, `name`, `day`, `latitude`, `longitude`, `start_at`, `end_at`, `estimated_cost`, `reason`, `notes`.
- `route_legs`: thời gian, khoảng cách, phương tiện car và GeoJSON `geometry.coordinates`; chuyển `[lng, lat]` sang tọa độ component bản đồ.
- Bản đồ và danh sách dùng cùng `place_id`. Chọn điểm ở danh sách focus pin tương ứng; chọn pin highlight điểm ở danh sách. Ngày dùng một state chung.
- Chỉ vẽ đường khi ngày đó có đầy đủ geometry LineString từ backend. Không nối các điểm bằng tuyến đường giả khi geometry thiếu. Không giả lập lựa chọn phương tiện khác ngoài car.
- `weather.type=unavailable`: hiển thị reason thật. `forecast`: đọc `hourly.time`, `temperature_2m`, `precipitation_probability` cho ngày được chọn; null giữ là chưa có. Phạm vi hiển thị là trung tâm điểm đến, không suy ra thời tiết riêng cho từng pin.
- `warnings`, `budget.complete`, `categories.*.unknown_items` giữ rõ dữ liệu chưa đầy đủ; `estimated_cost=null` không đổi thành giá 0.
- In lịch trình dùng `window.print()`. Bản in chứa toàn bộ ngày, không chỉ ngày đang chọn trên UI. Chưa xác minh bản in có data trên browser.

## Payload đã triển khai

Ví dụ contract dưới đây minh họa cấu trúc; ID và version thực lấy từ backend, không hard-code vào UI.

### Chat

```json
{
  "text": "Điều chỉnh thứ tự điểm tham quan giúp tôi",
  "base_version": 1
}
```

### Preview sau đổi thứ tự

```json
{
  "base_version": 1,
  "stops": [
    {
      "place_id": 2,
      "day": 1
    },
    {
      "place_id": 1,
      "day": 1
    }
  ]
}
```

### Commit

```json
{
  "preview_id": "ID do API preview trả về",
  "base_version": 1
}
```

### Xác nhận / Xuất bản

```json
{
  "base_version": 2
}
```

```json
{
  "base_version": 2,
  "is_published": true
}
```

## Auth, URL và giới hạn backend

- Backend upstream lấy từ `NEXT_PUBLIC_API_URL` hiện có, là `https://vistra-backend-production.up.railway.app`. Request protected giữ transport proxy session hiện hữu `/api/backend`, rồi server gọi upstream + endpoint. Đây là chuyển tiếp backend thật, không phải mock/fallback hoặc gọi endpoint nghiệp vụ vào origin Vercel.
- Ví dụ detail: browser `/api/backend/api/v1/trips/{id}` → upstream `${NEXT_PUBLIC_API_URL}/api/v1/trips/{id}`. Sources dùng domain service trực tiếp `${NEXT_PUBLIC_API_URL}/places/{id}`.
- Không đổi auth cookie/admin guard sang transport khác chỉ vì user xác nhận CORS. Không fallback sang frontend origin khi thiếu environment.
- Source backend hiện chưa enforce owner ở GET detail/chat và một số legacy mutation. Proxy kiểm tra session qua `/api/v1/auth/me`, đọc trip thật và so `owner_user_id === session.user.id`, đồng thời so ID response với ID request, trước khi trả dữ liệu/forward mutation. Null owner và owner khác đều bị 403. UI không gọi trực tiếp các private endpoint để né guard.
- Guard trên frontend proxy không sửa được quyền truy cập khi client khác gọi thẳng backend. Backend vẫn cần owner enforcement cho release bên ngoài; không đánh dấu việc này đã được backend sửa.
- Confirm hiện bỏ qua `base_version` trong source backend. Proxy thêm kiểm tra version trước khi forward; kiểm tra này **không phải CAS atomic trong database**, không đảm bảo chống race nếu có mutation trực tiếp/concurrent giữa bước kiểm tra và confirm. Không tuyên bố đã sửa atomic confirmation tại BE.
- Backend legacy generate/preview/commit/budget có thể yêu cầu X-API-Key nếu `api_token` được bật. Không nhúng key vào browser hoặc tạo auth giả; lỗi cấu hình sẽ hiện lỗi API. Cấu hình/runtime có tài khoản chưa được xác minh trong task này.

## Phần tiếp tục chờ BE

| Phần UI | Vì sao chưa nối | Tình trạng |
| --- | --- | --- |
| Lịch sử hội thoại sau reload | GET trip không trả message history và chưa có endpoint lịch sử chat trong source đã đọc | Blocked by BE; chỉ giữ hội thoại thực nhận trong phiên đang mở, không seed message |
| Sidebar sửa ngày/ngân sách/thành viên/dị ứng/DNA của trip hiện tại | PATCH trip hiện chỉ xử lý status/publication; không nhận các ràng buộc này | Blocked by BE; không gửi field bị BE bỏ qua hoặc giả lập cập nhật |
| Chọn phương tiện động và reroute tương ứng | Contract hiện transport car; chưa có catalog phương tiện và request đổi phương tiện cho trip | Blocked by BE; không tạo option/mock route |
| Ảnh/screenshot đã chèn trong session | Trip/chat hiện chưa trả nguồn image/input được lưu hoặc endpoint upload phù hợp | Blocked by BE; nguồn đối chiếu địa điểm là dữ liệu `/places/{id}`, không giả làm ảnh đã gửi |
| Mở trực tiếp chi tiết hành trình cộng đồng của người khác | Chưa có public detail với payload được kiểm soát; private GET vẫn owner-gated | Blocked by BE; vẫn cho clone API thật rồi mở bản sao trong danh sách cá nhân |
| Lưu/thêm chi tiêu từ giao diện | Task này nối đọc budget hiện có; không tạo UI nhập chi tiêu mới ngoài phạm vi | Chưa triển khai, không gắn hành động giả |

## Entry points đã cập nhật

- Card `/my-trips` và lịch sử hoạt động profile: draft → `/planner?id=<id>`, confirmed → `/trip-plan?id=<id>`.
- Sau tạo trip qua API thật: link mở `/planner?id=<id>` của response.
- Hai page giữ liên kết chuyển qua lại với cùng ID; không tự chọn plan seed khi URL thiếu ID.
- Page.tsx giữ vai trò wrapper Suspense; UI ở các component nhỏ, logic/API orchestration ở `useTripWorkspace`.
- Các async response cũ không được hydrate dữ liệu riêng tư sau logout/đổi account/đổi trip. UI workspace được remount theo owner/trip để không giữ input/modal của trip cũ.

## Kiểm tra

| Check | Kết quả | Giới hạn |
| --- | --- | --- |
| Test API tạm | 35/35 pass: schema, payload URL, preview không tự commit, reorder không gửi giờ cũ, commit/version, conflict, confirm/publication, owner gate, null owner, auth, traversal, Origin, missing env, logout/late response | Fixture cô lập trong test, không phải runtime production; script đã xóa theo AGENTS.md |
| `npx tsc --noEmit` | Pass khi chạy tuần tự sau build | Lần chạy song song build bị TS6053 do `.next/types` đang tái tạo; ghi `fallure.md` và recheck pass |
| `npm run lint` | Pass sau cleanup test tạm | Lần chạy khi script CommonJS tạm còn tồn tại bị 10 no-require-imports; ghi `fallure.md`, dọn test và recheck pass |
| `npm run build` | Pass trên source cuối | Cảnh báo migration middleware → proxy hiện hữu; không đổi ngoài scope |
| `git diff --check` | Pass | Windows nhắc chuẩn hóa CRLF cho một số file |
| Playwright MCP, production preview | `/planner`, `/trip-plan` ở 1440x900 và 390x844: trạng thái chưa đăng nhập, không tràn ngang | Không xác minh workspace có dữ liệu, chat, drag/drop, tuyến map, print hoặc mutation bằng tài khoản thực |
| Browser network đọc thật | health 200; auth/detail/budget 401 khi chưa đăng nhập | Không tạo tài khoản/trip/mutation trên deployment để giả lập kết quả |

Evidence: [run-info](../../../evidence/playwright/2026-10-07_20-55-05/run-info.md), có screenshot, Network, Console và runtime-checks. HTTP 401 trong Console là kết quả kỳ vọng của kiểm tra phiên chưa đăng nhập, không phải lỗi UI đã được bỏ qua.

## File chính

- `src/constants/endpoints.ts`, `src/types/planApi.ts`, `src/types/tripApi.ts`.
- `src/schemas/tripWorkspaceSchema.ts`, `src/schemas/tripApiSchema.ts`, `src/schemas/planSchema.ts`.
- `src/services/tripService.ts`.
- `src/components/planner/useTripWorkspace.ts`, `PlannerScreen.tsx`, `TripPageState.tsx`, `PlaceSources.tsx`.
- `src/components/trip-plan/TripPlanScreen.tsx`, `ItineraryView.tsx`, `TripMap.tsx`, `BudgetSummary.tsx`.
- `src/app/api/backend/[...path]/route.ts`, `src/config/backendConfig.ts`: owner guard và method/path allowlist.
- Entry links: `TripCard`, `MyTripsScreen`, `ProfileActivityTab`, `CreateTripScreen`.

Các xóa component mock trong git diff tổng thuộc cả task chuyển backend-only trước đó. Báo cáo này chỉ bổ sung wiring hai page và entry points; không coi các thay đổi trước là task mới đã làm lại.

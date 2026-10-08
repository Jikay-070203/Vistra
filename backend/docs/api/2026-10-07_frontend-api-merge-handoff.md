# VISTRA — Bàn giao API và tồn đọng frontend khi merge

Ngày đối chiếu: 07/10/2026. Nguồn: `backend/src/main.py`, frontend trong worktree `codex/api-ui-wiring`, và [tài liệu API hiện hành](api_docs.md). Đây là review source/build, **chưa kiểm thử request với backend đang chạy**. Trạng thái “có route” không đồng nghĩa API đã đáp ứng UI.

## Việc cần Backend xử lý hoặc xác nhận

| Ưu tiên | API / UI | Hiện trạng đã đọc trong source | Kết quả cần chốt |
| --- | --- | --- | --- |
| **P0** | `GET /api/v1/trips/{trip_id}` → `/my-trips`, `/planner`, `/trip-plan` | `v1_get_trip` gọi thẳng `get_trip`, còn `get_trip` trả `trip(db, trip_id)` mà không đọc session hay so `owner_user_id`. Response có thể chứa `request` và `itinerary` của trip riêng. | Xác thực `vistra_session` và chỉ cho owner đọc trip riêng; trả `401` khi chưa đăng nhập, `403`/`404` nhất quán khi không có quyền. Nếu muốn xem plan công khai, thiết kế projection công khai riêng, không trả chat/request riêng tư. Sau đó chốt DTO detail và `current_version` cho FE hydrate trước khi bật nút mở card server. |
| **P1** | `GET /api/v1/trips/me`, `GET /community/plans` → card chuyến đi | `plan_card` gán `endDate = startDate`, `updatedAt = created_at`, `estimatedCostVnd = null`, `coverImageUrl = null`; `origin` có thể là tọa độ. `likesCount` là tổng đã bao gồm lượt thích của người đang xem. | Trả ngày kết thúc tính từ ngày đi và `durationDays` hoặc `null` nếu không xác định; ngày cập nhật thật hoặc `null`, không dùng ngày tạo dưới tên `updatedAt`. Xác nhận field/nguồn ảnh, chi phí, tên nơi xuất phát; field chưa có để `null`. Giữ định nghĩa `likesCount` là tổng, `likedByMe` là cờ riêng. |
| **P1** | `GET /community/plans?province=...` → `/community` và link từ Landing | Route legacy lọc theo `destinations.slug`; danh mục tỉnh dùng tên/mã từ nguồn khác. FE chưa có mapping name/code → slug được xác minh nên bộ lọc tỉnh đang vô hiệu hóa. | Công bố slug chuẩn cùng `name`/`code` trong catalog hoặc nhận mã tỉnh đã thống nhất ở query; đưa mapping và ví dụ request/response vào contract. FE sẽ bật lại bộ lọc khi có contract. |
| **P1** | `GET /api/v1/community/trips` → lọc/tìm kiếm | Route v1 chỉ khai báo `page`/`page_size` rồi gọi legacy với `q`, `province`, `duration`, `tag`, `budget_*`, `liked_by_me` đều cố định rỗng. FE hiện dùng `/community/plans` để các filter hoạt động. | Nếu v1 là route chuẩn, nhận và chuyển tiếp các query filter, đồng thời trả `total`/`totalPages` sau lọc. Không xóa legacy cho tới khi FE chuyển route và đã kiểm tra tương thích. |
| **P1** | `POST /api/v1/community/trips/{id}/fork` → “Tái sử dụng” | Route có tồn tại và trả `new_trip_id`, nhưng FE chưa thể mở an toàn detail của bản nháp mới khi quyền đọc/detail chưa chốt; nút hiện được vô hiệu hóa. | Xác nhận owner của bản nháp mới, contract `new_trip_id`/`base_version`, và quyền đọc detail. Chỉ bật lại sau khi luồng fork → GET detail → planner được kiểm thử. Không cần tạo route fork mới. |
| **P2** | `GET /admin/evaluation/datasets`, `POST /admin/evaluation/datasets`, `/admin/evaluation/runs` → `/admin/system` | GET list trả `testCases: []`; POST tạo dataset tồn tại; run trả `queued`, GET run trả `cases: null` và chưa có worker hoàn tất. FE phân biệt dữ liệu server với import chỉ lưu trong trình duyệt. | Hydrate test cases/detail theo dataset hoặc cung cấp detail route; worker cần ghi kết quả, score và case failures. Chốt DTO import trước khi FE chuyển từ local-only sang lưu server. |

Ví dụ ranh giới dữ liệu mong đợi cho **trip detail** (không áp đặt cách đặt tên khác với DTO hiện có):

```json
{
  "id": "trip-uuid",
  "owner_user_id": "current-user-id",
  "current_version": 2,
  "status": "draft",
  "request": { "destination": "ninh-binh" },
  "itinerary": { "days": [] }
}
```

Object trên minh họa những nhóm dữ liệu FE cần đọc sau khi Backend đã kiểm tra owner; **không phải response runtime đã xác minh**. Plan công khai cần DTO được duyệt riêng để không lộ `owner_user_id`, yêu cầu cá nhân hoặc lịch sử chat.

## Tồn đọng thuộc Frontend — không giao Backend sửa

Các mục này được giữ trong bản merge theo yêu cầu bàn giao; **chưa đạt tiêu chí đóng lỗi** và phải được sửa trong lượt frontend tiếp theo:

| Mức | File / hiện tượng | Việc FE cần làm |
| --- | --- | --- |
| **P0** | `useMyTripsController.ts`: khi account A → B không unmount, dữ liệu A chỉ được xóa trong effect/`queueMicrotask`, sau lần render đầu. | Gắn danh sách và thống kê với `user.id` đã tải; render loading/rỗng ngay nếu identity hiện tại khác identity sở hữu state, đồng thời chặn response cũ. |
| **P0** | `FeedbackContext.tsx` và `ProfileFeedbackTab.tsx`: tickets giữ trong provider qua login/logout; tab chỉ fetch khi mount và lỗi fetch không xóa ticket cũ. | Reset/scope tickets theo identity và loại danh sách admin/user; refetch theo user, chặn response cũ, không render ticket của account trước trong lúc chờ/lỗi. |
| **P0** | `useProfileController.ts`: PATCH bắt đầu ở A có thể hoàn thành sau khi đổi sang B rồi `setFormData` bằng response A. | Kiểm tra identity của request trước mọi state update sau `await updateProfile`, kể cả success/error/finally. |
| **P1** | `useCommunityController.ts`: GET mới chỉ seed `likesState` cho ID chưa có, nên count/liked cũ có thể che response mới. | Thay state theo response GET mới, trừ mutation đang pending; dùng response mutation làm nguồn chuẩn, rollback đúng khi lỗi. |

## Mức xác minh và điều kiện tích hợp

- Worktree `codex/api-ui-wiring` đã qua `git diff --check`, `npx tsc --noEmit`, ESLint các file sửa trọng điểm và `npm run build` (22 route). Lint toàn dự án còn 2 lỗi, 2 warning ở `HeroPlanCarousel.tsx` và `VistraMap.tsx`, đều không thuộc diff API hiện tại.
- Backend offline trong đợt review: các nhãn **source-wired/UI-wired** không được hiểu là **runtime-verified**. Cần thử cookie/session, ownership, list/filter, like, feedback và admin mutation với backend chạy thật trước khi coi tích hợp hoàn tất.
- FE đang vô hiệu hóa mở/tái sử dụng card server và lọc tỉnh để tránh dữ liệu giả hoặc điều hướng sai. Các điểm này chỉ bật lại khi contract và luồng FE tương ứng được xác minh.
- Frontend proxy yêu cầu biến server-only `BACKEND_API_URL`; mẫu tại `frontend/.env.example`. Không đưa token/secret vào `NEXT_PUBLIC_*`.

# VISTRA — Report API lỗi, chưa thể sử dụng đầy đủ và API còn thiếu

- Thời điểm rà soát: 2026-10-07, Asia/Ho_Chi_Minh.
- Repository: `P-103`; frontend: `frontend`; backend: `backend`.
- Source frontend đã tích hợp: nhánh `BinhNT`, merge commit `ac4f8b8`, chứa implementation `e9c9f1d`.
- Mục đích: handoff cho backend, đối chiếu API đang có với dữ liệu và hành vi UI cần. Đây là report, chưa sửa backend hoặc bổ sung API.
- Phạm vi: landing, auth, community, destinations, my-trips, create-trip, planner, trip-plan, profile và management pages.

## 1. Cách đọc và giới hạn bằng chứng

| Nhãn | Ý nghĩa |
|---|---|
| **LỖI SOURCE** | Source có hành vi sai/thiếu kiểm tra xác định được; chưa đồng nghĩa đã tái hiện trên deployment hiện tại. |
| **CHƯA HOÀN CHỈNH** | Route đã tồn tại nhưng chưa xử lý đầy đủ chức năng hoặc dữ liệu UI cần. |
| **THIẾU API** | Chưa tìm thấy route/capability tương ứng trong backend được rà soát. |
| **CHỜ DỮ LIỆU** | Contract dùng được nhưng dữ liệu thực tế có thể chưa được nhập; không kết luận API lỗi. |
| **CHƯA KIỂM CHỨNG** | Chưa có bằng chứng runtime phù hợp, nhất là thao tác có đăng nhập và mutation. |
| 🟩 **ĐÃ CÓ** | Field/hành vi đã có trong contract hiện tại. |
| 🟧 **CÓ NHƯNG CHƯA ĐỦ/SAI** | Field tồn tại nhưng nguồn dữ liệu, giá trị hoặc xử lý chưa đáp ứng. |
| 🟥 **THIẾU** | Field/hành vi cần bổ sung, không phải response hiện tại. |

Các JSON dưới đây là mẫu contract để BE đối chiếu, **không phải dữ liệu trả về từ production trong lượt này**. JSON thuộc API mới đều ghi rõ **đề xuất**; BE và FE cần chốt tên route/field trước khi triển khai. Giá trị số/ngày trong ví dụ chỉ minh họa shape, không phải metric đo được. Mẫu response bổ sung được giữ theo convention của từng API hiện có; không ép mọi API vào một envelope mới.

Không gửi mutation lên production trong lần lập report. Source backend trong repo có thể khác phiên bản deployment. Để kết luận deployment đã sửa hay chưa, BE cần cung cấp revision triển khai và chạy các acceptance case bên dưới.

### Những điều không được phân loại thành API lỗi

- `GET /my-trips?_rsc=...` và `/trip-plan?...&_rsc=...` là request navigation/RSC của Next.js, dùng frontend origin là đúng.
- `/api/backend/...` là proxy session đang forward tới **`NEXT_PUBLIC_API_URL + endpoint`**, không phải API mock. Upstream đã được cấu hình bằng env; public API dùng backend URL trực tiếp, API tỉnh công khai có base URL riêng.
- Anonymous nhận `401` ở auth/private endpoints là hành vi mong đợi.
- Danh sách rỗng, itinerary chưa sinh, giá chưa biết, geometry không có hoặc thời tiết ngoài cửa sổ dự báo không tự động là bug. Phải phân biệt dữ liệu thiếu với field bị gán rỗng/null cố định trong source.
- In lịch trình/xuất feedback PDF bằng browser print, carousel, donut chart rendering, slider, dropdown, bố cục responsive không cần API riêng chỉ để vẽ UI.
- Phần minh họa/animation trên landing không phải bằng chứng backend đang trả dữ liệu mock.

## 2. Bảng API đã có nhưng lỗi/chưa sử dụng đầy đủ

| ID | API / capability hiện có | UI liên quan | Phân loại và vấn đề | BE cần xử lý |
|---|---|---|---|---|
| E01 | `GET /api/v1/trips/{id}`, `POST /api/v1/trips/{id}/chat`; legacy trip detail/generate/preview/commit/budget/expenses/delete/restore | planner, trip-plan, dữ liệu riêng tư | **LỖI SOURCE**: v1 detail/chat nhận cookie nhưng không kiểm tra session/owner; legacy routes chủ yếu dựa API key, không kiểm tra owner. | Kiểm tra session + owner ngay BE; không dựa vào FE proxy. |
| E02 | `POST /api/v1/trips` | create-trip → planner | **CHƯA HOÀN CHỈNH CONTRACT QUYỀN**: cho tạo trip khi không có session, lưu `owner_user_id=null`; FE private proxy không cho mở trip không có owner. | Chốt trip guest hay trip cá nhân; luồng cá nhân phải có owner hợp lệ, hoặc có cơ chế claim được bảo vệ. |
| E03 | `POST /trips/{id}/confirm` | chốt plan | **LỖI SOURCE**: nhận `base_version` nhưng không sử dụng để đối chiếu/update có điều kiện. | Atomic version check; stale request phải `409`, không chốt phiên bản người dùng chưa xem. |
| E04 | `PATCH /trips/{id}/publication`, `PATCH /api/v1/trips/{id}` | publish, cập nhật trip | **RỦI RO NHẤT QUÁN SOURCE**: publication không kiểm tra rowcount sau conditional update; v1 PATCH kiểm tra phiên bản trước nhưng update không có version predicate. | Atomic CAS + rowcount; response chỉ success khi mutation thực sự áp dụng. |
| E05 | `GET /api/v1/trips/me`, `GET /community/plans` dùng `plan_card()` | card my-trips/community/profile activity | **LỖI SOURCE + THIẾU DỮ LIỆU**: `endDate=startDate`, `updatedAt=created_at`; ảnh/chi phí ước tính luôn null. | Ngày về theo số ngày; timestamp cập nhật thật; projection ảnh/chi phí theo nguồn thật. |
| E06 | `GET /api/v1/public/landing`, `GET /api/v1/catalog/allergies` và CRUD `/admin/content` | hero, intro, allergy options, admin/content | **CHƯA HOÀN CHỈNH**: public reader không đọc `content_items`; hero luôn `[]`; intro không có ảnh; allergies là list viết sẵn. | Đồng bộ CMS → public reader/catalog; áp dụng active/order và mapping field ảnh. |
| E07 | `GET /api/v1/destinations/recommendations`, `GET /api/v1/destinations/{id}` | destinations cards/detail/compare | **CHƯA HOÀN CHỈNH**: v1 không nhận criteria; legacy có params nhưng chỉ lấy 5 destination theo ID; nhiều field null cố định; detail chỉ catalog. | Gợi ý theo tháng lịch kế tiếp + tiêu chí/DNA; trả key-info plan và dữ liệu so sánh. |
| E08 | `/admin/evaluation/datasets`, `/admin/evaluation/runs`, `/admin/evaluation/runs/{id}` | dataset test và detail result | **CHƯA HOÀN CHỈNH**: tạo run `queued`, không thấy worker cập nhật trong repo; `cases=null`, list dataset luôn `testCases=[]`. | Trình chạy + terminal status/results; endpoint xem cases của dataset. |
| E09 | `GET /admin/system/summary`, alias `/api/v1/admin/system/metrics` | KPI system/overview, benchmark | **CHƯA HOÀN CHỈNH**: metrics luôn null, benchmarkGroups luôn `[]`. | Đo/thống kê thực; định nghĩa khoảng đo, mẫu số và đơn vị. |
| E10 | `GET /api/v1/admin/traces`, detail trace | trace list/detail | **CHƯA HOÀN CHỈNH / CHƯA KIỂM CHỨNG**: đọc bảng có thật; không thấy writer `system_traces` trong code Python backend; chưa nhận filter status. | Nối trace production hoặc xác nhận writer ngoài repo; lọc trước phân trang. |
| E11 | `PATCH /api/v1/trips/{id}` | sửa ràng buộc planner | **CHƯA HOÀN CHỈNH**: chỉ xử lý status/is_published; payload khác có thể bị bỏ qua và vẫn success. | Typed request cho constraints; reject field unsupported; preview/confirm rõ ràng. |
| E12 | `GET /api/v1/community/trips`, `GET /api/v1/admin/feedback`, `GET /api/v1/feedback/me` | alias tương lai | **CHƯA HOÀN CHỈNH**: alias không expose/forward toàn bộ filter mà legacy có. | Đồng bộ contract hoặc công bố alias là subset. FE hiện dùng legacy community/admin feedback nên không coi là lỗi filter FE hiện tại. |
| E13 | `GET /auth/oauth/{provider}/start` (google hoặc facebook) | login/register qua provider | **CHƯA SỬ DỤNG ĐƯỢC**: source trả `501 OAUTH_NOT_CONFIGURED`. | Implement provider flow + callback/session; giữ disabled đến khi đủ. |

### E01–E04. Quyền sở hữu và nhất quán phiên bản

**Bằng chứng:** `backend/src/main.py:363–435`, `458–516`, `674–683`, `981–989`, `1023–1053`; `backend/src/models.py` (`VersionRequest`, `PublicationRequest`). FE đang giảm rủi ro bằng owner check trong `frontend/src/app/api/backend/[...path]/route.ts`, nhưng không bảo vệ người gọi trực tiếp backend hoặc giải quyết race giữa preflight và mutation.

Request confirm/publication hiện tại đã đủ field:

```json
{
  "base_version": 3
}
```

```json
{
  "base_version": 3,
  "is_published": true
}
```

| Field/hành vi | Trạng thái | Mong đợi |
|---|---|---|
| Cookie `vistra_session` | 🟩 Có ở auth và một số routes | Cùng một policy session cho private trips. |
| `owner_user_id` trên detail | 🟩 Có | Owner phải kiểm tra ở BE; trip không có owner cần policy riêng. |
| `base_version` trên confirm | 🟧 Nhận nhưng bỏ qua | Compare và update trong cùng transaction; stale `409`. |
| Conditional update publication | 🟧 Có predicate nhưng không xác nhận rowcount | Không trả success nếu 0 rows changed. |
| Constraints trong v1 PATCH | 🟥 Không xử lý | Xem M02; không nhận tùy ý rồi bỏ qua âm thầm. |

Acceptance BE: anonymous private read/write `401`; user B đọc/sửa/chốt/publish trip A `403` hoặc `404` theo policy; A hợp lệ thành công; trip deleted không sửa được; hai request version cũ không cùng được chốt; API key không thay quyền owner. Xác nhận riêng scope của global `/trips` và legacy delete/restore dù FE hiện không mount các action đó.

Đối với E02, không tự coi trip guest là bug nếu BE cố ý hỗ trợ guest. Tuy nhiên luồng FE cá nhân hiện cần session/owner; BE phải công bố policy để không tạo trip rồi UI bị chặn. Response create đã có `generation_error`: trip được lưu nhưng chưa sinh itinerary là partial success hợp lệ, FE đang hiển thị đúng hai kết quả này.

### E05. Card trip sai ngày và timestamp

**Bằng chứng:** `backend/src/main.py:588–604`; `frontend/src/types/tripCollectionApi.ts`.

Request hiện tại:

```json
{
  "page": 1,
  "page_size": 12
}
```

Response item mong đợi, giữ naming hiện có:

```json
{
  "id": "trip-id",
  "title": "Hành trình Ninh Bình",
  "origin": null,
  "destination": "Ninh Bình",
  "coverImageUrl": "/media/ninh-binh.jpg",
  "startDate": "2026-11-01",
  "endDate": "2026-11-03",
  "durationDays": 3,
  "budgetMinVnd": 3000000,
  "budgetMaxVnd": 3000000,
  "estimatedCostVnd": 2500000,
  "status": "confirmed",
  "isPublished": true,
  "updatedAt": "2026-10-07T14:00:00Z",
  "tags": ["attraction"],
  "likesCount": 4,
  "likedByMe": false
}
```

| Field | Hiện tại | BE cần làm |
|---|---|---|
| `endDate` | 🟧 Bằng `startDate` cho mọi trip | Tính `start_date + days - 1` nếu quy ước inclusive; chốt timezone/date-only. |
| `updatedAt` | 🟧 Lấy `created_at` | Lưu/cập nhật timestamp khi plan thay đổi; không ghi ngày tạo như ngày update. |
| `coverImageUrl` | 🟧 Null cố định | Chọn ảnh có nguồn thật; nullable khi thực sự không có ảnh. |
| `estimatedCostVnd` | 🟧 Null cố định | Projection từ itinerary/budget; giữ null nếu chưa đủ ước tính, không biến unknown thành 0. |
| `budgetMinVnd`, `budgetMaxVnd` | 🟧 Cùng lấy single `budget_vnd` | Hiện FE dùng ceiling; khi hỗ trợ range xem M02. |
| `title` | 🟧 Có fallback, create schema không nhận title | Nếu cho user đặt tên cần bổ sung write contract; không yêu cầu bỏ fallback hợp lệ. |

Community response hiện có `items/page/pageSize/total/totalPages`; mine có `items/pagination.page/page_size/total_records`. **Giữ hai shape hiện tại**, đừng đổi envelope trong một patch sửa card.

### E06. CMS lưu được nhưng public không nhận thay đổi

**Bằng chứng:** `backend/src/main.py:537–555`, `763–805`, `939–952`; `frontend/src/types/contentApi.ts`, `publicLandingApi.ts`, `schemas/publicLandingSchema.ts`.

CMS hiện có GET list, POST hero/allergy, PATCH item, DELETE item. Public reader đang lấy intro từ bảng destinations, allergy từ list trong function và hero `[]`. Nhập thêm CMS data **không tự sửa được** public reader này.

Ví dụ POST `/admin/content/hero-plans` FE có thể gửi:

```json
{
  "title": "Một cuối tuần ở Huế",
  "destination": "Huế",
  "image": "/media/hue.jpg",
  "duration": "2 ngày",
  "budget": "3.000.000 ₫",
  "tags": ["Văn hóa"],
  "summary": "Khám phá di sản và ẩm thực.",
  "highlights": ["Đại Nội", "Sông Hương"]
}
```

Mẫu public output mong đợi, có sẵn shape FE đọc:

```json
{
  "heroPlans": [
    {
      "id": "hero-id",
      "title": "Một cuối tuần ở Huế",
      "destination": "Huế",
      "image": "/media/hue.jpg",
      "duration": "2 ngày",
      "budget": "3.000.000 ₫",
      "tags": ["Văn hóa"],
      "summary": "Khám phá di sản và ẩm thực.",
      "highlights": ["Đại Nội", "Sông Hương"],
      "active": true,
      "order": 0
    }
  ],
  "introDestinations": [
    {
      "id": "intro-id",
      "active": true,
      "order": 0,
      "label": "Huế",
      "provinceCode": "hue",
      "imageUrl": "/media/hue.jpg",
      "tagline": "Dấu ấn di sản"
    }
  ],
  "allergyOptions": [
    {
      "id": "seafood",
      "active": true,
      "label": "Hải sản"
    }
  ],
  "stats": {
    "destinations": 6,
    "places": 120
  }
}
```

| Field/hành vi | Trạng thái | BE cần làm |
|---|---|---|
| `heroPlans` | 🟧 Rỗng cố định | Đọc hero content đã active, đúng order. |
| Intro `imageUrl` | 🟧 Null cố định | Map CMS `image` sang public `imageUrl`; không đổi tên âm thầm ở một đầu. |
| Intro `active/order/label/tagline` | 🟧 Không lấy CMS | Áp dụng cấu hình admin, quản lý 6 card đã chốt. |
| `provinceCode` | 🟧 Hiện là destination slug dù tên field là code | Công bố rõ là slug hay official code; link intro → community phải chọn được filter đúng. |
| `allergyOptions` | 🟧 List viết sẵn | GET catalog và public đọc cùng nguồn CMS. |
| `stats.places` | 🟧 Null cố định | Count theo scope được công bố; nếu chưa hỗ trợ giữ null có chủ đích. |
| Create intro content | 🟥 POST chỉ cho hero/allergy | Nếu cần thêm/thay 6 card từ CMS rỗng phải có create/upsert intro; PATCH không tạo item chưa có. |
| Schema payload CMS | 🟧 Dict + kiểm tra title/label tối thiểu | Validate collection-specific fields, URL, types/order; lỗi từng field để admin sửa. |

Acceptance: admin sửa một item → public GET phản ánh dữ liệu đã lưu; inactive không xuất hiện; reorder đúng; catalog allergy phản ánh thêm/sửa/xóa; bảo toàn cùng ID/mapping. Không trả ảnh giả khi chưa có media.

### E07. Recommendations hiện là catalog, chưa là plan đề xuất

**Bằng chứng:** `backend/src/main.py:557–586`, `954–969`; `frontend/src/services/destinationService.ts`, `types/recommendationApi.ts`.

V1 hiện không nhận criteria; legacy nhận `start_date/end_date/budget_max_vnd/travelers/style/dna_focus` nhưng không dùng để xếp hạng. FE hiện gọi v1 **không gửi những filter này** và không tuyên bố đã cá nhân hóa. Đây là thiếu capability, không phải FE gửi sai params.

Request mong đợi **đề xuất mở rộng**, không phải request FE đang gửi:

```json
{
  "from": "2026-11-01",
  "to": "2026-11-30",
  "budget_min_vnd": 1000000,
  "budget_max_vnd": 10000000,
  "travelers": 2,
  "style": "relaxed",
  "use_user_dna": true
}
```

Thời điểm ví dụ là tháng lịch kế tiếp của ngày lập report. Chốt convention `from/to` hay `start_date/end_date`; tránh hai API cùng chức năng nhưng nhận tên field khác không được ghi tài liệu.

```json
{
  "period": {
    "from": "2026-11-01",
    "to": "2026-11-30"
  },
  "items": [
    {
      "id": "hue",
      "name": "Huế",
      "region": "Miền Trung",
      "country": "Vietnam",
      "imageUrl": "/media/hue.jpg",
      "durationDays": 3,
      "estimatedCostVnd": 5000000,
      "visualMatchPct": 85,
      "budgetMatchPct": 90,
      "seasonMatchPct": 80,
      "vibe": "Di sản và nghỉ ngơi",
      "tags": ["Văn hóa"],
      "goldenHour": null,
      "transportSummary": "Ô tô giữa các điểm",
      "rationale": "Phù hợp thời gian và sở thích đã chọn.",
      "realityCheck": null,
      "bestMoments": null,
      "details": null
    }
  ],
  "generatedAt": "2026-10-07T14:00:00Z"
}
```

| Field/hành vi | Trạng thái |
|---|---|
| ID/name/region/country/generatedAt | 🟩 Có từ catalog. |
| `period.from/to` | 🟧 V1 hiện không truyền ngày nên null. |
| `imageUrl`, `durationDays`, `estimatedCostVnd`, match percentages, vibe/transport info | 🟧 Có key nhưng null cố định trong source. |
| Rank theo tháng kế tiếp, criteria, DNA | 🟥 Chưa xử lý. |
| Click xem plan cụ thể / dùng ngay plan đề xuất | 🟥 Destination detail không cung cấp itinerary hoặc reference tới plan an toàn; cần M05/plan-detail contract. |
| So sánh tối đa 3 | 🟩 FE có limit; 🟧 dữ liệu detail hiện chỉ ID/slug/name/region/coordinates/targetPlaces/highlights rỗng. |

BE không cần tạo API “vẽ bảng so sánh”; trả đủ detail/key-info và ID plan để FE so sánh, chọn một plan trực tiếp hoặc clone. Bổ sung itinerary/reference là extension contract và cần cập nhật schema FE (`details` hiện chỉ chấp nhận null).

### E08. Dataset và evaluation run chưa chạy đến kết quả

**Bằng chứng:** `backend/src/main.py:807–856`; tìm kiếm `evaluation_runs/summary_json` trong backend Python chỉ thấy insert/read, chưa thấy worker/update. Nếu worker nằm ngoài repo, BE cần cung cấp vị trí, contract và evidence chạy thật.

Request có sẵn:

```json
{
  "name": "Kiểm thử kế hoạch Huế",
  "description": "Bộ test có thể tái sử dụng",
  "test_cases": [
    {
      "name": "Không vượt thời gian mở cửa",
      "input": {
        "destination": "hue"
      },
      "expected": {
        "respects_opening_hours": true
      }
    }
  ]
}
```

```json
{
  "datasetId": "dataset-id"
}
```

Response run kết thúc **đề xuất bổ sung cases**, giữ field đang có:

```json
{
  "runId": "run-id",
  "datasetId": "dataset-id",
  "status": "completed",
  "scorePct": 50,
  "counts": {
    "passed": 1,
    "warning": 0,
    "failed": 1
  },
  "cases": [
    {
      "id": "case-id",
      "name": "Không vượt thời gian mở cửa",
      "status": "failed",
      "expected": {
        "respects_opening_hours": true
      },
      "actual": {
        "respects_opening_hours": false
      },
      "reason": "Địa điểm đóng cửa trước thời điểm ghé thăm.",
      "latencyMs": 1500
    }
  ]
}
```

🟩 Có dataset create/list, run create/read, ID/status. 🟧 List dataset trả `testCases=[]` dù có cases lưu DB; run chưa có transition/summary thực. 🟥 Thiếu detail cases và case-results contract/runner/failure response.

Acceptance: queued → running → completed/failed; không queued vô hạn; failure có lý do; result có passed/failed từng case, số đếm khớp; modal FE có thể đưa failed lên đầu. Admin không cần xem toàn bộ test_cases trong mọi list page nếu có detail endpoint. GET detail dataset route mới là **đề xuất**, chưa tồn tại.

### E09–E10. Metrics và trace mới có read contract

Response metrics hiện tại đã có shape nhưng null/rỗng cố định. Mong đợi khi thật sự có telemetry:

```json
{
  "availabilityPct": 99.5,
  "aiResponseLatencyMs": {
    "avg": 1500,
    "p95": 2400
  },
  "apiLatencyMs": {
    "avg": 120,
    "p95": 250
  },
  "planAcceptancePct": 60,
  "checkedAt": "2026-10-07T14:00:00Z",
  "benchmarkGroups": []
}
```

🟧 Toàn bộ metric số chưa được tính; `checkedAt` có thời gian phản hồi nhưng không xác định cửa sổ đo. 🟥 Benchmark group contract chưa định nghĩa; không tự bịa điểm benchmark. BE cần ghi window/timezone/sampleCount và công thức acceptance: plan đã chốt chia cho tập plan được gợi ý nào. Chart system overview còn cần M07.

Trace hiện có list pagination và detail `id/timestamp/traceType/status/latencyMs/confidence/context/details`; FE dùng được các field này. Chưa thấy writer vào `system_traces` trong repo; các trace công cụ lưu ở nơi khác không tự trở thành record của API này. Cần xác nhận/nối nguồn thật trước khi tuyên bố trace toàn hệ thống hoạt động.

Request filter **đề xuất bổ sung**:

```json
{
  "page": 1,
  "page_size": 20,
  "status": "failed",
  "from": "2026-10-01T00:00:00+07:00",
  "to": "2026-10-07T23:59:59+07:00"
}
```

🟩 page/page_size được nhận; 🟥 status/from/to chưa được routes list hiện tại nhận. Bộ lọc phải tác động `items/total` cùng scope trước pagination.

### E11–E13. Partial update, alias và OAuth

- **E11:** PATCH trip nhận dict, chỉ áp dụng status/is_published. Gửi `budget_vnd`, `people` hoặc `pace` không tạo cập nhật constraints. Phải reject unsupported fields hoặc implement rõ theo M02; không báo thành công giả.
- **E12:** alias community gọi legacy với q rỗng và các filter null; alias admin feedback bỏ q/status; alias my-feedback bỏ status. Hiện FE dùng `/community/plans` và `/admin/feedback/tickets` nên các filter đã hỗ trợ ở legacy vẫn dùng được. My-feedback v1 chưa hỗ trợ status server; cần bổ sung nếu mở filter đó. Không thay toàn bộ legacy endpoint bằng v1 trước khi đủ parity.
- **E13:** provider Google/Facebook source trả 501. Email/password có routes thật; OAuth chưa sẵn sàng không làm email/password API trở thành mock.

## 3. API/capability đang thiếu cho UI

Các route trong cột “Hướng bổ sung” là **đề xuất**, trừ endpoint được đánh dấu “mở rộng route có sẵn”. Không có endpoint giả đã được nối vào FE cho những mục này. UI liên quan hiện có thể là unavailable placeholder sau khi bỏ mock; đó vẫn là feature BE cần để phục hồi trải nghiệm đã yêu cầu.

| ID | UI / chức năng | Input FE cần truyền | Output còn thiếu | Hướng bổ sung và trạng thái |
|---|---|---|---|---|
| M01 | Planner chat history sau reload | trip ID, cursor/page, page size | messages, role, timestamp, thinking summary, reference phiên bản/preview | **THIẾU API** đọc lịch sử + persistence; POST chat hiện chỉ reply/preview. |
| M02 | Sửa Structured Inputs/constraints planner | base_version, dates, budget range, travelers, allergies, fitness, DNA | persisted request + version/preview mới + cảnh báo | **THIẾU CAPABILITY**, mở rộng create/update; không dùng PATCH hiện tại như đã hỗ trợ. |
| M03 | Image input, phân tích image/text thành DNA | file upload, text, trip/session context | source ID, URL/thumbnail, analysis status, derived DNA | **THIẾU API** upload/analysis; không gửi base64 vào TripCreate hiện tại. |
| M04 | Planner transport selector và đổi route | destination/trip ID, transport mode, base_version | mode options + preview route geometry/time/cost | **THIẾU CAPABILITY**: schema/planner hiện chỉ car. |
| M05 | Mở public plan community hoặc plan recommendation | public plan ID | public-safe itinerary, summary, budget, route, clone reference | **THIẾU API** public detail; không dùng private trip detail của người khác. |
| M06 | My-trips search/filter, profile activity totals | q/status, start/end dates, budget range, pagination | filtered items/total; total confirmed/published riêng | **THIẾU CAPABILITY**, mở rộng `/api/v1/trips/me`. |
| M07 | Admin overview/users seasonality | khoảng đo, timezone, 12 tháng | tổng user/revenue, created/confirmed monthly, peak planning period | **THIẾU API** analytics tổng hợp; metrics health không cung cấp những field này. |
| M08 | Admin users list/detail/stats/lock/sort | pagination, sort, filters, user ID, status mutation | user records, monthly new users, membership distribution, detail | **THIẾU API** quản lý user; login trả role không thay thế danh sách admin. |
| M09 | Admin revenue, transactions, plan revenue split | from/to, granularity, pagination | revenue totals, chart series, package shares, transactions | **THIẾU API** finance/reporting. |
| M10 | Profile subscription/billing | current user, selected package; invoice ID | current plan/limits, catalog pricing, billing history/action results | **THIẾU API** subscription/billing. |
| M11 | Admin prompt injection test | scenario ID hoặc custom prompt | response, blocked/allowed result, guardrail reason, latency | **THIẾU API** scenario/runner/results. |
| M12 | Admin database diagram/record CRUD/bulk JSON | entity name, query/pagination, validated records, confirm | schema/relations, records, per-object validation + write result | **THIẾU API** entity management; không đồng nhất với CMS content. |
| M13 | Admin/content chọn ảnh mới | image file, collection/item ID | hosted image URL/path, media ID, metadata | **THIẾU API** media upload; URL CMS không tự upload file. |
| M14 | Profile DNA từ chat/image/manual, source evidence | user session; optional analysis request | signal sources, score provenance, summary, updatedAt | **THIẾU CAPABILITY**; GET/PUT DNA hiện chỉ manual preferences. |
| M15 | Weather icons và safety/health advisories theo điểm/ngày | trip/place/date | weather classification, sourced advisory severity/time validity | **THIẾU CAPABILITY CHI TIẾT**; weather/warnings hiện có một phần, không coi toàn bộ là thiếu. |

### M01. Lịch sử hội thoại và tóm tắt brainstorm

POST `/api/v1/trips/{id}/chat` đang nhận đủ `{text, base_version}` và trả `reply/preview/tools_used/base_version`. Chưa lưu/đọc lịch sử trong API chat hiện tại; current-session messages FE không bảo đảm reload còn nội dung.

Request GET lịch sử **đề xuất**:

```json
{
  "trip_id": "trip-id",
  "cursor": null,
  "page_size": 30
}
```

```json
{
  "items": [
    {
      "id": "message-id",
      "role": "assistant",
      "content": "Đã đề xuất điều chỉnh lịch trình.",
      "created_at": "2026-10-07T14:00:00Z",
      "thinking_summary": "Cân đối thời gian di chuyển và giờ mở cửa",
      "base_version": 3,
      "preview_id": "preview-id"
    }
  ],
  "next_cursor": null
}
```

🟥 Các field lịch sử trên chưa có read contract. `thinking_summary` là tóm tắt process an toàn để UI trình bày, **không yêu cầu raw chain-of-thought/system prompt/tool secrets**. Nếu preview đã hết hạn, history vẫn tồn tại nhưng không được tự mở lại mutation cũ. Owner isolation bắt buộc.

### M02. Tạo trip/sửa constraints: phần đã nhận và phần chưa nhận

Source đối chiếu: `backend/src/models.py` (`TripCreate`), `frontend/src/components/create-trip/CreateTripScreen.tsx`, `frontend/src/types/planApi.ts`.

| Input | Hiện tại |
|---|---|
| destination, start_date, days, people, budget_vnd, budget_scope, pace | 🟩 Đã nhận trong create. |
| interests, must_visit, origin tọa độ, allow_unverified, lodging/transport estimates | 🟩 Có contract BE; không suy ra tất cả đều đang có input UI. |
| Ngày về | 🟩 FE tính days từ date range; không cần thêm end_date nếu đã chốt inclusive semantics. |
| Budget minimum/range | 🟥 Chỉ ceiling `budget_vnd` được gửi; không tuyên bố min đã được áp dụng. |
| Seniors/adults/children riêng | 🟥 Hiện chỉ nhận people tổng. |
| Allergy lựa chọn/custom entries, fitness, image IDs, narrative, plan-specific DNA | 🟥 Chưa có trong create schema; thêm trực tiếp hiện sẽ bị 422 do extra=forbid. |
| Update constraints sau create | 🟥 V1 PATCH chưa xử lý; preview stops chỉ đổi điểm/thứ tự, không sửa toàn bộ input. |

Request extension **đề xuất**, không phải payload đang gửi:

```json
{
  "base_version": 3,
  "destination": "hue",
  "start_date": "2026-11-01",
  "days": 3,
  "people": 3,
  "budget_vnd": 10000000,
  "budget_scope": "total",
  "pace": "relaxed",
  "budget_min_vnd": 3000000,
  "travelers": {
    "seniors": 1,
    "adults": 2,
    "children": 0
  },
  "allergies": {
    "selected": ["Hải sản"],
    "custom": ["Mè"]
  },
  "fitness_level": "light",
  "narrative": "Ưu tiên di sản và nghỉ ngơi.",
  "inspiration_image_ids": ["image-id"],
  "plan_dna": {
    "culture": 80,
    "nature": 60
  }
}
```

🟥 base_version cho constraint mutation; budget_min_vnd/travelers/allergies/fitness_level/narrative/inspiration_image_ids/plan_dna là extension cần chốt. Allergy gửi text theo định hướng đã chọn; options ID là metadata UI, không bắt BE dùng ID nếu contract không cần.

Response tối thiểu **đề xuất**:

```json
{
  "trip_id": "trip-id",
  "base_version": 3,
  "preview_id": "preview-id",
  "expires_at": "2026-10-07T14:30:00Z",
  "requires_confirmation": true,
  "warnings": []
}
```

BE cần xác định full itinerary nằm trong response preview theo shape hiện có và khi nào request mới được persist. FE chỉ gửi khi user bấm xác nhận cập nhật; không cập nhật DNA account từ override riêng của một plan. Không tự bật các input chưa được BE nhận.

### M03 và M13. Upload ảnh và source analysis

Hai mục khác mục đích, có thể dùng chung media storage nhưng quyền/context khác nhau:

| Flow | Request đề xuất | Response cần |
|---|---|---|
| User image inspiration | multipart `file`, context trip/session | image/source ID, preview URL, metadata; analysis job ID/status nếu async. |
| Admin CMS image | multipart `file`, collection/item ID | media ID + URL dùng được trên frontend deployment. |
| Analyze text/images | image IDs + narrative + optional current user DNA | job status, derived DNA, summary/provenance; lỗi từng source nếu có. |

```json
{
  "id": "media-id",
  "url": "https://media.example.com/images/hue.jpg",
  "thumbnail_url": "https://media.example.com/images/hue-thumb.jpg",
  "mime_type": "image/jpeg",
  "width": 1600,
  "height": 1000,
  "created_at": "2026-10-07T14:00:00Z"
}
```

Tất cả field trong JSON này là 🟥 contract mới. Domain example chỉ minh họa, không phải storage đã tồn tại. Trình duyệt deploy không ghi thẳng vào source folder FE. CMS `image` string có sẵn chỉ lưu reference; không thực hiện upload, phân tích hoặc host file.

### M04. Đổi phương tiện và tuyến đường

Hiện `TripCreate.transport` và FE `PlanRouteLegDto.transport` chỉ `car`; routing không nhận mode từ UI. Không bịa danh sách phương tiện hoặc tự vẽ tuyến thẳng như tuyến BE đã tính.

```json
{
  "trip_id": "trip-id",
  "base_version": 3,
  "transport": "walking"
}
```

```json
{
  "options": [
    {
      "value": "car",
      "label": "Ô tô",
      "supported": true
    },
    {
      "value": "walking",
      "label": "Đi bộ",
      "supported": true
    }
  ],
  "selected": "walking",
  "preview_id": "preview-id",
  "route_legs": [
    {
      "day": 1,
      "from_place_id": 10,
      "to_place_id": 11,
      "duration_min": 15,
      "distance_km": 1,
      "transport": "walking",
      "geometry": {
        "type": "LineString",
        "coordinates": [[107.58, 16.46], [107.59, 16.47]]
      }
    }
  ]
}
```

🟩 Route duration/distance/geometry đã có trong itinerary hiện tại. 🟥 mode options và mode khác car chưa có; JSON trên là **projection minh họa extension**, không phải full itinerary DTO. Khi BE thêm mode, FE phải cập nhật types/schema; không chỉ gắn dropdown. Chỉ tư vấn phương tiện, không booking.

### M05. Public plan detail

`GET /community/plans` đã có list, PUT like và POST clone có route thật. Chưa có public-safe GET detail. Private detail không phải giải pháp cho card của user khác.

```json
{
  "id": "public-plan-id",
  "title": "Hành trình Huế",
  "destination": "Huế",
  "durationDays": 3,
  "coverImageUrl": "/media/hue.jpg",
  "budget": {
    "knownMinVnd": 3000000,
    "knownMaxVnd": 5000000,
    "complete": false
  },
  "days": [
    {
      "day": 1,
      "placeIds": [10, 11]
    }
  ],
  "canClone": true
}
```

JSON là **public view tối thiểu đề xuất**, chưa đủ thay itinerary map: detail phải kèm/projection activities tọa độ, timing, route geometry và warnings từ DTO hiện có. 🟥 Public read policy + DTO chưa có; tuyệt đối không trả cookie, email, request riêng, raw chat/DNA/images cá nhân hay owner metadata không được công khai. Recommendation cần reference public/sample plan thật nếu muốn dùng ngay.

### M06. Filter my-trips và totals profile

`GET /api/v1/trips/me` hiện chỉ nhận page/page_size và sort created_at desc. Filter client trên một trang không đáp ứng lọc toàn bộ dataset.

```json
{
  "page": 1,
  "page_size": 12,
  "q": "Huế",
  "status": "confirmed",
  "start_date": "2026-11-01",
  "end_date": "2026-11-30",
  "budget_min_vnd": 1000000,
  "budget_max_vnd": 10000000
}
```

🟩 page/page_size; 🟥 các filter còn lại. Chốt date range là containment hay overlap với dates trip. Giữ current list envelope; bổ sung aggregation **đề xuất**:

```json
{
  "summary": {
    "totalTrips": 20,
    "confirmedTrips": 8,
    "publishedTrips": 3
  }
}
```

Không tính confirmed/published tổng từ items của trang hiện tại. BE phải phân biệt totals toàn account và totals sau filter.

### M07–M09. Analytics/admin users/revenue

Overview cần số plan tạo/chốt theo **12 tháng gần nhất**, không chart trong ngày. “Cao điểm” là khoảng thời gian có số plan tạo cao nhất, không phải concurrent online users.

Response analytics **đề xuất**:

```json
{
  "timezone": "Asia/Ho_Chi_Minh",
  "period": {
    "from": "2025-11-01",
    "to": "2026-10-31"
  },
  "totalUsers": 120,
  "totalRevenueVnd": 40000000,
  "monthlyPlans": [
    {
      "month": "2026-10",
      "created": 30,
      "confirmed": 12
    }
  ],
  "peakPlanningPeriod": {
    "from": "2026-10-01",
    "to": "2026-10-31",
    "createdPlans": 30
  }
}
```

🟥 Các analytics field này chưa có API. Ví dụ monthlyPlans chỉ minh họa 1 bucket; response thật phải đủ 12 bucket, kể cả tháng có 0. Feedback counts đã có `/admin/feedback/tickets`; không cần bịa API riêng cho số feedback nếu dùng được aggregate có sẵn.

User list request **đề xuất**:

```json
{
  "page": 1,
  "page_size": 20,
  "q": "nguyen",
  "status": "active",
  "sort_by": "created_at",
  "sort_order": "desc"
}
```

```json
{
  "items": [
    {
      "id": "user-id",
      "full_name": "Nguyễn An",
      "email": "user@example.com",
      "status": "active",
      "membership": "free",
      "created_at": "2026-10-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_records": 1
  },
  "membership_distribution": [
    {
      "membership": "free",
      "count": 1,
      "percentage": 100
    }
  ],
  "monthly_new_users": [
    {
      "month": "2026-10",
      "count": 1
    }
  ]
}
```

🟥 User admin list/detail/stats/mutation chưa có. Lock request tối thiểu user ID + status, reason nếu BE yêu cầu; cần role admin, confirm FE, audit actor/time phía BE. Password/hash/session/token không thuộc user detail response. Membership distribution có thể endpoint stats riêng; không tính donut từ một page users.

Revenue request/response **đề xuất**:

```json
{
  "from": "2026-01-01",
  "to": "2026-12-31",
  "granularity": "month",
  "page": 1,
  "page_size": 20
}
```

```json
{
  "currency": "VND",
  "totalRevenueVnd": 40000000,
  "series": [
    {
      "period": "2026-10",
      "revenueVnd": 5000000
    }
  ],
  "packageDistribution": [
    {
      "packageId": "plus",
      "revenueVnd": 30000000,
      "percentage": 75
    },
    {
      "packageId": "basic",
      "revenueVnd": 10000000,
      "percentage": 25
    }
  ],
  "transactions": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

🟥 Finance route chưa có. Chốt revenue gross/net/refund, timezone, day/week/month bucket boundaries. Preset/custom date phải cùng query; transaction list phân trang server, package share tổng scope không theo page. Rendering donut hoặc preset date synchronization là trách nhiệm FE, không quy thành API lỗi.

### M10. Subscription/billing

Hiện profile subscription đã bỏ mock và hiển thị unavailable. Cần current subscription/limits, package catalog và invoices/checkout capability nếu mở tính năng nâng cấp.

```json
{
  "subscription": {
    "planId": "free",
    "status": "active",
    "renewsAt": null
  },
  "usage": {
    "plansUsed": 2,
    "plansLimit": 10,
    "resetAt": "2026-11-01T00:00:00Z"
  },
  "invoices": {
    "items": [],
    "page": 1,
    "pageSize": 10,
    "total": 0
  }
}
```

Toàn bộ là 🟥 contract đề xuất. Chưa có provider/payment contract thì không bật checkout thành công giả. Booking khách sạn/vé/phương tiện nằm ngoài scope hiện tại.

### M11. Prompt injection / guardrail test

Input **đề xuất**:

```json
{
  "scenario_id": null,
  "prompt": "Một prompt kiểm thử do admin nhập",
  "configuration_version": "current"
}
```

```json
{
  "run_id": "safety-run-id",
  "status": "completed",
  "blocked": true,
  "response": "Không thể thực hiện yêu cầu này.",
  "reason": "Vi phạm chính sách bảo vệ chỉ dẫn hệ thống",
  "latency_ms": 1200,
  "guardrails": [
    {
      "name": "instruction-protection",
      "passed": true
    }
  ]
}
```

🟥 Scenario catalog + test runner chưa có. Dataset run không tự thay thế prompt injection test. Không expose system prompt/keys/private user context trong result. Admin có thể chọn scenario để fill prompt hoặc nhập tay; result phải là kết quả chạy thật.

### M12. Schema diagram, records CRUD và JSON batch

Đây là API mới cho quản trị dữ liệu thực thể, **không phải `/admin/content`**. BE nên cung cấp allowlist entities/schema, không cho browser gửi SQL/table name tùy ý để thực thi.

| Capability đề xuất | Input | Output cần |
|---|---|---|
| Entity/schema catalog | session admin | tables/entities, display names, field type/nullable/required, PK/FK relations, allowed actions. |
| Record list/detail | entity ID, q/sort/page/page_size, record ID | items + server pagination; record shape theo schema. |
| Create/update/delete | entity ID, record fields/ID; version nếu có | saved record hoặc confirmation; field errors/conflict. |
| Batch validate/review | entity ID, array objects | valid/invalid object indexes, field paths/reasons, preview counts. |
| Batch import sau confirm | validation reference hoặc records đã review | inserted/rejected counts, IDs, per-object errors, atomic/partial semantics rõ ràng. |

```json
{
  "entity": "places",
  "records": [
    {
      "name": "Địa điểm A",
      "destination_id": 1
    }
  ]
}
```

```json
{
  "validCount": 0,
  "invalidCount": 1,
  "errors": [
    {
      "index": 0,
      "field": "coordinates",
      "code": "REQUIRED",
      "message": "Thiếu tọa độ theo schema của entity."
    }
  ]
}
```

JSON này chỉ minh họa **contract lỗi từng object**, không khẳng định place schema hiện bắt buộc field `coordinates` như ví dụ. FE validate/review không thay validation BE. Trước import phải xác nhận, không bỏ qua object lỗi rồi gửi âm thầm; policy partial import cần chốt riêng nếu mở.

### M14. DNA provenance/analysis

GET/PUT `/api/v1/users/me/dna` hiện đã lưu/đọc metrics và preferences thủ công. GET raw có `signalSources=[]`, `summary=null` cố định; FE schema hiện chỉ đọc metrics/preferences/updatedAt, chưa render provenance thật.

Extension **đề xuất**:

```json
{
  "metrics": [
    {
      "key": "culture",
      "score": 80
    }
  ],
  "preferences": {
    "pace": "relaxed",
    "sceneryFocus": "heritage",
    "cuisinePriority": "local"
  },
  "signalSources": [
    {
      "id": "signal-id",
      "type": "chat",
      "label": "Ưu tiên di sản trong hội thoại",
      "createdAt": "2026-10-07T14:00:00Z"
    }
  ],
  "summary": "Ưu tiên văn hóa và nhịp độ nhẹ nhàng.",
  "updatedAt": "2026-10-07T14:00:00Z"
}
```

🟩 metrics/preferences/updatedAt. 🟧 signalSources/summary có key nhưng không pipeline dữ liệu. 🟥 Source item shape, chat/image derivation và kết hợp DNA chưa có. Account DNA và override của từng trip phải tách scope. Không bịa provenance từ manual slider.

### M15. Weather/safety dữ liệu đặc trưng địa điểm

Itinerary hiện có `weather`, `warnings`, activity notes/reason; weather provider đã lấy temperature/precipitation/probability. Không nói backend chưa có weather API. Nhưng source request forecast chưa lấy weather code để FE map icon chuẩn; chưa có structured địa điểm-specific health/safety advisory contract.

Extension **đề xuất**:

```json
{
  "place_id": 10,
  "date": "2026-11-01",
  "weather": {
    "status": "forecast",
    "condition_code": 61,
    "condition_scheme": "WMO",
    "temperature_c": 25,
    "precipitation_probability_pct": 70,
    "source": "weather-provider",
    "updated_at": "2026-10-31T10:00:00Z"
  },
  "advisories": [
    {
      "type": "safety",
      "severity": "caution",
      "title": "Đường trơn khi có mưa",
      "description": "Kiểm tra điều kiện trước khi di chuyển.",
      "source_url": "https://example.com/advisory",
      "valid_until": "2026-11-02"
    }
  ]
}
```

🟥 Structured fields trên chưa có contract hiện tại. Không fabricate health warning như dữ kiện đã xác minh; thời tiết ngoài horizon cần `unavailable/seasonality` được phân biệt với forecast. Không cần một route riêng nếu BE bổ sung vào itinerary/place detail phù hợp. Source citation place đã có `sources[].source_url`; đó không phải field `url` bị thiếu.

## 4. Những API đủ để FE nối hiện tại, nhưng vẫn cần runtime verification

| Flow | API hiện tại | Kết luận phù hợp |
|---|---|---|
| Health | `GET /health` | Evidence cũ HTTP/browser proxy 200; không phải API lỗi. |
| Email/password auth | `/api/v1/auth/register`, `/login`, `/me`, `/logout` | FE nối thật; anonymous me 401 đúng; chưa chạy authenticated production flow trong report này. |
| Profile basic | `GET/PATCH /api/v1/users/me` | Đủ basic fields đang mounted; avatar upload chưa có, không suy ra PATCH DOB/password cũng được hỗ trợ. |
| Manual DNA | `GET/PUT /api/v1/users/me/dna` | Đủ manual metrics/preferences; không đủ automatic DNA/provenance (M14). |
| Community list/filter | `GET /community/plans` | Có q/province/duration/tag/budget/liked filter, lọc trước pagination trong source; cần fixture dữ liệu thật để chứng minh kết quả đúng tất cả trang. |
| Community like/clone | `PUT /community/plans/{id}/like`, `POST /community/plans/{id}/clone` | FE nối thật, legacy response dùng đúng shape; authenticated mutation chưa kiểm chứng trên production. |
| Owned trip workspace | detail/chat/generate/preview/commit/budget/confirm/publication | FE nối thật và có proxy guards; các defect/extension ở E01–E04/M01–M04 vẫn cần BE giải quyết. |
| Place detail sources | `GET /places/{id}` | Đã dùng sources[].source_url/address/verified_at; record thiếu sources có thể do dữ liệu, không phải route thiếu. |
| Feedback create/list/reply/classify/rating | v1 user feedback và legacy admin feedback routes | FE nối thật, supported input có schema; chưa có evidence authenticated production mutations. Export PDF không cần BE API riêng. |
| CMS CRUD | `/admin/content` và collection/item routes | FE nối thật, lưu admin riêng; public propagation chưa đủ (E06). |

### Province mapping

- Public VN API: `https://provinces.open-api.vn/api/v2/` dùng catalog chính thức. BE catalog `/api/v1/catalog/provinces` trả `{id, slug, name}` theo destinations enabled.
- `/community/plans?province=...` source lọc bằng **`destinations.slug`**, không nhận official `name/code` tự động.
- FE đã có mapping/catalog adapter; không đánh dấu “thiếu slug hoàn toàn” như report trước khi backend catalog xuất hiện.
- Cần BE xác nhận tập tên/mã tỉnh chính thức → destination slug, gồm Huế/Quảng Bình/Ninh Bình/Hội An/Hà Nội/HCM và khác biệt tên địa danh so với đơn vị hành chính. Hội An không tự động tương đương một tỉnh; không yêu cầu tên tỉnh phải trùng nguyên văn slug.
- Test release: chọn tỉnh → request truyền slug đúng → tất cả trang chỉ còn plans đúng destination; unmatched phải báo không có mapping hoặc không có dữ liệu, không âm thầm bỏ filter. Nếu chỉ có dữ liệu rỗng hiện chưa chứng minh được kết quả này.

### URL/auth/CORS chưa thể kết luận lỗi deployment hiện tại

- Production backend được kiểm tra ở evidence trước: `https://vistra-backend-production.up.railway.app`; env là nguồn quyết định, không hard-code URL này vào service.
- Evidence cũ có local browser origin `http://localhost:3001` thiếu ACAO, trong khi request với production origin `https://c4-app-103.vercel.app` có ACAO khớp và credentials. Đây là **snapshot cũ theo origin**, không khẳng định production CORS hiện đang lỗi.
- Cần kiểm chứng lại deployed revision/current env nếu browser còn lỗi; HTTP CLI 200 không chứng minh browser CORS/cookie dùng được.
- Protected APIs vẫn đi qua session proxy để giữ HttpOnly/SSR guard. Nếu chuyển browser direct, phải chốt cookie cross-site/SameSite/Secure và SSR session strategy; không sửa URL riêng lẻ rồi giả định auth hoạt động.
- Legacy routes phụ thuộc optional `X-API-Key` nếu BE bật `api_token`; browser FE không được chứa secret này. BE cần xác nhận cơ chế session/server credential cho các route đang dùng. Hiện chưa có evidence cho kết luận chúng đã fail vì API key trên production.

## 5. Checklist backend để đóng report

1. Ưu tiên owner authorization tại backend và atomic version checks (E01–E04); xác nhận guest ownership policy. Kiểm thử cả gọi trực tiếp BE và qua FE proxy.
2. Sửa card dates/updated timestamp (E05); kiểm thử trip 1 ngày và nhiều ngày, edit/revision/publish timestamp.
3. Nối CMS vào public landing/allergies, ảnh/active/order, tạo intro từ CMS rỗng (E06). Không xử lý bằng nhập thêm seed vào nguồn public đang bỏ qua CMS.
4. Chốt recommendations criteria/calendar/DNA/plan detail (E07/M05); public detail phải lọc dữ liệu riêng tư.
5. Implement evaluation runner/results và dataset detail; công bố worker nếu nằm ngoài repo (E08). Chốt metrics/trace ingestion và filter contract (E09–E10).
6. Chốt extensions constraints, image/DNA, transport, chat history và my-trips filters (E11/M01–M06/M14–M15). Giữ disabled capability chưa đủ; không silently accept rồi ignore.
7. Bổ sung APIs admin analytics/users/revenue/subscription/safety/entity/media còn thiếu (M07–M13), phân trang server cho list và aggregation theo toàn scope.
8. Gửi lại mỗi API: method/path, auth, query/body schema, example success/error JSON, nullable semantics, field units/timezone, deployed revision và test evidence. FE sẽ cập nhật constants/types/schema/service/UI theo contract đã chốt.

### Evidence và nguồn đối chiếu

- Source chính: [backend routes](../../../../../backend/src/main.py), [request models](../../../../../backend/src/models.py), [planner](../../../../../backend/src/planner.py), [weather provider](../../../../../backend/src/tools/weather.py).
- Frontend: [endpoint constants](../../../../src/constants/endpoints.ts), [discovery constants](../../../../src/constants/discoveryEndpoints.ts), [trip service](../../../../src/services/tripService.ts), [destination service](../../../../src/services/destinationService.ts), [content types](../../../../src/types/contentApi.ts), [session proxy](../../../../src/app/api/backend/[...path]/route.ts).
- [Báo cáo bỏ mock/nối backend](../../backend-only-ui/2026-10-07_20-14-50/report.md): bằng chứng URL/HTTP/CORS trước đó, không dùng phần planner gate cũ làm kết luận hiện tại.
- [Báo cáo planner/trip-plan follow-up](../../planner-trip-plan-api/2026-10-07_20-55-05/report.md): supersede trạng thái planner chưa nối của report trước.
- [Runtime checks gần nhất của implementation](../../../evidence/playwright/2026-10-07_20-55-05/runtime-checks.json): health 200, anonymous auth/private 401; không có authenticated mutation proof.
- [Field-gap report trước đó](../../ui-first-api-handoff/2026-10-07/api-field-gap-report-phase-current.md): tham khảo rộng hơn về UI intent. Không coi mọi payload/endpoint đề xuất trong tài liệu này là API đang mounted hoặc đã tồn tại.

Report này dựa trên source hiện tại và evidence đã có; không chạy thêm build, authenticated runtime hoặc production mutation chỉ để lập tài liệu. Không có source implementation bị sửa trong lượt tạo report.

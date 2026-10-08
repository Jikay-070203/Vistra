# VISTRA — Report field gap của các API đã có route (scope hiện tại)

Ngày review: **07/10/2026**. Vai trò: PM/BA. Đối chiếu tĩnh request model, route/helper và JSON UI yêu cầu; **không gọi API thật, không xác nhận deployment hoặc tích hợp UI**.

## 1. Scope đã điều chỉnh theo quyết định của team

| Mã FE | Quyết định hiện tại | Cách áp dụng trong report |
|---|---|---|
| API-08, API-32 | Demo; up-scope phase sau | Không giao API/field gói dịch vụ, hóa đơn, doanh thu trong đợt này. |
| API-13 | Conflict ý tưởng; tạm skip | Không yêu cầu thực thi phân tích DNA. Lưu điểm DNA do người dùng chọn/nhập sẵn vào trip là dữ liệu form riêng, nếu vẫn nằm trong scope UI. |
| API-29 | Dashboard lấy từ các API khác | Không yêu cầu endpoint tổng quan riêng. Counts của phản hồi có thể dùng cho badge; cần khóa mapping nguồn cho các phần dashboard còn lại. |
| API-30, API-31, API-48–54 | Tạm skip | Không đưa vào backlog field gap hoặc yêu cầu phát triển lần này. |
| API-58–62 | Đang chờ chốt luồng từ tài liệu FE | Không mở thêm yêu cầu trong report chỉ dành cho route hiện có này. |

**44 yêu cầu FE còn lại được đối chiếu.** Bao gồm cả các dòng đã đáp ứng để tránh giao bổ sung nhầm. Một yêu cầu FE có thể dùng nhiều route BE; không buộc tạo endpoint mới hoặc giữ nguyên tên route đề xuất.

### Căn cứ

- [JSON UI mong muốn — ui-first-api-handoff.md](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:1).
- [api_docs.md cập nhật](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/docs/api/api_docs.md:1): chỉ dùng làm chỉ dẫn route; trạng thái field được kiểm tra lại trong source.
- [main.py:891](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:891), [models.py:94](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:94), [planner.py:52](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/planner.py:52), [agents/orchestrator.py:28](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/agents/orchestrator.py:28) và các helper/source dẫn ngay trong từng mục.
- Các JSON dưới là **mẫu FE mong muốn**, không phải dữ liệu production hoặc response đã gọi được. ID/tiền/ảnh/điểm minh họa không bắt Backend trả đúng giá trị mẫu.

## 2. Quy ước đánh dấu

| Dấu | Ý nghĩa | Hướng xử lý |
|---|---|---|
| 🟩 | Có field và xử lý cùng ý nghĩa trong source đã đọc | Giữ và xác minh khi nối UI. Không đồng nghĩa đã kiểm thử runtime. |
| 🟨 | Có nguồn tương đương nhưng lệch tên/cấu trúc/kiểu/enum, validation hoặc chưa bảo đảm schema | Chốt mapper/contract hoặc bổ sung phần thiếu; không tự coi là cần API mới. |
| 🟥 | Không nhận/không lưu/không trả, trả rỗng/null cố định, hoặc sai ý nghĩa | Backend bổ sung dữ liệu/xử lý, hoặc hai đội chấp thuận trạng thái unavailable/phạm vi demo. |
| ⬜ | FE tính/định dạng được, hoặc đã defer theo quyết định mới | Không giao Backend thêm field/thuật toán chỉ để giống giá trị mẫu. |

**Đọc chính xác:** field được schema nhận không có nghĩa đã lưu hoặc áp dụng; field có key nhưng luôn null/[] không đủ cho UI có dữ liệu. Mảng rỗng vì chưa có bản ghi thật có thể hợp lệ; report chỉ đánh đỏ khi handler cố định rỗng hoặc không hydrate các bản ghi đã lưu.

### Những quy ước chung chưa khớp

| Nội dung | Đánh dấu | Hiện tại / xử lý |
|---|---|---|
| Envelope `data` của FE | 🟨 | BE thường trả object thẳng hoặc wrapper `user/profile/item/ticket/dataset`. Chốt một convention hoặc FE mapper. Không đánh mọi field là thiếu chỉ vì wrapper khác. |
| `path/query/body` trong mẫu request | ⬜ | Đây là mô tả request, không gửi nguyên wrapper làm body. GET không có JSON body; query/path được ghi riêng vì UI cần bộ lọc. |
| camelCase ↔ snake_case | 🟨 | Phải map trước gửi. `StrictModel(extra=forbid)` trả 422 cho field dư; route `payload:dict` có thể nhận nhưng bỏ qua field không xử lý. |
| Error JSON | 🟨 | Có HTTP 401/403/404/409/422; shape đang gồm `detail:string`, `detail:{code,message}` hoặc lỗi Pydantic. Chưa có projection ổn định `error.code/message/fieldErrors/currentVersion` như FE. Xem [FE errors](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:6413). |
| Null/unavailable | 🟨 | Giá/weather/score không có nguồn thì không bịa. Chốt `status/basis/asOf/reason` và UI empty state; không biến null cố định thành “API đã đáp ứng”. |
| Quyền và version | 🟥 ở những route nêu riêng | GET detail/chat v1 chưa dùng session/owner; action phải kiểm tra version thật. Permission DTO không thay được enforcement server. |

<a id="ma-tran-plan"></a>

## 3. Ma trận Plan dùng chung

Áp dụng cho response **API-14, API-15, API-16, API-17, API-18, API-19**. Các field được so với dữ liệu **GET detail hiện có** và planner; ma trận này **không khẳng định mọi action đã trả Plan hoặc đã lưu thay đổi**. Xem ghi chú riêng từng route.

JSON đầy đủ: [mẫu Plan ở cuối report](#plan-json). 113 field được liệt kê một lần. Ngày trống vẫn phải hiện trong mảng days; không chỉ nhóm những activity đã tồn tại.

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟩 | trip.id | Có dữ liệu tương ứng; source-only. |
| `data.documentCode` | string | ⬜ | trip.id + quy ước VST-… | Mã trình bày có thể FE tạo; UUID không bắt buộc giống mã ví dụ. |
| `data.version` | number | 🟨 | current_version hoặc itinerary.version | Đổi tên; action phải dùng version mới sau commit. |
| `data.title` | string | 🟥 | request.title không nhận/lưu qua TripCreate | Chưa có tên hành trình ổn định. |
| `data.status` | string | 🟩 | trips.status | Có dữ liệu tương ứng; source-only. |
| `data.isPublished` | boolean | 🟨 | trips.is_published: 0/1 | Đổi tên/chuyển boolean; public/private cần kiểm tra quyền. |
| `data.lastUpdated` | string | 🟥 | Chỉ trips.created_at | Chưa cập nhật thời điểm sau chat, revision, ràng buộc, confirm/publication. |
| `data.destination.id` | string | 🟨 | destination_id | Có DB ID; chốt ID thống nhất với catalog/recommendation. |
| `data.destination.name` | string | 🟨 | Catalog destinations.display_name | Có ở catalog nhưng detail chưa hydrate; có thể compose/mapping. |
| `data.destination.provinceCode` | number | 🟥 | Không có catalog code tỉnh chuẩn | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.origin` | string | 🟥 | request.origin coordinates\|null | FE cần tên xuất phát; chưa resolve defaultOrigin hồ sơ vào plan. |
| `data.coverImage` | string | 🟥 | Không có | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.summary` | string | 🟥 | Không có | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.startDate` | string | 🟨 | request.start_date | Đổi cấu trúc. |
| `data.endDate` | string | ⬜ | start_date + days - 1 | Ngày kết thúc có thể derive chính xác. |
| `data.duration.days` | number | ⬜ | request.days | FE tính days/nights/label. |
| `data.duration.nights` | number | ⬜ | request.days | FE tính days/nights/label. |
| `data.duration.label` | string | ⬜ | request.days | FE tính days/nights/label. |
| `data.datesLabel` | string | ⬜ | start/end | FE format. |
| `data.travelers.adults` | number | 🟥 | people chỉ là tổng | Chưa lưu nhóm tuổi. |
| `data.travelers.elderly` | number | 🟥 | people chỉ là tổng | Chưa lưu nhóm tuổi. |
| `data.travelers.children` | number | 🟥 | people chỉ là tổng | Chưa lưu nhóm tuổi. |
| `data.travelers.total` | number | 🟨 | request.people | Có tổng, nhưng chưa đủ nhóm tuổi. |
| `data.travelers.label` | string | ⬜ | travelers từng nhóm sau khi có dữ liệu | FE format; hiện thiếu nhóm tuổi nên chưa render chính xác. |
| `data.pace` | string | 🟨 | request.pace | Map enum/label; chốt giữ nguyên lựa chọn. |
| `data.budget.min` | number | 🟥 | request.budget_vnd chỉ 1 mức | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.budget.max` | number | 🟨 | request.budget_vnd | Chốt đây là trần và nhóm/người. |
| `data.budget.estimatedTotal` | number | 🟨 | itinerary.budget.known_max_vnd + complete | Có tổng phần biết giá, không phải tổng đầy đủ nếu complete=false. Không thay unknown bằng 0. |
| `data.budget.currency` | string | ⬜ | VND | Quy ước. |
| `data.budget.basis` | string | 🟨 | request.budget_scope | Map total→group_total. |
| `data.request.provinceCode` | number | 🟥 | destination: slug | Có nơi đến theo slug, chưa có code/name tỉnh và mapping chuẩn. |
| `data.request.startDate` | string | 🟨 | start_date | Đổi tên, kiểu date. |
| `data.request.endDate` | string | ⬜ | request.start_date + days - 1 | Có thể tính nhưng request DTO chưa chuẩn hóa. |
| `data.request.travelers.adults` | number | 🟥 | request.people | Không giữ nhóm tuổi. |
| `data.request.travelers.elderly` | number | 🟥 | request.people | Không giữ nhóm tuổi. |
| `data.request.travelers.children` | number | 🟥 | request.people | Không giữ nhóm tuổi. |
| `data.request.budget.min` | number | 🟥 | budget_vnd: int | Chỉ một mức ngân sách, không giữ min. |
| `data.request.budget.max` | number | 🟨 | budget_vnd | Có một trần; phải thống nhất group_total→budget_scope=total và vẫn bổ sung min. |
| `data.request.budget.currency` | string | ⬜ | VND theo quy ước | FE/API cố định VND; không cần field riêng nếu quy ước rõ. |
| `data.request.budget.basis` | string | 🟨 | budget_scope | group_total→total, per_person→per_person; giữ cùng cơ sở tính. |
| `data.request.allergies.optionIds[]` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `data.request.allergies.customEntries[]` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `data.request.fitnessLevel` | number | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `data.request.pace` | string | 🟨 | pace: relaxed/normal/busy | Cần map slow/balanced/fast và nhãn Planner; không gửi slow trực tiếp. |
| `data.request.narrative` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `data.request.inspirationImageIds[]` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `data.request.dnaWeights[].key` | string | 🟥 | interests[] chỉ là kind | Thiếu lưu trọng số nhập/chọn sẵn. Báo cáo không yêu cầu chạy API-13 đang skip. |
| `data.request.dnaWeights[].score` | number | 🟥 | interests[] chỉ là kind | Thiếu lưu trọng số nhập/chọn sẵn. Báo cáo không yêu cầu chạy API-13 đang skip. |
| `data.request.destinationId` | string | 🟨 | destination | Có lựa chọn destination slug; cần mapping ID recommendation và mã tỉnh. |
| `data.days[].id` | string | ⬜ | trip.id + day number | Định danh ngày có thể tạo ổn định. |
| `data.days[].dayNumber` | number | 🟨 | itinerary.activities[].day | Nhóm theo ngày; phải bổ sung cả ngày trống từ request.days. |
| `data.days[].dayOfWeek` | string | ⬜ | Ngày + timezone | FE format. |
| `data.days[].date` | string | ⬜ | start_date + dayNumber - 1 | FE hoặc DTO tính. |
| `data.days[].title` | string | 🟥 | Không có | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.days[].pace` | string | 🟨 | request.pace | Chỉ pace toàn chuyến; nếu khác từng ngày phải chốt. |
| `data.days[].paceLabel` | string | ⬜ | pace enum đã chốt | FE label. |
| `data.days[].highlight` | string | 🟥 | Không có | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.days[].weather.summary` | string | 🟥 | Provider hiện chỉ gọi temperature/precipitation | Thiếu humidity/cloud/UV/wind/summary theo UI; không thay bằng mock. |
| `data.days[].weather.temperatureC` | number | 🟨 | itinerary.weather.hourly.temperature_2m | Có khi forecast khả dụng; cần aggregate đúng ngày/khung giờ, không tự suy seasonal. |
| `data.days[].weather.temperatureMinC` | number | 🟨 | hourly.temperature_2m | Aggregate min ngày khi có forecast. |
| `data.days[].weather.temperatureMaxC` | number | 🟨 | hourly.temperature_2m | Aggregate max ngày khi có forecast. |
| `data.days[].weather.humidityPercent` | number | 🟥 | Provider hiện chỉ gọi temperature/precipitation | Thiếu humidity/cloud/UV/wind/summary theo UI; không thay bằng mock. |
| `data.days[].weather.cloudProbabilityPercent` | number | 🟥 | Provider hiện chỉ gọi temperature/precipitation | Thiếu humidity/cloud/UV/wind/summary theo UI; không thay bằng mock. |
| `data.days[].weather.uvIndex` | number | 🟥 | Provider hiện chỉ gọi temperature/precipitation | Thiếu humidity/cloud/UV/wind/summary theo UI; không thay bằng mock. |
| `data.days[].weather.uvLabel` | string | 🟥 | Provider hiện chỉ gọi temperature/precipitation | Thiếu humidity/cloud/UV/wind/summary theo UI; không thay bằng mock. |
| `data.days[].weather.windDescription` | string | 🟥 | Provider hiện chỉ gọi temperature/precipitation | Thiếu humidity/cloud/UV/wind/summary theo UI; không thay bằng mock. |
| `data.days[].weather.basis` | string | 🟨 | weather.type/source/scope | Có forecast/unavailable; chưa seasonal_estimate theo FE sample. |
| `data.days[].weather.asOf` | string | 🟨 | weather.updated_at khi available | Unavailable chưa có updated_at; cần thời điểm kiểm tra và reason. |
| `data.days[].activities[].id` | string | 🟨 | place_id | Có thể map stable ID từ plan+place với invariant hiện chỉ dùng place một lần; chốt mapper cho kéo thứ tự, không dùng index. |
| `data.days[].activities[].isTransit` | boolean | ⬜ | activities + route_legs | FE/DTO phân biệt activity/transit. |
| `data.days[].activities[].timeStart` | string | 🟨 | start_at ISO | Trích HH:mm đúng timezone. |
| `data.days[].activities[].timeEnd` | string | 🟨 | end_at ISO | Trích HH:mm đúng timezone. |
| `data.days[].activities[].category` | string | 🟨 | kind | Map enum sang label. |
| `data.days[].activities[].location` | string | 🟨 | name | Có tên place; chốt nhãn địa điểm. |
| `data.days[].activities[].title` | string | 🟨 | name | Tên place có sẵn; nếu title trải nghiệm riêng cần nguồn nội dung. |
| `data.days[].activities[].description` | string | 🟨 | reason | Có lý do xếp lịch; chưa mô tả trải nghiệm giàu nội dung như UI. |
| `data.days[].activities[].notes` | string | 🟨 | notes[] + warnings[] | Nối notes hoặc giữ array; global warnings chưa được projection rõ. |
| `data.days[].activities[].tags[]` | string | 🟥 | kind không phải tags/vibe trải nghiệm | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.days[].activities[].coordinates.lat` | number | 🟨 | latitude | Đổi tên/cấu trúc. |
| `data.days[].activities[].coordinates.lng` | number | 🟨 | longitude | Đổi tên/cấu trúc. |
| `data.days[].activities[].transit.fromActivityId` | string | 🟨 | route_legs[].from_place_id | Chốt stable activity ID mapper; inbound from_place_id=null có thể hợp lệ. |
| `data.days[].activities[].transit.toActivityId` | string | 🟨 | route_legs[].to_place_id | Chốt mapper. |
| `data.days[].activities[].transit.type` | string | 🟨 | route_legs[].transport=car | Map label; không giao routing mode mới theo scope hiện tại. |
| `data.days[].activities[].transit.durationMinutes` | number | 🟨 | route_legs[].duration_min | Có thời gian ước tính, không live traffic. |
| `data.days[].activities[].transit.distanceKm` | number | 🟨 | route_legs[].distance_km | Đổi tên. |
| `data.days[].activities[].transit.description` | string | ⬜ | Tên điểm đầu/cuối | FE format sau khi map đủ stop. |
| `data.chatMessages[].id` | string | 🟥 | Không lưu messages/conversation | Không phục hồi hội thoại sau refresh. |
| `data.chatMessages[].sender` | string | 🟥 | Không lưu messages/conversation | Không phục hồi hội thoại sau refresh. |
| `data.chatMessages[].timestamp` | string | 🟥 | Không lưu messages/conversation | Không phục hồi hội thoại sau refresh. |
| `data.chatMessages[].text` | string | 🟥 | Không lưu messages/conversation | Không phục hồi hội thoại sau refresh. |
| `data.chatMessages[].affectedChange` | string | 🟥 | Không lưu messages/conversation | Không phục hồi hội thoại sau refresh. |
| `data.sources[].id` | string | 🟨 | activities[].sources[].id | Có nguồn place; cần gom/khử trùng lặp. |
| `data.sources[].type` | string | 🟨 | Nguồn place/weather/route khác shape | Chốt taxonomy, không gán loại suy đoán. |
| `data.sources[].title` | string | 🟨 | activities[].sources[].name hoặc weather.source | Có tên nguồn, gom thành DTO. |
| `data.sources[].snippet` | string | 🟥 | Không có trích đoạn ngắn | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.sources[].authorOrDomain` | string | ⬜ | name hoặc URL hostname | FE format nếu đủ nguồn. |
| `data.sources[].url` | string | 🟨 | place source_url/weather.source_url | Có URL nguồn, không nhầm license_url thành URL dẫn chứng. |
| `data.costBreakdown[].category` | string | 🟨 | itinerary.budget.categories keys | Có transport/food/stay/tickets/other; map label. |
| `data.costBreakdown[].amount` | number | 🟨 | category.min_vnd/max_vnd + unknown_items | Chốt một basis tính nhất quán; có unknown phải hiển thị incomplete. |
| `data.costBreakdown[].detail` | string | 🟥 | Chưa mô tả khoản mục | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.costBreakdown[].percentage` | number | ⬜ | amount / tổng đủ và cùng basis | FE tính; không tính từ tổng thiếu rồi gọi đầy đủ. |
| `data.transportRecommendation.vehicleLabel` | string | 🟥 | Chỉ leg car facts | Chưa khuyến nghị xe tổng thể, durationEstimate/terrainDescription. |
| `data.transportRecommendation.durationEstimate` | string | 🟥 | Chỉ leg car facts | Chưa khuyến nghị xe tổng thể, durationEstimate/terrainDescription. |
| `data.transportRecommendation.terrainDescription` | string | 🟥 | Chỉ leg car facts | Chưa khuyến nghị xe tổng thể, durationEstimate/terrainDescription. |
| `data.transportRecommendation.isBooking` | boolean | ⬜ | false theo scope | Không booking. |
| `data.climateGuide.temperatureRange` | string | 🟥 | Có route seasonality riêng | Chưa projection hướng dẫn khí hậu/trang phục; có thể dùng dữ liệu lịch sử sau khi chốt basis. |
| `data.climateGuide.climateLabel` | string | 🟥 | Có route seasonality riêng | Chưa projection hướng dẫn khí hậu/trang phục; có thể dùng dữ liệu lịch sử sau khi chốt basis. |
| `data.climateGuide.description` | string | 🟥 | Có route seasonality riêng | Chưa projection hướng dẫn khí hậu/trang phục; có thể dùng dữ liệu lịch sử sau khi chốt basis. |
| `data.climateGuide.clothingTips[]` | string | 🟥 | Có route seasonality riêng | Chưa projection hướng dẫn khí hậu/trang phục; có thể dùng dữ liệu lịch sử sau khi chốt basis. |
| `data.localTips` | string | 🟥 | Không có | Thiếu dữ liệu hoặc projection tương ứng. |
| `data.access.canEdit` | boolean | 🟥 | GET detail chưa kiểm tra session/owner/public | Chưa enforce quyền và trả quyền UI; không gửi canEdit=true cho mọi người. |
| `data.access.canConfirm` | boolean | 🟥 | GET detail chưa kiểm tra session/owner/public | Chưa enforce quyền và trả quyền UI; không gửi canEdit=true cho mọi người. |
| `data.access.canPublish` | boolean | 🟥 | GET detail chưa kiểm tra session/owner/public | Chưa enforce quyền và trả quyền UI; không gửi canEdit=true cho mọi người. |

### Lưu ý quyết định đối với Plan

- `endDate/duration/datesLabel/dayOfWeek/percentage` có thể tính ở FE từ dữ liệu số/ngày chuẩn; không cần thêm cột DB để lưu label.
- `budget.estimatedTotal/costBreakdown.amount` phải chỉ rõ `complete` và basis khi có giá chưa biết. Tổng khoản mục cùng basis phải nhất quán; không xem giá chưa biết là 0.
- Provider weather hiện có forecast trong cửa sổ ngắn hoặc unavailable; request tháng tới không mặc nhiên có forecast. Nếu dùng lịch sử theo mùa, phải ghi rõ basis và ngày nguồn.
- Stable activity ID có thể là mapping xác định từ plan + place dưới invariant hiện tại không lặp place; không dùng index mảng làm ID sau kéo thứ tự. Nếu cần nhiều lần ghé cùng place, hai đội phải chốt identity khác.
- Nguồn đang nằm dưới activity/weather/route; có thể gom thành một projection. License URL khác URL dẫn chứng; snippet chưa có.
- Không yêu cầu API routing theo phương tiện/traffic/booking mới. Report chỉ chỉ ra dữ liệu route/stop đang có và dữ liệu UI thực sự thiếu.

## 4. Index các API đã đối chiếu

| Mã FE | UI | Route BE hiện có | Kết quả bảng riêng | Chi tiết |
|---|---|---|---|---|
| API-01 | /login; /admin/login → /login | `POST /api/v1/auth/login` | Không thiếu ở bảng riêng; 2 field cần map/chốt | [Xem field](#api-01) |
| API-02 | /register | `POST /api/v1/auth/register` | 1 field thiếu; 6 field cần map/chốt | [Xem field](#api-02) |
| API-03 | Navbar; /profile; toàn bộ khu vực cần đăng nhập | `GET /api/v1/auth/me + GET /api/v1/users/me` | 1 field thiếu; 3 field cần map/chốt | [Xem field](#api-03) |
| API-04 | Sidebar của toàn bộ /admin/* | `POST /api/v1/auth/logout` | Không thiếu ở bảng riêng; 1 field cần map/chốt | [Xem field](#api-04) |
| API-05 | /profile → Thông tin cá nhân | `PATCH /api/v1/users/me` | 1 field thiếu; 5 field cần map/chốt | [Xem field](#api-05) |
| API-06 | /profile → Travel DNA; giá trị mặc định cho /create-trip | `GET /api/v1/users/me/dna` | 7 field thiếu; 2 field cần map/chốt | [Xem field](#api-06) |
| API-07 | /profile → Áp dụng cập nhật DNA | `PUT /api/v1/users/me/dna` | 8 field thiếu; 4 field cần map/chốt | [Xem field](#api-07) |
| API-09 | / → Carousel, Bạn muốn đi đâu? | `GET /api/v1/public/landing` | 13 field thiếu; 6 field cần map/chốt | [Xem field](#api-09) |
| API-10 | /create-trip → Tỉnh du lịch; /community → bộ lọc tỉnh; /admin/content → liên kết tỉnh | `GET /api/v1/catalog/provinces` | 1 field thiếu; 1 field cần map/chốt | [Xem field](#api-10) |
| API-11 | /create-trip → Moodboard, + Thêm ảnh | `GET /api/v1/catalog/moodboard` | 4 field thiếu; 0 field cần map/chốt | [Xem field](#api-11) |
| API-12 | /create-trip → Dị ứng ẩm thực | `GET /api/v1/catalog/allergies` | Không thiếu ở bảng riêng; 2 field cần map/chốt | [Xem field](#api-12) |
| API-14 | /create-trip → Bắt đầu hội thoại; /destinations → Chọn | `POST /api/v1/trips (+ generate_itinerary)` | Có gap; xem Plan chung + hành vi route | [Xem field](#api-14) |
| API-15 | /planner; /trip-plan; /my-trips; /community → xem hồ sơ | `GET /api/v1/trips/{trip_id}` | Có gap; xem Plan chung + hành vi route | [Xem field](#api-15) |
| API-16 | /planner → Đổi ràng buộc; /create-trip → tiếp tục bản nháp | `PATCH /api/v1/trips/{trip_id}` | Có gap; xem Plan chung + hành vi route | [Xem field](#api-16) |
| API-17 | /planner → Hội thoại cùng Vistra | `POST /api/v1/trips/{trip_id}/chat` | 4 field thiếu; 3 field cần map/chốt | [Xem field](#api-17) |
| API-18 | /planner → kéo/đổi thứ tự điểm dừng trong ngày | `POST /trips/{trip_id}/revisions/preview → /commit` | Có gap; xem Plan chung + hành vi route | [Xem field](#api-18) |
| API-19 | /planner → Xác nhận chốt; /trip-plan → Chốt bản nháp | `POST /trips/{trip_id}/confirm` | Có gap; xem Plan chung + hành vi route | [Xem field](#api-19) |
| API-20 | /trip-plan → Xuất bản/Gỡ khỏi cộng đồng | `PATCH /trips/{trip_id}/publication` | 1 field thiếu; 3 field cần map/chốt | [Xem field](#api-20) |
| API-21 | /my-trips; /profile → thống kê, Nhật ký hành trình | `GET /api/v1/trips/me` | 17 field thiếu; 6 field cần map/chốt | [Xem field](#api-21) |
| API-22 | /community; / → Xem cùng vùng/Bạn muốn đi đâu? | `GET /api/v1/community/trips` | 16 field thiếu; 10 field cần map/chốt | [Xem field](#api-22) |
| API-23 | /community → Thích/Bỏ thích | `POST /api/v1/community/trips/{trip_id}/like` | Không thiếu ở bảng riêng; 4 field cần map/chốt | [Xem field](#api-23) |
| API-24 | /community → Tái sử dụng; sau đó /planner | `POST /api/v1/community/trips/{trip_id}/fork` | 12 field thiếu; 3 field cần map/chốt | [Xem field](#api-24) |
| API-25 | /destinations → 5 thẻ; Chi tiết; So sánh 2–3 điểm đến | `GET /api/v1/destinations/recommendations (+ detail)` | 42 field thiếu; 3 field cần map/chốt | [Xem field](#api-25) |
| API-26 | Nút Phản hồi & Báo lỗi trên website | `POST /api/v1/feedback` | 4 field thiếu; 6 field cần map/chốt | [Xem field](#api-26) |
| API-27 | /profile → Phản hồi của tôi; danh sách và chi tiết | `GET /api/v1/feedback/me` | 3 field thiếu; 6 field cần map/chốt | [Xem field](#api-27) |
| API-28 | /profile → Đánh giá câu trả lời hỗ trợ | `POST /api/v1/feedback/{ticket_id}/rating` | Không thiếu ở bảng riêng; 2 field cần map/chốt | [Xem field](#api-28) |
| API-33 | /admin/feedback → KPI, hộp thư, chi tiết; sidebar badge | `GET /api/v1/admin/feedback` | 8 field thiếu; 13 field cần map/chốt | [Xem field](#api-33) |
| API-34 | /admin/feedback → Phân loại hoặc thay đổi trạng thái | `PATCH /api/v1/admin/feedback/{ticket_id}` | 3 field thiếu; 8 field cần map/chốt | [Xem field](#api-34) |
| API-35 | /admin/feedback → Gửi trả lời chính thức | `POST /api/v1/admin/feedback/{ticket_id}/replies` | 3 field thiếu; 7 field cần map/chốt | [Xem field](#api-35) |
| API-36 | /admin/system → Trace Logs; /admin → Xem tất cả | `GET /api/v1/admin/traces` | 2 field thiếu; 8 field cần map/chốt | [Xem field](#api-36) |
| API-37 | /admin/system → modal chi tiết trace; link traceId từ /admin | `GET /api/v1/admin/traces/{trace_id}` | Không thiếu ở bảng riêng; 6 field cần map/chốt | [Xem field](#api-37) |
| API-38 | /admin/system → Trạng thái API, nút Kiểm tra | `GET /health` | Đủ/nghiệp vụ đáp ứng; FE xử lý trình bày | [Xem field](#api-38) |
| API-39 | /admin/system → 4 KPI và 2 nhóm Benchmark | `GET /api/v1/admin/system/metrics` | 23 field thiếu; 1 field cần map/chốt | [Xem field](#api-39) |
| API-40 | /admin/content → Intro/Hero/Dị ứng, bảng và form chỉnh sửa | `GET /admin/content` | Không thiếu ở bảng riêng; 12 field cần map/chốt | [Xem field](#api-40) |
| API-41 | /admin/content → sửa/bật/tắt thẻ Intro; / → điểm đến nổi bật | `PATCH /admin/content/intro-destinations/{item_id}` | Không thiếu ở bảng riêng; 11 field cần map/chốt | [Xem field](#api-41) |
| API-42 | /admin/content → Thêm kế hoạch Hero; / → Carousel | `POST /admin/content/hero-plans` | 2 field thiếu; 10 field cần map/chốt | [Xem field](#api-42) |
| API-43 | /admin/content → sửa/bật/tắt kế hoạch Hero | `PATCH /admin/content/hero-plans/{item_id}` | 2 field thiếu; 12 field cần map/chốt | [Xem field](#api-43) |
| API-44 | /admin/content → xóa kế hoạch Hero | `DELETE /admin/content/hero-plans/{item_id}` | Không thiếu ở bảng riêng; 1 field cần map/chốt | [Xem field](#api-44) |
| API-45 | /admin/content → Thêm dị ứng; /create-trip → danh mục | `POST /admin/content/allergy-options` | Không thiếu ở bảng riêng; 3 field cần map/chốt | [Xem field](#api-45) |
| API-46 | /admin/content → sửa/bật/tắt mục dị ứng | `PATCH /admin/content/allergy-options/{item_id}` | Không thiếu ở bảng riêng; 5 field cần map/chốt | [Xem field](#api-46) |
| API-47 | /admin/content → xóa mục dị ứng | `DELETE /admin/content/allergy-options/{item_id}` | Không thiếu ở bảng riêng; 1 field cần map/chốt | [Xem field](#api-47) |
| API-55 | /admin/system → Golden Dataset, tìm/chọn bộ, modal testcase | `GET /admin/evaluation/datasets + GET /admin/evaluation/runs/{run_id}` | 8 field thiếu; 0 field cần map/chốt | [Xem field](#api-55) |
| API-56 | /admin/system → Tạo/Nạp bộ Golden Dataset | `POST /admin/evaluation/datasets` | 9 field thiếu; 6 field cần map/chốt | [Xem field](#api-56) |
| API-57 | /admin/system → Chạy kiểm thử Golden Dataset | `POST /admin/evaluation/runs → GET /admin/evaluation/runs/{run_id}` | 8 field thiếu; 5 field cần map/chốt | [Xem field](#api-57) |

Các số field ở index là bảng riêng từng API, không phải số endpoint. Với Plan, dùng mục 3 để tránh đếm cùng một gap nhiều lần.

## 5. Request/response từng API

<a id="api-01"></a>

### API-01 — /login; /admin/login → /login

- **FE mong muốn:** `POST /api/v1/auth/login`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:36).
- **BE đối chiếu:** `POST /api/v1/auth/login` — [main.py:900](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:900) · [models.py:22](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:22) · [main.py:193](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:193).
- **Kết luận:** Login và cookie đã có. permissions/redirectPath có thể giải quyết bằng bảng role/mapping FE; không cần API admin login riêng.

#### Request mong muốn

```json
{
  "body": {
    "email": "minhan.demo@gmail.com",
    "password": "ExampleOnly_123!"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.email` | string | 🟩 | email | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.password` | string | 🟩 | password | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "user": {
      "id": "USR-101",
      "fullName": "Nguyễn Minh An",
      "email": "minhan.demo@gmail.com",
      "role": "traveler",
      "permissions": [
        "trip:create",
        "trip:update:own",
        "feedback:create"
      ]
    },
    "redirectPath": "/my-trips"
  },
  "message": "Đăng nhập thành công."
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.user.id` | string | 🟩 | user.id | Có field và xử lý tương ứng trong source. |
| `data.user.fullName` | string | 🟨 | user.full_name | Đổi snake_case. |
| `data.user.email` | string | 🟩 | user.email | Có field và xử lý tương ứng trong source. |
| `data.user.role` | string | 🟩 | user.role | Có field và xử lý tương ứng trong source. |
| `data.user.permissions[]` | string | 🟨 | user.role | Có role; chốt permission mapping hoặc BE cung cấp list. |
| `data.redirectPath` | string | ⬜ | role + route của FE | FE có thể điều hướng theo role chuẩn, không cần thêm endpoint/field server. |
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-02"></a>

### API-02 — /register

- **FE mong muốn:** `POST /api/v1/auth/register`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:58).
- **BE đối chiếu:** `POST /api/v1/auth/register` — [main.py:891](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:891) · [models.py:14](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:14) · [main.py:178](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:178).
- **Kết luận:** Ngày sinh có lưu nhưng optional; accepted_terms_version không được lưu/enforce. Đăng ký hiện tự cấp phiên, khác FE mẫu nextAction=login. Không gửi confirmPassword.

#### Request mong muốn

```json
{
  "body": {
    "fullName": "Nguyễn Minh An",
    "dateOfBirth": "1998-05-12",
    "email": "minhan.demo@gmail.com",
    "password": "ExampleOnly_123!",
    "acceptedTerms": true
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.fullName` | string | 🟨 | full_name | Đổi tên; BE giới hạn họ tên 2–120 ký tự. |
| `body.dateOfBirth` | string | 🟨 | date_of_birth | Nhận/lưu ngày nhưng BE đang cho bỏ trống; chốt required theo UI. |
| `body.email` | string | 🟨 | email | Nhận email; chưa kiểm tra domain @gmail.com theo FE. |
| `body.password` | string | 🟨 | password | Nhận mật khẩu ≥8 ký tự; chưa enforce đủ hoa/thường/số/ký tự đặc biệt. |
| `body.acceptedTerms` | boolean | 🟥 | accepted_terms_version: string \| null | Chưa có boolean chấp thuận hoặc lưu/enforce terms; không ánh xạ true thành version tùy ý. |

#### Response JSON mong muốn

```json
{
  "data": {
    "user": {
      "id": "USR-101",
      "fullName": "Nguyễn Minh An",
      "email": "minhan.demo@gmail.com",
      "role": "traveler"
    },
    "nextAction": "login"
  },
  "message": "Đã tạo tài khoản."
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.user.id` | string | 🟩 | user.id | Có field và xử lý tương ứng trong source. |
| `data.user.fullName` | string | 🟨 | user.full_name | Đổi snake_case. |
| `data.user.email` | string | 🟩 | user.email | Có field và xử lý tương ứng trong source. |
| `data.user.role` | string | 🟩 | user.role | Có field và xử lý tương ứng trong source. |
| `data.nextAction` | string | 🟨 | Server tạo session ngay | FE mẫu đăng ký→login; cần chốt tự login hay quay về login, không giả missing field là bug. |
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-03"></a>

### API-03 — Navbar; /profile; toàn bộ khu vực cần đăng nhập

- **FE mong muốn:** `GET /api/v1/me`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:78).
- **BE đối chiếu:** `GET /api/v1/auth/me + GET /api/v1/users/me` — [main.py:909](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:909) · [main.py:220](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:220).
- **Kết luận:** Ghép hai route auth/me + users/me để đáp ứng cùng UI. Không coi việc tách endpoint là thiếu nghiệp vụ. dateOfBirth chưa có ở projection; membershipLabel thuộc API-08 đã defer.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "USR-101",
    "role": "traveler",
    "fullName": "Nguyễn Minh An",
    "email": "minhan.demo@gmail.com",
    "phone": "0900000000",
    "dateOfBirth": "1998-05-12",
    "defaultOrigin": "Hà Nội, Việt Nam",
    "bio": "Yêu thích cảnh quan và văn hóa bản địa.",
    "preferredPace": "slow",
    "preferredStay": "Boutique Villa & Homestay bản địa",
    "dietaryPreference": "Ẩm thực địa phương",
    "joinedAt": "2026-08-12T09:00:00+07:00",
    "membershipLabel": "Pro Explorer",
    "permissions": [
      "trip:create",
      "trip:update:own",
      "feedback:create"
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.role` | string | 🟨 | auth/me.user.role | Profile không trả role; ghép với auth/me. |
| `data.fullName` | string | 🟩 | fullName | Có field và xử lý tương ứng trong source. |
| `data.email` | string | 🟩 | email | Có field và xử lý tương ứng trong source. |
| `data.phone` | string | 🟩 | phone | Có field và xử lý tương ứng trong source. |
| `data.dateOfBirth` | string | 🟥 | users.date_of_birth có lưu | GET/PATCH profile projection chưa trả ngày sinh. |
| `data.defaultOrigin` | string | 🟩 | defaultOrigin | Có field và xử lý tương ứng trong source. |
| `data.bio` | string | 🟩 | bio | Có field và xử lý tương ứng trong source. |
| `data.preferredPace` | string | 🟨 | preferredPace | Giữ giá trị từ profile; chốt enum chung với form/planner. |
| `data.preferredStay` | string | 🟩 | preferredStay | Có field và xử lý tương ứng trong source. |
| `data.dietaryPreference` | string | 🟩 | dietaryPreference | Có field và xử lý tương ứng trong source. |
| `data.joinedAt` | string | 🟩 | joinedAt | Có field và xử lý tương ứng trong source. |
| `data.membershipLabel` | string | ⬜ | Deferred API-08 | Theo chỉ đạo mới, gói/hạn mức demo phase sau; không giao bổ sung field này. |
| `data.permissions[]` | string | 🟨 | user.role | Có role, chưa có permission list; có thể suy UI từ bảng role chuẩn, server vẫn kiểm tra quyền. |

<a id="api-04"></a>

### API-04 — Sidebar của toàn bộ /admin/*

- **FE mong muốn:** `POST /api/v1/auth/logout`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:100).
- **BE đối chiếu:** `POST /api/v1/auth/logout` — [main.py:918](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:918).
- **Kết luận:** success=true và cookie revoke đáp ứng logout về nghiệp vụ; chỉ tên wrapper khác.

#### Request mong muốn

```json
{
  "body": {}
}
```

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "loggedOut": true
  },
  "message": "Đã đăng xuất."
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.loggedOut` | boolean | 🟨 | success=true | Đổi tên; cookie được xóa. |
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-05"></a>

### API-05 — /profile → Thông tin cá nhân

- **FE mong muốn:** `PATCH /api/v1/me`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:114).
- **BE đối chiếu:** `PATCH /api/v1/users/me` — [main.py:922](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:922) · [models.py:27](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:27) · [main.py:231](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:231).
- **Kết luận:** Response ở profile wrapper; metadata ngày sinh/role/permissions nếu cần có thể ghép endpoint hiện có. Email đổi được cập nhật ngay, emailChangePending=false; chưa có luồng xác minh.

#### Request mong muốn

```json
{
  "body": {
    "fullName": "Nguyễn Minh An",
    "email": "minhan.demo@gmail.com",
    "phone": "0900000000",
    "defaultOrigin": "Hà Nội, Việt Nam",
    "bio": "Yêu thích cảnh quan và văn hóa bản địa."
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.fullName` | string | 🟨 | full_name | Đổi tên, được lưu. |
| `body.email` | string | 🟩 | email | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.phone` | string | 🟩 | phone | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.defaultOrigin` | string | 🟨 | default_origin | Đổi tên, được lưu. |
| `body.bio` | string | 🟩 | bio | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "USR-101",
    "role": "traveler",
    "fullName": "Nguyễn Minh An",
    "email": "minhan.demo@gmail.com",
    "phone": "0900000000",
    "dateOfBirth": "1998-05-12",
    "defaultOrigin": "Hà Nội, Việt Nam",
    "bio": "Yêu thích cảnh quan và văn hóa bản địa.",
    "preferredPace": "slow",
    "preferredStay": "Boutique Villa & Homestay bản địa",
    "dietaryPreference": "Ẩm thực địa phương",
    "joinedAt": "2026-08-12T09:00:00+07:00",
    "membershipLabel": "Pro Explorer",
    "permissions": [
      "trip:create",
      "trip:update:own",
      "feedback:create"
    ]
  },
  "message": "Đã lưu hồ sơ."
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.role` | string | 🟨 | auth/me.user.role | Profile không trả role; ghép với auth/me. |
| `data.fullName` | string | 🟩 | fullName | Có field và xử lý tương ứng trong source. |
| `data.email` | string | 🟩 | email | Có field và xử lý tương ứng trong source. |
| `data.phone` | string | 🟩 | phone | Có field và xử lý tương ứng trong source. |
| `data.dateOfBirth` | string | 🟥 | users.date_of_birth có lưu | GET/PATCH profile projection chưa trả ngày sinh. |
| `data.defaultOrigin` | string | 🟩 | defaultOrigin | Có field và xử lý tương ứng trong source. |
| `data.bio` | string | 🟩 | bio | Có field và xử lý tương ứng trong source. |
| `data.preferredPace` | string | 🟨 | preferredPace | Giữ giá trị từ profile; chốt enum chung với form/planner. |
| `data.preferredStay` | string | 🟩 | preferredStay | Có field và xử lý tương ứng trong source. |
| `data.dietaryPreference` | string | 🟩 | dietaryPreference | Có field và xử lý tương ứng trong source. |
| `data.joinedAt` | string | 🟩 | joinedAt | Có field và xử lý tương ứng trong source. |
| `data.membershipLabel` | string | ⬜ | Deferred API-08 | Theo chỉ đạo mới, gói/hạn mức demo phase sau; không giao bổ sung field này. |
| `data.permissions[]` | string | 🟨 | user.role | Có role, chưa có permission list; có thể suy UI từ bảng role chuẩn, server vẫn kiểm tra quyền. |
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-06"></a>

### API-06 — /profile → Travel DNA; giá trị mặc định cho /create-trip

- **FE mong muốn:** `GET /api/v1/me/travel-dna`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:145).
- **BE đối chiếu:** `GET /api/v1/users/me/dna` — [main.py:931](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:931) · [main.py:259](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:259).
- **Kết luận:** Audit DNA profile đã lưu, không giao phân tích ảnh/mô tả API-13. Nguồn phân tích/weights cần demo hoặc deferred; điểm cuisinePriority vẫn lệch kiểu/ý nghĩa.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "pacePreference": "slow",
    "sceneryFocus": "nature",
    "cuisinePriority": 85,
    "metrics": [
      {
        "key": "nature",
        "label": "Thiên nhiên & Hoang dã",
        "score": 94,
        "rating": "Rất cao"
      },
      {
        "key": "photography",
        "label": "Chất lượng Nhiếp ảnh",
        "score": 92,
        "rating": "Rất cao"
      },
      {
        "key": "mountains",
        "label": "Đồi núi & Vùng cao",
        "score": 90,
        "rating": "Rất cao"
      },
      {
        "key": "quiet",
        "label": "Thanh tĩnh & Yên bình",
        "score": 88,
        "rating": "Cao"
      },
      {
        "key": "cool_climate",
        "label": "Mát mẻ & Ôn hòa",
        "score": 85,
        "rating": "Cao"
      },
      {
        "key": "light_exploration",
        "label": "Khám phá nhẹ nhàng",
        "score": 54,
        "rating": "Trung bình"
      },
      {
        "key": "luxury",
        "label": "Sang trọng tối thượng",
        "score": 28,
        "rating": "Thấp"
      },
      {
        "key": "crowds",
        "label": "Thích chỗ đông vui",
        "score": 20,
        "rating": "Thấp"
      },
      {
        "key": "nightlife",
        "label": "Cuộc sống về đêm",
        "score": 15,
        "rating": "Thấp"
      }
    ],
    "sources": [
      {
        "id": "chat",
        "title": "Hội thoại & Tinh chỉnh Planner",
        "weightPercent": 40,
        "description": "Sở thích từ hội thoại lập kế hoạch.",
        "signalsCount": 18
      },
      {
        "id": "explicit",
        "title": "Sở thích cấu hình chủ động",
        "weightPercent": 35,
        "description": "Tiêu chí do du khách điều chỉnh.",
        "signalsCount": 6
      },
      {
        "id": "moodboard",
        "title": "Moodboard & Ảnh cảm hứng",
        "weightPercent": 25,
        "description": "Sở thích rút ra từ ảnh được chọn.",
        "signalsCount": 12
      }
    ],
    "version": "2.4",
    "updatedAt": "2026-10-07T00:10:00+07:00"
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.pacePreference` | string | 🟨 | preferences.pace | Đổi cấu trúc và chốt enum. |
| `data.sceneryFocus` | string | 🟨 | preferences.sceneryFocus | Đổi cấu trúc. |
| `data.cuisinePriority` | number | 🟥 | preferences.cuisinePriority: string \| null | Không phải điểm số 0–100. |
| `data.metrics[].key` | string | 🟩 | metrics[].key | Có field và xử lý tương ứng trong source. |
| `data.metrics[].label` | string | ⬜ | metrics[].key + catalog labels tại FE | Label trình bày không cần thuật toán phân tích DNA. |
| `data.metrics[].score` | number | 🟩 | metrics[].score | Có field và xử lý tương ứng trong source. |
| `data.metrics[].rating` | string | ⬜ | metrics[].score + rule phân mức đã chốt | Có thể FE định dạng; phải chốt ngưỡng, không tự đoán. |
| `data.sources[].id` | string | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.sources[].title` | string | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.sources[].weightPercent` | number | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.sources[].description` | string | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.sources[].signalsCount` | number | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.version` | string | 🟥 | Chỉ updatedAt | Chưa có version/projection cho chỉ số phiên bản DNA. |
| `data.updatedAt` | string | 🟩 | updatedAt | Có field và xử lý tương ứng trong source. |

<a id="api-07"></a>

### API-07 — /profile → Áp dụng cập nhật DNA

- **FE mong muốn:** `PATCH /api/v1/me/travel-dna`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:233).
- **BE đối chiếu:** `PUT /api/v1/users/me/dna` — [main.py:935](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:935) · [models.py:43](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:43) · [main.py:270](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:270).
- **Kết luận:** PUT đang dùng model cho phép subset, chưa phải full replacement; chốt PUT/PATCH nghĩa nào. metrics nhận/lưu 0–100; không tự suy thuật toán DNA.

#### Request mong muốn

```json
{
  "body": {
    "pacePreference": "slow",
    "sceneryFocus": "nature",
    "cuisinePriority": 85,
    "metrics": [
      {
        "key": "nature",
        "score": 94
      },
      {
        "key": "photography",
        "score": 92
      },
      {
        "key": "mountains",
        "score": 90
      },
      {
        "key": "quiet",
        "score": 88
      },
      {
        "key": "cool_climate",
        "score": 85
      },
      {
        "key": "light_exploration",
        "score": 54
      },
      {
        "key": "luxury",
        "score": 28
      },
      {
        "key": "crowds",
        "score": 20
      },
      {
        "key": "nightlife",
        "score": 15
      }
    ]
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.pacePreference` | string | 🟨 | pace | Đổi tên; cần giữ/map enum slow/balanced/fast. |
| `body.sceneryFocus` | string | 🟨 | scenery_focus | Đổi tên, được lưu. |
| `body.cuisinePriority` | number | 🟥 | cuisine_priority: string | FE cần mức số 0–100; BE đang nhận chuỗi sở thích, khác ý nghĩa. |
| `body.metrics[].key` | string | 🟩 | metrics[].key | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.metrics[].score` | number | 🟩 | metrics[].score | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "pacePreference": "slow",
    "sceneryFocus": "nature",
    "cuisinePriority": 85,
    "metrics": [
      {
        "key": "nature",
        "label": "Thiên nhiên & Hoang dã",
        "score": 94,
        "rating": "Rất cao"
      },
      {
        "key": "photography",
        "label": "Chất lượng Nhiếp ảnh",
        "score": 92,
        "rating": "Rất cao"
      },
      {
        "key": "mountains",
        "label": "Đồi núi & Vùng cao",
        "score": 90,
        "rating": "Rất cao"
      },
      {
        "key": "quiet",
        "label": "Thanh tĩnh & Yên bình",
        "score": 88,
        "rating": "Cao"
      },
      {
        "key": "cool_climate",
        "label": "Mát mẻ & Ôn hòa",
        "score": 85,
        "rating": "Cao"
      },
      {
        "key": "light_exploration",
        "label": "Khám phá nhẹ nhàng",
        "score": 54,
        "rating": "Trung bình"
      },
      {
        "key": "luxury",
        "label": "Sang trọng tối thượng",
        "score": 28,
        "rating": "Thấp"
      },
      {
        "key": "crowds",
        "label": "Thích chỗ đông vui",
        "score": 20,
        "rating": "Thấp"
      },
      {
        "key": "nightlife",
        "label": "Cuộc sống về đêm",
        "score": 15,
        "rating": "Thấp"
      }
    ],
    "sources": [
      {
        "id": "chat",
        "title": "Hội thoại & Tinh chỉnh Planner",
        "weightPercent": 40,
        "description": "Sở thích từ hội thoại lập kế hoạch.",
        "signalsCount": 18
      },
      {
        "id": "explicit",
        "title": "Sở thích cấu hình chủ động",
        "weightPercent": 35,
        "description": "Tiêu chí do du khách điều chỉnh.",
        "signalsCount": 6
      },
      {
        "id": "moodboard",
        "title": "Moodboard & Ảnh cảm hứng",
        "weightPercent": 25,
        "description": "Sở thích rút ra từ ảnh được chọn.",
        "signalsCount": 12
      }
    ],
    "version": "2.4",
    "updatedAt": "2026-10-07T00:10:00+07:00"
  },
  "message": "Đã lưu Travel DNA."
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.pacePreference` | string | 🟨 | preferences.pace | Đổi cấu trúc và chốt enum. |
| `data.sceneryFocus` | string | 🟨 | preferences.sceneryFocus | Đổi cấu trúc. |
| `data.cuisinePriority` | number | 🟥 | preferences.cuisinePriority: string \| null | Không phải điểm số 0–100. |
| `data.metrics[].key` | string | 🟩 | metrics[].key | Có field và xử lý tương ứng trong source. |
| `data.metrics[].label` | string | ⬜ | metrics[].key + catalog labels tại FE | Label trình bày không cần thuật toán phân tích DNA. |
| `data.metrics[].score` | number | 🟩 | metrics[].score | Có field và xử lý tương ứng trong source. |
| `data.metrics[].rating` | string | ⬜ | metrics[].score + rule phân mức đã chốt | Có thể FE định dạng; phải chốt ngưỡng, không tự đoán. |
| `data.sources[].id` | string | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.sources[].title` | string | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.sources[].weightPercent` | number | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.sources[].description` | string | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.sources[].signalsCount` | number | 🟥 | signalSources=[] cố định | Thiếu id/title/weightPercent/description/signalsCount cho UI DNA profile. Không yêu cầu triển khai API-13; nếu phase này dùng catalog/demo hoặc unavailable, hai đội cần chốt rõ. |
| `data.version` | string | 🟥 | Chỉ updatedAt | Chưa có version/projection cho chỉ số phiên bản DNA. |
| `data.updatedAt` | string | 🟩 | updatedAt | Có field và xử lý tương ứng trong source. |
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-09"></a>

### API-09 — / → Carousel, Bạn muốn đi đâu?

- **FE mong muốn:** `GET /api/v1/content/landing`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:410).
- **BE đối chiếu:** `GET /api/v1/public/landing` — [main.py:939](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:939) · [main.py:537](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:537).
- **Kết luận:** Public landing vẫn đọc destinations + catalog hardcoded, không lấy nội dung content_items mà admin ghi. Đây là thiếu đồng bộ dữ liệu thật, không chỉ thiếu tên field.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "heroPlans": [
      {
        "id": "hero-01",
        "title": "Sương sớm Mường Hoa & Săn mây Ô Quy Hồ",
        "destination": "Sa Pa, Lào Cai",
        "provinceCode": 10,
        "duration": "4 ngày / 3 đêm",
        "budget": "7.400.000 VND / người",
        "image": "https://static.example.com/sapa-hero.jpg",
        "summary": "Hành trình thư thái, ngắm cảnh và khám phá văn hóa địa phương.",
        "highlights": [
          "Ngắm cảnh",
          "Nghỉ dưỡng"
        ],
        "active": true
      }
    ],
    "introDestinations": [
      {
        "id": "intro-1",
        "label": "Lào Cai",
        "provinceCode": 10,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-1.jpg",
        "order": 1,
        "active": true
      },
      {
        "id": "intro-2",
        "label": "Lâm Đồng",
        "provinceCode": 68,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-2.jpg",
        "order": 2,
        "active": true
      },
      {
        "id": "intro-3",
        "label": "Ninh Bình",
        "provinceCode": 37,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-3.jpg",
        "order": 3,
        "active": true
      },
      {
        "id": "intro-4",
        "label": "Quảng Bình",
        "provinceCode": 44,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-4.jpg",
        "order": 4,
        "active": true
      },
      {
        "id": "intro-5",
        "label": "Đà Nẵng",
        "provinceCode": 48,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-5.jpg",
        "order": 5,
        "active": true
      },
      {
        "id": "intro-6",
        "label": "Hà Giang",
        "provinceCode": 2,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-6.jpg",
        "order": 6,
        "active": true
      }
    ],
    "marketingMetrics": [
      {
        "key": "time_saved",
        "value": 85,
        "unit": "percent",
        "label": "Tiết kiệm thời gian",
        "description": "Giảm sàng lọc thông tin rải rác",
        "basis": "demo"
      },
      {
        "key": "intent_match",
        "value": 94,
        "unit": "percent",
        "label": "Khớp ý định thực tế",
        "description": "Điểm đến được giữ lại sau thảo luận",
        "basis": "demo"
      }
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.heroPlans[].id` | string | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].title` | string | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].destination` | string | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].provinceCode` | number | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].duration` | string | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].budget` | string | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].image` | string | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].summary` | string | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].highlights[]` | string | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.heroPlans[].active` | boolean | 🟥 | heroPlans=[] cố định | Không đọc content_items Hero đã admin lưu. |
| `data.introDestinations[].id` | string | 🟩 | introDestinations[].id | Có field và xử lý tương ứng trong source. |
| `data.introDestinations[].label` | string | 🟩 | introDestinations[].label | Có field và xử lý tương ứng trong source. |
| `data.introDestinations[].provinceCode` | number | 🟥 | provinceCode=slug | FE cần mã danh mục tỉnh; chưa mapping chuẩn. |
| `data.introDestinations[].tagline` | string | 🟥 | tagline=null cố định | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.introDestinations[].image` | string | 🟥 | imageUrl=null cố định | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.introDestinations[].order` | number | 🟩 | order | Có field và xử lý tương ứng trong source. |
| `data.introDestinations[].active` | boolean | 🟩 | active=true; chỉ destinations.enabled=1 | Có field và xử lý tương ứng trong source. |
| `data.marketingMetrics[].key` | string | 🟨 | stats.destinations / stats.places=null | Không cùng ý nghĩa. FE marketing số minh họa phải giữ basis/demo hoặc nguồn đã chốt; không suy số đo mới. |
| `data.marketingMetrics[].value` | number | 🟨 | stats.destinations / stats.places=null | Không cùng ý nghĩa. FE marketing số minh họa phải giữ basis/demo hoặc nguồn đã chốt; không suy số đo mới. |
| `data.marketingMetrics[].unit` | string | 🟨 | stats.destinations / stats.places=null | Không cùng ý nghĩa. FE marketing số minh họa phải giữ basis/demo hoặc nguồn đã chốt; không suy số đo mới. |
| `data.marketingMetrics[].label` | string | 🟨 | stats.destinations / stats.places=null | Không cùng ý nghĩa. FE marketing số minh họa phải giữ basis/demo hoặc nguồn đã chốt; không suy số đo mới. |
| `data.marketingMetrics[].description` | string | 🟨 | stats.destinations / stats.places=null | Không cùng ý nghĩa. FE marketing số minh họa phải giữ basis/demo hoặc nguồn đã chốt; không suy số đo mới. |
| `data.marketingMetrics[].basis` | string | 🟨 | stats.destinations / stats.places=null | Không cùng ý nghĩa. FE marketing số minh họa phải giữ basis/demo hoặc nguồn đã chốt; không suy số đo mới. |

<a id="api-10"></a>

### API-10 — /create-trip → Tỉnh du lịch; /community → bộ lọc tỉnh; /admin/content → liên kết tỉnh

- **FE mong muốn:** `GET /api/v1/catalog/provinces`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:505).
- **BE đối chiếu:** `GET /api/v1/catalog/provinces` — [main.py:944](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:944).
- **Kết luận:** items chỉ là destinations enabled trong DB. Cần chốt danh mục tỉnh/code/name dùng chung; không coi DB destination ID là mã tỉnh.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "items": [
      {
        "code": 10,
        "name": "Lào Cai"
      },
      {
        "code": 68,
        "name": "Lâm Đồng"
      },
      {
        "code": 37,
        "name": "Ninh Bình"
      }
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.items[].code` | number | 🟥 | items[].id + slug | Đây là ID destination DB, không chứng minh là mã tỉnh; chưa toàn bộ danh mục tỉnh. |
| `data.items[].name` | string | 🟨 | items[].name=destinations.display_name | Có tên destination, cần đảm bảo là đúng tên tỉnh thay vì tên điểm du lịch. |

<a id="api-11"></a>

### API-11 — /create-trip → Moodboard, + Thêm ảnh

- **FE mong muốn:** `GET /api/v1/catalog/inspiration-images`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:523).
- **BE đối chiếu:** `GET /api/v1/catalog/moodboard` — [main.py:944](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:944).
- **Kết luận:** Mảng moodboard rỗng cố định: các field item chưa được cấp. Không yêu cầu upload.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "items": [
      {
        "id": "IMG-01",
        "url": "https://static.example.com/cloud-valley.jpg",
        "caption": "Biển mây thung lũng lúc bình minh",
        "tags": [
          "Thanh bình",
          "Sương mù"
        ]
      },
      {
        "id": "IMG-02",
        "url": "https://static.example.com/balcony.jpg",
        "caption": "Ban công ngắm cảnh hoài niệm",
        "tags": [
          "Cổ điển",
          "Ban công ngắm cảnh"
        ]
      },
      {
        "id": "IMG-03",
        "url": "https://static.example.com/village.jpg",
        "caption": "Lối mòn và xưởng thủ công bản làng",
        "tags": [
          "Bản làng",
          "Lối đi thuận tiện"
        ]
      }
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.items[].id` | string | 🟥 | items=[] cố định | Chưa có kho ảnh id/url/caption/tags cho nút thêm ảnh. |
| `data.items[].url` | string | 🟥 | items=[] cố định | Chưa có kho ảnh id/url/caption/tags cho nút thêm ảnh. |
| `data.items[].caption` | string | 🟥 | items=[] cố định | Chưa có kho ảnh id/url/caption/tags cho nút thêm ảnh. |
| `data.items[].tags[]` | string | 🟥 | items=[] cố định | Chưa có kho ảnh id/url/caption/tags cho nút thêm ảnh. |

<a id="api-12"></a>

### API-12 — /create-trip → Dị ứng ẩm thực

- **FE mong muốn:** `GET /api/v1/catalog/allergies`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:556).
- **BE đối chiếu:** `GET /api/v1/catalog/allergies` — [main.py:944](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:944) · [main.py:537](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:537).
- **Kết luận:** Allergies public hardcoded; CRUD admin ở content_items khác nguồn. Cần cấp cùng ID và active, không tự thêm dị ứng cá nhân vào catalog.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "items": [
      {
        "id": "allergy-seafood",
        "label": "Hải sản & Tôm cua",
        "active": true
      },
      {
        "id": "allergy-peanut",
        "label": "Đậu phộng",
        "active": true
      }
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.items[].id` | string | 🟨 | ID hardcoded seafood/peanut/... | Có ID; đồng bộ ID với admin và request, không tự prefix allergy-. |
| `data.items[].label` | string | 🟩 | items[].label | Có field và xử lý tương ứng trong source. |
| `data.items[].active` | boolean | 🟨 | true hardcoded | Chưa phản ánh active trong content_items quản trị. |

<a id="api-14"></a>

### API-14 — /create-trip → Bắt đầu hội thoại; /destinations → Chọn

- **FE mong muốn:** `POST /api/v1/trip-plans`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:720).
- **BE đối chiếu:** `POST /api/v1/trips (+ generate_itinerary)` — [main.py:981](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:981) · [models.py:94](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:94) · [main.py:363](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:363) · [planner.py:52](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/planner.py:52).
- **Kết luận:** days≥1 đã bỏ giới hạn 3 ngày. generate_itinerary mặc định false → itinerary null/version0; muốn Planner hoạt động phải sinh đồng bộ hoặc có flow generate đã chốt. Chưa giữ các ràng buộc UI. Không yêu cầu triển khai API-13 để lưu các điểm DNA nhập/chọn sẵn.

#### Request mong muốn

```json
{
  "body": {
    "provinceCode": 10,
    "startDate": "2026-11-18",
    "endDate": "2026-11-21",
    "travelers": {
      "adults": 2,
      "elderly": 0,
      "children": 0
    },
    "budget": {
      "min": 10000000,
      "max": 15000000,
      "currency": "VND",
      "basis": "group_total"
    },
    "allergies": {
      "optionIds": [
        "allergy-seafood"
      ],
      "customEntries": [
        "Dị ứng đậu phộng"
      ]
    },
    "fitnessLevel": 2,
    "pace": "slow",
    "narrative": "Tôi muốn đi núi yên tĩnh trong 4 ngày, chụp ảnh và ăn món địa phương.",
    "inspirationImageIds": [
      "IMG-01",
      "IMG-02",
      "IMG-03"
    ],
    "dnaWeights": [
      {
        "key": "nature",
        "score": 94
      },
      {
        "key": "photography",
        "score": 92
      },
      {
        "key": "mountains",
        "score": 90
      },
      {
        "key": "quiet",
        "score": 88
      },
      {
        "key": "cool_climate",
        "score": 85
      },
      {
        "key": "light_exploration",
        "score": 54
      },
      {
        "key": "luxury",
        "score": 28
      },
      {
        "key": "crowds",
        "score": 20
      },
      {
        "key": "nightlife",
        "score": 15
      }
    ],
    "destinationId": "DEST-SAPA"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.provinceCode` | number | 🟥 | destination: slug | Có nơi đến theo slug, chưa có code/name tỉnh và mapping chuẩn. |
| `body.startDate` | string | 🟨 | start_date | Đổi tên, kiểu date. |
| `body.endDate` | string | ⬜ | start_date + days | FE tính days bao gồm cả ngày đầu/cuối; BE hỗ trợ days≥1. Không cần field end_date nếu mapping được chốt. |
| `body.travelers.adults` | number | 🟥 | people: int | Có tổng thành viên; không giữ riêng người lớn/cao tuổi/trẻ em. |
| `body.travelers.elderly` | number | 🟥 | people: int | Có tổng thành viên; không giữ riêng người lớn/cao tuổi/trẻ em. |
| `body.travelers.children` | number | 🟥 | people: int | Có tổng thành viên; không giữ riêng người lớn/cao tuổi/trẻ em. |
| `body.budget.min` | number | 🟥 | budget_vnd: int | Chỉ một mức ngân sách, không giữ min. |
| `body.budget.max` | number | 🟨 | budget_vnd | Có một trần; phải thống nhất group_total→budget_scope=total và vẫn bổ sung min. |
| `body.budget.currency` | string | ⬜ | VND theo quy ước | FE/API cố định VND; không cần field riêng nếu quy ước rõ. |
| `body.budget.basis` | string | 🟨 | budget_scope | group_total→total, per_person→per_person; giữ cùng cơ sở tính. |
| `body.allergies.optionIds[]` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `body.allergies.customEntries[]` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `body.fitnessLevel` | number | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `body.pace` | string | 🟨 | pace: relaxed/normal/busy | Cần map slow/balanced/fast và nhãn Planner; không gửi slow trực tiếp. |
| `body.narrative` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `body.inspirationImageIds[]` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `body.dnaWeights[].key` | string | 🟥 | interests[] chỉ là kind | Thiếu lưu trọng số nhập/chọn sẵn. Báo cáo không yêu cầu chạy API-13 đang skip. |
| `body.dnaWeights[].score` | number | 🟥 | interests[] chỉ là kind | Thiếu lưu trọng số nhập/chọn sẵn. Báo cáo không yêu cầu chạy API-13 đang skip. |
| `body.destinationId` | string | 🟨 | destination | Có lựa chọn destination slug; cần mapping ID recommendation và mã tỉnh. |

#### Response JSON mong muốn

Toàn bộ `data` là **Plan**: [ma trận field](#ma-tran-plan) và [JSON đầy đủ](#plan-json). Shape chi tiết riêng theo trạng thái/version của API-14 vẫn giữ tại [contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:720).

#### Đánh dấu field response

Dùng đủ 113 field tại [ma trận Plan chung](#ma-tran-plan). Phải đọc kèm ghi chú route phía trên; field có sẵn ở GET detail không chứng minh action đã lưu hoặc trả đúng version.

<a id="api-15"></a>

### API-15 — /planner; /trip-plan; /my-trips; /community → xem hồ sơ

- **FE mong muốn:** `GET /api/v1/trip-plans/{planId}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:1321).
- **BE đối chiếu:** `GET /api/v1/trips/{trip_id}` — [main.py:986](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:986) · [main.py:101](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:101).
- **Kết luận:** V1 detail có vistra_session parameter nhưng không dùng; gọi get_trip thẳng và trả request thô. Cần owner/private/public projection trước đáp ứng UI; không lộ request/chat/dị ứng khi xem cộng đồng.

#### Request mong muốn

```json
{
  "path": {
    "planId": "PLAN-01"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.planId` | string | 🟨 | path.trip_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |

#### Response JSON mong muốn

Toàn bộ `data` là **Plan**: [ma trận field](#ma-tran-plan) và [JSON đầy đủ](#plan-json). Shape chi tiết riêng theo trạng thái/version của API-15 vẫn giữ tại [contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:1321).

#### Đánh dấu field response

Dùng đủ 113 field tại [ma trận Plan chung](#ma-tran-plan). Phải đọc kèm ghi chú route phía trên; field có sẵn ở GET detail không chứng minh action đã lưu hoặc trả đúng version.

<a id="api-16"></a>

### API-16 — /planner → Đổi ràng buộc; /create-trip → tiếp tục bản nháp

- **FE mong muốn:** `PATCH /api/v1/trip-plans/{planId}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:1854).
- **BE đối chiếu:** `PATCH /api/v1/trips/{trip_id}` — [main.py:1023](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1023) · [main.py:1023](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1023).
- **Kết luận:** Route nhận payload dict nhưng chỉ thực thi status/is_published/base_version; request ràng buộc bị bỏ qua. Không được báo cập nhật thành công khi không lưu/tái tính. V1 response hiện không có hồ sơ đầy đủ.

#### Request mong muốn

```json
{
  "path": {
    "planId": "PLAN-01"
  },
  "body": {
    "expectedVersion": 1,
    "request": {
      "budget": {
        "min": 10000000,
        "max": 14000000,
        "currency": "VND",
        "basis": "group_total"
      },
      "travelers": {
        "adults": 2,
        "elderly": 0,
        "children": 0
      },
      "pace": "slow"
    }
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.planId` | string | 🟨 | path.trip_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.expectedVersion` | number | 🟥 | base_version có nhưng expectedVersion bị bỏ qua | Đổi tên là bắt buộc; route nhận dict không xử lý expectedVersion. |
| `body.request.budget.min` | number | 🟥 | payload: dict; chỉ dùng status/is_published/base_version | Nhận JSON không đồng nghĩa lưu field: ràng buộc hiện bị bỏ qua, không tái tính itinerary. |
| `body.request.budget.max` | number | 🟥 | payload: dict; chỉ dùng status/is_published/base_version | Nhận JSON không đồng nghĩa lưu field: ràng buộc hiện bị bỏ qua, không tái tính itinerary. |
| `body.request.budget.currency` | string | 🟥 | payload: dict; chỉ dùng status/is_published/base_version | Nhận JSON không đồng nghĩa lưu field: ràng buộc hiện bị bỏ qua, không tái tính itinerary. |
| `body.request.budget.basis` | string | 🟥 | payload: dict; chỉ dùng status/is_published/base_version | Nhận JSON không đồng nghĩa lưu field: ràng buộc hiện bị bỏ qua, không tái tính itinerary. |
| `body.request.travelers.adults` | number | 🟥 | payload: dict; chỉ dùng status/is_published/base_version | Nhận JSON không đồng nghĩa lưu field: ràng buộc hiện bị bỏ qua, không tái tính itinerary. |
| `body.request.travelers.elderly` | number | 🟥 | payload: dict; chỉ dùng status/is_published/base_version | Nhận JSON không đồng nghĩa lưu field: ràng buộc hiện bị bỏ qua, không tái tính itinerary. |
| `body.request.travelers.children` | number | 🟥 | payload: dict; chỉ dùng status/is_published/base_version | Nhận JSON không đồng nghĩa lưu field: ràng buộc hiện bị bỏ qua, không tái tính itinerary. |
| `body.request.pace` | string | 🟥 | payload: dict; chỉ dùng status/is_published/base_version | Nhận JSON không đồng nghĩa lưu field: ràng buộc hiện bị bỏ qua, không tái tính itinerary. |

**Các field handler PATCH thực sự dùng:** `base_version`, `status`, `is_published`. `request.*` trong JSON phía trên chưa được xử lý. Đây là thiếu nghiệp vụ, không chỉ đổi snake_case.

#### Response JSON mong muốn

Toàn bộ `data` là **Plan**: [ma trận field](#ma-tran-plan) và [JSON đầy đủ](#plan-json). Shape chi tiết riêng theo trạng thái/version của API-16 vẫn giữ tại [contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:1854).

#### Đánh dấu field response

Dùng đủ 113 field tại [ma trận Plan chung](#ma-tran-plan). Phải đọc kèm ghi chú route phía trên; field có sẵn ở GET detail không chứng minh action đã lưu hoặc trả đúng version.

<a id="api-17"></a>

### API-17 — /planner → Hội thoại cùng Vistra

- **FE mong muốn:** `POST /api/v1/trip-plans/{planId}/messages`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:2404).
- **BE đối chiếu:** `POST /api/v1/trips/{trip_id}/chat` — [main.py:1050](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1050) · [main.py:674](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:674) · [agents/orchestrator.py:12](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/agents/orchestrator.py:12) · [agents/orchestrator.py:28](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/agents/orchestrator.py:28).
- **Kết luận:** Chat trả reply/preview/tools_used/base_version và không commit; không lưu chat. V1 không kiểm tra session/owner. Các field Plan ở mục chung là khả năng đọc raw detail, không phải chat hiện đã trả Plan.

#### Request mong muốn

```json
{
  "path": {
    "planId": "PLAN-01"
  },
  "body": {
    "text": "Thêm nghỉ trưa và giữ ngân sách tối đa 15 triệu.",
    "expectedVersion": 1
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.planId` | string | 🟨 | path.trip_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.text` | string | 🟩 | text | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.expectedVersion` | number | 🟨 | base_version | Đổi tên; BE kiểm tra version, yêu cầu≥1. Chưa chat được bản v0 chưa generate. |

#### Response JSON mong muốn

```json
{
  "data": {
    "message": {
      "id": "MSG-03",
      "sender": "assistant",
      "timestamp": "2026-10-07T00:25:04+07:00",
      "text": "Đã dành thời gian nghỉ sau bữa trưa và giữ trần ngân sách.",
      "affectedChange": "Ngày 1: bổ sung khoảng nghỉ 13:00–15:00."
    }
  }
}
```

Ngoài object message trên, response mong muốn có `data.plan` là [Plan đầy đủ](#plan-json); tham chiếu này chỉ dùng trong report, không phải field $ref gửi trên API.

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.message.id` | string | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.message.sender` | string | ⬜ | assistant | Có reply từ assistant; có thể map sender. |
| `data.message.timestamp` | string | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.message.text` | string | 🟨 | reply | Có câu trả lời. |
| `data.message.affectedChange` | string | 🟥 | preview + tools_used | Không có mô tả tác động có cấu trúc; chưa lưu hội thoại. |
| `data.plan` | Plan | 🟥 | Chat không trả committed plan | Xem Plan chung; phải commit/đọc mới theo version đúng. |

<a id="api-18"></a>

### API-18 — /planner → kéo/đổi thứ tự điểm dừng trong ngày

- **FE mong muốn:** `PATCH /api/v1/trip-plans/{planId}/days/{dayNumber}/activity-order`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:2963).
- **BE đối chiếu:** `POST /trips/{trip_id}/revisions/preview → /commit` — [main.py:458](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:458) · [models.py:129](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:129) · [main.py:472](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:472).
- **Kết luận:** UI yêu cầu đổi thứ tự theo stable activity IDs; backend legacy nhận full stops và preview không lưu. Cần chốt orchestration preview→commit, giới hạn hiện max18 stops toàn chuyến và ID mapping; không bắt mở UI preview mới ngoài flow đã duyệt.

#### Request mong muốn

```json
{
  "path": {
    "planId": "PLAN-01",
    "dayNumber": 1
  },
  "body": {
    "orderedActivityIds": [
      "ACT-1-1",
      "ACT-1-2",
      "ACT-1-3"
    ],
    "expectedVersion": 1
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.planId` | string | 🟨 | path.trip_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `path.dayNumber` | number | 🟨 | stops[].day | Route preview không có path ngày; chốt mapping và giữ các ngày khác trong full stops. |
| `body.orderedActivityIds[]` | string | 🟥 | stops[].place_id/day/start_time | BE dùng place_id; chưa có stable activityId và mapping thứ tự của một ngày. Cần gửi toàn bộ stops hiện tại nếu dùng route legacy. |
| `body.expectedVersion` | number | 🟨 | base_version | Preview và commit dùng base_version. |

**BE hiện nhận — ví dụ shape, chưa đủ mapper từ stable activity ID:**

```json
{
  "base_version": 1,
  "stops": [
    {
      "place_id": 1,
      "day": 1,
      "start_time": "09:00"
    }
  ]
}
```

Commit tiếp theo cần `base_version` và `preview_id`; không coi preview là save. Mapper không được làm mất stops của các ngày không chỉnh.

#### Response JSON mong muốn

Toàn bộ `data` là **Plan**: [ma trận field](#ma-tran-plan) và [JSON đầy đủ](#plan-json). Shape chi tiết riêng theo trạng thái/version của API-18 vẫn giữ tại [contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:2963).

#### Đánh dấu field response

Dùng đủ 113 field tại [ma trận Plan chung](#ma-tran-plan). Phải đọc kèm ghi chú route phía trên; field có sẵn ở GET detail không chứng minh action đã lưu hoặc trả đúng version.

<a id="api-19"></a>

### API-19 — /planner → Xác nhận chốt; /trip-plan → Chốt bản nháp

- **FE mong muốn:** `POST /api/v1/trip-plans/{planId}/confirmation`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:3505).
- **BE đối chiếu:** `POST /trips/{trip_id}/confirm` — [main.py:387](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:387) · [main.py:387](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:387).
- **Kết luận:** Root confirm có kiểm tra owner và phải có itinerary; nhận base_version nhưng chưa kiểm tra version này. PATCH v1 status=confirmed không có kiểm tra itinerary đã sinh tương đương. Chốt một đường gọi hợp lệ.

#### Request mong muốn

```json
{
  "path": {
    "planId": "PLAN-01"
  },
  "body": {
    "expectedVersion": 1
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.planId` | string | 🟨 | path.trip_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.expectedVersion` | number | 🟨 | base_version | Model nhận nhưng confirm handler hiện chưa so sánh với current_version. |

#### Response JSON mong muốn

Toàn bộ `data` là **Plan**: [ma trận field](#ma-tran-plan) và [JSON đầy đủ](#plan-json). Shape chi tiết riêng theo trạng thái/version của API-19 vẫn giữ tại [contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:3505).

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-20"></a>

### API-20 — /trip-plan → Xuất bản/Gỡ khỏi cộng đồng

- **FE mong muốn:** `PATCH /api/v1/trip-plans/{planId}/publication`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4042).
- **BE đối chiếu:** `PATCH /trips/{trip_id}/publication` — [main.py:403](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:403) · [models.py:58](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:58) · [main.py:403](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:403).
- **Kết luận:** Root publication kiểm tra owner/confirmed/base_version. Mẫu FE chưa có expectedVersion/baseVersion: phải bổ sung mapping request. Không phải API /api/v1/trips/{id}/publication trong api_docs vì route đó chưa có.

#### Request mong muốn

```json
{
  "path": {
    "planId": "PLAN-01"
  },
  "body": {
    "isPublished": true
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.planId` | string | 🟨 | path.trip_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.isPublished` | boolean | 🟨 | is_published | Đổi tên. Root publication còn bắt buộc base_version mà mẫu FE chưa gửi; bổ sung request version. |

**🟥 Field cần gửi thêm khi dùng root publication:** `body.base_version` (integer≥0, bắt buộc theo PublicationRequest). FE mẫu chỉ có isPublished nên sau đổi tên vẫn 422 nếu không bổ sung version.

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "PLAN-01",
    "status": "confirmed",
    "isPublished": true,
    "lastUpdated": "2026-10-07T00:31:00+07:00"
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.status` | string | 🟨 | Không ở root response; PATCH v1 có status | Ghép detail hoặc trả status cho projection publication. |
| `data.isPublished` | boolean | 🟩 | isPublished | Có field và xử lý tương ứng trong source. |
| `data.lastUpdated` | string | 🟥 | publishedAt chỉ là thời điểm publication | Chưa lastUpdated hành trình dùng chung mọi thay đổi. |

<a id="api-21"></a>

### API-21 — /my-trips; /profile → thống kê, Nhật ký hành trình

- **FE mong muốn:** `GET /api/v1/me/trips`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4063).
- **BE đối chiếu:** `GET /api/v1/trips/me` — [main.py:971](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:971) · [main.py:588](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:588).
- **Kết luận:** V1 ownership và pagination đã có; chưa filter/status/q/date/budget/sort/counts. plan_card endDate=startDate và updatedAt=created_at sai ý nghĩa; min/max bị gộp cùng budget_vnd.

#### Request mong muốn

```json
{
  "query": {
    "status": "all",
    "q": "Sa Pa",
    "startDate": "2026-11-01",
    "endDate": "2026-11-30",
    "budgetMin": 10000000,
    "budgetMax": 15000000,
    "sort": "updated_desc",
    "page": 1,
    "pageSize": 12
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `query.status` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `query.q` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `query.startDate` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `query.endDate` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `query.budgetMin` | number | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `query.budgetMax` | number | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `query.sort` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `query.page` | number | 🟩 | page | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `query.pageSize` | number | 🟨 | page_size | Đổi tên; có phân trang. |

#### Response JSON mong muốn

```json
{
  "data": {
    "items": [
      {
        "id": "PLAN-01",
        "title": "Sa Pa mùa mây & Văn hóa bản địa",
        "coverImage": "https://static.example.com/sapa-plan.jpg",
        "status": "draft",
        "isPublished": false,
        "destination": "Sa Pa, Lào Cai",
        "origin": "Hà Nội, Việt Nam",
        "duration": "4 ngày / 3 đêm",
        "startDate": "2026-11-18",
        "endDate": "2026-11-21",
        "dates": "18–21 Th11/2026",
        "budget": {
          "amount": 14250000,
          "currency": "VND",
          "basis": "group_total"
        },
        "lastUpdated": "2026-10-07T00:20:00+07:00"
      }
    ],
    "counts": {
      "all": 25,
      "draft": 6,
      "confirmed": 19,
      "published": 19
    },
    "excludedMissingCount": 0
  },
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.items[].id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.items[].title` | string | 🟨 | title fallback Trip to … | Có tên tự sinh; TripCreate không lưu title nên chưa giữ tên riêng của hành trình. |
| `data.items[].coverImage` | string | 🟥 | coverImageUrl=null cố định | Không có ảnh hành trình đã chọn. |
| `data.items[].status` | string | 🟩 | status | Có field và xử lý tương ứng trong source. |
| `data.items[].isPublished` | boolean | 🟩 | isPublished | Có field và xử lý tương ứng trong source. |
| `data.items[].destination` | string | 🟩 | destination | Tên điểm đến từ catalog. |
| `data.items[].origin` | string | 🟥 | origin=request.origin coordinates\|null | FE cần tên nơi xuất phát, BE trả tọa độ/null và không resolve profile origin. |
| `data.items[].duration` | string | ⬜ | durationDays | FE format số ngày/đêm. |
| `data.items[].startDate` | string | 🟩 | startDate | Có field và xử lý tương ứng trong source. |
| `data.items[].endDate` | string | 🟥 | endDate=startDate | Sai với hành trình nhiều ngày; phải tính start + days - 1. |
| `data.items[].dates` | string | ⬜ | startDate + endDate đã sửa | FE format label; không dùng endDate sai. |
| `data.items[].budget.amount` | number | 🟥 | estimatedCostVnd=null; min=max budget_vnd | Không có chi phí dự toán card như FE cần. Phân biệt user budget và estimate. |
| `data.items[].budget.currency` | string | ⬜ | VND | Quy ước tiền tệ. |
| `data.items[].budget.basis` | string | 🟥 | Không trả budget_scope ở card | Phải giữ cơ sở nhóm/người. |
| `data.items[].lastUpdated` | string | 🟥 | updatedAt=created_at | Không phải thời điểm cập nhật cuối. |
| `data.counts.all` | number | 🟥 | Không summary | Chưa đếm all/draft/confirmed/published độc lập filter/page. |
| `data.counts.draft` | number | 🟥 | Không summary | Chưa đếm all/draft/confirmed/published độc lập filter/page. |
| `data.counts.confirmed` | number | 🟥 | Không summary | Chưa đếm all/draft/confirmed/published độc lập filter/page. |
| `data.counts.published` | number | 🟥 | Không summary | Chưa đếm all/draft/confirmed/published độc lập filter/page. |
| `data.excludedMissingCount` | number | 🟨 | Không field, không policy | Chốt loại bản ghi thiếu hay trả trạng thái thiếu; nếu không loại thì có thể cố định 0 theo policy rõ. |
| `pagination.page` | number | 🟨 | pagination.page | Đổi cấu trúc/tên; summary/filter vẫn thiếu. |
| `pagination.pageSize` | number | 🟨 | pagination.page_size | Đổi cấu trúc/tên; summary/filter vẫn thiếu. |
| `pagination.total` | number | 🟨 | pagination.total_records | Đổi cấu trúc/tên; summary/filter vẫn thiếu. |
| `pagination.totalPages` | number | ⬜ | ceil(pagination.total_records / pagination.page_size) | FE tính từ tổng đã có. |

<a id="api-22"></a>

### API-22 — /community; / → Xem cùng vùng/Bạn muốn đi đâu?

- **FE mong muốn:** `GET /api/v1/community/trips`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4113).
- **BE đối chiếu:** `GET /api/v1/community/trips` — [main.py:1004](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1004) · [main.py:606](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:606) · [main.py:588](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:588).
- **Kết luận:** Legacy community có nhiều filter, v1 chỉ page/page_size và hardcode các filter khác. Tên tỉnh ở link FE/mã tỉnh cần map slug thống nhất. Public card thiếu author/image/dự toán.

#### Request mong muốn

```json
{
  "query": {
    "q": "Sa Pa",
    "provinceCode": 10,
    "durationDays": 4,
    "theme": "mountains",
    "favoritesOnly": false,
    "budgetMin": 1000000,
    "budgetMax": 1000000000,
    "page": 1,
    "pageSize": 9
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `query.q` | string | 🟥 | Có ở /community/plans | V1 không khai báo/truyền query; cần nối tiếp filter legacy. |
| `query.provinceCode` | number | 🟥 | legacy province lọc d.slug | Chưa mapping provinceCode/tên tỉnh sang slug ở v1. |
| `query.durationDays` | number | 🟥 | legacy duration | V1 không khai báo/truyền. |
| `query.theme` | string | 🟥 | legacy tag | V1 không khai báo/truyền và cần mapping theme. |
| `query.favoritesOnly` | boolean | 🟥 | legacy liked_by_me | V1 đang truyền None; filter đã thích chưa hoạt động. |
| `query.budgetMin` | number | 🟥 | legacy budget_min_vnd | V1 không khai báo/truyền. |
| `query.budgetMax` | number | 🟥 | legacy budget_max_vnd | V1 không khai báo/truyền. |
| `query.page` | number | 🟩 | page | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `query.pageSize` | number | 🟨 | page_size | Đổi tên; có phân trang. |

#### Response JSON mong muốn

```json
{
  "data": {
    "items": [
      {
        "id": "PLAN-PUBLIC-01",
        "title": "Sa Pa mùa mây & Văn hóa bản địa",
        "coverImage": "https://static.example.com/sapa-plan.jpg",
        "duration": "4 ngày / 3 đêm",
        "dates": "18–21 Th11/2026",
        "startDate": "2026-11-18",
        "endDate": "2026-11-21",
        "origin": "Hà Nội, Việt Nam",
        "destination": "Sa Pa, Lào Cai",
        "provinceCode": 10,
        "author": {
          "id": "USR-201",
          "name": "An Bình",
          "avatar": "https://static.example.com/avatar-anbinh.jpg"
        },
        "likesCount": 142,
        "isLiked": false,
        "budget": {
          "amount": 14250000,
          "currency": "VND",
          "basis": "group_total"
        }
      }
    ],
    "filters": {
      "provinces": [
        {
          "code": 10,
          "name": "Lào Cai"
        },
        {
          "code": 68,
          "name": "Lâm Đồng"
        }
      ],
      "durations": [
        {
          "days": 2,
          "nights": 1,
          "label": "2 ngày / 1 đêm"
        },
        {
          "days": 3,
          "nights": 2,
          "label": "3 ngày / 2 đêm"
        },
        {
          "days": 4,
          "nights": 3,
          "label": "4 ngày / 3 đêm"
        }
      ]
    },
    "excludedBudgetMissingCount": 0
  },
  "pagination": {
    "page": 1,
    "pageSize": 9,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.items[].id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.items[].title` | string | 🟨 | title fallback Trip to … | Có tên tự sinh; TripCreate không lưu title nên chưa giữ tên riêng của hành trình. |
| `data.items[].coverImage` | string | 🟥 | coverImageUrl=null cố định | Không có ảnh hành trình đã chọn. |
| `data.items[].duration` | string | ⬜ | durationDays | FE format số ngày/đêm. |
| `data.items[].dates` | string | ⬜ | startDate + endDate đã sửa | FE format label; không dùng endDate sai. |
| `data.items[].startDate` | string | 🟩 | startDate | Có field và xử lý tương ứng trong source. |
| `data.items[].endDate` | string | 🟥 | endDate=startDate | Sai với hành trình nhiều ngày; phải tính start + days - 1. |
| `data.items[].origin` | string | 🟥 | origin=request.origin coordinates\|null | FE cần tên nơi xuất phát, BE trả tọa độ/null và không resolve profile origin. |
| `data.items[].destination` | string | 🟩 | destination | Tên điểm đến từ catalog. |
| `data.items[].provinceCode` | number | 🟥 | Không có | Cần catalog tỉnh thống nhất. |
| `data.items[].author.id` | string | 🟥 | Không hydrate owner | Thiếu ID/tên/avatar tác giả công khai. |
| `data.items[].author.name` | string | 🟥 | Không hydrate owner | Thiếu ID/tên/avatar tác giả công khai. |
| `data.items[].author.avatar` | string | 🟥 | Không hydrate owner | Thiếu ID/tên/avatar tác giả công khai. |
| `data.items[].likesCount` | number | 🟩 | likesCount | Có field và xử lý tương ứng trong source. |
| `data.items[].isLiked` | boolean | 🟨 | likedByMe | Đổi tên. |
| `data.items[].budget.amount` | number | 🟥 | estimatedCostVnd=null; min=max budget_vnd | Không có chi phí dự toán card như FE cần. Phân biệt user budget và estimate. |
| `data.items[].budget.currency` | string | ⬜ | VND | Quy ước tiền tệ. |
| `data.items[].budget.basis` | string | 🟥 | Không trả budget_scope ở card | Phải giữ cơ sở nhóm/người. |
| `data.filters.provinces[].code` | number | 🟨 | catalog/provinces nguồn khác | Có thể compose API-10 nhưng catalog còn thiếu mã/tên chuẩn. |
| `data.filters.provinces[].name` | string | 🟨 | catalog/provinces nguồn khác | Có thể compose API-10 nhưng catalog còn thiếu mã/tên chuẩn. |
| `data.filters.durations[].days` | number | ⬜ | Card durationDays/các preset đã chốt | Nếu filter là preset thì FE giữ; nếu theo dữ liệu thật cần dữ liệu toàn tập, không suy từ một trang. |
| `data.filters.durations[].nights` | number | ⬜ | Card durationDays/các preset đã chốt | Nếu filter là preset thì FE giữ; nếu theo dữ liệu thật cần dữ liệu toàn tập, không suy từ một trang. |
| `data.filters.durations[].label` | string | ⬜ | Card durationDays/các preset đã chốt | Nếu filter là preset thì FE giữ; nếu theo dữ liệu thật cần dữ liệu toàn tập, không suy từ một trang. |
| `data.excludedBudgetMissingCount` | number | 🟨 | Không có | Chốt policy thiếu budget; backend lọc hiện bỏ null nhưng không trả số loại. |
| `pagination.page` | number | 🟨 | page | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.pageSize` | number | 🟨 | pageSize | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.total` | number | 🟨 | total | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.totalPages` | number | 🟨 | totalPages | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |

<a id="api-23"></a>

### API-23 — /community → Thích/Bỏ thích

- **FE mong muốn:** `PUT /api/v1/community/trips/{tripId}/like`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4191).
- **BE đối chiếu:** `POST /api/v1/community/trips/{trip_id}/like` — [main.py:1011](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1011).
- **Kết luận:** Like idempotent bằng unique(trip,user)/ON CONFLICT; chỉ mapper snake_case và wrapper. Không giao tạo route mới chỉ vì FE đề xuất PUT còn v1 là POST.

#### Request mong muốn

```json
{
  "path": {
    "tripId": "PLAN-PUBLIC-01"
  },
  "body": {
    "liked": true
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.tripId` | string | 🟨 | path.trip_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.liked` | boolean | 🟩 | liked | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "tripId": "PLAN-PUBLIC-01",
    "isLiked": true,
    "likesCount": 143
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.tripId` | string | 🟨 | trip_id | Đổi tên. |
| `data.isLiked` | boolean | 🟨 | liked | Đổi tên. |
| `data.likesCount` | number | 🟨 | total_likes | Đổi tên; đã có idempotent likes. |

<a id="api-24"></a>

### API-24 — /community → Tái sử dụng; sau đó /planner

- **FE mong muốn:** `POST /api/v1/community/trips/{tripId}/reuse`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4205).
- **BE đối chiếu:** `POST /api/v1/community/trips/{trip_id}/fork` — [main.py:1017](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1017) · [main.py:659](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:659).
- **Kết luận:** Fork lưu request nhưng không copy itinerary; version0 và trả new_trip_id. Muốn mở Planner cần generate cho bản nháp hoặc chốt flow tạo, không giả đã có lịch trình khi redirect.

#### Request mong muốn

```json
{
  "path": {
    "tripId": "PLAN-PUBLIC-01"
  },
  "body": {}
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.tripId` | string | 🟨 | path.trip_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |

#### Response JSON mong muốn

```json
{
  "data": {
    "trip": {
      "id": "PLAN-COPY-01",
      "title": "Sa Pa mùa mây & Văn hóa bản địa",
      "coverImage": "https://static.example.com/sapa-plan.jpg",
      "status": "draft",
      "isPublished": false,
      "destination": "Sa Pa, Lào Cai",
      "origin": "Hà Nội, Việt Nam",
      "duration": "4 ngày / 3 đêm",
      "startDate": "2026-11-18",
      "endDate": "2026-11-21",
      "dates": "18–21 Th11/2026",
      "budget": {
        "amount": 14250000,
        "currency": "VND",
        "basis": "group_total"
      },
      "lastUpdated": "2026-10-07T00:30:00+07:00"
    },
    "sourceTripId": "PLAN-PUBLIC-01",
    "redirectPath": "/planner?planId=PLAN-COPY-01"
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.trip.id` | string | 🟨 | new_trip_id | Có ID bản nháp mới. |
| `data.trip.title` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.coverImage` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.status` | string | 🟨 | status | draft đúng. |
| `data.trip.isPublished` | boolean | 🟩 | INSERT is_published=0 | V1 response chưa trả nhưng server lưu private; có thể đọc detail. |
| `data.trip.destination` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.origin` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.duration` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.startDate` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.endDate` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.dates` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.budget.amount` | number | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.budget.currency` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.budget.basis` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.trip.lastUpdated` | string | 🟥 | V1 chỉ new_trip_id/status/base_version/message | Đọc lại card/detail cũng chưa đủ các field; xem ma trận card/plan. |
| `data.sourceTripId` | string | ⬜ | path trip_id | FE biết hành trình nguồn. |
| `data.redirectPath` | string | ⬜ | new_trip_id | FE xây /planner?planId=… |

Các field `trip.*` còn thiếu dùng [ma trận card API-21](#api-21) và [Plan chung](#ma-tran-plan) khi mở Planner mới; không sao chép liên hệ/dị ứng/chat riêng của tác giả.

<a id="api-25"></a>

### API-25 — /destinations → 5 thẻ; Chi tiết; So sánh 2–3 điểm đến

- **FE mong muốn:** `POST /api/v1/destination-recommendations`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4235).
- **BE đối chiếu:** `GET /api/v1/destinations/recommendations (+ detail)` — [main.py:954](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:954) · [main.py:557](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:557) · [main.py:958](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:958).
- **Kết luận:** V1 không nhận bộ lọc và gọi legacy không truyền tham số; legacy nhận vài query nhưng SQL chọn 5 destination đầu không áp dụng chúng. Response nhiều null/empty; không đủ detail/compare. Chưa chốt nguồn thì giữ unavailable/basis rõ, không bịa score/weather/image.

#### Request mong muốn

```json
{
  "body": {
    "travelersGroup": "couple",
    "style": "all",
    "dnaFocus": "nature",
    "dnaWeights": [
      {
        "key": "nature",
        "score": 94
      },
      {
        "key": "photography",
        "score": 92
      },
      {
        "key": "mountains",
        "score": 90
      },
      {
        "key": "quiet",
        "score": 88
      },
      {
        "key": "cool_climate",
        "score": 85
      },
      {
        "key": "light_exploration",
        "score": 54
      },
      {
        "key": "luxury",
        "score": 28
      },
      {
        "key": "crowds",
        "score": 20
      },
      {
        "key": "nightlife",
        "score": 15
      }
    ],
    "budget": {
      "min": 1000000,
      "max": 15000000,
      "currency": "VND",
      "basis": "group_total"
    },
    "period": "next_calendar_month"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.travelersGroup` | string | 🟥 | legacy travelers: int | V1 không nhận filter; phải giữ nhóm solo/couple/3–4/5+, không suy ra số người chính xác. |
| `body.style` | string | 🟥 | legacy style nhận nhưng không dùng | Chưa áp dụng phân loại/ranking. |
| `body.dnaFocus` | string | 🟥 | legacy dna_focus nhận nhưng không dùng | Chưa áp dụng phân loại/ranking. |
| `body.dnaWeights[].key` | string | 🟥 | Không nhận | Có thể sử dụng trọng số sẵn có nếu chốt; không yêu cầu phân tích DNA mới. |
| `body.dnaWeights[].score` | number | 🟥 | Không nhận | Có thể sử dụng trọng số sẵn có nếu chốt; không yêu cầu phân tích DNA mới. |
| `body.budget.min` | number | 🟥 | legacy budget_max_vnd không dùng | Không dùng ngân sách để chọn/ranking. |
| `body.budget.max` | number | 🟥 | legacy budget_max_vnd không dùng | Không dùng ngân sách để chọn/ranking. |
| `body.budget.currency` | string | 🟥 | legacy budget_max_vnd không dùng | Không dùng ngân sách để chọn/ranking. |
| `body.budget.basis` | string | 🟥 | legacy budget_max_vnd không dùng | Không dùng ngân sách để chọn/ranking. |
| `body.period` | string | 🟥 | legacy start_date/end_date; v1 không truyền | Chưa tính tháng lịch tiếp theo tại Asia/Ho_Chi_Minh. |

#### Response JSON mong muốn

```json
{
  "data": {
    "period": {
      "label": "Tháng 11/2026",
      "startDate": "2026-11-01",
      "endDate": "2026-11-30",
      "timezone": "Asia/Ho_Chi_Minh"
    },
    "items": [
      {
        "id": "DEST-SAPA",
        "name": "Sa Pa, Lào Cai",
        "region": "Tây Bắc Bộ",
        "provinceCode": 10,
        "country": "Việt Nam",
        "coverImage": "https://static.example.com/destination-1.jpg",
        "visualMatch": 94,
        "seasonMatch": 96,
        "budgetMatch": 91,
        "estimatedCost": {
          "amount": 7400000,
          "currency": "VND",
          "basis": "per_person"
        },
        "duration": {
          "days": 4,
          "nights": 3,
          "label": "4 ngày / 3 đêm"
        },
        "transport": {
          "level": "Trung bình"
        },
        "goldenHour": "05:30–07:00 hoặc 16:30–17:30; tùy điều kiện thực tế",
        "bestMoments": {
          "peakHours": "05:30–07:00",
          "sunDirection": "Ánh sáng từ phía Đông",
          "weatherSuitability": 82,
          "crowdLevel": "Thấp vào sáng sớm",
          "dailyForecast": [
            {
              "date": "2026-11-18",
              "day": "18 Th11",
              "score": 89
            },
            {
              "date": "2026-11-19",
              "day": "19 Th11",
              "score": 74
            },
            {
              "date": "2026-11-20",
              "day": "20 Th11",
              "score": 51
            },
            {
              "date": "2026-11-21",
              "day": "21 Th11",
              "score": 79
            }
          ],
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "realityCheck": {
          "confidence": 84,
          "expectationImage": "https://static.example.com/expectation-1.jpg",
          "expectationDesc": "Cảnh quan yên tĩnh trong ảnh cảm hứng.",
          "realityImage": "https://static.example.com/reality-1.jpg",
          "realityDesc": "Cảnh quan mùa đi; trải nghiệm phụ thuộc thời tiết và lượng khách.",
          "keyPoints": [
            "Kiểm tra điều kiện trước khi khởi hành",
            "Ưu tiên thời điểm ít đông",
            "Chuẩn bị trang phục phù hợp địa hình"
          ]
        }
      },
      {
        "id": "DEST-DALAT",
        "name": "Đà Lạt, Lâm Đồng",
        "region": "Tây Nguyên",
        "provinceCode": 68,
        "country": "Việt Nam",
        "coverImage": "https://static.example.com/destination-2.jpg",
        "visualMatch": 84,
        "seasonMatch": 79,
        "budgetMatch": 95,
        "estimatedCost": {
          "amount": 6900000,
          "currency": "VND",
          "basis": "per_person"
        },
        "duration": {
          "days": 4,
          "nights": 3,
          "label": "4 ngày / 3 đêm"
        },
        "transport": {
          "level": "Dễ dàng"
        },
        "goldenHour": "05:30–07:00 hoặc 16:30–17:30; tùy điều kiện thực tế",
        "bestMoments": {
          "peakHours": "05:30–07:00",
          "sunDirection": "Ánh sáng từ phía Đông",
          "weatherSuitability": 82,
          "crowdLevel": "Thấp vào sáng sớm",
          "dailyForecast": [
            {
              "date": "2026-11-18",
              "day": "18 Th11",
              "score": 89
            },
            {
              "date": "2026-11-19",
              "day": "19 Th11",
              "score": 74
            },
            {
              "date": "2026-11-20",
              "day": "20 Th11",
              "score": 51
            },
            {
              "date": "2026-11-21",
              "day": "21 Th11",
              "score": 79
            }
          ],
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "realityCheck": {
          "confidence": 84,
          "expectationImage": "https://static.example.com/expectation-2.jpg",
          "expectationDesc": "Cảnh quan yên tĩnh trong ảnh cảm hứng.",
          "realityImage": "https://static.example.com/reality-2.jpg",
          "realityDesc": "Cảnh quan mùa đi; trải nghiệm phụ thuộc thời tiết và lượng khách.",
          "keyPoints": [
            "Kiểm tra điều kiện trước khi khởi hành",
            "Ưu tiên thời điểm ít đông",
            "Chuẩn bị trang phục phù hợp địa hình"
          ]
        }
      },
      {
        "id": "DEST-MCC",
        "name": "Mù Cang Chải, Yên Bái",
        "region": "Tây Bắc Bộ",
        "provinceCode": 15,
        "country": "Việt Nam",
        "coverImage": "https://static.example.com/destination-3.jpg",
        "visualMatch": 91,
        "seasonMatch": 72,
        "budgetMatch": 96,
        "estimatedCost": {
          "amount": 5800000,
          "currency": "VND",
          "basis": "per_person"
        },
        "duration": {
          "days": 4,
          "nights": 3,
          "label": "4 ngày / 3 đêm"
        },
        "transport": {
          "level": "Thử thách"
        },
        "goldenHour": "05:30–07:00 hoặc 16:30–17:30; tùy điều kiện thực tế",
        "bestMoments": {
          "peakHours": "05:30–07:00",
          "sunDirection": "Ánh sáng từ phía Đông",
          "weatherSuitability": 82,
          "crowdLevel": "Thấp vào sáng sớm",
          "dailyForecast": [
            {
              "date": "2026-11-18",
              "day": "18 Th11",
              "score": 89
            },
            {
              "date": "2026-11-19",
              "day": "19 Th11",
              "score": 74
            },
            {
              "date": "2026-11-20",
              "day": "20 Th11",
              "score": 51
            },
            {
              "date": "2026-11-21",
              "day": "21 Th11",
              "score": 79
            }
          ],
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "realityCheck": {
          "confidence": 84,
          "expectationImage": "https://static.example.com/expectation-3.jpg",
          "expectationDesc": "Cảnh quan yên tĩnh trong ảnh cảm hứng.",
          "realityImage": "https://static.example.com/reality-3.jpg",
          "realityDesc": "Cảnh quan mùa đi; trải nghiệm phụ thuộc thời tiết và lượng khách.",
          "keyPoints": [
            "Kiểm tra điều kiện trước khi khởi hành",
            "Ưu tiên thời điểm ít đông",
            "Chuẩn bị trang phục phù hợp địa hình"
          ]
        }
      },
      {
        "id": "DEST-PHONGNHA",
        "name": "Phong Nha - Kẻ Bàng, Quảng Bình",
        "region": "Bắc Trung Bộ",
        "provinceCode": 44,
        "country": "Việt Nam",
        "coverImage": "https://static.example.com/destination-4.jpg",
        "visualMatch": 95,
        "seasonMatch": 92,
        "budgetMatch": 94,
        "estimatedCost": {
          "amount": 6500000,
          "currency": "VND",
          "basis": "per_person"
        },
        "duration": {
          "days": 3,
          "nights": 2,
          "label": "3 ngày / 2 đêm"
        },
        "transport": {
          "level": "Dễ dàng"
        },
        "goldenHour": "05:30–07:00 hoặc 16:30–17:30; tùy điều kiện thực tế",
        "bestMoments": {
          "peakHours": "05:30–07:00",
          "sunDirection": "Ánh sáng từ phía Đông",
          "weatherSuitability": 82,
          "crowdLevel": "Thấp vào sáng sớm",
          "dailyForecast": [
            {
              "date": "2026-11-18",
              "day": "18 Th11",
              "score": 89
            },
            {
              "date": "2026-11-19",
              "day": "19 Th11",
              "score": 74
            },
            {
              "date": "2026-11-20",
              "day": "20 Th11",
              "score": 51
            },
            {
              "date": "2026-11-21",
              "day": "21 Th11",
              "score": 79
            }
          ],
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "realityCheck": {
          "confidence": 84,
          "expectationImage": "https://static.example.com/expectation-4.jpg",
          "expectationDesc": "Cảnh quan yên tĩnh trong ảnh cảm hứng.",
          "realityImage": "https://static.example.com/reality-4.jpg",
          "realityDesc": "Cảnh quan mùa đi; trải nghiệm phụ thuộc thời tiết và lượng khách.",
          "keyPoints": [
            "Kiểm tra điều kiện trước khi khởi hành",
            "Ưu tiên thời điểm ít đông",
            "Chuẩn bị trang phục phù hợp địa hình"
          ]
        }
      },
      {
        "id": "DEST-NINHBINH",
        "name": "Tràng An - Tam Cốc, Ninh Bình",
        "region": "Đồng bằng sông Hồng",
        "provinceCode": 37,
        "country": "Việt Nam",
        "coverImage": "https://static.example.com/destination-5.jpg",
        "visualMatch": 93,
        "seasonMatch": 95,
        "budgetMatch": 98,
        "estimatedCost": {
          "amount": 3900000,
          "currency": "VND",
          "basis": "per_person"
        },
        "duration": {
          "days": 2,
          "nights": 1,
          "label": "2 ngày / 1 đêm"
        },
        "transport": {
          "level": "Rất dễ dàng"
        },
        "goldenHour": "05:30–07:00 hoặc 16:30–17:30; tùy điều kiện thực tế",
        "bestMoments": {
          "peakHours": "05:30–07:00",
          "sunDirection": "Ánh sáng từ phía Đông",
          "weatherSuitability": 82,
          "crowdLevel": "Thấp vào sáng sớm",
          "dailyForecast": [
            {
              "date": "2026-11-18",
              "day": "18 Th11",
              "score": 89
            },
            {
              "date": "2026-11-19",
              "day": "19 Th11",
              "score": 74
            },
            {
              "date": "2026-11-20",
              "day": "20 Th11",
              "score": 51
            },
            {
              "date": "2026-11-21",
              "day": "21 Th11",
              "score": 79
            }
          ],
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "realityCheck": {
          "confidence": 84,
          "expectationImage": "https://static.example.com/expectation-5.jpg",
          "expectationDesc": "Cảnh quan yên tĩnh trong ảnh cảm hứng.",
          "realityImage": "https://static.example.com/reality-5.jpg",
          "realityDesc": "Cảnh quan mùa đi; trải nghiệm phụ thuộc thời tiết và lượng khách.",
          "keyPoints": [
            "Kiểm tra điều kiện trước khi khởi hành",
            "Ưu tiên thời điểm ít đông",
            "Chuẩn bị trang phục phù hợp địa hình"
          ]
        }
      }
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.period.label` | string | 🟥 | period.from/to=null khi qua v1 | Chưa tính tháng tới và timezone. |
| `data.period.startDate` | string | 🟥 | period.from/to=null khi qua v1 | Chưa tính tháng tới và timezone. |
| `data.period.endDate` | string | 🟥 | period.from/to=null khi qua v1 | Chưa tính tháng tới và timezone. |
| `data.period.timezone` | string | 🟥 | period.from/to=null khi qua v1 | Chưa tính tháng tới và timezone. |
| `data.items[].id` | string | 🟨 | items[].id=slug | ID hợp lệ nếu chuẩn hóa catalog/link; khác ID minh họa không tự là thiếu. |
| `data.items[].name` | string | 🟩 | name | Có field và xử lý tương ứng trong source. |
| `data.items[].region` | string | 🟨 | region=admin_name | Cần xác nhận nhãn vùng, không mặc nhiên bằng tên tỉnh. |
| `data.items[].provinceCode` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].country` | string | 🟨 | country=Vietnam | Đổi label tại FE. |
| `data.items[].coverImage` | string | 🟥 | imageUrl=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].visualMatch` | number | 🟥 | visualMatchPct=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].seasonMatch` | number | 🟥 | seasonMatchPct=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].budgetMatch` | number | 🟥 | budgetMatchPct=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].estimatedCost.amount` | number | 🟥 | estimatedCostVnd=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].estimatedCost.currency` | string | 🟥 | estimatedCostVnd=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].estimatedCost.basis` | string | 🟥 | estimatedCostVnd=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].duration.days` | number | 🟥 | durationDays=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].duration.nights` | number | 🟥 | durationDays=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].duration.label` | string | 🟥 | durationDays=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].transport.level` | string | 🟥 | transportSummary=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].goldenHour` | string | 🟥 | goldenHour=null | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].bestMoments.peakHours` | string | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].bestMoments.sunDirection` | string | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].bestMoments.weatherSuitability` | number | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].bestMoments.crowdLevel` | string | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].bestMoments.dailyForecast[].date` | string | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].bestMoments.dailyForecast[].day` | string | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].bestMoments.dailyForecast[].score` | number | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].bestMoments.basis` | string | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].bestMoments.asOf` | string | 🟥 | bestMoments=null | Chưa có dữ liệu thời điểm, cơ sở/asOf và điểm phù hợp theo ngày. Không dùng dự báo ngoài cửa sổ provider. |
| `data.items[].realityCheck.confidence` | number | 🟥 | realityCheck=null | Chưa có kỳ vọng/thực tế, ảnh và confidence/notes. |
| `data.items[].realityCheck.expectationImage` | string | 🟥 | realityCheck=null | Chưa có kỳ vọng/thực tế, ảnh và confidence/notes. |
| `data.items[].realityCheck.expectationDesc` | string | 🟥 | realityCheck=null | Chưa có kỳ vọng/thực tế, ảnh và confidence/notes. |
| `data.items[].realityCheck.realityImage` | string | 🟥 | realityCheck=null | Chưa có kỳ vọng/thực tế, ảnh và confidence/notes. |
| `data.items[].realityCheck.realityDesc` | string | 🟥 | realityCheck=null | Chưa có kỳ vọng/thực tế, ảnh và confidence/notes. |
| `data.items[].realityCheck.keyPoints[]` | string | 🟥 | realityCheck=null | Chưa có kỳ vọng/thực tế, ảnh và confidence/notes. |

<a id="api-26"></a>

### API-26 — Nút Phản hồi & Báo lỗi trên website

- **FE mong muốn:** `POST /api/v1/feedback`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4639).
- **BE đối chiếu:** `POST /api/v1/feedback` — [main.py:990](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:990) · [models.py:62](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:62) · [main.py:685](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:685) · [main.py:155](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:155).
- **Kết luận:** Feedback hiện require_session, model không có liên hệ guest. category/severity FE đề xuất cần phân biệt gợi ý user và phân loại staff; không ép server tin user. Không hứa theo dõi guest qua email.

#### Request mong muốn

```json
{
  "body": {
    "category": "ux_issue",
    "severity": "high",
    "subject": "Không thấy nút xác nhận trên máy tính bảng",
    "description": "Thanh công cụ che nút xác nhận khi xem màn hình dọc.",
    "userName": "Nguyễn Minh An",
    "userEmail": "minhan.demo@gmail.com",
    "routeOrigin": "/planner"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.category` | string | 🟨 | Không nhận tại create | Cần chốt đây là phân loại người gửi đề xuất hay staff chính thức; không cho client tự quyết phân loại chính thức. |
| `body.severity` | string | 🟨 | Không nhận tại create | Tương tự category; có thể nhận như gợi ý riêng hoặc bỏ khỏi FE request sau chốt. |
| `body.subject` | string | 🟩 | subject | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.description` | string | 🟩 | description | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.userName` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `body.userEmail` | string | 🟥 | Không có | Chưa có field/năng lực tương ứng trong route đã đối chiếu. |
| `body.routeOrigin` | string | 🟨 | route_origin | Đổi tên; StrictModel không nhận routeOrigin. |

#### Response JSON mong muốn

```json
{
  "data": {
    "ticket": {
      "id": "FB-NEW-01",
      "subject": "Không thấy nút xác nhận trên máy tính bảng",
      "description": "Thanh công cụ che nút xác nhận khi xem màn hình dọc.",
      "userName": "Nguyễn Minh An",
      "userEmail": "minhan.demo@gmail.com",
      "category": "ux_issue",
      "severity": "high",
      "status": "unassigned",
      "createdAt": "2026-10-07T00:30:00+07:00",
      "routeOrigin": "/planner",
      "staffReplies": [],
      "userAnswerRating": null,
      "ratingFeedback": null
    }
  },
  "message": "Đã tiếp nhận phản hồi."
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.ticket.id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.ticket.subject` | string | 🟩 | subject | Có field và xử lý tương ứng trong source. |
| `data.ticket.description` | string | 🟩 | description | Có field và xử lý tương ứng trong source. |
| `data.ticket.userName` | string | 🟥 | Không hydrate users/full_name | Cần trả danh tính người gửi hoặc liên hệ guest đã lưu. |
| `data.ticket.userEmail` | string | 🟥 | Không hydrate users/email | Cần trả liên hệ được phép; không lộ người khác. |
| `data.ticket.category` | string | 🟩 | category | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.ticket.severity` | string | 🟩 | severity | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.ticket.status` | string | 🟨 | status | Có các trạng thái đang dùng nhưng enum chưa hỗ trợ closed. |
| `data.ticket.createdAt` | string | 🟩 | createdAt | Có field và xử lý tương ứng trong source. |
| `data.ticket.routeOrigin` | string | 🟩 | routeOrigin | Có field và xử lý tương ứng trong source. |
| `data.ticket.staffReplies[]` | array | 🟨 | replies[] | Mảng rỗng trước reply là hợp lệ. |
| `data.ticket.userAnswerRating` | null (mẫu) | 🟩 | userAnswerRating | Có field và xử lý tương ứng trong source. |
| `data.ticket.ratingFeedback` | null (mẫu) | 🟨 | ratingComment | Đổi tên. |
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-27"></a>

### API-27 — /profile → Phản hồi của tôi; danh sách và chi tiết

- **FE mong muốn:** `GET /api/v1/me/feedback`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4669).
- **BE đối chiếu:** `GET /api/v1/feedback/me` — [main.py:994](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:994) · [main.py:155](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:155).
- **Kết luận:** Phiếu/replies/pagination cá nhân đã có; thiếu tên/email người gửi, senderName. Wrapper replies→staffReplies có thể mapper.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "items": [
      {
        "id": "FB-1001",
        "subject": "Không thấy nút xác nhận trên máy tính bảng",
        "description": "Thanh công cụ che nút xác nhận khi xem màn hình dọc.",
        "userName": "Nguyễn Minh An",
        "userEmail": "minhan.demo@gmail.com",
        "category": "ux_issue",
        "severity": "high",
        "status": "answered",
        "createdAt": "2026-10-06T09:15:00+07:00",
        "routeOrigin": "/planner",
        "staffReplies": [
          {
            "id": "REP-101",
            "senderName": "Nhân viên hỗ trợ",
            "senderRole": "support",
            "timestamp": "2026-10-06T10:30:00+07:00",
            "message": "Đã ghi nhận và hướng dẫn mở rộng khu vực lịch trình."
          }
        ],
        "userAnswerRating": 5,
        "ratingFeedback": "Hướng dẫn rõ ràng."
      }
    ],
    "total": 1
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.items[].id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.items[].subject` | string | 🟩 | subject | Có field và xử lý tương ứng trong source. |
| `data.items[].description` | string | 🟩 | description | Có field và xử lý tương ứng trong source. |
| `data.items[].userName` | string | 🟥 | Không hydrate users/full_name | Cần trả danh tính người gửi hoặc liên hệ guest đã lưu. |
| `data.items[].userEmail` | string | 🟥 | Không hydrate users/email | Cần trả liên hệ được phép; không lộ người khác. |
| `data.items[].category` | string | 🟩 | category | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.items[].severity` | string | 🟩 | severity | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.items[].status` | string | 🟨 | status | Có các trạng thái đang dùng nhưng enum chưa hỗ trợ closed. |
| `data.items[].createdAt` | string | 🟩 | createdAt | Có field và xử lý tương ứng trong source. |
| `data.items[].routeOrigin` | string | 🟩 | routeOrigin | Có field và xử lý tương ứng trong source. |
| `data.items[].staffReplies[].id` | string | 🟨 | replies[].id | Đổi tên mảng. |
| `data.items[].staffReplies[].senderName` | string | 🟥 | Chỉ join sender_role | Chưa join tên người trả lời. |
| `data.items[].staffReplies[].senderRole` | string | 🟨 | replies[].senderRole | role staff/admin khác ví dụ support; chốt nhãn/enum. |
| `data.items[].staffReplies[].timestamp` | string | 🟨 | replies[].createdAt | Đổi tên. |
| `data.items[].staffReplies[].message` | string | 🟨 | replies[].message | Đổi tên mảng. |
| `data.items[].userAnswerRating` | number | 🟩 | userAnswerRating | Có field và xử lý tương ứng trong source. |
| `data.items[].ratingFeedback` | string | 🟨 | ratingComment | Đổi tên. |
| `data.total` | number | 🟩 | total | Có field và xử lý tương ứng trong source. |

<a id="api-28"></a>

### API-28 — /profile → Đánh giá câu trả lời hỗ trợ

- **FE mong muốn:** `PUT /api/v1/me/feedback/{ticketId}/answer-rating`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:4699).
- **BE đối chiếu:** `POST /api/v1/feedback/{ticket_id}/rating` — [main.py:999](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:999) · [main.py:708](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:708).
- **Kết luận:** Chủ phiếu và phải có staff reply; rating1–5 được lưu. ratingComment→ratingFeedback chỉ mapping.

#### Request mong muốn

```json
{
  "path": {
    "ticketId": "FB-1001"
  },
  "body": {
    "rating": 5,
    "comment": "Hướng dẫn rõ ràng."
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.ticketId` | string | 🟨 | path.item_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.rating` | number | 🟩 | rating | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.comment` | string | 🟩 | comment | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "ticketId": "FB-1001",
    "userAnswerRating": 5,
    "ratingFeedback": "Hướng dẫn rõ ràng."
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.ticketId` | string | 🟩 | ticketId | Có field và xử lý tương ứng trong source. |
| `data.userAnswerRating` | number | 🟩 | userAnswerRating | Có field và xử lý tương ứng trong source. |
| `data.ratingFeedback` | string | 🟨 | ratingComment | Đổi tên. |

<a id="api-33"></a>

### API-33 — /admin/feedback → KPI, hộp thư, chi tiết; sidebar badge

- **FE mong muốn:** `GET /api/v1/admin/feedback`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5135).
- **BE đối chiếu:** `GET /api/v1/admin/feedback` — [main.py:1055](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1055) · [main.py:721](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:721) · [main.py:155](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:155).
- **Kết luận:** V1 bỏ q/status, chưa category. Legacy counts theo toàn bộ status đã có; averageAnswerRating/ratedCount chưa tính. Không tạo API-29 riêng; counts có thể dùng cho badge/dashboard như đã họp.

#### Request mong muốn

```json
{
  "query": {
    "q": "FB-1001",
    "status": "answered",
    "category": "ux_issue",
    "page": 1,
    "pageSize": 5
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `query.q` | string | 🟥 | legacy q có | V1 hardcode q="". |
| `query.status` | string | 🟥 | legacy status có | V1 hardcode None. |
| `query.category` | string | 🟥 | Chưa có cả ở legacy | Cần filter category. |
| `query.page` | number | 🟩 | page | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `query.pageSize` | number | 🟨 | page_size | Đổi tên. |

#### Response JSON mong muốn

```json
{
  "data": {
    "summary": {
      "totalCount": 8,
      "unassignedCount": 2,
      "inProgressCount": 3,
      "answeredOrResolvedCount": 3,
      "averageAnswerRating": 4.5,
      "ratedCount": 4
    },
    "items": [
      {
        "id": "FB-1001",
        "subject": "Không thấy nút xác nhận trên máy tính bảng",
        "description": "Thanh công cụ che nút xác nhận khi xem màn hình dọc.",
        "userName": "Nguyễn Minh An",
        "userEmail": "minhan.demo@gmail.com",
        "category": "ux_issue",
        "severity": "high",
        "status": "answered",
        "createdAt": "2026-10-06T09:15:00+07:00",
        "routeOrigin": "/planner",
        "staffReplies": [
          {
            "id": "REP-101",
            "senderName": "Nhân viên hỗ trợ",
            "senderRole": "support",
            "timestamp": "2026-10-06T10:30:00+07:00",
            "message": "Đã ghi nhận và hướng dẫn mở rộng khu vực lịch trình."
          }
        ],
        "userAnswerRating": 5,
        "ratingFeedback": "Hướng dẫn rõ ràng."
      }
    ]
  },
  "pagination": {
    "page": 1,
    "pageSize": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.summary.totalCount` | number | ⬜ | sum counts | Các counts toàn bộ có sẵn; FE có thể cộng theo danh sách status chuẩn. |
| `data.summary.unassignedCount` | number | 🟨 | counts.unassigned | Đổi cấu trúc; dùng badge/dashboard API-29 theo quyết định mới. |
| `data.summary.inProgressCount` | number | 🟨 | counts.in_progress | Đổi cấu trúc. |
| `data.summary.answeredOrResolvedCount` | number | ⬜ | counts.answered + counts.resolved | FE cộng, không cần API riêng. |
| `data.summary.averageAnswerRating` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.summary.ratedCount` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.items[].subject` | string | 🟩 | subject | Có field và xử lý tương ứng trong source. |
| `data.items[].description` | string | 🟩 | description | Có field và xử lý tương ứng trong source. |
| `data.items[].userName` | string | 🟥 | Không hydrate users/full_name | Cần trả danh tính người gửi hoặc liên hệ guest đã lưu. |
| `data.items[].userEmail` | string | 🟥 | Không hydrate users/email | Cần trả liên hệ được phép; không lộ người khác. |
| `data.items[].category` | string | 🟩 | category | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.items[].severity` | string | 🟩 | severity | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.items[].status` | string | 🟨 | status | Có các trạng thái đang dùng nhưng enum chưa hỗ trợ closed. |
| `data.items[].createdAt` | string | 🟩 | createdAt | Có field và xử lý tương ứng trong source. |
| `data.items[].routeOrigin` | string | 🟩 | routeOrigin | Có field và xử lý tương ứng trong source. |
| `data.items[].staffReplies[].id` | string | 🟨 | replies[].id | Đổi tên mảng. |
| `data.items[].staffReplies[].senderName` | string | 🟥 | Chỉ join sender_role | Chưa join tên người trả lời. |
| `data.items[].staffReplies[].senderRole` | string | 🟨 | replies[].senderRole | role staff/admin khác ví dụ support; chốt nhãn/enum. |
| `data.items[].staffReplies[].timestamp` | string | 🟨 | replies[].createdAt | Đổi tên. |
| `data.items[].staffReplies[].message` | string | 🟨 | replies[].message | Đổi tên mảng. |
| `data.items[].userAnswerRating` | number | 🟩 | userAnswerRating | Có field và xử lý tương ứng trong source. |
| `data.items[].ratingFeedback` | string | 🟨 | ratingComment | Đổi tên. |
| `pagination.page` | number | 🟨 | page | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.pageSize` | number | 🟨 | pageSize | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.total` | number | 🟨 | total | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.totalPages` | number | 🟨 | totalPages | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |

<a id="api-34"></a>

### API-34 — /admin/feedback → Phân loại hoặc thay đổi trạng thái

- **FE mong muốn:** `PATCH /api/v1/admin/feedback/{ticketId}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5186).
- **BE đối chiếu:** `PATCH /api/v1/admin/feedback/{ticket_id}` — [main.py:1060](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1060) · [models.py:73](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:73) · [main.py:738](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:738) · [main.py:155](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:155).
- **Kết luận:** PATCH subset có lưu; status thiếu closed và category/severity là string chưa enum chuẩn. Reply/name các field chung còn thiếu.

#### Request mong muốn

```json
{
  "path": {
    "ticketId": "FB-1001"
  },
  "body": {
    "category": "ux_issue",
    "severity": "high",
    "status": "in_progress"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.ticketId` | string | 🟨 | path.item_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.category` | string | 🟩 | category | Có lưu; cần enum chuẩn, không nhận string tùy ý vô hạn. |
| `body.severity` | string | 🟩 | severity | Có lưu; cần enum chuẩn. |
| `body.status` | string | 🟨 | unassigned/in_progress/answered/resolved | Thiếu closed so với FE; các giá trị hiện có được lưu. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "FB-1001",
    "subject": "Không thấy nút xác nhận trên máy tính bảng",
    "description": "Thanh công cụ che nút xác nhận khi xem màn hình dọc.",
    "userName": "Nguyễn Minh An",
    "userEmail": "minhan.demo@gmail.com",
    "category": "ux_issue",
    "severity": "high",
    "status": "in_progress",
    "createdAt": "2026-10-06T09:15:00+07:00",
    "routeOrigin": "/planner",
    "staffReplies": [
      {
        "id": "REP-101",
        "senderName": "Nhân viên hỗ trợ",
        "senderRole": "support",
        "timestamp": "2026-10-06T10:30:00+07:00",
        "message": "Đã ghi nhận và hướng dẫn mở rộng khu vực lịch trình."
      }
    ],
    "userAnswerRating": 5,
    "ratingFeedback": "Hướng dẫn rõ ràng."
  },
  "message": "Đã cập nhật phiếu."
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.subject` | string | 🟩 | subject | Có field và xử lý tương ứng trong source. |
| `data.description` | string | 🟩 | description | Có field và xử lý tương ứng trong source. |
| `data.userName` | string | 🟥 | Không hydrate users/full_name | Cần trả danh tính người gửi hoặc liên hệ guest đã lưu. |
| `data.userEmail` | string | 🟥 | Không hydrate users/email | Cần trả liên hệ được phép; không lộ người khác. |
| `data.category` | string | 🟩 | category | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.severity` | string | 🟩 | severity | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.status` | string | 🟨 | status | Có các trạng thái đang dùng nhưng enum chưa hỗ trợ closed. |
| `data.createdAt` | string | 🟩 | createdAt | Có field và xử lý tương ứng trong source. |
| `data.routeOrigin` | string | 🟩 | routeOrigin | Có field và xử lý tương ứng trong source. |
| `data.staffReplies[].id` | string | 🟨 | replies[].id | Đổi tên mảng. |
| `data.staffReplies[].senderName` | string | 🟥 | Chỉ join sender_role | Chưa join tên người trả lời. |
| `data.staffReplies[].senderRole` | string | 🟨 | replies[].senderRole | role staff/admin khác ví dụ support; chốt nhãn/enum. |
| `data.staffReplies[].timestamp` | string | 🟨 | replies[].createdAt | Đổi tên. |
| `data.staffReplies[].message` | string | 🟨 | replies[].message | Đổi tên mảng. |
| `data.userAnswerRating` | number | 🟩 | userAnswerRating | Có field và xử lý tương ứng trong source. |
| `data.ratingFeedback` | string | 🟨 | ratingComment | Đổi tên. |
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-35"></a>

### API-35 — /admin/feedback → Gửi trả lời chính thức

- **FE mong muốn:** `POST /api/v1/admin/feedback/{ticketId}/replies`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5221).
- **BE đối chiếu:** `POST /api/v1/admin/feedback/{ticket_id}/replies` — [main.py:1065](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1065) · [main.py:751](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:751) · [main.py:155](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:155).
- **Kết luận:** Reply lấy sender từ session, status→answered đúng; chưa trả senderName. PDF dùng browser print.

#### Request mong muốn

```json
{
  "path": {
    "ticketId": "FB-1001"
  },
  "body": {
    "message": "Đã cập nhật hướng dẫn sử dụng nút xác nhận."
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.ticketId` | string | 🟨 | path.item_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.message` | string | 🟩 | message | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "ticket": {
      "id": "FB-1001",
      "subject": "Không thấy nút xác nhận trên máy tính bảng",
      "description": "Thanh công cụ che nút xác nhận khi xem màn hình dọc.",
      "userName": "Nguyễn Minh An",
      "userEmail": "minhan.demo@gmail.com",
      "category": "ux_issue",
      "severity": "high",
      "status": "answered",
      "createdAt": "2026-10-06T09:15:00+07:00",
      "routeOrigin": "/planner",
      "staffReplies": [
        {
          "id": "REP-101",
          "senderName": "Nhân viên hỗ trợ",
          "senderRole": "support",
          "timestamp": "2026-10-06T10:30:00+07:00",
          "message": "Đã ghi nhận và hướng dẫn mở rộng khu vực lịch trình."
        },
        {
          "id": "REP-102",
          "senderName": "Nhân viên hỗ trợ",
          "senderRole": "support",
          "timestamp": "2026-10-07T00:35:00+07:00",
          "message": "Đã cập nhật hướng dẫn sử dụng nút xác nhận."
        }
      ],
      "userAnswerRating": 5,
      "ratingFeedback": "Hướng dẫn rõ ràng."
    }
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.ticket.id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.ticket.subject` | string | 🟩 | subject | Có field và xử lý tương ứng trong source. |
| `data.ticket.description` | string | 🟩 | description | Có field và xử lý tương ứng trong source. |
| `data.ticket.userName` | string | 🟥 | Không hydrate users/full_name | Cần trả danh tính người gửi hoặc liên hệ guest đã lưu. |
| `data.ticket.userEmail` | string | 🟥 | Không hydrate users/email | Cần trả liên hệ được phép; không lộ người khác. |
| `data.ticket.category` | string | 🟩 | category | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.ticket.severity` | string | 🟩 | severity | Có cột và staff PATCH; null lúc chưa phân loại là hợp lệ. |
| `data.ticket.status` | string | 🟨 | status | Có các trạng thái đang dùng nhưng enum chưa hỗ trợ closed. |
| `data.ticket.createdAt` | string | 🟩 | createdAt | Có field và xử lý tương ứng trong source. |
| `data.ticket.routeOrigin` | string | 🟩 | routeOrigin | Có field và xử lý tương ứng trong source. |
| `data.ticket.staffReplies[].id` | string | 🟨 | replies[].id | Đổi tên mảng. |
| `data.ticket.staffReplies[].senderName` | string | 🟥 | Chỉ join sender_role | Chưa join tên người trả lời. |
| `data.ticket.staffReplies[].senderRole` | string | 🟨 | replies[].senderRole | role staff/admin khác ví dụ support; chốt nhãn/enum. |
| `data.ticket.staffReplies[].timestamp` | string | 🟨 | replies[].createdAt | Đổi tên. |
| `data.ticket.staffReplies[].message` | string | 🟨 | replies[].message | Đổi tên mảng. |
| `data.ticket.userAnswerRating` | number | 🟩 | userAnswerRating | Có field và xử lý tương ứng trong source. |
| `data.ticket.ratingFeedback` | string | 🟨 | ratingComment | Đổi tên. |

<a id="api-36"></a>

### API-36 — /admin/system → Trace Logs; /admin → Xem tất cả

- **FE mong muốn:** `GET /api/v1/admin/traces`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5268).
- **BE đối chiếu:** `GET /api/v1/admin/traces` — [main.py:1070](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1070) · [main.py:865](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:865).
- **Kết luận:** Pagination trace đã có; chưa filter status/latency threshold. Có đọc table trace, nhưng chưa thấy producer insert trace trong luồng trip/chat/evaluation đang đọc; không gọi đây là log đầy đủ chỉ vì có GET.

#### Request mong muốn

```json
{
  "query": {
    "status": "WARNING",
    "page": 1,
    "pageSize": 5
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `query.status` | string | 🟥 | Không query/filter status | Không lọc ALL/SUCCESS/WARNING/LATENCY_SPIKE. |
| `query.page` | number | 🟩 | page | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `query.pageSize` | number | 🟨 | page_size | Đổi tên. |

#### Response JSON mong muốn

```json
{
  "data": {
    "items": [
      {
        "id": "TRACE-101",
        "timestamp": "2026-10-07T00:15:00+07:00",
        "traceType": "Microclimate RAG",
        "latencyMs": 1420,
        "confidence": 93.8,
        "status": "WARNING",
        "context": "Điều chỉnh thời gian ngắm cảnh theo dữ liệu thời tiết."
      }
    ],
    "totalCount": 20,
    "latencySpikeThresholdMs": 2000
  },
  "pagination": {
    "page": 1,
    "pageSize": 5,
    "total": 3,
    "totalPages": 1
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.items[].id` | string | 🟩 | items[].id | Có field và xử lý tương ứng trong source. |
| `data.items[].timestamp` | string | 🟩 | items[].timestamp | Có field và xử lý tương ứng trong source. |
| `data.items[].traceType` | string | 🟩 | items[].traceType | Có field và xử lý tương ứng trong source. |
| `data.items[].latencyMs` | number | 🟩 | items[].latencyMs | Có field và xử lý tương ứng trong source. |
| `data.items[].confidence` | number | 🟩 | items[].confidence | Có field và xử lý tương ứng trong source. |
| `data.items[].status` | string | 🟨 | DB string không enum | Chốt uppercase code, đặc biệt LATENCY_SPIKE. |
| `data.items[].context` | string | 🟨 | context=json.loads(context_json) | FE cần text; BE có thể trả object, cần schema/summary. |
| `data.totalCount` | number | 🟨 | total | Đổi tên. |
| `data.latencySpikeThresholdMs` | number | 🟥 | Không có | Có thể là cấu hình FE nếu hai bên chốt cùng ngưỡng, không tự đoán. |
| `pagination.page` | number | 🟨 | page | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.pageSize` | number | 🟨 | pageSize | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.total` | number | 🟨 | total | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |
| `pagination.totalPages` | number | 🟨 | totalPages | BE có pagination ở root, FE đặt pagination object; chỉ đổi cấu trúc. |

<a id="api-37"></a>

### API-37 — /admin/system → modal chi tiết trace; link traceId từ /admin

- **FE mong muốn:** `GET /api/v1/admin/traces/{traceId}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5297).
- **BE đối chiếu:** `GET /api/v1/admin/traces/{trace_id}` — [main.py:1075](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1075) · [main.py:878](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:878).
- **Kết luận:** details_json/context_json được trả nguyên; chưa có schema/producer bảo đảm inputSummary/retrievedSources/decisionImpact. Đọc deep link theo ID đã có, cần che PII/secret trong producer/projection.

#### Request mong muốn

```json
{
  "path": {
    "traceId": "TRACE-101"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.traceId` | string | 🟨 | path.trace_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "TRACE-101",
    "timestamp": "2026-10-07T00:15:00+07:00",
    "traceType": "Microclimate RAG",
    "latencyMs": 1420,
    "confidence": 93.8,
    "status": "WARNING",
    "context": "Điều chỉnh thời gian ngắm cảnh theo dữ liệu thời tiết.",
    "details": {
      "inputSummary": "Du khách muốn ngắm cảnh sáng sớm.",
      "retrievedSources": [
        "Tham chiếu khí hậu địa phương",
        "Kinh nghiệm thực địa"
      ],
      "decisionImpact": "Điều chỉnh khung giờ đề xuất."
    }
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟩 | id | Có field và xử lý tương ứng trong source. |
| `data.timestamp` | string | 🟩 | timestamp | Có field và xử lý tương ứng trong source. |
| `data.traceType` | string | 🟩 | traceType | Có field và xử lý tương ứng trong source. |
| `data.latencyMs` | number | 🟩 | latencyMs | Có field và xử lý tương ứng trong source. |
| `data.confidence` | number | 🟩 | confidence | Có field và xử lý tương ứng trong source. |
| `data.status` | string | 🟨 | DB status:string | Chốt enum. |
| `data.context` | string | 🟨 | context_json:any | Chốt kiểu text/summary. |
| `data.details.inputSummary` | string | 🟨 | details_json:any | Trả details thô nhưng không có producer/schema bảo đảm key này. |
| `data.details.retrievedSources[]` | string | 🟨 | details_json:any | Không đảm bảo string[] hoặc schema. |
| `data.details.decisionImpact` | string | 🟨 | details_json:any | Không có producer bảo đảm field này. |

<a id="api-38"></a>

### API-38 — /admin/system → Trạng thái API, nút Kiểm tra

- **FE mong muốn:** `GET /health`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5320).
- **BE đối chiếu:** `GET /health` — [main.py:130](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:130).
- **Kết luận:** Health đã đủ status/version; chỉ đưa vào để xác nhận không cần giao bổ sung. Số version khác ví dụ không là field gap.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `status` | string | 🟩 | status=ok | Có field và xử lý tương ứng trong source. |
| `version` | string | 🟩 | version | Có field và xử lý tương ứng trong source. |

<a id="api-39"></a>

### API-39 — /admin/system → 4 KPI và 2 nhóm Benchmark

- **FE mong muốn:** `GET /api/v1/admin/system/metrics`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5324).
- **BE đối chiếu:** `GET /api/v1/admin/system/metrics` — [main.py:1079](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:1079) · [main.py:858](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:858).
- **Kết luận:** metrics alias trả system_summary: availabilityPct=null, latency avg/p95=null, planAcceptancePct=null, benchmarkGroups=[]. Không có các phép đo trong contract UI. Trả unavailable có basis/asOf rõ nếu chưa đo; không dùng mock làm live.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "measurementMonth": "2026-10",
    "asOf": "2026-10-07T00:20:00+07:00",
    "basis": "illustrative_example",
    "experienceUsers": 1240,
    "experienceUsersWeekGrowthPercent": 18,
    "planAcceptanceRate": {
      "value": 95.2,
      "unit": "percent",
      "subtext": "Khớp ý định thực tế"
    },
    "planningTimeOptimization": {
      "value": 70,
      "unit": "percent",
      "subtext": "So với quy trình đối chứng"
    },
    "orchestrationLatencyP95Ms": 1420,
    "orchestrationSlaMs": 2000,
    "retrievalConfidencePercent": 93.8,
    "clipCosineSimilarityPercent": 94.6,
    "microclimateGroundingPercent": 91.2,
    "geoRoutingSatisfiedPercent": 96.8,
    "realityCheckAccuracyPercent": 88.4,
    "automatedEvaluationStatus": "passed",
    "paceCoherencePercent": 93.1,
    "hallucinationRatePercent": 0.4,
    "hallucinationRateComparator": "lt",
    "explicitConfirmIntegrityPercent": 100,
    "intentRetentionPercent": 95.2
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.measurementMonth` | string | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.asOf` | string | 🟨 | checkedAt | Chỉ thời điểm đọc API, chưa thời điểm dữ liệu đo. |
| `data.basis` | string | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.experienceUsers` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.experienceUsersWeekGrowthPercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.planAcceptanceRate.value` | number | 🟥 | planAcceptancePct=null | Không có phép đo/value/subtext thực. |
| `data.planAcceptanceRate.unit` | string | 🟥 | planAcceptancePct=null | Không có phép đo/value/subtext thực. |
| `data.planAcceptanceRate.subtext` | string | 🟥 | planAcceptancePct=null | Không có phép đo/value/subtext thực. |
| `data.planningTimeOptimization.value` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.planningTimeOptimization.unit` | string | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.planningTimeOptimization.subtext` | string | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.orchestrationLatencyP95Ms` | number | 🟥 | aiResponseLatencyMs.p95=null | Không có phép đo orchestration tương ứng. |
| `data.orchestrationSlaMs` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.retrievalConfidencePercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.clipCosineSimilarityPercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.microclimateGroundingPercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.geoRoutingSatisfiedPercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.realityCheckAccuracyPercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.automatedEvaluationStatus` | string | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.paceCoherencePercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.hallucinationRatePercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.hallucinationRateComparator` | string | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.explicitConfirmIntegrityPercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.intentRetentionPercent` | number | 🟥 | Không có | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |

<a id="api-40"></a>

### API-40 — /admin/content → Intro/Hero/Dị ứng, bảng và form chỉnh sửa

- **FE mong muốn:** `GET /api/v1/admin/content`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5362).
- **BE đối chiếu:** `GET /admin/content` — [main.py:763](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:763) · [main.py:763](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:763).
- **Kết luận:** Admin trả payload JSON đã lưu nên nhiều field có thể roundtrip. Chưa schema/default đủ để bảo đảm toàn bộ item, chưa sync public catalog/landing. Intro không có create UI nên cần seed hoặc dữ liệu ban đầu theo scope đã chốt.

#### Request mong muốn

Không có JSON body/query trong mẫu FE. Cookie/HTTP được gửi theo quy ước session; không gửi userId/role.

#### Đánh dấu field request

⬜ Không có field JSON request cần bổ sung ở mẫu này.

#### Response JSON mong muốn

```json
{
  "data": {
    "introDestinations": [
      {
        "id": "intro-1",
        "label": "Lào Cai",
        "provinceCode": 10,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-1.jpg",
        "order": 1,
        "active": true
      },
      {
        "id": "intro-2",
        "label": "Lâm Đồng",
        "provinceCode": 68,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-2.jpg",
        "order": 2,
        "active": true
      },
      {
        "id": "intro-3",
        "label": "Ninh Bình",
        "provinceCode": 37,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-3.jpg",
        "order": 3,
        "active": true
      },
      {
        "id": "intro-4",
        "label": "Quảng Bình",
        "provinceCode": 44,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-4.jpg",
        "order": 4,
        "active": true
      },
      {
        "id": "intro-5",
        "label": "Đà Nẵng",
        "provinceCode": 48,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-5.jpg",
        "order": 5,
        "active": true
      },
      {
        "id": "intro-6",
        "label": "Hà Giang",
        "provinceCode": 2,
        "tagline": "Cảnh quan và trải nghiệm bản địa",
        "image": "https://static.example.com/intro-6.jpg",
        "order": 6,
        "active": true
      }
    ],
    "heroPlans": [
      {
        "id": "hero-01",
        "title": "Sương sớm Mường Hoa & Săn mây Ô Quy Hồ",
        "destination": "Sa Pa, Lào Cai",
        "provinceCode": 10,
        "duration": "4 ngày / 3 đêm",
        "budget": "7.400.000 VND / người",
        "image": "https://static.example.com/sapa-hero.jpg",
        "summary": "Hành trình thư thái, ngắm cảnh và khám phá văn hóa địa phương.",
        "highlights": [
          "Ngắm cảnh",
          "Nghỉ dưỡng"
        ],
        "active": true
      }
    ],
    "allergyOptions": [
      {
        "id": "allergy-seafood",
        "label": "Hải sản & Tôm cua",
        "active": true
      },
      {
        "id": "allergy-peanut",
        "label": "Đậu phộng",
        "active": false
      }
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.introDestinations[].id` | string | 🟩 | introDestinations[].id | Có field và xử lý tương ứng trong source. |
| `data.introDestinations[].label` | string | 🟨 | content_items.payload_json | Có field nếu payload đã lưu; chưa có route/seed đảm bảo 6 Intro và mapping code/image. |
| `data.introDestinations[].provinceCode` | number | 🟨 | content_items.payload_json | Có field nếu payload đã lưu; chưa có route/seed đảm bảo 6 Intro và mapping code/image. |
| `data.introDestinations[].tagline` | string | 🟨 | content_items.payload_json | Có field nếu payload đã lưu; chưa có route/seed đảm bảo 6 Intro và mapping code/image. |
| `data.introDestinations[].image` | string | 🟨 | content_items.payload_json | Có field nếu payload đã lưu; chưa có route/seed đảm bảo 6 Intro và mapping code/image. |
| `data.introDestinations[].order` | number | 🟩 | introDestinations[].order | Có field và xử lý tương ứng trong source. |
| `data.introDestinations[].active` | boolean | 🟩 | introDestinations[].active | Có field và xử lý tương ứng trong source. |
| `data.heroPlans[].id` | string | 🟩 | heroPlans[].id | Có field và xử lý tương ứng trong source. |
| `data.heroPlans[].title` | string | 🟨 | content_items.payload_json | Roundtrip được field đã gửi nhưng chưa bảo đảm schema/default đầy đủ, xem API-42/43. |
| `data.heroPlans[].destination` | string | 🟨 | content_items.payload_json | Roundtrip được field đã gửi nhưng chưa bảo đảm schema/default đầy đủ, xem API-42/43. |
| `data.heroPlans[].provinceCode` | number | 🟨 | content_items.payload_json | Roundtrip được field đã gửi nhưng chưa bảo đảm schema/default đầy đủ, xem API-42/43. |
| `data.heroPlans[].duration` | string | 🟨 | content_items.payload_json | Roundtrip được field đã gửi nhưng chưa bảo đảm schema/default đầy đủ, xem API-42/43. |
| `data.heroPlans[].budget` | string | 🟨 | content_items.payload_json | Roundtrip được field đã gửi nhưng chưa bảo đảm schema/default đầy đủ, xem API-42/43. |
| `data.heroPlans[].image` | string | 🟨 | content_items.payload_json | Roundtrip được field đã gửi nhưng chưa bảo đảm schema/default đầy đủ, xem API-42/43. |
| `data.heroPlans[].summary` | string | 🟨 | content_items.payload_json | Roundtrip được field đã gửi nhưng chưa bảo đảm schema/default đầy đủ, xem API-42/43. |
| `data.heroPlans[].highlights[]` | string | 🟨 | content_items.payload_json | Roundtrip được field đã gửi nhưng chưa bảo đảm schema/default đầy đủ, xem API-42/43. |
| `data.heroPlans[].active` | boolean | 🟩 | heroPlans[].active | Có field và xử lý tương ứng trong source. |
| `data.allergyOptions[].id` | string | 🟩 | allergyOptions[].id | Có field và xử lý tương ứng trong source. |
| `data.allergyOptions[].label` | string | 🟩 | payload.label | Có field và xử lý tương ứng trong source. |
| `data.allergyOptions[].active` | boolean | 🟩 | allergyOptions[].active | Có field và xử lý tương ứng trong source. |

<a id="api-41"></a>

### API-41 — /admin/content → sửa/bật/tắt thẻ Intro; / → điểm đến nổi bật

- **FE mong muốn:** `PATCH /api/v1/admin/content/intro-destinations/{id}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5451).
- **BE đối chiếu:** `PATCH /admin/content/intro-destinations/{item_id}` — [main.py:787](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:787) · [main.py:787](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:787).
- **Kết luận:** Có lưu arbitrary payload và metadata active/order, nhưng chưa validate fields required/province/URL. Sửa intro không đồng bộ public vì public đọc nguồn khác.

#### Request mong muốn

```json
{
  "path": {
    "id": "intro-1"
  },
  "body": {
    "label": "Lào Cai",
    "tagline": "Cảnh quan và văn hóa vùng cao",
    "provinceCode": 10,
    "order": 1,
    "image": "https://static.example.com/intro-1.jpg",
    "active": true
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.id` | string | 🟨 | path.item_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.label` | string | 🟨 | payload.label | Có lưu qua dict; chưa validate required/non-empty. |
| `body.tagline` | string | 🟩 | payload.tagline | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.provinceCode` | number | 🟨 | payload.provinceCode | Có lưu nhưng chưa validate catalog tỉnh/ID. |
| `body.order` | number | 🟩 | payload.order → sort_order | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.image` | string | 🟨 | payload.image | Có lưu nhưng chưa validate URL/required. |
| `body.active` | boolean | 🟩 | payload.active → active | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "intro-1",
    "label": "Lào Cai",
    "provinceCode": 10,
    "tagline": "Cảnh quan và văn hóa vùng cao",
    "image": "https://static.example.com/intro-1.jpg",
    "order": 1,
    "active": true
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟨 | item.id | Đổi cấu trúc. |
| `data.label` | string | 🟨 | item.label | Có payload nếu đã nhập. |
| `data.provinceCode` | number | 🟨 | item.provinceCode | Có payload, chưa validate/mapping catalog. |
| `data.tagline` | string | 🟨 | item.tagline | Có payload nếu đã nhập. |
| `data.image` | string | 🟨 | item.image | Có payload nếu đã nhập. |
| `data.order` | number | 🟨 | item.order | Đổi cấu trúc. |
| `data.active` | boolean | 🟨 | item.active | Đổi cấu trúc. |

<a id="api-42"></a>

### API-42 — /admin/content → Thêm kế hoạch Hero; / → Carousel

- **FE mong muốn:** `POST /api/v1/admin/content/hero-plans`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5474).
- **BE đối chiếu:** `POST /admin/content/hero-plans` — [main.py:774](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:774) · [main.py:774](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:774).
- **Kết luận:** Chỉ validate title. Field destination/image bắt buộc chưa được validate; provinceCode/highlights có trong response FE nhưng không có input và server chưa default/resolve.

#### Request mong muốn

```json
{
  "body": {
    "title": "Sương sớm Mường Hoa & Săn mây Ô Quy Hồ",
    "destination": "Sa Pa, Lào Cai",
    "duration": "4 ngày / 3 đêm",
    "budget": "7.400.000 VND / người",
    "image": "https://static.example.com/sapa-hero.jpg",
    "summary": "Hành trình thư thái, ngắm cảnh và khám phá văn hóa địa phương."
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.title` | string | 🟩 | payload.title | Có kiểm tra title không rỗng. |
| `body.destination` | string | 🟨 | payload.destination | Có lưu; chưa validate bắt buộc. |
| `body.duration` | string | 🟩 | payload.duration | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.budget` | string | 🟩 | payload.budget | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.image` | string | 🟨 | payload.image | Có lưu; chưa validate URL/required. |
| `body.summary` | string | 🟩 | payload.summary | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "hero-01",
    "title": "Sương sớm Mường Hoa & Săn mây Ô Quy Hồ",
    "destination": "Sa Pa, Lào Cai",
    "provinceCode": 10,
    "duration": "4 ngày / 3 đêm",
    "budget": "7.400.000 VND / người",
    "image": "https://static.example.com/sapa-hero.jpg",
    "summary": "Hành trình thư thái, ngắm cảnh và khám phá văn hóa địa phương.",
    "highlights": [
      "Ngắm cảnh",
      "Nghỉ dưỡng"
    ],
    "active": true
  },
  "message": "Đã thêm kế hoạch Hero."
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟨 | item.id | Đổi cấu trúc. |
| `data.title` | string | 🟨 | item.title | Có payload. |
| `data.destination` | string | 🟨 | item.destination | Có payload. |
| `data.provinceCode` | number | 🟥 | Không có trong mẫu POST/không resolve | Server chưa map destination→provinceCode mặc định. |
| `data.duration` | string | 🟨 | item.duration | Có payload. |
| `data.budget` | string | 🟨 | item.budget | Có payload. |
| `data.image` | string | 🟨 | item.image | Có payload. |
| `data.summary` | string | 🟨 | item.summary | Có payload. |
| `data.highlights[]` | string | 🟥 | Không có default | Không có input highlights trên UI nên server cần default/catalog nếu UI vẫn hiển thị. |
| `data.active` | boolean | 🟨 | item.active=true | Đổi cấu trúc. |
| `message` | string | ⬜ | Copy thông báo FE / message ở action | Thông báo hiển thị có thể FE xử lý theo HTTP status. |

<a id="api-43"></a>

### API-43 — /admin/content → sửa/bật/tắt kế hoạch Hero

- **FE mong muốn:** `PATCH /api/v1/admin/content/hero-plans/{id}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5501).
- **BE đối chiếu:** `PATCH /admin/content/hero-plans/{item_id}` — [main.py:787](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:787) · [main.py:787](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:787).
- **Kết luận:** Có merge PATCH và metadata active; không validate title/destination/image sau PATCH. Giữ fields cũ khi toggle là đúng, nhưng dữ liệu thiếu sẵn vẫn thiếu.

#### Request mong muốn

```json
{
  "path": {
    "id": "hero-01"
  },
  "body": {
    "title": "Sương sớm Mường Hoa & Săn mây Ô Quy Hồ",
    "destination": "Sa Pa, Lào Cai",
    "duration": "4 ngày / 3 đêm",
    "budget": "7.400.000 VND / người",
    "image": "https://static.example.com/sapa-hero.jpg",
    "summary": "Hành trình thư thái, ngắm cảnh và khám phá văn hóa địa phương.",
    "active": false
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.id` | string | 🟨 | path.item_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.title` | string | 🟨 | payload.title | Lưu qua dict; PATCH chưa enforce title không rỗng. |
| `body.destination` | string | 🟨 | payload.destination | Lưu qua dict; chưa enforce required. |
| `body.duration` | string | 🟩 | payload.duration | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.budget` | string | 🟩 | payload.budget | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.image` | string | 🟨 | payload.image | Lưu qua dict; chưa enforce required/URL. |
| `body.summary` | string | 🟩 | payload.summary | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.active` | boolean | 🟩 | active | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "hero-01",
    "title": "Sương sớm Mường Hoa & Săn mây Ô Quy Hồ",
    "destination": "Sa Pa, Lào Cai",
    "provinceCode": 10,
    "duration": "4 ngày / 3 đêm",
    "budget": "7.400.000 VND / người",
    "image": "https://static.example.com/sapa-hero.jpg",
    "summary": "Hành trình thư thái, ngắm cảnh và khám phá văn hóa địa phương.",
    "highlights": [
      "Ngắm cảnh",
      "Nghỉ dưỡng"
    ],
    "active": false
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟨 | item.id | Đổi cấu trúc. |
| `data.title` | string | 🟨 | item.title | Có payload. |
| `data.destination` | string | 🟨 | item.destination | Có payload. |
| `data.provinceCode` | number | 🟥 | Không có trong mẫu POST/không resolve | Server chưa map destination→provinceCode mặc định. |
| `data.duration` | string | 🟨 | item.duration | Có payload. |
| `data.budget` | string | 🟨 | item.budget | Có payload. |
| `data.image` | string | 🟨 | item.image | Có payload. |
| `data.summary` | string | 🟨 | item.summary | Có payload. |
| `data.highlights[]` | string | 🟥 | Không có default | Không có input highlights trên UI nên server cần default/catalog nếu UI vẫn hiển thị. |
| `data.active` | boolean | 🟨 | item.active | Có cập nhật/đổi cấu trúc. |

<a id="api-44"></a>

### API-44 — /admin/content → xóa kế hoạch Hero

- **FE mong muốn:** `DELETE /api/v1/admin/content/hero-plans/{id}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5531).
- **BE đối chiếu:** `DELETE /admin/content/hero-plans/{item_id}` — [main.py:800](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:800) · [main.py:800](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:800).
- **Kết luận:** HTTP204 có thể đáp ứng xóa bằng mapper FE; không bắt server trả deleted=true.

#### Request mong muốn

```json
{
  "path": {
    "id": "hero-01"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.id` | string | 🟨 | path.item_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "hero-01",
    "deleted": true
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | ⬜ | Path item_id | 204 không body; FE biết ID. |
| `data.deleted` | boolean | ⬜ | HTTP 204 | Không cần body deleted nếu chốt success theo HTTP. |

<a id="api-45"></a>

### API-45 — /admin/content → Thêm dị ứng; /create-trip → danh mục

- **FE mong muốn:** `POST /api/v1/admin/content/allergy-options`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5541).
- **BE đối chiếu:** `POST /admin/content/allergy-options` — [main.py:774](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:774) · [main.py:774](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:774).
- **Kết luận:** Có label và UUID, active=true. Cần sync public allergies và ID với các request trip.

#### Request mong muốn

```json
{
  "body": {
    "label": "Hải sản & Tôm cua"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.label` | string | 🟩 | payload.label | Có kiểm tra label không rỗng. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "allergy-seafood",
    "label": "Hải sản & Tôm cua",
    "active": true
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟨 | item.id | Server cấp UUID, format mẫu FE không bắt buộc. |
| `data.label` | string | 🟨 | item.label | Đổi cấu trúc. |
| `data.active` | boolean | 🟨 | item.active=true | Đổi cấu trúc. |

<a id="api-46"></a>

### API-46 — /admin/content → sửa/bật/tắt mục dị ứng

- **FE mong muốn:** `PATCH /api/v1/admin/content/allergy-options/{id}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5552).
- **BE đối chiếu:** `PATCH /admin/content/allergy-options/{item_id}` — [main.py:787](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:787) · [main.py:787](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:787).
- **Kết luận:** PATCH label/active có lưu; label có thể bị làm rỗng vì thiếu validate. Public allergies chưa đọc nguồn này.

#### Request mong muốn

```json
{
  "path": {
    "id": "allergy-seafood"
  },
  "body": {
    "label": "Hải sản & Tôm cua",
    "active": false
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.id` | string | 🟨 | path.item_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |
| `body.label` | string | 🟨 | payload.label | Lưu qua dict; PATCH chưa enforce label không rỗng. |
| `body.active` | boolean | 🟩 | active | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "allergy-seafood",
    "label": "Hải sản & Tôm cua",
    "active": false
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟨 | item.id | Đổi cấu trúc. |
| `data.label` | string | 🟨 | item.label | Có payload. |
| `data.active` | boolean | 🟨 | item.active | Đổi cấu trúc. |

<a id="api-47"></a>

### API-47 — /admin/content → xóa mục dị ứng

- **FE mong muốn:** `DELETE /api/v1/admin/content/allergy-options/{id}`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:5567).
- **BE đối chiếu:** `DELETE /admin/content/allergy-options/{item_id}` — [main.py:800](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:800) · [main.py:800](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:800).
- **Kết luận:** HTTP204 đáp ứng success; kiểm tra tham chiếu/policy dị ứng cần chốt khi trips bắt đầu lưu optionIds.

#### Request mong muốn

```json
{
  "path": {
    "id": "allergy-seafood"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.id` | string | 🟨 | path.item_id | Khác tên tham số URL; giá trị/ownership kiểm tra riêng. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "allergy-seafood",
    "deleted": true
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | ⬜ | Path item_id | 204 không body; FE biết ID. |
| `data.deleted` | boolean | ⬜ | HTTP 204 | Không cần body deleted nếu chốt theo HTTP. |

<a id="api-55"></a>

### API-55 — /admin/system → Golden Dataset, tìm/chọn bộ, modal testcase

- **FE mong muốn:** `GET /api/v1/admin/golden-datasets`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:6177).
- **BE đối chiếu:** `GET /admin/evaluation/datasets + GET /admin/evaluation/runs/{run_id}` — [main.py:807](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:807) · [main.py:807](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:807) · [main.py:847](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:847).
- **Kết luận:** List dataset có name/description/count/isBuiltin, nhưng testCases=[]; GET run cases=null. Search q chưa nhận. Không có kết quả từng testcase để modal hiển thị.

#### Request mong muốn

```json
{
  "query": {
    "q": "đa thế hệ"
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `query.q` | string | 🟥 | Chỉ page/page_size | Chưa tìm theo tên; có thể tìm FE nếu trả đủ toàn bộ catalog. |

#### Response JSON mong muốn

```json
{
  "data": {
    "items": [
      {
        "id": "DS-01",
        "name": "Kiểm định hành trình đa thế hệ",
        "description": "Đối chiếu yêu cầu, khoảng nghỉ và khả năng di chuyển.",
        "testCasesCount": 2,
        "lastRunDate": "2026-10-06T14:30:00+07:00",
        "isCustom": false,
        "testCases": [
          {
            "id": "TC-01",
            "name": "Đi nhẹ cùng người cao tuổi",
            "input": "Gia đình có người cao tuổi, ưu tiên nghỉ trưa.",
            "expected": "Điểm tham quan ít dốc và có khoảng nghỉ.",
            "actual": "Lịch trình có nghỉ trưa và giới hạn đi bộ.",
            "status": "passed"
          },
          {
            "id": "TC-02",
            "name": "Tránh đông sáng sớm",
            "input": "Muốn chụp ảnh nơi yên tĩnh.",
            "expected": "Đề xuất thời điểm ít đông.",
            "actual": "Đã đề xuất sáng sớm; cần kiểm tra dự báo sát ngày.",
            "status": "warning"
          }
        ]
      }
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.items[].id` | string | 🟩 | items[].id | Có field và xử lý tương ứng trong source. |
| `data.items[].name` | string | 🟩 | items[].name | Có field và xử lý tương ứng trong source. |
| `data.items[].description` | string | 🟩 | items[].description | Có field và xử lý tương ứng trong source. |
| `data.items[].testCasesCount` | number | 🟩 | items[].testCasesCount | Có field và xử lý tương ứng trong source. |
| `data.items[].lastRunDate` | string | 🟥 | Không trả last run | Thiếu field hoặc chưa có dữ liệu/năng lực tương ứng. |
| `data.items[].isCustom` | boolean | ⬜ | !items[].isBuiltin | Boolean đảo nghĩa rõ, FE map. |
| `data.items[].testCases[].id` | string | 🟥 | testCases=[] cố định | Có evaluation_cases trong DB nhưng list chưa hydrate; run cases cũng null. |
| `data.items[].testCases[].name` | string | 🟥 | testCases=[] cố định | Có evaluation_cases trong DB nhưng list chưa hydrate; run cases cũng null. |
| `data.items[].testCases[].input` | string | 🟥 | testCases=[] cố định | Có evaluation_cases trong DB nhưng list chưa hydrate; run cases cũng null. |
| `data.items[].testCases[].expected` | string | 🟥 | testCases=[] cố định | Có evaluation_cases trong DB nhưng list chưa hydrate; run cases cũng null. |
| `data.items[].testCases[].actual` | string | 🟥 | testCases=[] cố định | Có evaluation_cases trong DB nhưng list chưa hydrate; run cases cũng null. |
| `data.items[].testCases[].status` | string | 🟥 | testCases=[] cố định | Có evaluation_cases trong DB nhưng list chưa hydrate; run cases cũng null. |

<a id="api-56"></a>

### API-56 — /admin/system → Tạo/Nạp bộ Golden Dataset

- **FE mong muốn:** `POST /api/v1/admin/golden-datasets`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:6213).
- **BE đối chiếu:** `POST /admin/evaluation/datasets` — [main.py:822](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:822) · [models.py:83](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/models.py:83) · [main.py:822](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:822).
- **Kết luận:** Input test_cases nhận name/input/expected nhưng không giữ ID nhập, chưa validate required/type input/expected. Response chỉ metadata, không có cases/default not_run.

#### Request mong muốn

```json
{
  "body": {
    "id": "DS-CUSTOM-01",
    "name": "Kiểm định nghỉ trưa",
    "testCases": [
      {
        "id": "TC-CUSTOM-01",
        "name": "Khung nghỉ trưa",
        "input": "Có người cao tuổi đi cùng.",
        "expected": "Dành ít nhất một khoảng nghỉ giữa ngày."
      }
    ]
  }
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `body.id` | string | 🟥 | Server UUID | Mẫu FE ID tùy chọn chưa nhận; chốt bỏ ID client hay hỗ trợ giữ ID. |
| `body.name` | string | 🟩 | name | Có trường và có xử lý tương ứng trong source; chưa xác minh runtime. |
| `body.testCases[].id` | string | 🟥 | Server UUID cho case | Chưa giữ ID testcase đưa vào JSON. |
| `body.testCases[].name` | string | 🟨 | test_cases[].name | Đổi testCases→test_cases; có kiểm tra name. |
| `body.testCases[].input` | string | 🟨 | test_cases[].input | Nhận qua dict; chưa validate required/type. |
| `body.testCases[].expected` | string | 🟨 | test_cases[].expected | Nhận qua dict; chưa validate required/type. |

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "DS-CUSTOM-01",
    "name": "Kiểm định nghỉ trưa",
    "description": "Bộ dữ liệu nhập từ JSON.",
    "testCasesCount": 1,
    "lastRunDate": null,
    "isCustom": true,
    "testCases": [
      {
        "id": "TC-CUSTOM-01",
        "name": "Khung nghỉ trưa",
        "input": "Có người cao tuổi đi cùng.",
        "expected": "Dành ít nhất một khoảng nghỉ giữa ngày.",
        "actual": null,
        "status": "not_run"
      }
    ]
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟨 | dataset.id | Đổi cấu trúc; UUID thay vì ID tùy nhập, phải thống nhất. |
| `data.name` | string | 🟨 | dataset.name | Đổi cấu trúc. |
| `data.description` | string | 🟥 | Có description ở DB nhưng không trả | Mẫu FE không gửi description; cần default thống nhất. |
| `data.testCasesCount` | number | 🟨 | dataset.testCasesCount | Đổi cấu trúc. |
| `data.lastRunDate` | null (mẫu) | ⬜ | Bộ mới chưa chạy | Có thể null theo trạng thái bộ mới. |
| `data.isCustom` | boolean | ⬜ | !dataset.isBuiltin | Đảo boolean. |
| `data.testCases[].id` | string | 🟥 | Response không trả cases | Input/expected có lưu nhưng không trả; case ID server tự cấp. Chưa có actual/status=not_run trong projection. |
| `data.testCases[].name` | string | 🟥 | Response không trả cases | Input/expected có lưu nhưng không trả; case ID server tự cấp. Chưa có actual/status=not_run trong projection. |
| `data.testCases[].input` | string | 🟥 | Response không trả cases | Input/expected có lưu nhưng không trả; case ID server tự cấp. Chưa có actual/status=not_run trong projection. |
| `data.testCases[].expected` | string | 🟥 | Response không trả cases | Input/expected có lưu nhưng không trả; case ID server tự cấp. Chưa có actual/status=not_run trong projection. |
| `data.testCases[].actual` | null (mẫu) | 🟥 | Response không trả cases | Input/expected có lưu nhưng không trả; case ID server tự cấp. Chưa có actual/status=not_run trong projection. |
| `data.testCases[].status` | string | 🟥 | Response không trả cases | Input/expected có lưu nhưng không trả; case ID server tự cấp. Chưa có actual/status=not_run trong projection. |

<a id="api-57"></a>

### API-57 — /admin/system → Chạy kiểm thử Golden Dataset

- **FE mong muốn:** `POST /api/v1/admin/golden-datasets/{datasetId}/runs`. [Contract gốc](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/frontend/docs/reports/ui-first-api-handoff/2026-10-07/ui-first-api-handoff.md:6246).
- **BE đối chiếu:** `POST /admin/evaluation/runs → GET /admin/evaluation/runs/{run_id}` — [main.py:836](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:836) · [main.py:836](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:836) · [main.py:847](C:/Users/yuuki/Documents/ChatGPT/CodexWithChatGPT/P-103/backend/src/main.py:847).
- **Kết luận:** POST ghi queued và GET trả summary/cases null; chưa worker và actual/status testcase. Cần kết quả thực hoặc trạng thái lỗi/running chuẩn nếu chốt async; không báo hoàn tất từ queued.

#### Request mong muốn

```json
{
  "path": {
    "datasetId": "DS-01"
  },
  "body": {}
}
```

#### Đánh dấu field request

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `path.datasetId` | string | 🟨 | body.datasetId | Backend bắt datasetId trong body, không phải path. |

**Request BE hiện nhận để bắt đầu lượt chạy:**

```json
{
  "datasetId": "DS-01"
}
```

**Response khởi tạo hiện tại — shape từ source, chưa phải kết quả chạy:**

```json
{
  "runId": "UUID-cua-luot-chay",
  "status": "queued"
}
```

GET run hiện có `scorePct/counts/cases=null` nếu chưa summary; chưa hoàn thành contract testcase.

#### Response JSON mong muốn

```json
{
  "data": {
    "id": "DS-01",
    "name": "Kiểm định hành trình đa thế hệ",
    "description": "Đối chiếu yêu cầu, khoảng nghỉ và khả năng di chuyển.",
    "testCasesCount": 2,
    "lastRunDate": "2026-10-07T00:35:00+07:00",
    "isCustom": false,
    "testCases": [
      {
        "id": "TC-01",
        "name": "Đi nhẹ cùng người cao tuổi",
        "input": "Gia đình có người cao tuổi, ưu tiên nghỉ trưa.",
        "expected": "Điểm tham quan ít dốc và có khoảng nghỉ.",
        "actual": "Kết quả phản hồi mới từ hệ thống kiểm định.",
        "status": "passed"
      },
      {
        "id": "TC-02",
        "name": "Tránh đông sáng sớm",
        "input": "Muốn chụp ảnh nơi yên tĩnh.",
        "expected": "Đề xuất thời điểm ít đông.",
        "actual": "Kết quả phản hồi mới từ hệ thống kiểm định.",
        "status": "passed"
      }
    ],
    "executionMode": "live"
  }
}
```

#### Đánh dấu field response

| Field mong muốn | Kiểu theo JSON mẫu FE | Đánh dấu | Field/nguồn BE hiện có | Đối chiếu và việc cần làm |
|---|---|---|---|---|
| `data.id` | string | 🟨 | run.datasetId + dataset detail | Có datasetId ở GET run nhưng response khởi tạo chỉ runId/status. |
| `data.name` | string | 🟨 | dataset.name | Cần compose list dataset. |
| `data.description` | string | 🟨 | dataset.description | Cần compose list dataset. |
| `data.testCasesCount` | number | 🟨 | dataset.testCasesCount | Cần compose. |
| `data.lastRunDate` | string | 🟥 | Không trả completed_at | Chưa worker hoàn tất. |
| `data.isCustom` | boolean | ⬜ | !dataset.isBuiltin | FE map. |
| `data.testCases[].id` | string | 🟥 | GET run cases=null | Chưa actual/status từng testcase; chưa worker. |
| `data.testCases[].name` | string | 🟥 | GET run cases=null | Chưa actual/status từng testcase; chưa worker. |
| `data.testCases[].input` | string | 🟥 | GET run cases=null | Chưa actual/status từng testcase; chưa worker. |
| `data.testCases[].expected` | string | 🟥 | GET run cases=null | Chưa actual/status từng testcase; chưa worker. |
| `data.testCases[].actual` | string | 🟥 | GET run cases=null | Chưa actual/status từng testcase; chưa worker. |
| `data.testCases[].status` | string | 🟥 | GET run cases=null | Chưa actual/status từng testcase; chưa worker. |
| `data.executionMode` | string | 🟥 | Chỉ status=queued | Không được ghi live hoàn tất khi mới enqueue. |

## 6. Việc cần hoàn thiện trước khi nối UI

1. **Luồng Plan:** giữ đầy đủ request form, resolve nơi đến/xuất phát, sinh bản nháp có itinerary; cập nhật ràng buộc/thứ tự/chat phải lưu và đọc lại đúng version.
2. **An toàn dữ liệu:** owner/private/public projection ở detail/chat; kiểm tra phiên, trạng thái tài khoản và version trên server. Không chỉ bổ sung access flags trong JSON.
3. **List/filter:** nối query v1 tới filter đã có, bổ sung filter còn thiếu và counts toàn bộ; sửa endDate/lastUpdated/budget của card.
4. **Nội dung/catalog:** một nguồn giữa admin và public; cấp moodboard và code/name tỉnh rõ; không trả Hero rỗng sau admin đã thêm.
5. **Recommendation:** đủ dữ liệu card/detail/compare hoặc thỏa thuận trạng thái unavailable theo từng field. Không biến ranking/score/weather/ảnh chưa có nguồn thành mock production.
6. **Feedback/trace/metrics:** bổ sung các projection được đánh đỏ, giữ các counts đã có làm nguồn dashboard; khóa enum/type và provenance. Không tạo lại API-29.
7. **Evaluation:** hydrate testcase và trả actual/status mới từ lượt chạy thật. Nếu async được chọn, phải có trạng thái running/completed/failed, lấy kết quả và lỗi; queued không phải kiểm thử đã hoàn thành.

Các dòng ⬜ do phase demo/defer hoặc có thể tính tại FE không trở thành task Backend phase này. Nguồn DNA profile còn thiếu được ghi 🟥 nhưng không yêu cầu chạy API-13. Các dòng 🟨 mapper phải khóa trong tài liệu chính thức; không yêu cầu Backend viết endpoint mới chỉ để đổi tên.

## 7. JSON Plan mong muốn đầy đủ

<a id="plan-json"></a>

Mẫu dưới lấy từ contract FE; trạng thái và version của từng action phải đúng ngữ cảnh, không trả cố định draft/version2. JSON không gắn emoji vào key để giữ hợp lệ; trạng thái từng field nằm trong ma trận mục 3.

```json
{
  "data": {
    "id": "PLAN-01",
    "documentCode": "VST-PLAN-01",
    "version": 2,
    "title": "Sa Pa mùa mây & Văn hóa bản địa",
    "status": "draft",
    "isPublished": false,
    "lastUpdated": "2026-10-07T00:20:00+07:00",
    "destination": {
      "id": "DEST-SAPA",
      "name": "Sa Pa, Lào Cai",
      "provinceCode": 10
    },
    "origin": "Hà Nội, Việt Nam",
    "coverImage": "https://static.example.com/sapa-plan.jpg",
    "summary": "Hành trình thư thái, cảnh quan núi và văn hóa địa phương.",
    "startDate": "2026-11-18",
    "endDate": "2026-11-21",
    "duration": {
      "days": 4,
      "nights": 3,
      "label": "4 ngày / 3 đêm"
    },
    "datesLabel": "18–21 Th11/2026",
    "travelers": {
      "adults": 2,
      "elderly": 0,
      "children": 0,
      "total": 2,
      "label": "2 Người lớn"
    },
    "pace": "slow",
    "budget": {
      "min": 10000000,
      "max": 15000000,
      "estimatedTotal": 14250000,
      "currency": "VND",
      "basis": "group_total"
    },
    "request": {
      "provinceCode": 10,
      "startDate": "2026-11-18",
      "endDate": "2026-11-21",
      "travelers": {
        "adults": 2,
        "elderly": 0,
        "children": 0
      },
      "budget": {
        "min": 10000000,
        "max": 15000000,
        "currency": "VND",
        "basis": "group_total"
      },
      "allergies": {
        "optionIds": [
          "allergy-seafood"
        ],
        "customEntries": [
          "Dị ứng đậu phộng"
        ]
      },
      "fitnessLevel": 2,
      "pace": "slow",
      "narrative": "Tôi muốn đi núi yên tĩnh trong 4 ngày, chụp ảnh và ăn món địa phương.",
      "inspirationImageIds": [
        "IMG-01",
        "IMG-02",
        "IMG-03"
      ],
      "dnaWeights": [
        {
          "key": "nature",
          "score": 94
        },
        {
          "key": "photography",
          "score": 92
        },
        {
          "key": "mountains",
          "score": 90
        },
        {
          "key": "quiet",
          "score": 88
        },
        {
          "key": "cool_climate",
          "score": 85
        },
        {
          "key": "light_exploration",
          "score": 54
        },
        {
          "key": "luxury",
          "score": 28
        },
        {
          "key": "crowds",
          "score": 20
        },
        {
          "key": "nightlife",
          "score": 15
        }
      ],
      "destinationId": "DEST-SAPA"
    },
    "days": [
      {
        "id": "DAY-01-1",
        "dayNumber": 1,
        "dayOfWeek": "Thứ Tư",
        "date": "2026-11-18",
        "title": "Đến nơi & Thích nghi",
        "pace": "slow",
        "paceLabel": "Thư thái",
        "highlight": "Cảnh quan, trải nghiệm bản địa và khoảng nghỉ hợp lý.",
        "weather": {
          "summary": "Sa Pa · Khí hậu se lạnh",
          "temperatureC": 14,
          "temperatureMinC": 11,
          "temperatureMaxC": 18,
          "humidityPercent": 82,
          "cloudProbabilityPercent": 72,
          "uvIndex": 3,
          "uvLabel": "Trung bình",
          "windDescription": "Gió nhẹ từ thung lũng",
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "activities": [
          {
            "id": "ACT-1-1",
            "isTransit": false,
            "timeStart": "08:00",
            "timeEnd": "10:00",
            "category": "Văn hóa",
            "location": "Bản Cát Cát, Sa Pa",
            "title": "Tham quan bản Cát Cát",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.328,
              "lng": 103.844
            }
          },
          {
            "id": "TRN-1-1",
            "isTransit": true,
            "transit": {
              "fromActivityId": "ACT-1-1",
              "toActivityId": "ACT-1-2",
              "type": "Ô tô",
              "durationMinutes": 25,
              "distanceKm": 8,
              "description": "Di chuyển đến Trung tâm Sa Pa"
            }
          },
          {
            "id": "ACT-1-2",
            "isTransit": false,
            "timeStart": "11:30",
            "timeEnd": "13:00",
            "category": "Ẩm thực",
            "location": "Trung tâm Sa Pa",
            "title": "Bữa trưa địa phương",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.336,
              "lng": 103.843
            }
          },
          {
            "id": "TRN-1-2",
            "isTransit": true,
            "transit": {
              "fromActivityId": "ACT-1-2",
              "toActivityId": "ACT-1-3",
              "type": "Ô tô",
              "durationMinutes": 25,
              "distanceKm": 8,
              "description": "Di chuyển đến Trung tâm Sa Pa"
            }
          },
          {
            "id": "ACT-1-3",
            "isTransit": false,
            "timeStart": "15:00",
            "timeEnd": "16:30",
            "category": "Thư giãn",
            "location": "Trung tâm Sa Pa",
            "title": "Dạo phố và nghỉ ngơi",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.34,
              "lng": 103.845
            }
          }
        ]
      },
      {
        "id": "DAY-01-2",
        "dayNumber": 2,
        "dayOfWeek": "Thứ Năm",
        "date": "2026-11-19",
        "title": "Núi non & Mây ngàn",
        "pace": "slow",
        "paceLabel": "Thư thái",
        "highlight": "Cảnh quan, trải nghiệm bản địa và khoảng nghỉ hợp lý.",
        "weather": {
          "summary": "Sa Pa · Khí hậu se lạnh",
          "temperatureC": 14,
          "temperatureMinC": 11,
          "temperatureMaxC": 18,
          "humidityPercent": 82,
          "cloudProbabilityPercent": 72,
          "uvIndex": 3,
          "uvLabel": "Trung bình",
          "windDescription": "Gió nhẹ từ thung lũng",
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "activities": [
          {
            "id": "ACT-2-1",
            "isTransit": false,
            "timeStart": "05:30",
            "timeEnd": "07:30",
            "category": "Cảnh quan",
            "location": "Đèo Ô Quy Hồ",
            "title": "Ngắm bình minh Ô Quy Hồ",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.352,
              "lng": 103.774
            }
          },
          {
            "id": "TRN-2-1",
            "isTransit": true,
            "transit": {
              "fromActivityId": "ACT-2-1",
              "toActivityId": "ACT-2-2",
              "type": "Ô tô",
              "durationMinutes": 25,
              "distanceKm": 8,
              "description": "Di chuyển đến Bản Tả Van"
            }
          },
          {
            "id": "ACT-2-2",
            "isTransit": false,
            "timeStart": "10:30",
            "timeEnd": "12:00",
            "category": "Thủ công",
            "location": "Bản Tả Van",
            "title": "Thăm xưởng dệt bản Tả Van",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.301,
              "lng": 103.888
            }
          }
        ]
      },
      {
        "id": "DAY-01-3",
        "dayNumber": 3,
        "dayOfWeek": "Thứ Sáu",
        "date": "2026-11-20",
        "title": "Văn hóa & Cảnh quan",
        "pace": "slow",
        "paceLabel": "Thư thái",
        "highlight": "Cảnh quan, trải nghiệm bản địa và khoảng nghỉ hợp lý.",
        "weather": {
          "summary": "Sa Pa · Khí hậu se lạnh",
          "temperatureC": 14,
          "temperatureMinC": 11,
          "temperatureMaxC": 18,
          "humidityPercent": 82,
          "cloudProbabilityPercent": 72,
          "uvIndex": 3,
          "uvLabel": "Trung bình",
          "windDescription": "Gió nhẹ từ thung lũng",
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "activities": [
          {
            "id": "ACT-3-1",
            "isTransit": false,
            "timeStart": "08:30",
            "timeEnd": "10:30",
            "category": "Cảnh quan",
            "location": "Mường Hoa",
            "title": "Tham quan thung lũng Mường Hoa",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.307,
              "lng": 103.877
            }
          },
          {
            "id": "TRN-3-1",
            "isTransit": true,
            "transit": {
              "fromActivityId": "ACT-3-1",
              "toActivityId": "ACT-3-2",
              "type": "Ô tô",
              "durationMinutes": 25,
              "distanceKm": 8,
              "description": "Di chuyển đến Bản Lao Chải"
            }
          },
          {
            "id": "ACT-3-2",
            "isTransit": false,
            "timeStart": "14:00",
            "timeEnd": "16:00",
            "category": "Văn hóa",
            "location": "Bản Lao Chải",
            "title": "Trải nghiệm văn hóa bản địa",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.313,
              "lng": 103.873
            }
          }
        ]
      },
      {
        "id": "DAY-01-4",
        "dayNumber": 4,
        "dayOfWeek": "Thứ Bảy",
        "date": "2026-11-21",
        "title": "Chợ phiên & Khởi hành",
        "pace": "slow",
        "paceLabel": "Thư thái",
        "highlight": "Cảnh quan, trải nghiệm bản địa và khoảng nghỉ hợp lý.",
        "weather": {
          "summary": "Sa Pa · Khí hậu se lạnh",
          "temperatureC": 14,
          "temperatureMinC": 11,
          "temperatureMaxC": 18,
          "humidityPercent": 82,
          "cloudProbabilityPercent": 72,
          "uvIndex": 3,
          "uvLabel": "Trung bình",
          "windDescription": "Gió nhẹ từ thung lũng",
          "basis": "seasonal_estimate",
          "asOf": "2026-10-07T00:20:00+07:00"
        },
        "activities": [
          {
            "id": "ACT-4-1",
            "isTransit": false,
            "timeStart": "08:30",
            "timeEnd": "10:00",
            "category": "Mua sắm",
            "location": "Chợ Sa Pa",
            "title": "Mua quà địa phương",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.339,
              "lng": 103.842
            }
          },
          {
            "id": "TRN-4-1",
            "isTransit": true,
            "transit": {
              "fromActivityId": "ACT-4-1",
              "toActivityId": "ACT-4-2",
              "type": "Ô tô",
              "durationMinutes": 25,
              "distanceKm": 8,
              "description": "Di chuyển đến Sa Pa → Hà Nội"
            }
          },
          {
            "id": "ACT-4-2",
            "isTransit": false,
            "timeStart": "12:00",
            "timeEnd": "17:30",
            "category": "Di chuyển",
            "location": "Sa Pa → Hà Nội",
            "title": "Khởi hành về Hà Nội",
            "description": "Tham quan thong thả, có khoảng nghỉ và thời gian chụp ảnh.",
            "notes": "Mang giày bám đường; kiểm tra điều kiện thực tế trước khi đi.",
            "tags": [
              "Nhiếp ảnh",
              "Bản địa"
            ],
            "coordinates": {
              "lat": 22.337,
              "lng": 103.841
            }
          }
        ]
      }
    ],
    "chatMessages": [
      {
        "id": "MSG-01",
        "sender": "assistant",
        "timestamp": "2026-10-07T00:20:00+07:00",
        "text": "Đã tạo bản nháp bốn ngày với khoảng nghỉ và ngân sách dự kiến.",
        "affectedChange": "Tạo lịch trình ban đầu"
      },
      {
        "id": "MSG-02",
        "sender": "user",
        "timestamp": "2026-10-07T00:25:00+07:00",
        "text": "Thêm nghỉ trưa và giữ ngân sách tối đa 15 triệu."
      },
      {
        "id": "MSG-03",
        "sender": "assistant",
        "timestamp": "2026-10-07T00:25:04+07:00",
        "text": "Đã dành thời gian nghỉ sau bữa trưa và giữ trần ngân sách.",
        "affectedChange": "Ngày 1: bổ sung khoảng nghỉ 13:00–15:00."
      }
    ],
    "sources": [
      {
        "id": "SRC-01",
        "type": "weather_station",
        "title": "Tham chiếu khí hậu theo mùa",
        "snippet": "Khí hậu theo mùa; cần cập nhật dự báo sát ngày đi.",
        "authorOrDomain": "Nguồn minh họa",
        "url": "https://example.com/reference-climate"
      },
      {
        "id": "SRC-02",
        "type": "local_guide",
        "title": "Ghi chép trải nghiệm bản địa",
        "snippet": "Điểm dừng và lưu ý thực địa.",
        "authorOrDomain": "Hướng dẫn viên minh họa",
        "url": null
      },
      {
        "id": "SRC-03",
        "type": "community",
        "title": "Kinh nghiệm du lịch trong cộng đồng",
        "snippet": "Gợi ý tránh giờ đông người.",
        "authorOrDomain": "Cộng đồng minh họa",
        "url": null
      }
    ],
    "costBreakdown": [
      {
        "category": "Lưu trú",
        "amount": 6200000,
        "detail": "Lưu trú ba đêm",
        "percentage": 43.51
      },
      {
        "category": "Di chuyển",
        "amount": 4500000,
        "detail": "Di chuyển khứ hồi và nội vùng",
        "percentage": 31.58
      },
      {
        "category": "Ẩm thực",
        "amount": 2300000,
        "detail": "Các bữa ăn dự kiến",
        "percentage": 16.14
      },
      {
        "category": "Vé & Trải nghiệm",
        "amount": 1250000,
        "detail": "Vé tham quan và trải nghiệm",
        "percentage": 8.77
      }
    ],
    "transportRecommendation": {
      "vehicleLabel": "Xe du lịch 7–9 chỗ / Limousine",
      "durationEstimate": "4,5–5,5 giờ",
      "terrainDescription": "Cao tốc kết hợp đường đèo",
      "isBooking": false
    },
    "climateGuide": {
      "temperatureRange": "11°C – 18°C",
      "climateLabel": "Se lạnh",
      "description": "Lưu ý sương sớm và điều kiện đường đi.",
      "clothingTips": [
        "Áo ấm nhiều lớp",
        "Áo khoác chống thấm nhẹ",
        "Giày bám đường"
      ]
    },
    "localTips": "Mang tiền mặt và kiểm tra thời tiết sát ngày đi.",
    "access": {
      "canEdit": true,
      "canConfirm": true,
      "canPublish": false
    }
  }
}
```

## 8. Phạm vi kiểm tra và giới hạn

- Đã đọc request models, route/helper, planner, chat orchestrator, weather/routing output và migrations liên quan để đối chiếu field/ý nghĩa.
- Không gọi API, không chạy backend/model/provider hoặc test tích hợp. Field 🟩 là bằng chứng từ source, chưa phải kết quả test.
- Có **44 mục API**, **149 field request**, **465 field response riêng** và **113 field Plan chung** được đánh dấu. Tổng 727 dòng field: 🟩 151, 🟨 242, 🟥 274, ⬜ 60. Đây là số dòng đối chiếu, không phải số field DB hay số endpoint cần làm.
- Không sửa FE/BE implementation và không ghi đè các tài liệu gốc. Scope skip/defer ở mục 1 là quyết định mới nhất của người dùng.


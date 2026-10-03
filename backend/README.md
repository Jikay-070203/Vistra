# YourTripYourTry — crawler và backend MVP

Triển khai theo `YourTripYourTry_Technical_Flow_Roles.md` và giữ nguyên schema địa điểm đã có. Stack: Python 3.12, FastAPI, SQLite và React. Xem [Agent du lịch và bản đồ](AGENT_AND_MAP.md) cho giao diện Gemini, chỉnh lịch bằng lời nói, bản đồ tương tác, cấu hình và kết quả kiểm tra mới nhất.

Xem [bản sửa luồng chuyến đi](TRIP_FIX_REPORT.md) cho chế độ lịch tham khảo, gợi ý tham quan/ăn uống/lưu trú, thùng rác và báo cáo dữ liệu bốn điểm đến.

## Chạy trên Windows

```powershell
.\scripts\setup.ps1
.\scripts\crawl.ps1 -Destination ninh-binh -Limit 300
.\scripts\serve.ps1
```

Mở **http://127.0.0.1:8000/docs** để xem và thử API; health check: **http://127.0.0.1:8000/health**.

Python và thư viện được cách ly tại `.python/` và `.venv/` trong dự án. Venv cũ `..\venv` trỏ tới Python không còn tồn tại, vì vậy không dùng chung môi trường đó. `uv.lock` khóa phiên bản thư viện. Script setup không ghi đè `.env`; xem `.env.example` để thêm cấu hình cần thiết. Cấu hình đọc từ thư mục dự án dù gọi code ở thư mục khác.

## Crawl tự động

```powershell
# Một batch cho bốn điểm đến, tối đa 300 hồ sơ mỗi nơi
.\scripts\crawl.ps1

# Crawl riêng Hà Nội và Đà Lạt, mỗi nơi tối đa 300 địa điểm
.\scripts\crawl.ps1 -Destination ha-noi -Limit 300
.\scripts\crawl.ps1 -Destination da-lat -Limit 300

# Chạy lại mỗi 24 giờ; giữ tiến trình này chạy, Ctrl+C để dừng
.\scripts\crawl.ps1 -Daily

# Thống kê dữ liệu đã có
.\.venv\Scripts\python.exe -m crawl_data_py_playwright --report
```

`-Daily` chạy trong tiến trình hiện tại, không tự khởi động lại khi reboot. Nếu cần, cấu hình Windows Task Scheduler chạy `scripts/crawl.ps1` một lần mỗi ngày, với working directory là dự án; không chạy chồng nhiều job. Không tạo tác vụ hệ thống ngầm.

Pipeline mặc định dùng **OpenStreetMap qua Overpass HTTP API**, phù hợp dữ liệu có cấu trúc hơn mở trình duyệt. Bốn vùng sản phẩm có bounding box trong `crawl_data_py_playwright/destinations.json`; đây là vùng trải nghiệm thử nghiệm, không phải ranh giới hành chính chính thức. Điều chỉnh box nếu cần bao phủ thêm địa điểm.

Crawler thử các endpoint theo thứ tự, mỗi endpoint tối đa một lần trong một lượt crawl. Khi lỗi mạng/timeout, HTTP 408/5xx, JSON lỗi hoặc phản hồi không đầy đủ, crawler chuyển sang endpoint kế tiếp. Truy vấn giới hạn bộ nhớ 64 MiB và thời gian xử lý 45 giây trên máy chủ. Có thể cấu hình danh sách trong `.env` (JSON array), hoặc dùng mặc định:

```dotenv
OVERPASS_ENDPOINTS=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"]
CRAWL_CONNECT_TIMEOUT_SECONDS=10
```

Kumi hiện là **Private.coffee**, nên URL Kumi cũ được chuyển thành `https://overpass.private.coffee/api/interpreter` trước khi gửi POST. Xem [danh sách Overpass công khai](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances). Thêm endpoint OSM khác vào cuối danh sách nếu cần. `OVERPASS_ENDPOINTS` được ưu tiên hơn `OVERPASS_URL`; nếu chỉ có biến cũ, `OVERPASS_URL` vẫn là endpoint đầu tiên và Kumi là dự phòng. Timeout kết nối mặc định 10 giây, timeout đọc 60 giây. Hết danh sách mà chưa có phản hồi đầy đủ thì lượt crawl thất bại, không nhập dữ liệu một phần.

Luồng: truy vấn nhóm tham quan/ăn/café/lưu trú/công viên → kiểm tra tên/tọa độ trong box → chọn xen kẽ nhóm → lưu raw JSON → nhập SQLite → báo số lượng/chất lượng. 300 là **giới hạn lựa chọn mỗi batch**, không cam kết nguồn có đủ dữ liệu hoặc cơ sở dữ liệu luôn đúng 1.200 điểm. Batch lặp lại cùng dữ liệu chỉ cập nhật liên kết nguồn/bằng chứng, không tăng bản ghi canonical. Khi nguồn có điểm mới, tổng tích lũy có thể vượt 300.

- `data/yourtripyourtry.db`: dữ liệu dùng chung cho API và crawler.
- `data/raw/osm-*.json`: snapshot nguồn OSM; chỉ ghi khi nguồn trả đầy đủ; `_crawl` ghi endpoint và thời điểm lấy dữ liệu.
- `crawl_runs`, `crawl_requests`: log kết quả và lượt gọi kể cả lỗi; các request mới có `run_id`, `endpoint`, `http_status`, `error_message`.
- Cache thành công 24 giờ, dùng chung giữa các mirror; delay tối thiểu 5 giây; tối đa 40 lần gọi/ngày mặc định, cộng tất cả endpoint và cả lượt lỗi.
- Dừng cả batch khi 401/403/429; ghi cooldown 30 phút, không chuyển mirror để né giới hạn. Partial response không được nhập.
- Khóa file ngăn hai crawler cùng ghi; không giữ write transaction trong lúc gọi Overpass.
- Các mirror dùng chung một `source_id` OSM, nên chuyển endpoint không tạo nguồn hoặc địa điểm trùng. Trùng theo `source_id + external_place_id` cập nhật bằng chứng. Cùng tên chuẩn hóa/loại trong 150m tạo `dedupe_candidates`, không tự gộp.
- Canonical đã nhập được giữ ổn định khi crawl lại; thay đổi tên/tọa độ từ upstream nằm trong raw để quản trị đối chiếu.

Nguồn: [Overpass API và giới hạn sử dụng](https://wiki.openstreetmap.org/wiki/Overpass_API), [giấy phép OSM](https://www.openstreetmap.org/copyright). UI sử dụng dữ liệu cần hiển thị **© OpenStreetMap contributors**, liên kết giấy phép; API trả trường `attribution`. Không lấy hàng loạt Google Maps/Places để làm kho dữ liệu.

### Adapter Playwright tùy chọn

Đã có adapter cho **URL chi tiết khai báo sẵn có JSON-LD Place/Restaurant/Museum…**. Không phải scraper dùng được cho mọi website. Không có nguồn website nào được bật sẵn.

```powershell
$env:UV_CACHE_DIR = "$PWD\.cache\uv"
$env:UV_PYTHON_INSTALL_DIR = "$PWD\.python"
uv sync --frozen --group dev --group browser
.\.venv\Scripts\python.exe -m playwright install chromium
# Sao chép website.example.json, điền nguồn/URL được phép và duyệt điều khoản
.\.venv\Scripts\python.exe -m crawl_data_py_playwright --destination ninh-binh --website-config data/my-source.json
```

Adapter kiểm tra `collection_approved`, HTTPS/host, robots.txt, delay/cap; dừng khi chặn truy cập/CAPTCHA. Chỉ lấy tên, tọa độ, địa chỉ và dữ kiện JSON-LD tối thiểu; không sao chép mô tả/review/HTML. Trang thiếu tọa độ hoặc chứa nhiều địa điểm trả `parse_error`; cần adapter riêng cho listing, phân trang hoặc trang render JSON-LD chậm. Chỉ cho tài nguyên cùng host; một số trang phụ thuộc CDN sẽ cần adapter riêng. Chromium chưa cần để chạy crawler OSM.

## Duyệt chất lượng trước khi lập lịch

Tất cả điểm crawl vào `discovered`. Chưa biết giá/giờ mở cửa thì giữ **unknown**, không gán miễn phí hoặc mở 24/7, không tự cấp `verified`.

1. `GET /places?destination=ninh-binh&q=...` để tìm; `GET /places/{id}` để lấy nguồn và `source_link_id`.
2. `GET /admin/duplicates`; quyết định `same` hoặc `different` bằng `POST /admin/duplicates/{left_id}/{right_id}?decision=...`. `same` archive bản bên phải, giữ nguyên nguồn và ID, không xóa dữ liệu.
3. `PUT /admin/places/{id}/review` với dữ liệu đã kiểm tra. Đây là **thay thế toàn bộ bộ giờ/giá hiện tại**, không phải PATCH. `null` nghĩa là chưa biết. Giờ có giá trị là lịch tuần đầy đủ: ngày không có khoảng giờ được coi là đóng cửa. Chia ca qua đêm thành hai ngày.

Ví dụ request (thay ID bằng nguồn thực và tự kiểm tra thời lượng/đặc tính):

```json
{
  "quality_status": "schedulable",
  "indoor_outdoor": "outdoor",
  "suggested_duration_min": 90,
  "rain_sensitivity": 2,
  "source_link_id": 1,
  "note": "Ghi lại căn cứ đã kiểm tra thời lượng và đặc tính địa điểm",
  "opening_intervals": null,
  "prices": null
}
```

`verified` yêu cầu giá và lịch tuần có nguồn; giá 0 chỉ khi đã xác nhận miễn phí. Source link phải thuộc địa điểm. Điểm còn nghi trùng chưa được duyệt vào planner. Nhật ký duyệt lưu ở `place_reviews`. Không đánh dấu hàng loạt điểm là đáng tin chỉ để chạy demo.

## API cho frontend

| Nhóm | Endpoint |
| --- | --- |
| Địa điểm | `GET /destinations`, `GET /places`, `GET /places/{id}` |
| Chuyến đi | `POST /trips`, `GET /trips`, `GET /trips/{id}` |
| Lập lịch | `POST /trips/{id}/generate` |
| Chỉnh lịch | `POST /trips/{id}/revisions/preview`, `POST /trips/{id}/revisions/commit` |
| Chi tiêu | `POST /trips/{id}/expenses`, `GET /trips/{id}/expenses`, `GET /trips/{id}/budget` |
| Khí hậu | `GET /destinations/{slug}/seasonality?start_year=2020&end_year=2025` |
| AI tùy chọn | `POST /agent/parse` với `{ "text": "..." }` |
| Quản trị | `PUT /admin/places/{id}/review`, `GET /admin/duplicates`, `GET /admin/crawl-runs` |

Ví dụ `POST /trips`:

```json
{
  "destination": "ninh-binh",
  "start_date": "2026-10-10",
  "days": 2,
  "people": 2,
  "budget_vnd": 1500000,
  "budget_scope": "per_person",
  "transport": "car",
  "origin": { "latitude": 21.0285, "longitude": 105.8542 },
  "pace": "relaxed",
  "interests": ["attraction", "food"],
  "must_visit": [],
  "lodging_total_vnd": null,
  "transport_total_vnd": null
}
```

Chọn ID điểm bắt buộc từ API trước khi tạo chuyến. `generate` chỉ chạy khi chưa có lịch; dùng revisions cho lịch đã có. Calendar/bản đồ/chi phí cùng đọc một `itinerary.version` chứa activities, route_legs, budget, weather, warnings. Thời gian có offset +07:00, tiền số nguyên VND. Dự toán ghi riêng min/max và phần chưa biết. Khoản chi thực tế không sửa dự toán.

Preview nhận `{ "base_version": 1, "stops": [{ "place_id": 123, "day": 1, "start_time": "10:00" }] }`; gửi **toàn bộ danh sách hoạt động mong muốn**, thứ tự trong mỗi ngày là thứ tự đi. Bỏ `start_time` để tự xếp. Điểm bắt buộc phải còn đủ. Preview sống 30 phút. Commit nhận `{ "base_version": 1, "preview_id": "..." }`; nếu version/địa điểm thay đổi trả 409. Không dùng preview cũ ghi đè lịch mới.

Planner dùng heuristic 09:00–18:00, 1–3 ngày; giữ giờ mở cửa đã biết, thời lượng, nghỉ và đường đi. Giới hạn tìm ứng viên nên có thể yêu cầu chỉnh lịch dù tồn tại phương án tối ưu hơn; thông báo rõ khi không xếp được. Giờ/giá chưa biết được cảnh báo. Ngân sách là ưu tiên mềm: báo vượt mức, chưa có bộ tối ưu chi phí.

## Tuyến, thời tiết và Gemini

- **OSRM**: chỉ hỗ trợ ô tô trong bản này. Dùng thời gian đường thực từ API, GeoJSON và cache; không đổi khoảng cách chim bay thành thời gian di chuyển. Nhà cung cấp lỗi thì generate/preview trả 503, lịch đã lưu vẫn đọc được. Chưa tính live traffic, detour khách sạn/đường về; những phần thiếu có cảnh báo. Có thể đổi `OSRM_URL` sang server riêng. [Tài liệu OSRM](https://github.com/Project-OSRM/osrm-backend/blob/master/docs/http.md).
- **Open-Meteo**: dự báo trong cửa sổ 16 ngày, cache 1 giờ; ngoài cửa sổ trả unavailable và có endpoint lịch sử riêng. Thống kê ERA5 theo 1–10 năm hoàn chỉnh, cache 30 ngày; ngày mưa định nghĩa lượng mưa >=1mm. Dự báo theo tâm điểm đến, chưa riêng từng tọa độ; gắn cảnh báo mưa, chưa tự tối ưu/đề xuất đổi điểm. Lỗi thời tiết không làm hỏng lịch. Xem [Forecast](https://open-meteo.com/en/docs), [Historical](https://open-meteo.com/en/docs/historical-weather-api) và [điều kiện gói dịch vụ](https://open-meteo.com/en/pricing).
- **Gemini**: phân tích ý định thành bản nháp và hỗ trợ điều chỉnh chuyến đi đã có lịch bằng công cụ đọc dữ liệu, kiểm tra bản xem trước. Hỗ trợ `Geminai_API_KEY` và `GEMINI_API_KEY`, chọn `GEMINI_MODEL` để bật. Key chỉ gửi qua header phía server. Agent không tự lưu thay đổi; người dùng xem trước rồi chấp nhận. Chi tiết và giới hạn trong [Agent du lịch và bản đồ](AGENT_AND_MAP.md). [Structured output](https://ai.google.dev/gemini-api/docs/structured-output).

## Kiểm thử và giới hạn vận hành

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\ruff.exe check backend crawl_data_py_playwright tests
```

Tests dùng DB tạm và HTTP/provider giả lập, không trộn địa điểm giả vào dữ liệu thật, không dùng key Gemini. Kiểm tra nhập lặp, nghi trùng, cap/block, dữ liệu thiếu, giờ đóng cửa, điểm bắt buộc, trùng giờ, tính tiền, preview/commit/409, auth, cache tuyến và phân biệt thời tiết.

MVP hiện là **một người dùng trên localhost**, chưa có tài khoản/phân quyền theo người. `API_TOKEN` bật kiểm tra `X-API-Key` cho toàn bộ API dữ liệu (cả quản trị). Không public bản này như một dịch vụ nhiều người dùng. CORS chỉ cho localhost:5173. SQLite dùng WAL/foreign keys/busy timeout; giữ database trên đĩa bền vững và sao lưu bằng SQLite backup khi đang chạy. Thư mục hiện ở OneDrive: tránh nhiều máy cùng mở/ghi file DB đồng bộ.

Các phần còn lại: duyệt bộ địa điểm thật đủ để lập lịch, auth nhiều người dùng, thêm phương tiện, tối ưu toàn cục chi phí/thời tiết và lưu hội thoại qua nhiều yêu cầu. Frontend React đã có lập lịch, bản đồ, chi tiêu và trợ lý Gemini; việc kiểm tra kết nối Gemini thật và giao diện trực quan còn giới hạn theo [báo cáo kiểm tra](AGENT_AND_MAP.md).

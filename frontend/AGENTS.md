<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quy ước lưu trữ Screenshot & Evidence Playwright MCP

Quy định này áp dụng cho toàn bộ agent và task làm việc trong project `frontend` khi sử dụng Playwright MCP (triển khai UI, sửa UI, review giao diện, regression check, smoke check).

---

## 1. Phạm vi & Ngoại lệ

- **Áp dụng:** Tất cả các task kỹ thuật, triển khai giao diện, kiểm thử thành phần, refactor hoặc retest sử dụng Playwright MCP.
- **Ngoại lệ bắt buộc (Giữ nguyên tương thích):**
  Các task **Report / Đánh giá hệ thống** (ví dụ: UI/UX Audit, System Demo Report) đã có quy ước gom evidence trực tiếp cùng thư mục báo cáo tại `docs/reports/ui-ux-audits/<timestamp>/evidence/` (hoặc `docs/reports/<category>/<timestamp>/evidence/`). **Giữ nguyên 100%** vị trí và liên kết evidence của các task Report đó; không di chuyển, không đổi tên và không xóa evidence cũ.

---

## 2. Thư mục gốc & Vòng đời thư mục Task

- **Thư mục gốc cố định:**
  `docs/evidence/playwright/`
- **Mỗi task/base prompt độc lập tạo một thư mục riêng theo timestamp (Asia/Ho_Chi_Minh):**
  `docs/evidence/playwright/YYYY-MM-DD_HH-mm-ss/`
  *Ví dụ:* `docs/evidence/playwright/2026-10-02_14-30-00/`
- **Xử lý trùng lặp:** Nếu timestamp đã tồn tại, thêm hậu tố số tăng dần (ví dụ: `..._01`, `..._02`) để tuyệt đối không ghi đè dữ liệu cũ.
- **Vòng đời task & Follow-up Prompts:**
  - Khi bắt đầu một task độc lập mới: Tạo thư mục timestamp mới và khởi tạo file `run-info.md`.
  - Khi nhận các prompt tiếp theo thuộc cùng task (sửa lỗi theo review, retest, capture thêm trạng thái UI): **Tiếp tục dùng lại thư mục timestamp đã tạo của task đó**. Đọc thông tin từ `run-info.md`, tăng số thứ tự ảnh tiếp theo và cập nhật vào `run-info.md`.
  - **Chỉ tạo thư mục timestamp mới khi chuyển sang một task độc lập mới.**

---

## 3. Cơ chế gọi Tool Playwright MCP

Dựa trên schema thực tế của tool `browser_take_screenshot`:
- Tham số `filename` nhận đường dẫn tương đối tính từ workspace root.
- Tham số `scale` là bắt buộc (mặc định chọn `"css"`; chọn `"device"` khi cần chụp ở độ phân giải pixel ratio thực của thiết bị).

**Quy tắc thực thi:**
- **BẮT BUỘC** truyền tham số `filename` trỏ trực tiếp vào thư mục timestamp của task:
  ```json
  {
    "filename": "docs/evidence/playwright/YYYY-MM-DD_HH-mm-ss/01_task-id_route_state_viewport.png",
    "scale": "css"
  }
  ```
- **TUYỆT ĐỐI KHÔNG** để trống tham số `filename` khi chụp ảnh kiểm thử, vì tool sẽ tự động lưu vào thư mục nội bộ `.playwright-mcp/` hoặc thư mục tạm, vi phạm quy ước evidence của project.

---

## 4. Quy ước đặt tên Screenshot (Windows-Safe)

Tên file phải phản ánh rõ ngữ cảnh, không chứa các ký tự không hợp lệ trên Windows (`\`, `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`):

**Cú pháp:**
`{stt}_{task-id}_{route}_{state}_{viewport}.png`

- `{stt}`: Số thứ tự 2 chữ số (`01`, `02`, `03`...) tăng dần trong suốt vòng đời task để tránh trùng lặp.
- `{task-id}`: Mã định danh task (ví dụ: `RF-01`, `SYS-UI-02`, `VST-LP-01`).
- `{route}`: Tên route hoặc màn hình kiểm tra (ví dụ: `landing`, `planner`, `create-trip`, `destinations`, `admin`).
- `{state}`: Trạng thái UI hoặc hành vi tương tác, có phân biệt rõ giai đoạn (`initial`, `chat-open`, `drawer-expanded`, `before-fix`, `after-fix`, `retest-ok`).
- `{viewport}`: Độ phân giải viewport kiểm thử (ví dụ: `1920x1080`, `1440x1080`, `1280x720`, `768x1024`, `390x844`).

*Ví dụ:*
- `01_RF-01_create-trip_initial_390x844.png`
- `02_RF-01_create-trip_moodboard-selected_390x844.png`
- `03_RF-01_create-trip_retest-after-fix_390x844.png`

---

## 5. File `run-info.md` bắt buộc trong mỗi thư mục Task

Tại mỗi thư mục task `docs/evidence/playwright/YYYY-MM-DD_HH-mm-ss/`, tạo và duy trì file `run-info.md` với cấu trúc chuẩn:

```markdown
# Run Info - [Mã Task / Tên Task]

- **Task ID:** [Mã task, ví dụ: RF-01]
- **Tên Task:** [Tên mô tả ngắn gọn của task]
- **Thời điểm bắt đầu (Asia/Ho_Chi_Minh):** YYYY-MM-DD HH:mm:ss +07:00
- **Đường dẫn evidence:** docs/evidence/playwright/YYYY-MM-DD_HH-mm-ss/
- **Branch / Worktree:** [Branch hiện tại, ví dụ: BinhNT]
- **Application URL:** [Ví dụ: http://localhost:3000 hoặc local test page]

## Danh sách Screenshots

| STT | File Name | Route / URL | Viewport | Giai đoạn | Trạng thái UI đã chụp | Ghi chú & Console Errors |
|---|---|---|---|---|---|---|
| 01 | 01_...png | /route | 1920x1080 | Before / Initial | Trạng thái ban đầu | 0 errors |
| 02 | 02_...png | /route | 1920x1080 | After fix | Trạng thái sau chỉnh sửa | Đã fix layout tràn ngang |
| 03 | 03_...png | /route | 390x844  | Retest | Kiểm tra responsive mobile | Khớp design spec |
```

---

## 6. Nguyên tắc an toàn & Thao tác

- Tuyệt đối không xóa, di chuyển, đổi tên hoặc ghi đè bất kỳ screenshot hay thư mục evidence cũ nào.
- Chỉ làm việc thông qua Antigravity IDE và Playwright MCP. Không dùng Terminal, CMD, PowerShell hoặc Antigravity CLI khi thực hiện kiểm thử và ghi nhận evidence.

---

## 7. Quy trình chuẩn cho Base Prompt & Follow-up Prompt

1. **Khởi tạo Task (Base Prompt):**
   - Lấy timestamp hiện tại theo múi giờ `Asia/Ho_Chi_Minh` (`YYYY-MM-DD_HH-mm-ss`).
   - Xác định thư mục output: `docs/evidence/playwright/<timestamp>/`. Nếu thư mục đã tồn tại, thêm hậu tố `_01`, `_02`.
   - Khởi tạo file `docs/evidence/playwright/<timestamp>/run-info.md` ghi thông tin task, thời gian và URL kiểm thử.
2. **Thực thi Screenshot qua Playwright MCP:**
   - Khi gọi `browser_take_screenshot`, luôn truyền:
     ```json
     {
       "filename": "docs/evidence/playwright/<timestamp>/01_<task-id>_<route>_<state>_<viewport>.png",
       "scale": "css"
     }
     ```
   - Cập nhật dòng tương ứng vào bảng `Danh sách Screenshots` trong `run-info.md`.
3. **Follow-up Prompts / Retest trong cùng Task:**
   - Đọc `run-info.md` của task đang xử lý để lấy đúng đường dẫn `docs/evidence/playwright/<timestamp>/`.
   - Tiếp tục lưu các ảnh mới (after-fix, retest) vào cùng thư mục này với số thứ tự tăng dần (`02_...`, `03_...`).
   - Cập nhật kết quả vào `run-info.md`.
   - **Chỉ tạo thư mục timestamp mới khi bắt đầu một task độc lập hoàn toàn mới.**

## 8. Quy tắc test tạm cho task implement API

Quy tắc này chỉ áp dụng khi implement hoặc sửa luồng gọi API ở frontend; không xóa hay thay đổi các test có sẵn của feature khác.

- Chỉ tạo test script tạm trong `.api-test-tmp/<task-id>/`, không đặt test tạm trong `src/` và không thêm test `.mjs` lâu dài cho task API.
- Chạy test sau khi phần implement đã sẵn sàng. Nếu tất cả test case thành công, xóa toàn bộ test script và thư mục tạm của task trước khi kết thúc.
- Nếu có test case thất bại, append vào `frontend/fallure.md` gồm task/thời điểm, command đã chạy, tên case, expected/actual và lỗi liên quan. Không ghi credential, token hoặc dữ liệu nhạy cảm. Giữ test tạm để có thể tái hiện và dừng ở trạng thái chờ review thủ công; chỉ xóa sau khi lỗi đã được xử lí và toàn bộ test chạy lại thành công.
- Khi báo cáo kết quả, nêu số test case pass/fail và xác nhận test tạm đã được dọn hoặc đang được giữ để review.

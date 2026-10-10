
## PLANNER-API — kiểm tra môi trường, đã xử lý
- Thời điểm: 2026-10-07, Asia/Ho_Chi_Minh.
- Command: `npx tsc --noEmit` chạy đồng thời với `npm run build`.
- Expected: type-check pass. Actual: TS6053, build đang tạo lại `.next/types` nên compiler đọc file vừa bị thay thế. Không phải lỗi source/API.
- Resolution: chạy lại `npx tsc --noEmit` sau khi build kết thúc: exit 0.
- Command: `npm run lint` khi test tạm `PLANNER-API/check.cjs` chưa được dọn.
- Expected: lint pass. Actual: 10 lỗi no-require-imports trong script kiểm tra CommonJS tạm; không nằm trong source ứng dụng.
- Resolution: 35/35 test contract/controller pass; dọn test theo AGENTS.md, sau đó chạy lại lint. Kết quả cuối được ghi trong report task.

## CT-IMG-01 — test runner chưa resolve alias Next.js
- Thời điểm: 2026-10-09, Asia/Ho_Chi_Minh.
- Command: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test .api-test-tmp/CT-IMG-01/cloudinary-upload.test.mjs`.
- Case: `cloudinary-upload.test.mjs` không khởi chạy; expected các case upload service chạy, actual Node không resolve import alias `@/config`.
- Lỗi: `ERR_MODULE_NOT_FOUND: Cannot find package '@/config' imported from .../src/services/cloudinaryUploadService.ts`.
- Trạng thái: lỗi môi trường test Node thuần, không phải kết quả kiểm thử runtime upload. Giữ script để chạy lại với loader hỗ trợ alias; chỉ xóa sau khi toàn bộ case pass.
- Lần chạy lại: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --disable-warning=ExperimentalWarning --experimental-strip-types --experimental-loader .api-test-tmp/CT-IMG-01/alias-loader.mjs --test .api-test-tmp/CT-IMG-01/cloudinary-upload.test.mjs .api-test-tmp/CT-IMG-01/dna-analysis.test.mjs`.
- Expected: test loader được nạp và chạy các case; actual: Node từ chối đường dẫn loader tương đối (`ERR_INVALID_MODULE_SPECIFIER`). Đang sửa cách gọi loader bằng file URL tuyệt đối.
- Một lần gọi tiếp theo chạy từ thư mục `frontend` nhưng vẫn thêm tiền tố `frontend/`, nên Node không tìm thấy file test và không thực thi case nào; đã sửa đường dẫn theo đúng working directory.
- Resolution: chạy lại với file URL tuyệt đối cho loader và đường dẫn test tính từ `frontend`: 12/12 case pass (Cloudinary/DNA 8/8, validation 4/4). TypeScript 232 file/0 diagnostics, ESLint `src` pass, `git diff --check` pass. Các script test tạm được dọn sau khi toàn bộ case pass.
- Build riêng không xác nhận được: `next/font` không tải được Google Fonts vì môi trường bị giới hạn mạng; không có kết luận build thành công hay lỗi source từ lần chạy này.

## CT-IMG-03 — remove ảnh chưa hủy request upload
- Thời điểm: 2026-10-09 01:10, Asia/Ho_Chi_Minh.
- Command: `node --experimental-strip-types --test .api-test-tmp/CT-IMG-03/upload-session.test.mjs`.
- Case: `aborts only the image upload that the user removes while pending`.
- Expected: controller của ảnh bị gỡ bị abort và bị xóa khỏi map; upload khác tiếp tục.
- Actual: signal của ảnh bị gỡ vẫn chưa bị abort (`false !== true`) khi helper còn là stub.
- Resolution: helper `abortPendingUpload` gọi `abort()` cho đúng controller và xóa entry; gọi helper khi gỡ attachment đang upload.
- Retest: `node --experimental-strip-types --test .api-test-tmp/CT-IMG-03/*.test.mjs` — 4/4 case pass.

## AUTH-REFRESH-01 — session refresh/retry (expected red before implementation)
- Time: 2026-10-09 09:58:45, Asia/Ho_Chi_Minh.
- Command: `node --experimental-strip-types --test .api-test-tmp/auth-refresh-retry/apiClient.test.mjs` (working directory: `frontend`).
- Cases: `refresh POST is allowlisted and GET is rejected`; `one 401 refreshes through the same-origin proxy and retries with original options and JSON body`; `retry is limited to one attempt and exposes the retried 401 error`; `concurrent browser 401s share one refresh request`.
- Expected: refresh constant/POST allowlist exist, a browser session-proxy 401 refreshes once then retries once, and concurrent 401s share one refresh.
- Actual: 4 cases failed; 2 exclusion/boundary cases passed. The constant was `undefined`; POST route was not available; the API client surfaced the original HTTP 401 after 1 request instead of 3 calls; concurrent requests started no refresh.
- Errors: assertion expected `/api/v1/auth/refresh`, got `undefined`; API request threw `ApiClientError` HTTP 401 (`expired`); retry count expected 3, got 1; concurrent case expected a refresh, got none.
- Initial red run recorded; implementation and successful retest are listed below.
- Resolution: added the refresh endpoint constant and POST proxy allowlist; the shared client now performs one browser-only refresh through `/api/backend`, shares concurrent refreshes, and retries the original request once while retaining its options/body and existing error parsing.
- Retest command: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test .api-test-tmp/auth-refresh-retry/apiClient.test.mjs` (working directory: `frontend`). Actual: 6/6 pass, including auth exclusions, server/direct-origin boundaries, body/options preservation, retry limit, and one shared refresh for concurrent 401s.
- Test temporary directory: removed after the full pass.

## ADM-API-00 — assertion sai trong harness allowlist đã xử lý
- Thời điểm: 2026-10-09, Asia/Ho_Chi_Minh.
- Command ban đầu: `node frontend/.api-test-tmp/ADM-API-00/check.mjs`.
- Case: negative assertion cho `POST /api/v1/admin/golden-datasets/id/runs`.
- Expected của harness: route bị từ chối. Actual: route được allowlist, đúng với endpoint run được backend tài liệu hóa.
- Lỗi: assertion trong harness phân loại nhầm route hợp lệ, không phải lỗi trong source.
- Resolution: chuyển negative case sang path không hợp lệ `/api/v1/admin/golden-datasets/id/runs/extra`.
- Retest: `node frontend/.api-test-tmp/ADM-API-00/check.mjs` — 25 route allow, 10 route deny và endpoint builders đều pass.
- Test temporary directory: đã xóa sau khi toàn bộ assertion pass.

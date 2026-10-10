# VISTRA

Ứng dụng lập kế hoạch du lịch cá nhân hóa bằng Travel DNA, hỗ trợ tạo lịch trình, bản đồ, điểm đến gợi ý và hội thoại với Vistra để chỉnh sửa lịch trình.

## Trạng thái pipeline ảnh

Pipeline ảnh đã chạy hoàn tất thành công:

- Batch cuối: `48 imported, 0 skipped, 0 failed`.
- Vector đã được upsert vào collection Qdrant `scraped_images`.
- Kết thúc với: `Photo source exhausted; pipeline complete.`
- File không có Cloudinary URL bị bỏ qua là dữ liệu không hợp lệ, không phải lỗi xử lý batch.

## Công nghệ

- Backend: FastAPI, PostgreSQL, SQLAlchemy, Qdrant, OpenAI/Gemini.
- Frontend: Next.js, TypeScript, pnpm.
- Dữ liệu ảnh: Cloudinary và embedding tìm kiếm ảnh bằng SigLIP.
- Bản đồ/lộ trình: dữ liệu địa điểm, geocoding và routing từ các dịch vụ cấu hình trong môi trường.

## Cấu trúc thư mục

```text
backend/       API, database, migration, worker và photo pipeline
frontend/      Next.js web application
docker-compose.yml
README.md
```

## Yêu cầu cài đặt

- Windows PowerShell hoặc Linux/macOS.
- Python 3.11+ và PostgreSQL 15+ nếu chạy thủ công.
- Node.js 20+, pnpm.
- Docker Desktop nếu chạy bằng Docker.
- Các tài khoản/dịch vụ tùy tính năng: OpenAI hoặc Gemini, Qdrant, Cloudinary.

## Chạy nhanh bằng Docker

Tạo/cập nhật file môi trường theo mẫu của dự án, sau đó chạy:

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend
docker compose up --build
```

Các địa chỉ thường dùng:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Chạy backend thủ công trên Windows

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python -m uvicorn backend.src.main:app --reload --host 127.0.0.1 --port 8000
```

Nếu PowerShell chặn activate, có thể chạy trực tiếp:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.src.main:app --reload --host 127.0.0.1 --port 8000
```

## Chạy frontend thủ công

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend\frontend
pnpm install
pnpm.cmd run dev
```

Frontend mặc định chạy tại http://localhost:3000. Kiểm tra biến `API_BASE` hoặc biến proxy tương ứng trong `frontend/.env.local` để frontend gọi đúng backend.

## Biến môi trường quan trọng

Đặt biến trong file `.env` của backend và `.env.local` của frontend theo cấu hình hiện tại của dự án. Không commit secret thật lên Git.

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/vistra
API_BASE=http://localhost:8000
QDRANT_URL=https://your-qdrant-host
QDRANT_API_KEY=your-qdrant-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

Tên biến chính xác có thể khác theo module; hãy ưu tiên các biến đã có trong `.env.example`, `backend/.env` và `frontend/.env.local`.

## Chạy photo pipeline tiếp tục từ checkpoint

Pipeline có checkpoint nên khi tắt VS Code hoặc dừng tiến trình, chạy lại sẽ tiếp tục xử lý dữ liệu chưa hoàn tất, không cần upload lại các batch đã thành công.

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend
.\.venv\Scripts\Activate.ps1
$env:QDRANT_URL="https://your-qdrant-host"
$env:QDRANT_API_KEY="your-qdrant-key"
python .\backend\scripts\photo\run_photo_pipeline.py `
  --cycle-size 100 `
  --batch-size 50 `
  --interval-seconds 30 `
  --error-backoff-seconds 120
```

Không xóa các thư mục/file checkpoint hoặc trạng thái import nếu muốn pipeline resume đúng vị trí. Cảnh báo `use_fast` của Transformers chỉ là cảnh báo; lỗi `QDRANT_URL` hoặc `torchvision` mới làm pipeline không chạy được.

## Luồng sử dụng chính

1. Mở `/create-trip`, chọn điểm đến, ngày đi và sở thích.
2. Gửi Travel DNA để phân tích.
3. Tạo chuyến đi và sinh lịch trình.
4. Mở `/planner?trip_id=<TRIP_ID>` để xem lịch trình, bản đồ và toàn bộ điểm gợi ý.
5. Chọn điểm gợi ý, đổi địa điểm, đổi thứ tự hoặc xóa điểm; hệ thống tạo bản nháp để review.
6. Xác nhận thay đổi rồi bấm lưu lịch trình. Hủy sẽ giữ nguyên lịch trình cũ.

## API quan trọng

```text
POST /api/v1/dna/analyze
POST /api/v1/trips?generate_itinerary=true
GET  /api/v1/trips/{trip_id}
POST /api/v1/trips/{trip_id}/chat
POST /api/v1/trips/{trip_id}/revisions/preview
POST /api/v1/trips/{trip_id}/revisions/commit
```

## Kiểm tra nhanh

```powershell
python -m compileall backend
cd frontend
pnpm.cmd run lint
```

## Một số lỗi thường gặp

- `401`: phiên đăng nhập hết hạn; đăng nhập lại hoặc kiểm tra cookie/auth refresh.
- `503` khi generate: kiểm tra dịch vụ routing/geocoding và log backend.
- `422` revision preview: kiểm tra payload điểm đến, ngày và `trip_id`.
- `502` chat: kiểm tra provider AI, API key, timeout và log backend.
- `Set QDRANT_URL`: khai báo `QDRANT_URL` trong PowerShell trước khi chạy photo pipeline.
- `SiglipImageProcessorFast requires Torchvision`: cài đúng PyTorch/Torchvision hoặc dùng cấu hình processor chậm đã có trong pipeline.

## Lưu ý phát triển

- Giữ toàn bộ nội dung hiển thị cho người dùng bằng tiếng Việt.
- Không đưa khóa API, mật khẩu database hoặc token Qdrant vào source control.
- Sau khi thay đổi schema/database, kiểm tra migration và khởi động lại backend.
- Khi sửa planner, kiểm tra cả preview, commit, rollback và trạng thái bản nháp trên frontend.

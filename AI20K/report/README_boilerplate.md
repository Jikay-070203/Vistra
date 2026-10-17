# P-103
# YourTripYourTry là nền tảng hỗ trợ lập kế hoạch du lịch bằng AI, giúp người dùng khám phá địa điểm, xây dựng lịch trình và theo dõi ngân sách chuyến đi. 
# Dự án sử dụng FastAPI, PostgreSQL/SQLite và Gemini AI, với dữ liệu địa điểm được chuẩn hóa để phục vụ tìm kiếm và lập lịch trình theo từng destination.

Backend lập kế hoạch du lịch với FastAPI, PostgreSQL/SQLite
## Quick start bằng Docker

Yêu cầu: Docker Desktop, Docker Compose và Git.

```powershell
cd D:\Sourcecode\vinai\project\P-103
Copy-Item .env.example .env
docker compose up --build -d
docker compose ps
curl.exe -i http://localhost:8000/health
```

Backend ở `http://localhost:8000`; frontend demo ở `http://localhost:3000`.

```powershell
docker compose logs -f backend
docker compose down
```

## Cài đặt Python local

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn backend.src.main:app --host 0.0.0.0 --port 8000
```

Docker Compose là cách chạy chuẩn vì đã cấu hình đúng package, database và port.

## Biến môi trường

Không commit `.env`; file có thể chứa thông tin nhạy cảm.

| Biến | Mục đích | Ví dụ |
|---|---|---|
| `DATABASE_URL` | PostgreSQL URL; để trống để dùng SQLite | `postgresql://user:password@localhost:5432/dbname` |
| `DATABASE_PATH` | Đường dẫn SQLite | `/app/data/yourtripyourtry.db` |
| `API_TOKEN` | Token bảo vệ API | để trống khi local |
| `GEMINI_API_KEY` | API key Gemini | không commit giá trị thật |
| `GEMINI_MODEL` | Model Gemini | `gemini-3.5-flash-lite` |
| `CORS_ORIGINS` | JSON array các origin | `["http://localhost:3000"]` |
| `PORT` | Port Uvicorn | `8000` |
| `APP_ENV` | Môi trường chạy | `development` |
| `AI_LOG_SERVER` | Server nhận AI log | URL server được cấp |
| `AI_LOG_API_KEY` | Key gửi AI log | không commit giá trị thật |
| `AI_LOG_DIR` | Thư mục log | `.ai-log` |

Ví dụ local tối thiểu:

```dotenv
APP_ENV=development
PORT=8000
DATABASE_URL=
DATABASE_PATH=./data/yourtripyourtry.db
API_TOKEN=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
AI_LOG_DIR=.ai-log
```

## Database và seed

Schema và dữ liệu seed:

```text
backend/seed/YourTripYourTry_Places_Schema.sql
backend/seed/places_seed.seed
```

Schema được khởi tạo khi backend start. Kiểm tra PostgreSQL:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
SELECT COUNT(*) FROM places;
```

## API sample queries

```powershell
$base = "http://localhost:8000"
curl.exe -s "$base/health"
curl.exe -s "$base/destinations"
curl.exe -s "$base/places?destination=ninh-binh&limit=5"
curl.exe -s "$base/agent/status"
curl.exe -s "$base/places?destination=not-a-real-destination"
```

Nếu bật `API_TOKEN`:

```powershell
curl.exe -s -H "X-API-Key: $env:API_TOKEN" "$base/destinations"
```

| Method | Path | Mục đích |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/destinations` | Danh sách destinations |
| GET | `/places` | Tìm/lọc địa điểm |
| GET | `/places/{id}` | Chi tiết địa điểm |
| GET | `/destinations/{slug}/planning-places` | Địa điểm lập lịch |
| GET | `/agent/status` | Trạng thái AI |
| POST | `/agent/parse` | Parse yêu cầu du lịch |
| POST | `/trips` | Tạo chuyến đi |
| GET | `/trips` | Danh sách chuyến đi |
| POST | `/trips/{id}/generate` | Sinh itinerary |
| GET | `/trips/{id}/budget` | Ngân sách |

## Manual evaluation evidence

Sau khi backend healthy:

```powershell
python .\scripts\p-103\run_manual_eval.py --base-url http://localhost:8000
```

Kết quả nằm tại:

```text
presentation/test_case/EVAL_EVIDENCE.md
presentation/test_case/results.json
```

Đọc đúng UTF-8 trong PowerShell:

```powershell
Get-Content .\presentation\test_case\EVAL_EVIDENCE.md -Encoding UTF8
```

## AI logging

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup_hooks.ps1
```

Log local nằm ở `.ai-log/session.jsonl`. ChatGPT/web tool không có hook tự động:

```powershell
python .\scripts\log_manual.py `
  --tool chatgpt `
  --prompt "Mô tả ngắn việc đã hỏi AI"
```

`.ai-log/*.jsonl` bị ignore có chủ đích; không commit log hoặc API key.

## Cấu trúc chính

```text
backend/src/       FastAPI application
backend/seed/      SQL schema và place seed
scripts/p-103/     Evaluation utilities
scripts/log_*.py   AI logging utilities
presentation/      Demo và evaluation evidence
tests/             Automated tests
docker-compose.yml Backend/frontend stack
requirements.txt   Python dependencies
.env.example       Environment template
```

## Troubleshooting

| Lỗi | Cách xử lý |
|---|---|
| `WinError 10061` | Backend chưa chạy hoặc sai port; dùng `localhost:8000` |
| Healthcheck fail | Chạy `docker compose logs backend` |
| Không có places | Xem log bootstrap và `SELECT COUNT(*) FROM places` |
| `401 Invalid API key` | Truyền `X-API-Key` hoặc bỏ `API_TOKEN` khi local |
| Tiếng Việt lỗi trong evidence | Dùng `Get-Content -Encoding UTF8` |

## License

MIT

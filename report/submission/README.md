# VISTRA - Visual Intelligence System for Travel Recommendation & Agents
> **Dự án Capstone Build Phase · Nhóm P-103 (Group 01 - Track 103)**  
> *Your travel companion, with memory.*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue.svg?logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Qdrant](https://img.shields.io/badge/Vector%20DB-Qdrant-red.svg?logo=qdrant&logoColor=white)](https://qdrant.tech)



---

## 📌 Giới thiệu dự án

**VISTRA**  là nền tảng hỗ trợ lập kế hoạch du lịch thông minh thế hệ mới, ứng dụng hệ thống Đa tác tử (**Multi-Agent System**), truy xuất tăng cường đa phương thức (**Multimodal Hybrid RAG**) và công nghệ phân tích gu thẩm mỹ thị giác độc bản (**Travel DNA**). 

Hệ thống giúp người dùng biến ý tưởng hoặc hình ảnh chụp ngẫu hứng thành lịch trình du lịch khả thi, chính xác đến từng khung giờ, tối ưu chi phí và tự động thích ứng với điều kiện thời tiết thực tế tại Việt Nam.

### 🌟 Tính năng nổi bật
1. **Phân tích gu du lịch qua ảnh (Travel DNA)**: Tải lên từ 1 đến 3 ảnh để mô hình thị giác **Google SigLIP2** trích xuất chỉ số thẩm mỹ (thiên nhiên, văn hóa, ẩm thực, mức độ thư thái/khám phá).
2. **Hệ thống 5 Chuyên gia AI (Specialist Agent Swarm)**: Phân rã tác vụ chuyên sâu cho Destination Context, POI, Vận chuyển (OpenRouteService), Ngân sách và Dự báo thời tiết (Open-Meteo).
3. **Bộ thẩm định & Tự sửa lỗi (Critic-Planner Repair Loop)**: Tự động phát hiện và giải quyết xung đột giờ mở cửa, khoảng cách địa lý và thời tiết xấu trước khi xuất bản lịch trình.
4. **Trí nhớ đàm thoại 2 tầng (Conversational Memory)**: Ghi nhớ thói quen, sở thích cá nhân xuyên suốt các phiên làm việc với PostgreSQL và Qdrant.
5. **Dữ liệu có nguồn gốc minh bạch (Grounded Data)**: Hơn 1.200 địa điểm được chuẩn hóa từ OpenStreetMap (ODbL) và Wikivoyage, phân loại chất lượng từ discovered → schedulable → verified.

---

## 🚀 Khởi động nhanh (Quick Start)

### Cách 1: Khởi chạy bằng Docker Compose (Khuyến nghị)

Yêu cầu: Đã cài đặt **Docker Desktop** và **Git**.

```powershell
# 1. Di chuyển vào thư mục dự án
cd thư mục chứa mã nguồn

# 2. Cấu hình biến môi trường
Copy-Item .env.example .env

# 3. Khởi chạy toàn bộ hệ thống (Backend, Frontend, Databases)
docker compose up --build -d

# 4. Kiểm tra trạng thái các container
docker compose ps

# 5. Kiểm tra sức khỏe hệ thống backend
curl.exe -i http://localhost:8000/health
```

* **Frontend Web App**: `http://localhost:3000`
* **Backend API & Swagger UI**: `http://localhost:8000/docs`
* **Chatbot UI**: `http://localhost:8000`

Để dừng hệ thống:
```powershell
docker compose down
```

---

### Cách 2: Cài đặt và Chạy thủ công trên Local

#### Yêu cầu hệ thống:
* **Python**: 3.11 hoặc 3.12
* **Node.js**: 18+ và `npm` hoặc `pnpm`
* **Docker**: Dùng để chạy Qdrant và PostgreSQL nếu cần

#### Bước 1: Khởi tạo Backend (FastAPI)
```powershell
cd thư mục chứa mã nguồn

# Tạo và kích hoạt môi trường ảo Python
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Cài đặt thư viện phụ thuộc
python -m pip install --upgrade pip
pip install -r requirements.txt

# Cấu hình file .env
Copy-Item .env.example .env

# Khởi chạy server FastAPI
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Bước 2: Khởi tạo Frontend (Next.js)
```powershell
cd D:\Sourcecode\vinai\project\P-103\frontend

# Cài đặt dependencies
npm install

# Khởi chạy server phát triển
npm run dev
```

---

## ⚙️ Cấu hình Biến môi trường (.env)

| Tên biến | Bắt buộc | Mục đích & Mô tả | Giá trị mẫu / Mặc định |
| :--- | :---: | :--- | :--- |
| `APP_ENV` | Có | Môi trường hoạt động | `development` / `production` |
| `PORT` | Không | Cổng dịch vụ FastAPI | `8000` |
| `DATABASE_URL` | Không | Kết nối PostgreSQL; để trống để dùng SQLite | `postgresql://app:pwd@localhost:5432/vistra` |
| `DATABASE_PATH` | Có | Đường dẫn tập tin cơ sở dữ liệu SQLite cục bộ | `./data/yourtripyourtry.db` |
| `QDRANT_URL` | Không | Địa chỉ Qdrant Vector Engine | `http://localhost:6333` |
| `GEMINI_API_KEY` | Có | Khóa Google Gemini AI API | *Điền API Key của bạn* |
| `GEMINI_MODEL` | Không | Phiên bản mô hình Gemini ưu tiên | `gemini-3.5-flash-lite` |
| `OPENAI_API_KEY` | Không | Khóa OpenAI API (dùng cho Agent fallback) | `sk-...` |
| `CORS_ORIGINS` | Có | Danh sách Origin được phép truy cập CORS | `["http://localhost:3000","http://localhost:5173"]` |
| `AI_LOG_API_KEY` | Có | Khóa định danh thành viên đẩy log lên server chấm điểm | *Cấp tại dashboard Phoenix* |
| `AI_LOG_DIR` | Có | Thư mục ghi nhận phiên log cục bộ | `.ai-log` |

---

## 📡 Tài liệu API & Mẫu truy vấn (API Sample Queries)

### 1. Kiểm tra trạng thái hệ sinh thái (Health & Status)
```powershell
$base = "http://localhost:8000"

# Health check
curl.exe -s "$base/health"

# Agent & AI Provider status
curl.exe -s "$base/agent/status"
```

### 2. Danh mục Điểm đến & Khám phá địa điểm
```powershell
# Lấy danh sách điểm đến đã kích hoạt
curl.exe -s "$base/destinations"

# Lấy 5 địa điểm nổi bật tại Ninh Bình
curl.exe -s "$base/places?destination=ninh-binh&limit=5"
```

### 3. Khởi tạo Chuyến đi & Sinh Lịch trình tự động
```powershell
# Tạo một chuyến đi mới tại Ninh Bình (3 ngày 2 đêm, 2 người)
$tripBody = @{
    destination = "ninh-binh"
    start_date = "2026-11-10"
    days = 3
    people = 2
    budget_vnd = 5000000
    budget_scope = "total"
    transport = "car"
    pace = "normal"
    interests = @("attraction", "food", "nature")
} | ConvertTo-Json

$tripResponse = Invoke-RestMethod -Uri "$base/trips" -Method Post -Body $tripBody -ContentType "application/json"
$tripId =$tripResponse.id

# Kích hoạt AI Agent sinh lịch trình chi tiết
Invoke-RestMethod -Uri "$base/trips/$tripId/generate" -Method Post

## 🧪 Bằng chứng Kiểm thử (Evaluation Evidence)

Hệ thống đã trải qua quy trình kiểm thử tự động nghiêm ngặt và đạt 100% tỷ lệ vượt qua (5/5 Test Cases PASS):

```powershell
python .\scripts\p-103\run_manual_eval.py --base-url http://localhost:8000
```

| Mã kiểm thử | Mục tiêu kiểm chứng | Trạng thái |
| :---: | :--- | :---: |
| **TC01** | `GET /health` — Trả về HTTP 200 và version `0.1.0` | **PASS** |
| **TC02** | `GET /destinations` — Trả về danh mục 4 điểm đến có bản quyền OSM | **PASS** |
| **TC03** | `GET /places?destination=ninh-binh` — Truy vấn thành công 300 địa điểm đã seed | **PASS** |
| **TC04** | `GET /agent/status` — Kết nối Gemini và công bố năng lực Agent | **PASS** |
| **TC05** | `GET /places?destination=invalid` — Xử lý lỗi an toàn, không crash | **PASS** |

Xem báo cáo chi tiết tại: [`04_TAI_LIEU_KIEM_THU.md`](04_TAI_LIEU_KIEM_THU.md).

---

## 🛠️ Cấu trúc Mã nguồn Dự án (Project Structure)

```text
D:\Sourcecode\vinai\project\P-103\
├── backend/                  # FastAPI Application
│   ├── src/
│   │   ├── agents/           # Multi-Agent logic (Manager, Critic, Orchestrator)
│   │   ├── tools/            # Công cụ chuyên biệt: Routing, Weather, Budget, Places
│   │   ├── migrations/       # 23 file SQL DDL & DML hoàn chỉnh
│   │   ├── db.py             # Kết nối PostgreSQL
│   │   ├── main.py           # Định nghĩa toàn bộ RESTful Endpoints
│   │   ├── models.py         # Pydantic v2 schemas chuẩn hóa
│   │   └── planner.py        # Thuật toán TravelPlanner lập lịch
│   ├── seed/                 # Dữ liệu mẫu 1.200 POIs & Schema
│   └── scripts/              # Bộ test và công cụ crawl dữ liệu OSM
├── frontend/                 # Ứng dụng Web Next.js 15 & React 19
│   ├── src/
│   │   ├── components/       # UI Components: Composer, Moodboard, Travel DNA Slider
│   │   ├── services/         # API Client kết nối Backend & Cloudinary
│   │   └── types/            # TypeScript Interface definitions
├── chatbot/                  # Chatbot đàm thoại tự nhiên với Trí nhớ dài hạn
│   ├── src/                  # Pipeline hybrid retrieval và LangGraph
│   └── config.yaml           # Cấu hình vector size, BM25, SigLIP2
├── report_final/             # Toàn bộ hồ sơ báo cáo Capstone nghiệm thu
│   ├── 01_TEN_VA_MO_TA_DU_AN.md
│   ├── 02_SO_DO_KIEN_TRUC.md
│   ├── 03_TAI_LIEU_DAC_TA_VA_THIET_KE.md
│   └── 04_TAI_LIEU_KIEM_THU.md
├── docker-compose.yml        # Docker orchestration chạy local
└── requirements.txt          # Thư viện Python chính
```

---

## 🔒 Quy chuẩn Đạo đức & Bản quyền (Ethics & Compliance)
* **Bản quyền dữ liệu**: Tuân thủ giấy phép **Open Data Commons Open Database License (ODbL)** của OpenStreetMap contributors. 
* **Quyền riêng tư & Bảo mật**: Không commit API Key vào git. Session cookie sử dụng cờ `HttpOnly`, `SameSite=Lax`.

---

## 📄 Bản quyền & Giấy phép
Dự án được phát hành theo giấy phép **MIT License**. Mọi đóng góp xin tham khảo tài liệu [CONTRIBUTING.md](../P-103/CONTRIBUTING.md).

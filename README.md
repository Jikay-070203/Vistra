# VISTRA

VISTRA là nền tảng lập kế hoạch du lịch cá nhân hóa. Hệ thống phân tích sở thích để đề xuất điểm đến và xây dựng lịch trình phù hợp theo thời gian, ngân sách, nhu cầu ăn uống và phong cách chuyến đi.

## Công nghệ sử dụng

- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Backend: FastAPI, Python, SQLAlchemy.
- Cơ sở dữ liệu: PostgreSQL.
- AI: OpenAI/Gemini cho phân tích Travel DNA, tạo lịch trình và hội thoại với Vistra.
- Tìm kiếm vector: Qdrant cho dữ liệu điểm đến và hình ảnh.
- Hình ảnh: Cloudinary lưu trữ và phân phối ảnh địa điểm.
- Bản đồ và định tuyến: hiển thị vị trí, khoảng cách và lộ trình.
- Triển khai: Docker và Docker Compose.

## Chức năng chính

### Phân tích Travel DNA

- Thu thập sở thích, ngân sách, thời gian và nhu cầu của người dùng.
- Phân tích phong cách du lịch để cá nhân hóa đề xuất.
- Hỗ trợ thông tin dị ứng và ưu tiên ăn uống.

### Tạo lịch trình

- Tạo chuyến đi theo địa điểm, ngày đi và số lượng người.
- Sinh lịch trình theo từng ngày, gồm thời gian tham quan và di chuyển.
- Tối ưu theo giờ mở cửa, thời gian di chuyển và khung giờ trong ngày.
- Hiển thị lịch trình trên bản đồ.

### Điểm đến gợi ý

- Hiển thị toàn bộ điểm đến phù hợp với chuyến đi.
- Cho phép chọn nhiều điểm để tạo lịch trình.
- Thêm điểm đến mới hoặc thay thế điểm hiện có.

### Chỉnh sửa lịch trình

- Đổi thứ tự điểm đến bằng nút di chuyển lên/xuống.
- Xóa điểm đến khỏi lịch trình.
- Tạo bản nháp thay đổi để người dùng xem trước.
- Xác nhận thay đổi hoặc hủy để giữ nguyên lịch trình cũ.
- Lưu lịch trình sau khi chỉnh sửa.

### Hội thoại với Vistra

- Yêu cầu đổi thứ tự, thêm, thay thế hoặc xóa điểm đến bằng ngôn ngữ tự nhiên.
- Hiển thị trao đổi bằng tiếng Việt.
- Giải thích các vấn đề về thời gian, khoảng cách và tính phù hợp.
- Yêu cầu xác nhận trước khi cập nhật thay đổi vào lịch trình.

### Quản lý lịch trình

- Xem lịch trình theo từng ngày.
- Theo dõi trạng thái bản nháp và lịch trình đã chốt.
- Xem tài liệu hành trình.
- Chốt lịch trình sau khi hoàn tất chỉnh sửa.

### Dữ liệu địa điểm và hình ảnh

- Quản lý thông tin địa điểm du lịch, nhà hàng và dịch vụ liên quan.
- Tìm kiếm địa điểm bằng dữ liệu văn bản và vector embedding.
- Lưu trữ hình ảnh địa điểm qua Cloudinary.

## Triển khai local

### Yêu cầu

- Python 3.11 trở lên.
- Node.js 20 trở lên và pnpm.
- PostgreSQL hoặc Docker Desktop.
- Các API key cần thiết được khai báo trong file `.env` của backend và `.env.local` của frontend. Không commit các file này lên Git.

### Chạy bằng Docker Compose

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend
docker compose up --build
```

Sau khi khởi động:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger API: http://localhost:8000/docs

### Chạy backend thủ công

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python -m uvicorn backend.src.main:app --reload --host 127.0.0.1 --port 8000
```

### Chạy frontend thủ công

Mở terminal khác:

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend\frontend
pnpm install
pnpm.cmd run dev
```

Frontend chạy tại http://localhost:3000. Cấu hình URL backend trong `frontend/.env.local` theo môi trường local.

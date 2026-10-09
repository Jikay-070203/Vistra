Đã tạo 2 script quản lý admin, không ghi cứng tài khoản hoặc password vào `.env`.

Files:

- [create_admin.py](/D:/Sourcecode/vinai/project/demo/Vistra-backend/backend/scripts/create_admin.py)
- [change_admin.py](/D:/Sourcecode/vinai/project/demo/Vistra-backend/backend/scripts/change_admin.py)
- [admin_common.py](/D:/Sourcecode/vinai/project/demo/Vistra-backend/backend/scripts/admin_common.py)

Script đọc `DATABASE_URL` theo thứ tự:

1. Biến môi trường hiện tại.
2. File `.env`.

Password được nhập bằng prompt và không được lưu ra file.

Tạo admin:

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend

python backend/scripts/create_admin.py `
  --email admin@example.com `
  --name "Project Admin"
```

Promote hoặc cập nhật admin đã tồn tại:

```powershell
python backend/scripts/create_admin.py `
  --email admin@example.com
```

Đổi email:

```powershell
python backend/scripts/change_admin.py `
  --email admin@example.com `
  --new-email new-admin@example.com
```

Đổi tên:

```powershell
python backend/scripts/change_admin.py `
  --email admin@example.com `
  --new-name "New Admin"
```

Đổi password:

```powershell
python backend/scripts/change_admin.py `
  --email admin@example.com `
  --change-password
```

Nếu chạy script từ máy host kết nối PostgreSQL Docker, đặt URL tạm thời:

```powershell
$env:DATABASE_URL="postgresql://app:local-postgres-password@localhost:5434/yourtripyourtry_local"
```

Nếu chạy trong production, đặt `DATABASE_URL` PostgreSQL production trong biến môi trường của terminal hoặc Railway, không đưa password vào source code. Cả hai script đã kiểm tra compile thành công.
## API admin cho frontend

Các API dưới đây yêu cầu cookie `vistra_session` của tài khoản role `admin` hoặc
`staff`. Frontend phải gửi request với `credentials: "include"`.

### Dashboard và người dùng

```text
GET   /api/v1/admin/overview
GET   /api/v1/admin/revenue
GET   /api/v1/admin/users?page=1&page_size=20&q=
PATCH /api/v1/admin/users/{user_id}/status
```

### Feedback, trace và metrics

```text
GET   /api/v1/admin/feedback
PATCH /api/v1/admin/feedback/{ticket_id}
POST  /api/v1/admin/feedback/{ticket_id}/replies
GET   /api/v1/admin/traces
GET   /api/v1/admin/traces/{trace_id}
GET   /api/v1/admin/system/metrics
```

### CMS content

```text
GET    /api/v1/admin/content
POST   /api/v1/admin/content/{hero-plans|intro-destinations|allergy-options}
PATCH  /api/v1/admin/content/{collection}/{item_id}
DELETE /api/v1/admin/content/{collection}/{item_id}
```

### Quản trị dữ liệu

```text
GET /api/v1/admin/entities/metadata
GET /api/v1/admin/entities/{table}/records?page=1&page_size=20&q=
```

Các table được allow-list gồm `destinations`, `plans`, `itinerary_days`,
`activities` và `feedback_tickets`; backend không nhận tên bảng tùy ý từ client.

### Import địa danh và ảnh

```text
POST /api/v1/admin/import/places
POST /api/v1/admin/import/place-images
```

Import địa danh tối đa 100 item/request; import ảnh tối đa 50 item/request,
chỉ nhận HTTPS URL thuộc allow-list.

### Golden dataset và safety

```text
GET  /api/v1/admin/golden-datasets
POST /api/v1/admin/golden-datasets
POST /api/v1/admin/golden-datasets/{dataset_id}/runs
GET  /api/v1/admin/safety-presets
POST /api/v1/admin/safety-evaluations
```

Ví dụ tạo golden dataset:

```json
{
  "name": "Trip smoke tests",
  "description": "Production checks",
  "testCases": [
    {"id": "case-1", "name": "Basic request", "input": {"text": "hello"}, "expected": {"ok": true}}
  ]
}
```

Kết quả test production được ghi tại:

```text
backend/scripts/test/production_api_test_results.json
```

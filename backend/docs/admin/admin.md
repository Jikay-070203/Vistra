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
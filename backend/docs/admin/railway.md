Đã cập nhật Dockerfile để đưa scripts admin vào image backend:

```dockerfile
COPY scripts ./backend/scripts
```

Quy trình chạy trên Railway:

### 1. Commit và push code

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend

git add backend/src/deploy/Dockerfile backend/scripts
git commit -m "feat: add Railway admin account scripts"
git push origin main
```

Railway sẽ build và deploy phiên bản mới.

### 2. Mở Railway Console

Vào:

```text
Railway → Vistra-backend → Deployments → deployment mới → Console
```

Kiểm tra migration trước:

```bash
ls -l /app/backend/scripts
```

Phải thấy:

```text
admin_common.py
create_admin.py
change_admin.py
```

### 3. Tạo admin

Trong Railway Console chạy:

```bash
python /app/backend/scripts/create_admin.py \
  --email admin@vistral.com \
  --name "Project Admin"
```

Script sẽ hỏi:

```text
Admin password (not saved):
```

Password chỉ nhập trực tiếp, không lưu vào `.env`.

### 4. Đổi admin

Đổi email:

```bash
python /app/backend/scripts/change_admin.py \
  --email admin@example.com \
  --new-email new-admin@example.com
```

Đổi password:

```bash
python /app/backend/scripts/change_admin.py \
  --email admin@example.com \
  --change-password
```

Đổi tên:

```bash
python /app/backend/scripts/change_admin.py \
  --email admin@example.com \
  --new-name "New Project Admin"
```

### 5. Kiểm tra đăng nhập

Sau khi tạo admin, chạy script test từ máy local bằng tài khoản Railway:

```powershell
$env:API_BASE="https://vistra-backend-production.up.railway.app"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="password-vừa-tạo"

python backend/scripts/test_full_api.py
```

Không cần đặt `DATABASE_URL` trên máy local khi chạy test API. Railway tự dùng `DATABASE_URL` bên trong service.
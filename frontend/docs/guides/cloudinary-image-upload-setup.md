# Cấu hình tải ảnh cảm hứng lên Cloudinary

Frontend tải ảnh trực tiếp lên Cloudinary bằng unsigned upload preset. API secret không được đưa vào frontend, repository, hay biến `NEXT_PUBLIC_*`.

## Cần cấu hình

1. Trong Cloudinary, tạo hoặc chọn một upload preset ở chế độ **Unsigned**.
2. Đặt thư mục đích của preset thành `<target_folder>` theo cấu hình thật của project. Frontend không gửi tên thư mục; preset chịu trách nhiệm lưu đúng nơi.
3. Chỉ bật kiểu tài nguyên ảnh và các định dạng JPEG/PNG cần thiết. Preset là public và có thể bị người ngoài gọi, nên chỉ cấp quyền upload cần thiết.
4. Cấu hình hai biến public sau ở môi trường chạy Next.js:

```dotenv
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud_name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<unsigned_upload_preset>
```

Đặt chúng trong `frontend/.env.local` khi chạy local và trong Environment Variables của deployment khi chạy production. Khởi động lại dev server hoặc tạo lại deployment sau khi đổi giá trị.

Frontend kiểm tra định dạng JPEG/PNG, giới hạn 5 MiB mỗi ảnh và tối đa 3 ảnh trước khi tải lên. Đây là kiểm tra UX phía trình duyệt; chính sách preset và Backend vẫn cần xác thực dữ liệu nhận được. Backend không cần Cloudinary secret để đọc public URL.

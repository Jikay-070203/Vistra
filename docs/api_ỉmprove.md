Đã bắt đầu triển khai theo tài liệu API.

Đã thêm:

- `GET /api/v1/status`
- `GET /public/content`
- `GET /recommendations/destinations`

Các endpoint mới dùng dữ liệu PostgreSQL thật, không trả mock:

```text
/public/content        -> danh sách destinations và allergy options
/recommendations/...   -> đề xuất từ catalog destinations
/api/v1/status         -> trạng thái backend
```

Đã kiểm tra cú pháp Python thành công:

```text
python -m compileall -q backend/src
```

Tuy nhiên test cũ hiện chưa chạy được vì `tests/conftest.py` import sai:

```text
ModuleNotFoundError: No module named 'src'
```

Đây là lỗi môi trường test, không phải lỗi compile backend.

Lưu ý: tài liệu có hơn 50 API, trong đó các nhóm `auth`, `profile`, `community`, `feedback`, `admin`, `evaluation` cần thêm bảng PostgreSQL và cơ chế session/role thật. Không nên tạo giả toàn bộ trong một lần vì sẽ phá dữ liệu và bảo mật. Các API hiện có thể tiếp tục triển khai theo từng nhóm với migration tương ứng.
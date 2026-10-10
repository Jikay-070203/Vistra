# VISTRA AI service — đánh giá và kế hoạch triển khai

## Kết luận ngắn

Nên tách phần AI/search thành một service riêng. Backend chính chỉ gọi qua HTTP nội bộ và nhận JSON; như vậy việc tải model, embedding, Qdrant search hoặc lỗi provider không làm tiến trình API chính bị nặng theo.

Tuy nhiên, thư mục `Vistra-backend/ai` hiện chưa phải là một HTTP service hoàn chỉnh. Nó đang là thư viện Python gồm retrieval, embedding, ranking, generation và các lớp truy cập Qdrant/SQLite. Thư mục này có `compose.qdrant.yaml` để chạy Qdrant, nhưng chưa có:

- `Dockerfile` cho AI application;
- `app/main.py` hoặc FastAPI entrypoint;
- API contract cho `/health`, `/search`, `/chat`;
- image/embedding model cache được đóng gói;
- worker hoặc cơ chế giới hạn concurrency.

Vì vậy chưa nên nối trực tiếp vào backend production ở giai đoạn này.

## Kết quả kiểm tra Docker

Đã kiểm tra:

```powershell
docker compose -f ai/compose.qdrant.yaml config
```

Compose hợp lệ. Qdrant được cấu hình:

- Image: `qdrant/qdrant:v1.18.0`;
- REST: `127.0.0.1:6333`;
- gRPC: `127.0.0.1:6334`;
- volume: `vistra_qdrant:/qdrant/storage`;
- giới hạn: 2 CPU, 4 GB RAM.

Không thể chạy build/start Docker trong môi trường hiện tại vì Docker daemon chưa chạy:

```text
failed to connect to the Docker API ... docker_engine
The system cannot find the file specified
```

Trên máy local, cần mở Docker Desktop rồi chạy:

```powershell
cd D:\Sourcecode\vinai\project\demo\Vistra-backend
docker compose -f ai\compose.qdrant.yaml config
docker compose -f ai\compose.qdrant.yaml up -d
curl.exe --fail http://127.0.0.1:6333/readyz
curl.exe --fail http://127.0.0.1:6333/collections
```

Compose Qdrant có thể chạy độc lập để kiểm thử trước. Nó không tự nạp snapshot, model hay dữ liệu địa danh.

## Phân tích thành phần AI hiện tại

| Thành phần | Vai trò | Phụ thuộc |
|---|---|---|
| `src/service/chat_service.py` | Điều phối một lượt chat, memory, retrieval, generation | Qdrant, SQLite, provider |
| `src/service/search_service.py` | Tìm kiếm text/image và enrich kết quả | Embedding models, Qdrant, SQLite |
| `src/retrieval/` | Dense/BM25/SigLIP retrieval | Model cache, Qdrant |
| `src/embedding/` | Text, image và sparse embedding | Voyage, SigLIP2, BM25 |
| `src/generation/openai_generation.py` | Lập kế hoạch và sinh câu trả lời | OpenAI API key |
| `src/router/jev.py` | Route query tự nhiên | JEV API key |
| `src/database/` | Qdrant và SQLite metadata | Qdrant server, dataset |
| `compose.qdrant.yaml` | Chỉ chạy Qdrant | Docker |

## Kiến trúc nên dùng

```text
Frontend
   |
   v
Vistra-backend :8080
   |
   | HTTP private network, timeout + retry + circuit breaker
   v
Vistra-ai :8001
   |-- OpenAI/JEV
   |-- local text/image/sparse embeddings
   |-- Qdrant :6333
   |-- SQLite/read-only metadata hoặc PostgreSQL read model
```

Backend chính không nên import trực tiếp các model nặng. AI service nên có:

```text
GET  /health
GET  /ready
POST /v1/search/text
POST /v1/search/image-text
POST /v1/search/image-image
POST /v1/chat
```

Response cần thống nhất dạng:

```json
{
  "request_id": "uuid",
  "answer": "...",
  "places": [],
  "images": [],
  "sources": [],
  "provider": "openai",
  "model": "gpt-5-nano",
  "latency_ms": 123,
  "warnings": []
}
```

AI service không được nhận hoặc trả database credential của backend. Chỉ truyền DTO cần thiết: query, image URL/file reference, destination filter, conversation context và limit.

## Vì sao nên tách service

1. Model `torch`, `transformers`, SigLIP và BM25 làm image lớn và khởi động chậm.
2. Qdrant/indexing có thể dùng CPU/RAM cao, không nên cạnh tranh với FastAPI/auth/PostgreSQL.
3. Có thể restart hoặc scale AI service riêng khi provider/model lỗi.
4. Backend giữ vai trò auth, ownership, trip, feedback và database nghiệp vụ.
5. Có thể thay OpenAI/JEV hoặc model embedding mà không buộc deploy lại backend.

## Rủi ro cần xử lý trước khi build service

- Requirements chứa PyTorch, Transformers và model cache lớn; không phù hợp service Railway nhỏ nếu tải model lúc startup.
- `models_local_files_only: true` yêu cầu cache model được mount hoặc đóng gói trước.
- Qdrant snapshot phải cùng dimension/model: text 2048, image 768 và sparse `bm25`.
- `WikivoyageIndexer.index_batch()` đang có gap: gọi `add_chunks(chunks, embeddings)` thiếu `sparse_embeddings`.
- Dataset và SQLite bị loại khỏi Git; clone mới không đủ dữ liệu để full search.
- Dữ liệu ảnh có thể chứa Windows absolute path, cần chuẩn hóa trước khi chạy container.
- Không dùng public Qdrant URL giữa hai service cùng Railway; dùng private domain.

## Thứ tự triển khai an toàn

### Bước 1 — kiểm thử Qdrant độc lập

Mở Docker Desktop, chạy Compose Qdrant và xác nhận `/readyz`, `/collections`. Restore snapshot vào Qdrant local nếu có.

### Bước 2 — tạo AI API container riêng

Chỉ sau khi có entrypoint thật, tạo `ai/Dockerfile` và `ai/app/main.py`. Image cần healthcheck nhẹ, không gọi model/provider trong `/health`.

### Bước 3 — test AI service riêng

Test lần lượt health, text search, image search và chat. Kiểm tra timeout, response schema, 4xx/5xx và memory trước khi cho backend gọi.

### Bước 4 — nối backend qua adapter

Backend gọi `AI_SERVICE_URL` bằng HTTP private network. Không cho frontend gọi thẳng AI service. Backend vẫn kiểm tra auth, rate limit, ownership và giới hạn upload.

### Bước 5 — production

Tạo Railway service riêng cho AI, mount model/data volume cần thiết, giới hạn CPU/RAM, đặt private domain và chỉ expose backend public domain.

## Biến môi trường đề xuất cho backend sau này

```env
AI_SERVICE_URL=http://vistra-ai.railway.internal:8001
AI_SERVICE_TIMEOUT_SECONDS=45
AI_SERVICE_API_KEY=<internal-service-secret>
```

AI service:

```env
QDRANT_URL=http://qdrant.railway.internal:6333
OPENAI_API_KEY=<provider-key>
JEV_API_KEY=<jev-key>
```

Không commit các key này. AI service phải kiểm tra `X-Internal-Service-Key` hoặc cơ chế service-to-service tương đương.

## Trạng thái hiện tại

- [x] Đọc setup và cấu trúc AI hiện tại.
- [x] Kiểm tra Compose Qdrant hợp lệ.
- [ ] Build Docker AI application: chưa thể, vì chưa có Dockerfile/HTTP entrypoint.
- [ ] Chạy Docker local: bị chặn vì Docker daemon chưa chạy.
- [ ] Nối vào Vistra-backend: chưa thực hiện, đúng phạm vi an toàn.
- [ ] Tạo contract test cho AI HTTP service: cần sau khi có entrypoint.

## Kết luận

Nên triển khai AI thành service riêng, nhưng trước hết cần biến thư mục `ai` thành một application có HTTP API và Dockerfile. Hiện tại chỉ có thể triển khai Qdrant độc lập; chưa thể gọi trực tiếp thư mục này như một service. Sau khi Docker Desktop chạy và có entrypoint, cần build/test service AI riêng trước rồi mới cập nhật backend adapter.

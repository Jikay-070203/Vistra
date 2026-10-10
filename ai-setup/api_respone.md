# VISTRA AI — files và API response contract

## Trạng thái

Thư mục Vistra-backend/ai hiện là thư viện Python, chưa có FastAPI entrypoint hoặc Dockerfile cho AI service riêng. compose.qdrant.yaml chỉ chạy Qdrant. Các HTTP API bên dưới là contract đề xuất, chưa phải API runtime đã triển khai.

## Files và dữ liệu cần

Source chính:

- config.yaml
- requirements.txt
- compose.qdrant.yaml
- src/database/qdrant_connection.py
- src/database/qdrant_wikivoyage_store.py
- src/database/qdrant_image_store.py
- src/database/chat_memory_store.py
- src/database/sqlite_metadata_store.py
- src/embedding/text_embedder.py
- src/embedding/image_embedder.py
- src/embedding/sparse_embedder.py
- src/retrieval/text_retriever.py
- src/retrieval/image_retriever.py
- src/retrieval/result_enricher.py
- src/service/search_service.py
- src/service/chat_service.py
- src/generation/openai_generation.py
- src/router/jev.py
- src/memory/
- src/prompts/
- src/schema/

Dataset/database:

- datasets/processed/location_mappings.json
- datasets/processed/wikivoyage/pages.jsonl
- datasets/processed/wikivoyage/geo_tags.jsonl
- datasets/processed/wikivoyage/chunks.jsonl
- datasets/processed/wikivoyage/removed_chunk_ids.json
- datasets/raw/scraped_data/places.compact.jsonl
- datasets/raw/scraped_data/photos/
- datasets/processed/scraped/image_manifest.jsonl
- databases/sqlite_db/scraped_data.sqlite3
- databases/snapshots/wikivoyage_voyage.snapshot
- databases/snapshots/scraped_images.snapshot
- .cache/ model files

Các collection Qdrant:

| Collection | Cấu hình |
|---|---|
| wikivoyage_voyage | dense 2048 + sparse bm25 |
| scraped_images | dense 768 |
| chat_memory | text 2048 |

Environment:

    OPENAI_API_KEY=<openai-key>
    JEV_API_KEY=<jev-key>
    QDRANT_URL=http://qdrant.railway.internal:6333
    AI_SERVICE_API_KEY=<internal-service-secret>

Cấu hình model:

    text_embedding_model: voyageai/voyage-4-nano
    image_embedding_model: google/siglip2-base-patch16-224
    sparse_embedding_model: Qdrant/bm25
    text_vector_size: 2048
    image_vector_size: 768
    wikivoyage_collection: wikivoyage_voyage
    scraped_images_collection: scraped_images
    chat_memory_collection: chat_memory
    embedding_device: cpu
    models_local_files_only: true

## Chức năng Python hiện có

- search_service.py: text, image-text và image-image search.
- chat_service.py: memory, retrieval, generation và lưu conversation.
- database/*qdrant*: đọc/search collection.
- chat_memory_store.py: lưu conversation và preference.
- openai_generation.py: tạo kế hoạch/câu trả lời.
- jev.py: route query bằng JEV.

Lệnh hiện có:

    python -m src.service.search_service --text "museums in Hanoi" --route text --limit 5
    python -m src.service.search_service --text "quiet beach scenery" --route image_text --limit 5
    python -m src.service.search_service --image local-test.jpg --route image_image --limit 5

## HTTP API đề xuất cho service vistra-ai

### GET /health

Response:

    {
      "status": "ok",
      "service": "vistra-ai",
      "qdrant": "ready",
      "models": {"text": "loaded", "image": "loaded", "sparse": "loaded"}
    }

### GET /ready

Response:

    {
      "ready": true,
      "qdrant": {
        "ready": true,
        "collections": ["wikivoyage_voyage", "scraped_images", "chat_memory"]
      },
      "models": {
        "text_dimension": 2048,
        "image_dimension": 768,
        "sparse": "bm25"
      }
    }

Nếu thiếu dependency:

    {
      "ready": false,
      "code": "AI_DEPENDENCY_NOT_READY",
      "missing": ["scraped_images", "text_model"]
    }

### POST /v1/search/text

Header: X-Internal-Service-Key

Request:

    {
      "query": "museums in Hanoi",
      "limit": 5,
      "location": "Hanoi",
      "route": "text"
    }

Response:

    {
      "request_id": "req-uuid",
      "route": "text",
      "items": [
        {
          "id": "chunk-or-place-id",
          "score": 0.87,
          "title": "...",
          "text": "...",
          "latitude": 21.0285,
          "longitude": 105.8542,
          "source": "wikivoyage"
        }
      ],
      "total": 1,
      "warnings": []
    }

### POST /v1/search/image-text

Header: X-Internal-Service-Key

Request:

    {
      "query": "quiet beach scenery",
      "limit": 5,
      "location": "Phu Quoc"
    }

Response:

    {
      "request_id": "req-uuid",
      "route": "image_text",
      "items": [
        {
          "image_id": "sha256-or-source-id",
          "image_url": "https://...",
          "place_id": "node/123",
          "score": 0.82,
          "title": "...",
          "latitude": 10.2,
          "longitude": 103.9,
          "license": "CC BY-SA 4.0",
          "author": "..."
        }
      ],
      "warnings": []
    }

### POST /v1/search/image-image

Header: X-Internal-Service-Key. Content-Type: multipart/form-data.

Fields:

    image: JPEG/PNG/WebP, tối đa 8 MB
    limit: 5
    location: optional

Response:

    {
      "request_id": "req-uuid",
      "route": "image_image",
      "items": [],
      "warnings": []
    }

### POST /v1/chat

Header: X-Internal-Service-Key

Request:

    {
      "conversation_id": "conversation-uuid",
      "message": "Which museums should I visit in Hanoi?",
      "image_url": null,
      "stream": false
    }

Response:

    {
      "request_id": "req-uuid",
      "conversation_id": "conversation-uuid",
      "answer": "...",
      "places": [],
      "images": [],
      "activity": null,
      "provider": "openai",
      "model": "gpt-5-nano",
      "latency_ms": 123,
      "warnings": []
    }

### Error response chung

    {
      "request_id": "req-uuid",
      "error": {
        "code": "QDRANT_UNAVAILABLE",
        "message": "AI search is temporarily unavailable"
      }
    }

Mã lỗi: INVALID_REQUEST, INVALID_INTERNAL_SERVICE_KEY, IMAGE_TOO_LARGE, INVALID_IMAGE, AI_RATE_LIMITED, PROVIDER_ERROR, AI_DEPENDENCY_NOT_READY, AI_TIMEOUT.

## Backend gọi AI service

    AI_SERVICE_URL=http://vistra-ai.railway.internal:8001
    AI_SERVICE_TIMEOUT_SECONDS=45
    AI_SERVICE_API_KEY=<internal-service-secret>

Backend cần timeout, retry tối đa một lần cho lỗi mạng, circuit breaker và truyền request_id. Frontend không gọi trực tiếp AI service và không biết provider key.

## Checklist

- Docker Desktop đang chạy.
- Qdrant /readyz trả 200.
- wikivoyage_voyage có dense 2048 và sparse bm25.
- scraped_images có dense 768.
- chat_memory được tạo khi chat đầu tiên.
- SQLite, dataset và model cache tồn tại.
- AI container có /health và /ready.
- Text, image và chat response đúng schema.
- Internal API key được kiểm tra.
- Backend chưa cần biết chi tiết model/Qdrant.

## Kết luận

AI nên là service riêng. Hiện thư mục ai chưa có HTTP entrypoint và Dockerfile nên các API HTTP ở trên là contract cần triển khai, chưa phải response runtime đã kiểm chứng.


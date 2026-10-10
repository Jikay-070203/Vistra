# VISTRA photo import

Run the first 10 photos:

```powershell
$env:API_BASE="https://vistra-backend-production.up.railway.app"
$env:ADMIN_EMAIL="admin@vistral.com"
$env:ADMIN_PASSWORD="12345678"
python .\backend\scripts\photo\import_vistra_photos.py --batch-size 10 --max-batches 1
```

The script reads Cloudinary values from the backend `.env` or environment:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

The source manifest is `D:\Sourcecode\vinai\project\data\data\VISTRA\VISTRA\datasets\processed\scraped\image_manifest.jsonl`. Local Windows paths in the manifest are resolved against the VISTRA dataset directory.

Progress is stored in `state/checkpoint.json`, completed batch responses in `state/completed_batches/`, and failures in `state/failed_batches/`. The source manifest is never modified. `source_image_id`/`sha256` and the API batch ID prevent duplicate database rows.

This first tool uploads to Cloudinary and registers metadata in PostgreSQL. Qdrant is marked `pending_embedding_worker`; it is not safe to claim a vector exists until an image embedding model/worker is configured to create a 768-dimensional point and upsert it into `scraped_images`.

## Create Qdrant vectors for the uploaded batch

Run this after the first 10-photo import succeeds:

```powershell
$env:QDRANT_URL="https://qdrant-production-dashboard.up.railway.app"
$env:QDRANT_IMAGE_COLLECTION="scraped_images"
python .\backend\scripts\photo\embed_photos_qdrant.py --max-batches 1
```

The first run downloads/caches `google/siglip-base-patch16-224` and upserts 768-dimensional normalized vectors. It stores progress in `qdrant_state/checkpoint.json`. Only after this command succeeds should you import the next photo batch.

## Run all remaining photos automatically

After the first 10 photos have been uploaded and embedded, run:

```powershell
$env:API_BASE="https://vistra-backend-production.up.railway.app"
$env:ADMIN_EMAIL="admin@vistral.com"
$env:ADMIN_PASSWORD="12345678"
$env:QDRANT_URL="https://qdrant-production-dashboard.up.railway.app"
$env:QDRANT_IMAGE_COLLECTION="scraped_images"

python .\backend\scripts\photo\run_photo_pipeline.py `
  --cycle-size 100 `
  --batch-size 50 `
  --interval-seconds 30 `
  --error-backoff-seconds 120
```

Each cycle processes 100 images as two API requests of 50 (the backend limit), imports PostgreSQL, creates 100 vectors, upserts Qdrant, and only then starts the next cycle. It uses both checkpoints and does not repeat completed work.

Pause safely:

```powershell
New-Item .\backend\scripts\photo\state\STOP -ItemType File -Force
```

The current completed cycle is preserved. Remove `STOP` and run the same command to continue. Do not delete either checkpoint directory.

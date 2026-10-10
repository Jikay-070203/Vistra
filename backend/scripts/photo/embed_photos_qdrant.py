"""Create 768-d image vectors for completed Cloudinary photo batches.

Reads completed upload/import records, downloads each Cloudinary URL, encodes
with SigLIP vision output (768 dimensions), and upserts to Qdrant. The worker
has its own checkpoint, so a failed vector batch does not affect photo import.
"""

from __future__ import annotations

import argparse
import json
import os
import time
import uuid
import urllib.request
from pathlib import Path


def qdrant_request(base: str, path: str, method: str = "GET", payload: dict | None = None) -> dict:
    body = json.dumps(payload).encode() if payload is not None else None
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if os.getenv("QDRANT_API_KEY"):
        headers["api-key"] = os.environ["QDRANT_API_KEY"]
    request = urllib.request.Request(base.rstrip("/") + path, data=body, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Embed completed VISTRA photo batches into Qdrant.")
    parser.add_argument("--batches-dir", type=Path, default=Path(__file__).with_name("state") / "completed_batches")
    parser.add_argument("--state-dir", type=Path, default=Path(__file__).with_name("qdrant_state"))
    parser.add_argument("--qdrant-url", default=os.getenv("QDRANT_URL", ""))
    parser.add_argument("--collection", default=os.getenv("QDRANT_IMAGE_COLLECTION", "scraped_images"))
    parser.add_argument("--model", default=os.getenv("IMAGE_EMBEDDING_MODEL", "google/siglip-base-patch16-224"))
    parser.add_argument("--max-batches", type=int, default=1)
    args = parser.parse_args()
    if not args.qdrant_url:
        raise SystemExit("Set QDRANT_URL, for example https://qdrant-production-dashboard.up.railway.app")
    args.state_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_file = args.state_dir / "checkpoint.json"
    checkpoint = json.loads(checkpoint_file.read_text(encoding="utf-8")) if checkpoint_file.exists() else {"completed": []}
    completed = set(checkpoint.get("completed", []))

    # Lazy imports keep photo upload usable without loading ML dependencies.
    try:
        import torch
        from PIL import Image
        from transformers import AutoProcessor, SiglipVisionModel
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Photo embedding dependencies are missing. Install them with: "
            "python -m pip install -r backend/scripts/photo/requirements.txt"
        ) from exc

    # Keep the compatible processor because SiglipImageProcessorFast requires
    # torchvision, which is not required by the rest of this worker.
    processor = AutoProcessor.from_pretrained(args.model, use_fast=False)
    model = SiglipVisionModel.from_pretrained(args.model)
    model.eval()
    collection = qdrant_request(args.qdrant_url, f"/collections/{args.collection}")
    size = collection["result"]["config"]["params"]["vectors"]["size"]
    if size != 768:
        raise SystemExit(f"Collection {args.collection} has vector size {size}; expected 768.")

    files = sorted(args.batches_dir.glob("*.json"))
    processed = 0
    for batch_file in files:
        if batch_file.name in completed:
            continue
        batch = json.loads(batch_file.read_text(encoding="utf-8"))
        points = []
        for upload in batch.get("uploads", []):
            cloudinary = upload.get("cloudinary") or {}
            url = cloudinary.get("secure_url")
            image_id = upload.get("image_id")
            if not url or not image_id:
                continue
            with urllib.request.urlopen(url, timeout=120) as response:
                image = Image.open(response).convert("RGB")
            inputs = processor(images=image, return_tensors="pt")
            with torch.inference_mode():
                vector = model(**inputs).pooler_output[0].float().cpu()
            norm = float(torch.linalg.vector_norm(vector))
            if norm:
                vector = vector / norm
            # Qdrant point IDs must be uint64 or UUID; the source SHA-256 is
            # retained in payload and converted to a deterministic UUID.
            point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, "vistra:image:" + image_id))
            points.append({"id": point_id, "vector": vector.tolist(), "payload": {"source_image_id": image_id, "image_url": url, "batch_id": batch["batch_id"]}})
        if points:
            qdrant_request(args.qdrant_url, f"/collections/{args.collection}/points?wait=true", "PUT", {"points": points})
        else:
            # Dry-run or failed upload records may exist beside real batches.
            # Do not mark those as embedded; wait for a real Cloudinary batch.
            print(f"Skipped {batch_file.name}: no Cloudinary URLs")
            continue
        completed.add(batch_file.name)
        checkpoint_file.write_text(json.dumps({"completed": sorted(completed)}, indent=2), encoding="utf-8")
        processed += 1
        print(f"Embedded {batch_file.name}: {len(points)} vectors upserted to {args.collection}")
        if processed >= args.max_batches:
            break
    if not processed:
        print("No unprocessed completed photo batches.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

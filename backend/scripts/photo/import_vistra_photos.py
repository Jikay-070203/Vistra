"""Upload VISTRA photos to Cloudinary and register them in PostgreSQL.

Default safety limit is 10 photos per run. Progress is stored in state/ and
the source manifest is never modified. This tool imports image metadata and
URLs; image-vector generation is recorded as pending until an embedding worker
is configured.
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(r"D:\Sourcecode\vinai\project\data\data\VISTRA\VISTRA")
MANIFEST = ROOT / "datasets" / "processed" / "scraped" / "image_manifest.jsonl"
PHOTOS = ROOT / "datasets" / "raw" / "scraped_data" / "photos"


def stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_dotenv() -> None:
    env = Path(__file__).resolve().parents[3] / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)


def request_json(url: str, method: str = "GET", payload: dict | None = None, cookie: str = "") -> tuple[int, dict]:
    body = json.dumps(payload, ensure_ascii=False).encode() if payload is not None else None
    headers = {"Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if cookie:
        headers["Cookie"] = cookie
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            raw = response.read().decode("utf-8", errors="replace")
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            return exc.code, json.loads(raw)
        except json.JSONDecodeError:
            return exc.code, {"raw": raw}


def login(base: str) -> str:
    email, password = os.getenv("ADMIN_EMAIL"), os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        raise SystemExit("Set ADMIN_EMAIL and ADMIN_PASSWORD.")
    body = json.dumps({"email": email, "password": password}).encode()
    req = urllib.request.Request(base + "/api/v1/auth/login", data=body,
                                  headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as response:
        cookies = []
        for value in response.headers.get_all("Set-Cookie") or []:
            pair = value.split(";", 1)[0].strip()
            if pair.startswith(("vistra_session=", "vistra_refresh=")):
                cookies.append(pair)
        if cookies:
            return "; ".join(cookies)
    cookie = os.getenv("ADMIN_COOKIE", "")
    if not cookie:
        raise SystemExit("No auth cookie returned. Set ADMIN_COOKIE='vistra_session=...'.")
    return cookie


def resolve_path(path_value: str) -> Path:
    path = Path(path_value)
    if path.exists():
        return path
    # Manifest paths use the original E:\VISTRA root; map only that prefix.
    normalized = path_value.replace("/", "\\")
    marker = "datasets\\raw\\scraped_data\\photos\\"
    if marker in normalized:
        return PHOTOS / normalized.split(marker, 1)[1]
    return PHOTOS / path.name


def multipart_upload(cloud: str, preset: str, file_path: Path, public_id: str) -> tuple[int, dict]:
    boundary = "----VistraPhoto" + stamp()
    content = file_path.read_bytes()
    # Unsigned presets reject unique_filename. A deterministic public_id is
    # enough for stable Cloudinary assets and retry-safe uploads.
    fields = {"upload_preset": preset, "public_id": public_id}
    chunks = []
    for key, value in fields.items():
        chunks += [f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{value}\r\n".encode()]
    chunks += [f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{file_path.name}\"\r\nContent-Type: application/octet-stream\r\n\r\n".encode(), content, b"\r\n", f"--{boundary}--\r\n".encode()]
    req = urllib.request.Request(f"https://api.cloudinary.com/v1_1/{urllib.parse.quote(cloud, safe='')}/upload",
                                 data=b"".join(chunks), headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            return exc.code, json.loads(raw)
        except json.JSONDecodeError:
            return exc.code, {"raw": raw}


def main() -> int:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Import VISTRA photos in resumable Cloudinary/API batches.")
    parser.add_argument("--manifest", type=Path, default=MANIFEST)
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument("--max-batches", type=int, default=1)
    parser.add_argument("--interval-seconds", type=float, default=30)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.batch_size <= 50:
        raise SystemExit("--batch-size must be between 1 and 50")
    if not args.manifest.exists():
        raise SystemExit(f"Manifest not found: {args.manifest}")
    base = os.getenv("API_BASE", "").rstrip("/")
    cloud, preset = os.getenv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"), os.getenv("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET")
    if not args.dry_run and (not base or not cloud or not preset):
        raise SystemExit("Set API_BASE, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.")
    state = Path(__file__).with_name("state")
    done = state / "completed_batches"
    failed = state / "failed_batches"
    done.mkdir(parents=True, exist_ok=True); failed.mkdir(parents=True, exist_ok=True)
    checkpoint_file = state / "checkpoint.json"
    checkpoint = json.loads(checkpoint_file.read_text(encoding="utf-8")) if checkpoint_file.exists() else {"next_line": 0}
    next_line = int(checkpoint.get("next_line", 0))
    cookie = "" if args.dry_run else login(base)

    for batch_number in range(args.max_batches):
        rows = []
        with args.manifest.open("r", encoding="utf-8") as handle:
            for line_no, line in enumerate(handle):
                if line_no < next_line: continue
                if len(rows) >= args.batch_size: break
                if line.strip(): rows.append((line_no, json.loads(line)))
        if not rows: print("Photo import complete."); break
        batch_id = f"vistra-photos-{stamp()}-line-{rows[0][0]}"
        items, upload_results = [], []
        for _, record in rows:
            metadata = record.get("metadata") or {}
            image_id = str(record.get("image_id") or metadata.get("sha256") or "")
            file_path = resolve_path(str(record.get("path") or ""))
            if not image_id or not file_path.exists():
                upload_results.append({"image_id": image_id, "error": "LOCAL_FILE_NOT_FOUND", "path": str(file_path)})
                continue
            if args.dry_run:
                upload_results.append({"image_id": image_id, "dry_run": True, "path": str(file_path)})
                continue
            status, result = multipart_upload(cloud, preset, file_path, f"vistra/{image_id}")
            if status not in (200, 201):
                upload_results.append({"image_id": image_id, "http_status": status, "response": result})
                continue
            upload_results.append({"image_id": image_id, "cloudinary": result})
            place_id = (record.get("place_ids") or [None])[0]
            if place_id:
                items.append({"source_image_id": image_id, "source_place_id": place_id,
                              "image_url": result["secure_url"], "thumbnail_url": result.get("secure_url"),
                              "license": metadata.get("license"), "author": metadata.get("author"),
                              "width": record.get("width") or metadata.get("width"), "height": record.get("height") or metadata.get("height"),
                              "file_size_bytes": metadata.get("bytes"), "sha256": metadata.get("sha256") or image_id,
                              "metadata": {"source": metadata.get("source", "commons"), "attribution": metadata.get("attribution")}})
        payload = {"source": "cloudinary-vistra", "batch_id": batch_id, "items": items}
        if args.dry_run:
            status, response = 0, {"dry_run": True, "uploaded_candidates": len(rows), "api_items": len(items), "qdrant": "pending"}
        elif not items:
            status, response = 422, {"code": "NO_VALID_PHOTO_ITEMS", "uploads": upload_results}
        else:
            status, response = request_json(base + "/api/v1/admin/import/place-images", "POST", payload, cookie)
        record = {"batch_id": batch_id, "source_lines": [rows[0][0], rows[-1][0]], "http_status": status, "response": response, "uploads": upload_results, "qdrant_status": "pending_embedding_worker"}
        ok = args.dry_run or (status in (200, 201) and response.get("failed", 0) == 0)
        target = done if ok else failed
        (target / f"{batch_id}.json").write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
        if not ok:
            print(json.dumps(record, ensure_ascii=False, indent=2)); return 1
        if args.dry_run: print("Dry run only; photo checkpoint was not advanced."); continue
        next_line = rows[-1][0] + 1
        checkpoint_file.write_text(json.dumps({"source": str(args.manifest), "next_line": next_line, "updated_at": stamp()}, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Completed {batch_id}: {response.get('inserted', 0)} imported, {response.get('skipped', 0)} skipped, {response.get('failed', 0)} failed; Qdrant=pending")
        if batch_number + 1 < args.max_batches: time.sleep(args.interval_seconds)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

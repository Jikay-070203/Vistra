"""Run photo upload -> PostgreSQL -> Qdrant sequentially until exhausted."""
from __future__ import annotations
import argparse, json, os, subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
UPLOAD = HERE / "import_vistra_photos.py"
EMBED = HERE / "embed_photos_qdrant.py"


def load_dotenv() -> None:
    """Load local project env files before spawning upload/embed workers."""
    root = HERE.parents[3]
    for env_file in (root / ".env", root / "backend" / ".env",
                     root / "frontend" / ".env", root / "frontend" / ".env.local"):
        if not env_file.exists():
            continue
        for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

def checkpoint(path: Path) -> int:
    if not path.exists(): return 0
    return int(json.loads(path.read_text(encoding="utf-8")).get("next_line", 0))

def pending_qdrant_batches() -> int:
    """Count uploaded batches containing Cloudinary URLs but not embedded yet."""
    completed_dir = HERE / "state" / "completed_batches"
    state_file = HERE / "qdrant_state" / "checkpoint.json"
    embedded = set()
    if state_file.exists():
        try:
            embedded = set(json.loads(state_file.read_text(encoding="utf-8")).get("completed", []))
        except (OSError, json.JSONDecodeError):
            embedded = set()
    pending = 0
    for path in completed_dir.glob("*.json"):
        if path.name in embedded:
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        uploads = payload.get("uploads", [])
        if any((item.get("cloudinary") or {}).get("secure_url") for item in uploads):
            pending += 1
    return pending

def main() -> int:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Sequential photo upload and Qdrant pipeline.")
    parser.add_argument("--batch-size", type=int, default=50, help="API request size; maximum 50.")
    parser.add_argument("--cycle-size", type=int, default=100, help="Images per cycle; implemented as multiple API batches.")
    parser.add_argument("--interval-seconds", type=float, default=30)
    parser.add_argument("--error-backoff-seconds", type=float, default=120)
    parser.add_argument("--stop-file", type=Path, default=HERE / "state" / "STOP")
    args = parser.parse_args()
    photo_checkpoint = HERE / "state" / "checkpoint.json"
    while True:
        if args.stop_file.exists():
            print(f"Paused by {args.stop_file}. Remove it and run again to continue.")
            return 0
        before = checkpoint(photo_checkpoint)
        request_count = max(1, (args.cycle_size + args.batch_size - 1) // args.batch_size)
        pending = pending_qdrant_batches()
        if pending:
            recovery = subprocess.run(
                [sys.executable, str(EMBED), "--max-batches", str(min(request_count, pending))],
                env=os.environ.copy(),
            )
            if recovery.returncode != 0:
                print(f"Qdrant recovery failed; no new upload started. Retry after {args.error_backoff_seconds:g}s.")
                time.sleep(args.error_backoff_seconds)
                continue
        for _ in range(request_count):
            upload = subprocess.run([sys.executable, str(UPLOAD), "--batch-size", str(args.batch_size), "--max-batches", "1"], env=os.environ.copy())
            if upload.returncode != 0:
                print(f"Photo upload failed; retrying after {args.error_backoff_seconds:g}s.")
                time.sleep(args.error_backoff_seconds)
                break
        else:
            upload = None
        if upload is not None and upload.returncode != 0:
            continue
        after = checkpoint(photo_checkpoint)
        if after <= before:
            print("Photo source exhausted; pipeline complete.")
            return 0
        if args.stop_file.exists():
            print("Upload completed; STOP detected before Qdrant step. Resume to embed this batch.")
            return 0
        while True:
            embed = subprocess.run([sys.executable, str(EMBED), "--max-batches", str(request_count)], env=os.environ.copy())
            if embed.returncode == 0: break
            print(f"Qdrant embedding failed; photo checkpoint remains at line {after}. Retry after {args.error_backoff_seconds:g}s.")
            time.sleep(args.error_backoff_seconds)
        if args.interval_seconds: time.sleep(args.interval_seconds)

if __name__ == "__main__": raise SystemExit(main())

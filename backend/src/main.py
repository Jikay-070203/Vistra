import json
import asyncio
import hashlib
import logging
import hmac
import secrets
import sqlite3
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Literal
from uuid import uuid4
from urllib.parse import urlparse

import httpx
from cryptography.fernet import Fernet, InvalidToken

from fastapi import Cookie, Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import Settings
from backend.agents.orchestrator import ChatRequest, chat
from backend.agents.agent import IntentRequest
from backend.agents.gemini import create_client
from backend.db import connect, ensure_ai_provider_table, initialize, now, row, rows
from backend.models import (CommitRequest, ExpenseCreate, GenerateSelection, Kind, LikeRequest, LoginRequest,
                            AdminFeedbackPatch, DatasetCreate, FeedbackCreate, FeedbackRating, FeedbackReply,
                            PlaceReview, PreviewRequest, ProfilePatch, PublicationRequest, RegisterRequest,
                            TravelDnaPatch, TripCreate, VersionRequest, PlacesImportRequest,
                            PlaceImagesImportRequest)
from backend.places import detail, resolve_duplicate, review
from backend.planner import build
from backend.recommendations import recommendations, candidates as place_candidates
from backend.services import ExternalServices
from backend.catalog import ATTRIBUTION, DESTINATIONS, normalized

logger = logging.getLogger(__name__)


def _parse_json_object(text: str) -> dict:
    value = text.strip()
    if value.startswith("```"):
        value = value.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    parsed = json.loads(value)
    if not isinstance(parsed, dict):
        raise ValueError("Vision response must be a JSON object")
    return parsed


async def _analyze_images_with_vision(settings, client, images: list[tuple[bytes, str]], description: str) -> dict:
    """Run the configured multimodal provider and return normalized Travel DNA JSON."""
    instruction = (
        "Phân tích các ảnh cảm hứng du lịch cho ứng dụng lập chuyến đi tại Việt Nam. "
        "Chỉ trả về JSON với các khóa metrics, pace, scenery_focus, cuisine_priority, "
        "suggested_interests, confidence. metrics must be an array of objects with "
        "key (string), score (integer 0-100), and optional reason. Use visual evidence "
        "only; do not identify people or infer sensitive traits. Use null when uncertain. "
        "pace có một trong các giá trị relaxed, normal, busy. suggested_interests là mảng "
        "chuỗi ngắn. Các giá trị label, reason, scenery_focus, cuisine_priority và "
        "suggested_interests phải viết bằng tiếng Việt."
    )
    if description.strip():
        instruction += " Traveler note: " + description[:2000]

    try:
        if settings.ai_provider == "openai":
            if not settings.openai_api_key or not settings.openai_model:
                raise HTTPException(503, "OpenAI Vision chưa được cấu hình.")
            content = [{"type": "text", "text": instruction}]
            for data, mime in images:
                import base64
                encoded = base64.b64encode(data).decode("ascii")
                content.append({"type": "image_url", "image_url": {
                    "url": f"data:{mime};base64,{encoded}", "detail": "low"
                }})
            async with httpx.AsyncClient(timeout=60) as http:
                response = await http.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                    json={"model": settings.openai_model,
                          "messages": [{"role": "user", "content": content}],
                          "temperature": 0.1, "max_tokens": 1200,
                          "response_format": {"type": "json_object"}},
                )
            if response.status_code in (401, 403):
                raise HTTPException(503, "OpenAI từ chối API key hoặc quyền Vision.")
            if response.status_code == 429:
                raise HTTPException(429, "OpenAI đã chạm giới hạn quota.")
            response.raise_for_status()
            return _parse_json_object(response.json()["choices"][0]["message"]["content"])

        if not settings.gemini_api_key or not settings.gemini_model:
            raise HTTPException(503, "Gemini Vision chưa được cấu hình.")
        from google.genai import types
        owned_client = client is None
        client = client or create_client(settings)
        parts = [types.Part.from_text(text=instruction)]
        for data, mime in images:
            parts.append(types.Part.from_bytes(data=data, mime_type=mime))

        def call_gemini():
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=[types.Content(role="user", parts=parts)],
                config=types.GenerateContentConfig(
                    temperature=0.1, max_output_tokens=1200,
                    response_mime_type="application/json"),
            )
            return _parse_json_object(response.text or "")

        try:
            return await asyncio.to_thread(call_gemini)
        finally:
            if owned_client:
                client.close()
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Vision analysis failed: %s", exc)
        raise HTTPException(502, "AI Vision chưa trả về kết quả hợp lệ. Vui lòng thử lại.") from None


def _ai_fernet(settings: Settings) -> Fernet:
    if not settings.ai_config_encryption_key:
        raise HTTPException(503, "AI_CONFIG_ENCRYPTION_KEY is not configured")
    try:
        return Fernet(settings.ai_config_encryption_key.encode())
    except (ValueError, TypeError):
        raise HTTPException(503, "AI_CONFIG_ENCRYPTION_KEY must be a valid Fernet key") from None


def _load_ai_provider(settings: Settings, db) -> None:
    config = row(db, "SELECT provider,model,encrypted_api_key FROM ai_provider_settings WHERE id=1")
    if not config or not settings.ai_config_encryption_key:
        return
    try:
        key = _ai_fernet(settings).decrypt(config["encrypted_api_key"].encode()).decode()
    except (InvalidToken, UnicodeDecodeError, HTTPException):
        logger.warning("Stored AI provider key could not be decrypted")
        return
    settings.ai_provider = config["provider"]
    if config["provider"] == "gemini":
        settings.gemini_api_key, settings.gemini_model = key, config["model"]
    else:
        settings.openai_api_key, settings.openai_model = key, config["model"]


async def ensure_qdrant_collections(settings: Settings) -> None:
    """Create the configured Qdrant collections once, without failing the API startup.

    Collection creation is idempotent: existing collections are left untouched. Vector
    dimensions are explicit because Qdrant cannot change a collection's dimension later.
    """
    if not settings.qdrant_url.strip() or not settings.qdrant_auto_create:
        logger.info("Qdrant collection bootstrap disabled")
        return

    base_url = settings.qdrant_url.rstrip("/")
    headers = {"api-key": settings.qdrant_api_key} if settings.qdrant_api_key.strip() else {}
    definitions = {
        settings.qdrant_text_collection: settings.qdrant_text_vector_size,
        settings.qdrant_image_collection: settings.qdrant_image_vector_size,
        settings.qdrant_chat_memory_collection: settings.qdrant_chat_memory_vector_size,
    }
    timeout = httpx.Timeout(settings.qdrant_startup_timeout_seconds)

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
                ready = await client.get(f"{base_url}/readyz")
                ready.raise_for_status()
                response = await client.get(f"{base_url}/collections")
                response.raise_for_status()
                existing = {
                    item.get("name")
                    for item in response.json().get("result", {}).get("collections", [])
                }
                for name, size in definitions.items():
                    if name in existing:
                        logger.info("Qdrant collection already exists: %s", name)
                        continue
                    created = await client.put(
                        f"{base_url}/collections/{name}",
                        json={"vectors": {"size": size, "distance": settings.qdrant_distance}},
                    )
                    if created.status_code not in (200, 201, 202, 409):
                        created.raise_for_status()
                    logger.info(
                        "Qdrant collection %s: %s",
                        name,
                        "created" if created.status_code != 409 else "already exists",
                    )
            return
        except Exception as exc:
            if attempt == 2:
                logger.warning("Qdrant collection bootstrap skipped: %s", exc)
            else:
                await asyncio.sleep(2 * (attempt + 1))


def _password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return f"pbkdf2_sha256$210000${salt.hex()}${digest.hex()}"


def _password_matches(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds, salt_hex, digest_hex = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds))
        return hmac.compare_digest(candidate.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _public_user(user: dict) -> dict:
    return {"id": user["id"], "fullName": user["full_name"], "email": user["email"],
            "role": user["role"], "avatarUrl": user.get("avatar_url")}


def create_app(settings=None, services=None, gemini_client=None):
    settings = settings or Settings()
    external = services or ExternalServices(settings)

    @asynccontextmanager
    async def lifespan(app):
        logger.warning("Initializing database backend: %s", "postgresql" if settings.uses_postgres else "sqlite")
        initialize(settings.db_path)
        logger.warning("Database schema initialization completed")
        with connect(settings.db_path) as db:
            ensure_ai_provider_table(db)
            for slug, config in DESTINATIONS.items():
                db.execute("UPDATE destinations SET center_lat=?,center_lon=? WHERE slug=?", (*config["center"], slug))
            _load_ai_provider(settings, db)
        await ensure_qdrant_collections(settings)
        app.state.gemini = gemini_client
        try:
            if gemini_client is None and settings.gemini_api_key and settings.gemini_model:
                app.state.gemini = create_client(settings)
            yield
        finally:
            if gemini_client is None and app.state.gemini is not None:
                app.state.gemini.close()
            if services is None:
                external.close()

    app = FastAPI(title="YourTripYourTry API", version="0.1.0", lifespan=lifespan,
                  description="Local single-user MVP. All amounts are integer VND; times include timezone.")
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True,
                       allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
                       allow_headers=["Content-Type", "X-API-Key"])

    def authenticate(x_api_key: str | None = Header(default=None)):
        if settings.api_token and not secrets.compare_digest(x_api_key or "", settings.api_token):
            raise HTTPException(401, "Invalid API key")

    auth = [Depends(authenticate)]

    def database():
        with connect(settings.db_path) as db:
            yield db

    def destination(db, slug):
        result = row(db, "SELECT * FROM destinations WHERE slug=? AND enabled=1", (slug,))
        if not result:
            raise HTTPException(404, "Destination not found")
        return result

    def trip(db, trip_id):
        result = row(db, "SELECT * FROM trips WHERE id=? AND deleted_at IS NULL", (trip_id,))
        if not result:
            raise HTTPException(404, "Trip not found")
        result["request"] = json.loads(result.pop("request_json"))
        result['generation_error'] = json.loads(result['generation_error']) if result['generation_error'] else None
        result["travel_dna"] = json.loads(result["travel_dna_json"]) if result.get("travel_dna_json") else None
        version = row(db, "SELECT payload_json FROM itinerary_versions WHERE trip_id=? AND version=?",
                      (trip_id, result["current_version"]))
        result["itinerary"] = json.loads(version["payload_json"]) if version else None
        dest = row(db, 'SELECT * FROM destinations WHERE id=?', (result['destination_id'],))
        result['recommendations'] = recommendations(db, dest, result['itinerary'])
        return result

    def save_version(db, trip_id, base_version, payload):
        version = base_version + 1
        changed = db.execute("UPDATE trips SET current_version=? WHERE id=? AND current_version=? AND deleted_at IS NULL",
                             (version, trip_id, base_version)).rowcount
        if changed != 1:
            raise HTTPException(409, "Trip changed. Reload before applying this revision.")
        payload = {**payload, "trip_id": trip_id, "version": version}
        db.execute("INSERT INTO itinerary_versions VALUES (?,?,?,?)", (trip_id, version, json.dumps(payload, ensure_ascii=False), now()))
        return payload

    @app.exception_handler(sqlite3.OperationalError)
    async def database_error(request, error):
        if "locked" in str(error).lower():
            return JSONResponse(status_code=503, content={"detail": "Database busy; retry shortly"})
        return JSONResponse(status_code=500, content={"detail": "Database operation failed"})

    @app.get("/health")
    def health(db=Depends(database)):
        db.execute("SELECT 1")
        return {"status": "ok", "version": "0.1.0"}

    def session_user(db, session_token: str | None):
        if not session_token:
            return None
        item = row(db, """SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
            WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.status='active'""",
                   (hashlib.sha256(session_token.encode()).hexdigest(), now()))
        return item

    def require_session(vistra_session: str | None, db):
        user = session_user(db, vistra_session)
        if not user:
            raise HTTPException(401, detail={"code": "UNAUTHENTICATED", "message": "Sign in required"})
        return user

    def require_admin(vistra_session: str | None, db):
        user = require_session(vistra_session, db)
        if user["role"] not in ("staff", "admin"):
            raise HTTPException(403, detail={"code": "FORBIDDEN", "message": "Staff role required"})
        return user

    def import_mapping():
        path = Path(__file__).resolve().parent / "data" / "province_mapping.json"
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}

    def import_body_limit(request: Request, limit: int):
        length = request.headers.get("content-length")
        if length and int(length) > limit:
            raise HTTPException(413, detail={"code": "IMPORT_BODY_TOO_LARGE", "max_bytes": limit})

    def import_kind(category: str) -> str:
        category = category.lower()
        if category in {"restaurant", "food", "fast_food", "bakery"}:
            return "food"
        if category in {"cafe", "bar"}:
            return "cafe"
        if category in {"hotel", "guest_house", "hostel", "motel"}:
            return "stay"
        if category in {"activity", "sports_centre", "theme_park", "marketplace"}:
            return "activity"
        return "attraction" if category not in {"other", "yes"} else "other"

    def feedback_payload(db, ticket):
        replies = rows(db, """SELECT r.id,r.message,r.created_at,u.role AS sender_role
            FROM feedback_replies r JOIN users u ON u.id=r.sender_user_id
            WHERE r.ticket_id=? ORDER BY r.created_at""", (ticket["id"],))
        return {"id": ticket["id"], "subject": ticket["subject"], "description": ticket["description"],
                "routeOrigin": ticket["route_origin"], "category": ticket["category"],
                "severity": ticket["severity"], "status": ticket["status"],
                "createdAt": ticket["created_at"], "updatedAt": ticket["updated_at"],
                "userAnswerRating": ticket["user_answer_rating"], "ratingComment": ticket["rating_comment"],
                "replies": [{"id": r["id"], "senderRole": r["sender_role"],
                             "message": r["message"], "createdAt": r["created_at"]} for r in replies]}

    def issue_session(db, user_id: str, response: Response):
        raw = secrets.token_urlsafe(48)
        created = datetime.now(UTC)
        expires = created + timedelta(minutes=settings.auth_access_minutes)
        db.execute("INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)",
                   (str(uuid4()), user_id, hashlib.sha256(raw.encode()).hexdigest(),
                    expires.isoformat(), created.isoformat()))
        response.set_cookie("vistra_session", raw, httponly=True, secure=settings.auth_cookie_secure,
                            samesite="none" if settings.auth_cookie_secure else "lax",
                            max_age=settings.auth_access_minutes * 60, path="/")
        return expires.isoformat()

    def issue_refresh_token(db, user_id: str, response: Response):
        raw = secrets.token_urlsafe(64)
        created = datetime.now(UTC)
        expires = created + timedelta(days=settings.auth_refresh_days)
        refresh_id = str(uuid4())
        db.execute("INSERT INTO refresh_tokens(id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)",
                   (refresh_id, user_id, hashlib.sha256(raw.encode()).hexdigest(),
                    expires.isoformat(), created.isoformat()))
        response.set_cookie("vistra_refresh", raw, httponly=True, secure=settings.auth_cookie_secure,
                            samesite="none" if settings.auth_cookie_secure else "lax",
                            max_age=settings.auth_refresh_days * 86400, path="/")
        return {"id": refresh_id, "expires_at": expires.isoformat()}

    def issue_auth_pair(db, user_id: str, response: Response):
        refresh = issue_refresh_token(db, user_id, response)
        return {"expires_at": issue_session(db, user_id, response),
                "refresh_id": refresh["id"], "refresh_expires_at": refresh["expires_at"]}

    @app.post("/auth/register", status_code=201)
    def register(data: RegisterRequest, response: Response, db=Depends(database)):
        email = data.email.lower()
        if row(db, "SELECT id FROM users WHERE email=?", (email,)):
            raise HTTPException(409, detail={"code": "EMAIL_IN_USE", "message": "Email is already registered"})
        user_id = str(uuid4())
        timestamp = now()
        db.execute("""INSERT INTO users(id,full_name,date_of_birth,email,password_hash,role,status,created_at,updated_at)
            VALUES (?,?,?,?,?,'traveler','active',?,?)""",
                   (user_id, data.full_name, data.date_of_birth.isoformat() if data.date_of_birth else None,
                    email, _password_hash(data.password), timestamp, timestamp))
        user = row(db, "SELECT * FROM users WHERE id=?", (user_id,))
        auth_pair = issue_auth_pair(db, user_id, response)
        return {"user": _public_user(user), "session": {"expiresAt": auth_pair["expires_at"],
                "refreshExpiresAt": auth_pair["refresh_expires_at"]}}

    @app.post("/auth/login")
    def login(data: LoginRequest, response: Response, db=Depends(database)):
        user = row(db, "SELECT * FROM users WHERE email=?", (data.email.lower(),))
        if not user or not _password_matches(data.password, user["password_hash"]):
            raise HTTPException(401, detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"})
        if user["status"] != "active":
            raise HTTPException(403, detail={"code": "ACCOUNT_SUSPENDED", "message": "Account is suspended"})
        auth_pair = issue_auth_pair(db, user["id"], response)
        return {"user": _public_user(user), "session": {"expiresAt": auth_pair["expires_at"],
                "refreshExpiresAt": auth_pair["refresh_expires_at"]}}

    @app.get("/auth/me")
    def auth_me(response: Response, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = session_user(db, vistra_session)
        if not user:
            raise HTTPException(401, detail={"code": "UNAUTHENTICATED", "message": "Sign in required"})
        session = row(db, "SELECT expires_at FROM sessions WHERE token_hash=? AND revoked_at IS NULL",
                      (hashlib.sha256(vistra_session.encode()).hexdigest(),))
        return {"user": _public_user(user), "session": {"expiresAt": session["expires_at"]}}

    @app.post("/auth/logout")
    def logout(response: Response, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        if vistra_session:
            db.execute("UPDATE sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL",
                       (now(), hashlib.sha256(vistra_session.encode()).hexdigest()))
        response.delete_cookie("vistra_refresh", path="/")
        response.delete_cookie("vistra_session", path="/")
        return {"success": True}

    @app.post("/auth/refresh")
    def refresh_auth(response: Response, vistra_refresh: str | None = Cookie(default=None), db=Depends(database)):
        if not vistra_refresh:
            raise HTTPException(401, detail={"code": "REFRESH_REQUIRED", "message": "Refresh token required"})
        token_hash = hashlib.sha256(vistra_refresh.encode()).hexdigest()
        token = row(db, "SELECT * FROM refresh_tokens WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?",
                    (token_hash, now()))
        if not token:
            raise HTTPException(401, detail={"code": "INVALID_REFRESH_TOKEN", "message": "Refresh token is invalid or expired"})
        user = row(db, "SELECT * FROM users WHERE id=? AND status='active'", (token["user_id"],))
        if not user:
            raise HTTPException(401, detail={"code": "ACCOUNT_INACTIVE", "message": "Account is inactive"})
        pair = issue_auth_pair(db, user["id"], response)
        db.execute("UPDATE refresh_tokens SET revoked_at=?,replaced_by=? WHERE id=? AND revoked_at IS NULL",
                   (now(), pair["refresh_id"], token["id"]))
        return {"user": _public_user(user), "session": {"expiresAt": pair["expires_at"],
                "refreshExpiresAt": pair["refresh_expires_at"]}}

    @app.post("/api/v1/auth/refresh")
    def v1_refresh(response: Response, vistra_refresh: str | None = Cookie(default=None), db=Depends(database)):
        result = refresh_auth(response, vistra_refresh, db)
        result["user"] = {"id": result["user"]["id"], "full_name": result["user"]["fullName"],
                           "email": result["user"]["email"], "role": result["user"]["role"],
                           "avatar_url": result["user"].get("avatarUrl")}
        result["session"]["expires_at"] = result["session"].pop("expiresAt")
        result["session"]["refresh_expires_at"] = result["session"].pop("refreshExpiresAt")
        return result

    @app.get("/me/profile")
    def get_profile(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        return {"id": user["id"], "fullName": user["full_name"], "email": user["email"],
                "phone": user.get("phone"), "defaultOrigin": user.get("default_origin"),
                "bio": user.get("bio"), "preferredPace": user.get("preferred_pace"),
                "preferredStay": user.get("preferred_stay"),
                "dietaryPreference": user.get("dietary_preference"),
                "avatarUrl": user.get("avatar_url"),
                "joinedAt": user.get("joined_at") or user.get("created_at")}

    @app.patch("/me/profile")
    def update_profile(data: ProfilePatch, response: Response,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        values = data.model_dump(exclude_unset=True)
        if "email" in values:
            values["email"] = values["email"].lower() if values["email"] else values["email"]
            duplicate = row(db, "SELECT id FROM users WHERE email=? AND id<>?", (values["email"], user["id"]))
            if duplicate:
                raise HTTPException(409, detail={"code": "EMAIL_IN_USE", "message": "Email is already registered"})
        columns = {"full_name", "email", "phone", "default_origin", "bio", "preferred_pace",
                   "preferred_stay", "dietary_preference"}
        updates = [(key, value) for key, value in values.items() if key in columns]
        if updates:
            assignments = ",".join(f"{key}=?" for key, _ in updates)
            db.execute(f"UPDATE users SET {assignments},updated_at=? WHERE id=?",
                       (*[value for _, value in updates], now(), user["id"]))
        updated = row(db, "SELECT * FROM users WHERE id=?", (user["id"],))
        return {"profile": {"id": updated["id"], "fullName": updated["full_name"],
                             "email": updated["email"], "phone": updated.get("phone"),
                             "defaultOrigin": updated.get("default_origin"), "bio": updated.get("bio"),
                             "preferredPace": updated.get("preferred_pace"),
                             "preferredStay": updated.get("preferred_stay"),
                             "dietaryPreference": updated.get("dietary_preference"),
                             "avatarUrl": updated.get("avatar_url"),
                             "joinedAt": updated.get("joined_at") or updated.get("created_at")},
                "emailChangePending": False}

    @app.get("/me/travel-dna")
    def get_travel_dna(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        dna = row(db, "SELECT * FROM travel_dna_preferences WHERE user_id=?", (user["id"],))
        metrics = json.loads(dna["metrics_json"]) if dna else []
        return {"metrics": metrics, "signalSources": [],
                "preferences": {"pace": dna.get("pace") if dna else None,
                                "sceneryFocus": dna.get("scenery_focus") if dna else None,
                                "cuisinePriority": dna.get("cuisine_priority") if dna else None},
                "summary": None, "updatedAt": dna.get("updated_at") if dna else None}

    @app.patch("/me/travel-dna/preferences")
    def update_travel_dna(data: TravelDnaPatch,
                          vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        current = row(db, "SELECT * FROM travel_dna_preferences WHERE user_id=?", (user["id"],))
        supplied = data.model_dump(exclude_unset=True)
        metrics = supplied.get("metrics")
        if metrics is None:
            metrics = json.loads(current["metrics_json"]) if current else []
        payload = (json.dumps([item for item in metrics], ensure_ascii=False))
        pace = supplied.get("pace", current["pace"] if current else None)
        scenery = supplied.get("scenery_focus", current["scenery_focus"] if current else None)
        cuisine = supplied.get("cuisine_priority", current["cuisine_priority"] if current else None)
        timestamp = now()
        db.execute("""INSERT INTO travel_dna_preferences(user_id,metrics_json,pace,scenery_focus,cuisine_priority,updated_at)
            VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET metrics_json=excluded.metrics_json,
            pace=excluded.pace,scenery_focus=excluded.scenery_focus,cuisine_priority=excluded.cuisine_priority,
            updated_at=excluded.updated_at""", (user["id"], payload, pace, scenery, cuisine, timestamp))
        return {"metrics": json.loads(payload), "preferences": {"pace": pace, "sceneryFocus": scenery,
                "cuisinePriority": cuisine}, "updatedAt": timestamp}

    @app.post("/api/v1/dna/analyze", status_code=201)
    async def analyze_dna(request: Request,
                          vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        """Create a short-lived, user-owned DNA analysis reference.

        The MVP validates and records the image batch without pretending that a
        vision model produced a result. A model can consume the stored source
        metadata later without changing the ownership/expiry contract.
        """
        user = require_session(vistra_session, db)
        content_type = request.headers.get("content-type", "")
        if content_type.startswith("application/json"):
            payload = await request.json()
            urls = payload.get("image_urls", []) if isinstance(payload, dict) else []
            description = payload.get("description", "") if isinstance(payload, dict) else ""
            if not isinstance(urls, list) or not 1 <= len(urls) <= 3:
                raise HTTPException(422, detail={"code": "IMAGE_COUNT_INVALID", "message": "Attach between 1 and 3 images"})
            files = []
            for value in urls:
                if not isinstance(value, str) or not value.startswith(("https://", "http://")):
                    raise HTTPException(422, detail={"code": "IMAGE_URL_INVALID", "message": "image_urls must contain HTTP(S) URLs"})
                host = (urlparse(value).hostname or "").lower()
                if host != "res.cloudinary.com" and not host.endswith(".cloudinary.com"):
                    raise HTTPException(422, detail={"code": "IMAGE_HOST_INVALID", "message": "Images must be hosted on Cloudinary"})
                files.append({"url": value})
        else:
            form = await request.form()
            description = str(form.get("description", ""))
            files = [value for value in form.getlist("files") if hasattr(value, "read")]
            if not 1 <= len(files) <= 3:
                raise HTTPException(422, detail={"code": "IMAGE_COUNT_INVALID", "message": "Attach between 1 and 3 images"})
        sources, accepted = [], []
        allowed = {"image/jpeg", "image/png", "image/webp"}
        for upload in files:
            if "url" in upload:
                import httpx
                url = upload["url"]
                item = {"id": str(uuid4()), "url": url, "filename": url.rsplit("/", 1)[-1][:120], "status": "processed"}
                async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                    response = await client.get(url)
                if response.status_code >= 400:
                    item["status"] = "rejected"
                    item["error"] = "IMAGE_UNAVAILABLE"
                    sources.append(item)
                    continue
                content = response.content
                mime = response.headers.get("content-type", "").split(";", 1)[0].lower()
            else:
                content = await upload.read()
                item = {"id": str(uuid4()), "filename": upload.filename or "image", "status": "processed"}
                mime = (upload.content_type or "").lower()
            error = None
            if len(content) > 5 * 1024 * 1024:
                error = "IMAGE_TOO_LARGE"
            elif mime not in allowed:
                error = "UNSUPPORTED_IMAGE_TYPE"
            if error:
                item["status"] = "rejected"
                item["error"] = error
            else:
                accepted.append((item, mime, len(content), hashlib.sha256(content).hexdigest(), content))
            sources.append(item)
        if not accepted:
            code = "IMAGE_TOO_LARGE" if all(item.get("error") == "IMAGE_TOO_LARGE" for item in sources) else "NO_VALID_IMAGES"
            raise HTTPException(422, detail={"code": code, "message": "Each image must be <= 5 MB and JPEG, PNG, or WebP", "sources": sources})
        analysis_id = str(uuid4())
        created = now()
        expires = (datetime.now(UTC) + timedelta(hours=24)).isoformat(timespec="microseconds")
        vision = await _analyze_images_with_vision(
            settings, app.state.gemini,
            [(content, mime) for _, mime, _, _, content in accepted], description,
        )
        metric_labels = {
            "cultural_significance": "Giá trị văn hóa",
            "natural_beauty": "Vẻ đẹp thiên nhiên",
            "architectural_diversity": "Đa dạng kiến trúc",
            "historical_value": "Giá trị lịch sử",
            "food_culture": "Văn hóa ẩm thực",
            "adventure": "Mức độ khám phá",
            "relaxation": "Mức độ thư giãn",
            "urban_energy": "Năng lượng đô thị",
        }
        metrics = vision.get("metrics", [])
        if not isinstance(metrics, list):
            raise HTTPException(502, "AI Vision trả về metrics không hợp lệ.")
        normalized_metrics = []
        for metric in metrics[:30]:
            if not isinstance(metric, dict) or not isinstance(metric.get("key"), str):
                continue
            item = dict(metric)
            item["label"] = metric_labels.get(item["key"], item["key"].replace("_", " ").capitalize())
            if isinstance(item.get("reason"), str):
                item["reason"] = item["reason"]
            normalized_metrics.append(item)
        derived = {
            "metrics": normalized_metrics,
            "pace": vision.get("pace"),
            "scenery_focus": vision.get("scenery_focus"),
            "cuisine_priority": vision.get("cuisine_priority"),
            "suggested_interests": vision.get("suggested_interests", []),
        }
        confidence = vision.get("confidence")
        if confidence is not None:
            try:
                confidence = max(0.0, min(1.0, float(confidence)))
            except (TypeError, ValueError):
                confidence = None
        db.execute("""INSERT INTO dna_analyses(id,user_id,description,derived_dna_json,confidence,sources_json,status,created_at,expires_at)
            VALUES (?,?,?,?,?,?,?,?,?)""", (analysis_id, user["id"], description, json.dumps(derived), confidence,
                                                json.dumps(sources), "completed", created, expires))
        for item, content_type, size, digest, _content in accepted:
            db.execute("""INSERT INTO dna_analysis_files(id,analysis_id,filename,content_type,size_bytes,sha256,status,error)
                VALUES (?,?,?,?,?,?,?,?)""", (item["id"], analysis_id, item["filename"], content_type, size,
                                               digest, item["status"], None))
        return {"analysis_id": analysis_id, "status": "completed", "derived_dna": derived,
                "suggested_trip_dna": derived, "confidence": confidence, "expires_at": expires,
                "sources": sources,
                "notice": "Travel DNA generated by the configured vision model."}

    @app.get("/auth/oauth/{provider}/start")
    def oauth_start(provider: Literal["google", "facebook"], return_to: str = "/"):
        raise HTTPException(501, detail={"code": "OAUTH_NOT_CONFIGURED",
                                         "message": f"{provider} OAuth is not configured"})

    @app.api_route("/admin/fix-destinations", methods=["GET", "POST"])
    def fix_destinations(db=Depends(database)):
        # Temporary: repair corrupted display names. Unicode escapes keep the values encoding-safe.
        fixes = {"ha-noi": "H\u00e0 N\u1ed9i", "tp-ho-chi-minh": "TP. H\u1ed3 Ch\u00ed Minh"}
        query = "SELECT slug,display_name FROM destinations WHERE slug IN (?,?) ORDER BY slug"
        before = rows(db, query, tuple(fixes))
        for slug, display_name in fixes.items():
            db.execute("UPDATE destinations SET display_name=? WHERE slug=?", (display_name, slug))
        after = rows(db, query, tuple(fixes))
        return JSONResponse({"before": before, "after": after}, media_type="application/json; charset=utf-8")

    @app.get("/destinations", dependencies=auth)
    def destinations(db=Depends(database)):
        return {"items": rows(db, """SELECT d.*,COUNT(p.id) AS places,
            SUM(CASE WHEN p.quality_status IN ('schedulable','verified') THEN 1 ELSE 0 END) AS schedulable
            FROM destinations d LEFT JOIN places p ON p.destination_id=d.id
            WHERE d.enabled=1 GROUP BY d.id ORDER BY d.id"""), "attribution": ATTRIBUTION}

    @app.get('/destinations/{slug}/planning-places', dependencies=auth)
    def planning_places(slug: str, allow_unverified: bool = False, db=Depends(database)):
        dest = destination(db, slug)
        return {'items': [p for p in place_candidates(db, dest['id'], allow_unverified)
                          if p['kind'] != 'stay'], 'attribution': ATTRIBUTION}

    @app.get("/places", dependencies=auth)
    def places(destination: str | None = None, q: str = Query(default="", max_length=100), kind: Kind | None = None,
               quality: Literal["discovered", "schedulable", "verified", "archived"] | None = None,
               limit: int = Query(default=30, ge=1, le=100), offset: int = Query(default=0, ge=0), db=Depends(database)):
        conditions, params = [], []
        if destination:
            conditions.append("d.slug=?")
            params.append(destination)
        if q:
            conditions.append("p.normalized_name LIKE ? ESCAPE '\\'")
            params.append("%" + normalized(q).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%")
        for field, value in (("kind", kind), ("quality_status", quality)):
            if value:
                conditions.append(f"p.{field}=?")
                params.append(value)
        if quality is None:
            conditions.append("p.quality_status<>'archived'")
        where = " AND ".join(conditions) or "1=1"
        join = " FROM places p JOIN destinations d ON d.id=p.destination_id WHERE " + where
        count = db.execute("SELECT COUNT(*)" + join, params).fetchone()[0]
        items = rows(db, "SELECT p.*,d.slug AS destination" + join + " ORDER BY p.id LIMIT ? OFFSET ?", (*params, limit, offset))
        return dict(items=items, total=count, limit=limit, offset=offset, attribution=ATTRIBUTION)

    @app.get("/places/{place_id}", dependencies=auth)
    def place(place_id: int, db=Depends(database)):
        return {**detail(db, place_id), "attribution": ATTRIBUTION}

    @app.put("/admin/places/{place_id}/review", dependencies=auth)
    def review_place(place_id: int, data: PlaceReview, db=Depends(database)):
        return review(db, place_id, data)

    @app.get("/admin/duplicates", dependencies=auth)
    def duplicates(limit: int = Query(default=100, ge=1, le=500), db=Depends(database)):
        return {"items": rows(db, "SELECT * FROM dedupe_candidates WHERE decision='pending' LIMIT ?", (limit,))}

    @app.post("/admin/duplicates/{left_id}/{right_id}", dependencies=auth)
    def decide_duplicate(left_id: int, right_id: int, decision: Literal["same", "different"], db=Depends(database)):
        return resolve_duplicate(db, left_id, right_id, decision)

    @app.get("/admin/crawl-runs", dependencies=auth)
    def crawl_runs(limit: int = Query(default=20, ge=1, le=100), db=Depends(database)):
        return {"items": rows(db, "SELECT * FROM crawl_runs ORDER BY id DESC LIMIT ?", (limit,))}

    @app.post("/trips", status_code=201, dependencies=auth)
    def create_trip(data: TripCreate, generate_itinerary: bool = False,
                    vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        dest = destination(db, data.destination)
        trip_id = str(uuid4())
        owner = require_session(vistra_session, db)
        for place_id in data.must_visit:
            p = detail(db, place_id)
            if p["destination_id"] != dest["id"]:
                raise HTTPException(422, "Must-visit place belongs to another destination")
        if data.dna_analysis_id:
            if not owner:
                raise HTTPException(401, "A signed-in user is required for DNA analysis")
            analysis = row(db, "SELECT id FROM dna_analyses WHERE id=? AND user_id=? AND status='completed' AND expires_at>?",
                           (data.dna_analysis_id, owner["id"], now()))
            if not analysis:
                raise HTTPException(422, "DNA analysis is missing, expired, or belongs to another user")
        dna_json = data.travel_dna_override.model_dump_json() if data.travel_dna_override else None
        db.execute("""INSERT INTO trips(id,destination_id,request_json,current_version,created_at,owner_user_id,dna_analysis_id,travel_dna_json,notes)
            VALUES (?,?,?,?,?,?,?,?,?)""",
                   (trip_id, dest["id"], data.model_dump_json(), 0, now(), owner["id"] if owner else None,
                    data.dna_analysis_id, dna_json, data.notes))
        generation_error = None
        if generate_itinerary:
            try:
                payload = build(db, data, dest, external)
                save_version(db, trip_id, 0, payload)
            except HTTPException as error:
                # Preserve the saved trip and show candidates when providers or coverage fail.
                generation_error = error.detail
                db.execute('UPDATE trips SET generation_error=? WHERE id=?', (json.dumps(generation_error), trip_id))
        return {**trip(db, trip_id), 'generation_error': generation_error}

    @app.post("/trips/{trip_id}/confirm")
    def confirm_trip(trip_id: str, data: VersionRequest,
                     vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        current = trip(db, trip_id)
        owner = row(db, "SELECT owner_user_id FROM trips WHERE id=?", (trip_id,))
        if owner["owner_user_id"] and owner["owner_user_id"] != user["id"]:
            raise HTTPException(403, "Only the owner can confirm this plan")
        if current["current_version"] < 1:
            raise HTTPException(422, "Generate an itinerary before confirming the plan")
        timestamp = now()
        changed = db.execute("""UPDATE trips SET status='confirmed',confirmed_at=?,owner_user_id=?,updated_at=?
            WHERE id=? AND owner_user_id=? AND current_version=? AND deleted_at IS NULL""",
            (timestamp, user["id"], timestamp, trip_id, user["id"], data.base_version)).rowcount
        if changed != 1:
            raise HTTPException(409, "Trip changed. Reload before confirming the plan")
        return {"plan": trip(db, trip_id), "confirmedAt": timestamp,
                "version": current["current_version"]}

    @app.patch("/trips/{trip_id}/publication")
    def update_publication(trip_id: str, data: PublicationRequest,
                           vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        owner = row(db, "SELECT owner_user_id,status,current_version FROM trips WHERE id=? AND deleted_at IS NULL", (trip_id,))
        if not owner:
            raise HTTPException(404, "Trip not found")
        if owner["owner_user_id"] != user["id"]:
            raise HTTPException(403, "Only the owner can publish this plan")
        if owner["current_version"] != data.base_version:
            raise HTTPException(409, "Stale base_version")
        if data.is_published and owner["status"] != "confirmed":
            raise HTTPException(422, "Only confirmed plans can be published")
        timestamp = now() if data.is_published else None
        changed = db.execute("""UPDATE trips SET is_published=?,published_at=?,updated_at=?
            WHERE id=? AND owner_user_id=? AND current_version=? AND deleted_at IS NULL""",
            (1 if data.is_published else 0, timestamp, now(), trip_id, user["id"], data.base_version)).rowcount
        if changed != 1:
            raise HTTPException(409, "Trip changed. Reload before updating publication")
        return {"id": trip_id, "isPublished": data.is_published, "publishedAt": timestamp,
                "version": data.base_version}

    @app.get("/trips", dependencies=auth)
    def list_trips(limit: int = Query(default=20, ge=1, le=100), offset: int = Query(default=0, ge=0), deleted: bool = False, db=Depends(database)):
        condition = 'IS NOT NULL' if deleted else 'IS NULL'
        return {"items": rows(db, f"SELECT id,destination_id,current_version,created_at,deleted_at FROM trips WHERE deleted_at {condition} ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset))}

    @app.delete('/trips/{trip_id}', dependencies=auth)
    def delete_trip(trip_id: str, db=Depends(database)):
        trip(db, trip_id)
        db.execute('UPDATE trips SET deleted_at=? WHERE id=?', (now(), trip_id))
        return {'id': trip_id, 'deleted': True}

    @app.post('/trips/{trip_id}/restore', dependencies=auth)
    def restore_trip(trip_id: str, db=Depends(database)):
        if not row(db, 'SELECT id FROM trips WHERE id=? AND deleted_at IS NOT NULL', (trip_id,)):
            raise HTTPException(404, 'Trip not found')
        db.execute('UPDATE trips SET deleted_at=NULL WHERE id=?', (trip_id,))
        return trip(db, trip_id)

    @app.get("/trips/{trip_id}", dependencies=auth)
    def get_trip(trip_id: str, db=Depends(database)):
        return trip(db, trip_id)

    @app.post("/trips/{trip_id}/generate", dependencies=auth)
    def generate(trip_id: str, allow_unverified: bool | None = None, data: GenerateSelection | None = None, db=Depends(database)):
        current = trip(db, trip_id)
        if current["current_version"]:
            raise HTTPException(409, "Itinerary already exists; use preview and commit to revise it")
        request = TripCreate.model_validate(current["request"])
        if data is not None:
            request.must_visit = data.must_visit
        if allow_unverified is not None:
            request.allow_unverified = allow_unverified
        # A freshly imported VISTRA catalog is source-backed but remains in
        # `discovered` until editorial review. Allow a provisional draft when
        # no reviewed places exist, so the user gets an itinerary with the
        # proper provisional warning instead of an opaque 422.
        if not request.allow_unverified:
            reviewed = place_candidates(db, current["destination_id"], False)
            discovered = place_candidates(db, current["destination_id"], True)
            if not reviewed and discovered:
                request.allow_unverified = True
        payload = build(db, request, destination(db, request.destination), external)
        db.execute('UPDATE trips SET request_json=?,generation_error=NULL WHERE id=?', (request.model_dump_json(), trip_id))
        return save_version(db, trip_id, 0, payload)

    @app.post("/trips/{trip_id}/revisions/preview", dependencies=auth)
    def preview(trip_id: str, data: PreviewRequest, db=Depends(database)):
        current = trip(db, trip_id)
        if current["current_version"] != data.base_version:
            raise HTTPException(409, "Stale base_version")
        request = TripCreate.model_validate(current["request"])
        # A revision is an explicit replacement chosen by the traveler. The
        # submitted stops therefore become the new required set, allowing a
        # previously selected stop to be removed from the draft.
        request.must_visit = [stop.place_id for stop in data.stops]
        payload = build(db, request, destination(db, request.destination), external, data.stops)
        preview_id = str(uuid4())
        db.execute("INSERT INTO revision_previews(id,trip_id,base_version,payload_json,created_at,expires_at) VALUES (?,?,?,?,?,?)",
                   (preview_id, trip_id, data.base_version, json.dumps(payload, ensure_ascii=False), now(),
                    (datetime.now(UTC)+timedelta(minutes=30)).isoformat()))
        return dict(preview_id=preview_id, base_version=data.base_version, itinerary=payload,
                    known_cost_delta_vnd=payload["budget"]["known_max_vnd"]-current["itinerary"]["budget"]["known_max_vnd"])

    @app.post("/trips/{trip_id}/revisions/commit", dependencies=auth)
    def commit(trip_id: str, data: CommitRequest, db=Depends(database)):
        # Start a database transaction explicitly.  `BEGIN IMMEDIATE` is a
        # SQLite-only statement and causes PostgreSQL/Railway to return 500.
        # The compare-and-set in save_version, together with the committed
        # flag update below, preserves the one-time preview semantics on both
        # database backends.
        db.execute("BEGIN")
        current = trip(db, trip_id)
        candidate = row(db, "SELECT * FROM revision_previews WHERE id=? AND trip_id=?", (data.preview_id, trip_id))
        if not candidate:
            raise HTTPException(404, "Preview not found")
        if candidate["committed"] or candidate["expires_at"] < now() or candidate["base_version"] != data.base_version:
            raise HTTPException(409, "Preview used, expired or based on another version")
        payload = json.loads(candidate["payload_json"])
        eligible = {p['id'] for p in place_candidates(db, current['destination_id'], current['request'].get('allow_unverified', False))}
        # Reject previews if source facts were curated after preview creation.
        for activity in payload["activities"]:
            p = detail(db, activity["place_id"])
            if p['id'] not in eligible or p["updated_at"] != activity["place_updated_at"]:
                raise HTTPException(409, "Place data changed; generate a new preview")
        result = save_version(db, trip_id, data.base_version, payload)
        db.execute("UPDATE revision_previews SET committed=1 WHERE id=?", (data.preview_id,))
        return result

    @app.post("/trips/{trip_id}/expenses", status_code=201, dependencies=auth)
    def add_expense(trip_id: str, data: ExpenseCreate, db=Depends(database)):
        trip(db, trip_id)
        expense_id = str(uuid4())
        db.execute("INSERT INTO expenses VALUES (?,?,?,?,?,?,?)", (expense_id, trip_id, data.category, data.amount_vnd,
                   data.occurred_at.isoformat(), data.note, now()))
        return {"id": expense_id, "trip_id": trip_id, **data.model_dump(mode="json")}

    @app.get("/trips/{trip_id}/expenses", dependencies=auth)
    def expenses(trip_id: str, db=Depends(database)):
        trip(db, trip_id)
        return {"items": rows(db, "SELECT * FROM expenses WHERE trip_id=? ORDER BY occurred_at,id", (trip_id,))}

    @app.get("/trips/{trip_id}/budget", dependencies=auth)
    def budget(trip_id: str, db=Depends(database)):
        current = trip(db, trip_id)
        planned = current["itinerary"]["budget"] if current["itinerary"] else None
        actual = {r["category"]: r["amount"] for r in rows(db, "SELECT category,SUM(amount_vnd) AS amount FROM expenses WHERE trip_id=? GROUP BY category", (trip_id,))}
        categories = {c: dict(actual_vnd=actual.get(c, 0), estimate=planned["categories"][c] if planned else None)
                      for c in ("transport", "food", "stay", "tickets", "other")}
        return dict(trip_id=trip_id, version=current["current_version"], planned=planned, categories=categories,
                    actual_total_vnd=sum(actual.values()),
                    actual_minus_known_max_vnd=sum(actual.values())-planned["known_max_vnd"] if planned else None)

    @app.get("/destinations/{slug}/seasonality", dependencies=auth)
    def seasonality(slug: str, start_year: int = 2020, end_year: int = 2025, db=Depends(database)):
        return external.seasonality(db, destination(db, slug), start_year, end_year)

    @app.post("/agent/parse", dependencies=auth)
    def parse_intent(data: IntentRequest):
        from backend.agents.agent import parse
        return parse(settings, data.model_dump(), client=app.state.gemini)

    @app.get("/agent/status", dependencies=auth)
    def agent_status():
        enabled = bool((settings.gemini_api_key and settings.gemini_model) if settings.ai_provider == "gemini"
                       else (settings.openai_api_key and settings.openai_model))
        return {"enabled": enabled,
                "model": settings.gemini_model if settings.ai_provider == "gemini" else settings.openai_model,
                "provider": "google-genai" if settings.ai_provider == "gemini" else "openai",
                "capabilities": ["trip_draft", "trip_context", "itinerary_preview"]}

    @app.get("/api/v1/status")
    def api_status():
        """Versioned health alias used by the frontend smoke checks."""
        return {"status": "ok", "version": "0.1.0"}

    @app.get("/public/content")
    def public_content(db=Depends(database)):
        """Public landing content backed by the canonical destination catalog.

        Until the admin content tables are introduced, destinations are exposed
        as stable, cache-friendly intro cards rather than returning mock data.
        """
        destinations_data = rows(db, """SELECT d.id, d.slug, d.display_name, d.admin_name,
            d.target_places,
            (SELECT COALESCE(NULLIF(pi.thumbnail_url, ''), pi.image_url)
               FROM places p
               JOIN place_images pi ON pi.place_id = p.id
              WHERE p.destination_id = d.id
                AND COALESCE(NULLIF(pi.thumbnail_url, ''), pi.image_url) IS NOT NULL
              ORDER BY pi.created_at ASC, pi.id ASC
              LIMIT 1) AS image_url
            FROM destinations d WHERE d.enabled=1 ORDER BY d.id""")
        intro = [{"id": str(item["id"]), "active": True, "order": item["id"],
                  "label": item["display_name"], "provinceCode": item["slug"],
                  "imageUrl": item["image_url"], "tagline": None} for item in destinations_data]
        allergies = [
            {"id": "seafood", "active": True, "label": "Hải sản"},
            {"id": "peanut", "active": True, "label": "Đậu phộng"},
            {"id": "dairy", "active": True, "label": "Sữa"},
            {"id": "gluten", "active": True, "label": "Gluten"},
        ]
        cms = {"heroPlans": [], "introDestinations": [], "allergyOptions": []}
        mapping = {"hero-plans": "heroPlans", "intro-destinations": "introDestinations", "allergy-options": "allergyOptions"}
        for collection, key in mapping.items():
            cms[key] = [{**json.loads(item["payload_json"]), "id": item["id"],
                         "active": bool(item["active"]), "order": item["sort_order"]}
                        for item in rows(db, "SELECT * FROM content_items WHERE collection=? AND active=1 ORDER BY sort_order,id", (collection,))]
        if cms["heroPlans"] or cms["introDestinations"] or cms["allergyOptions"]:
            if not cms["introDestinations"]:
                cms["introDestinations"] = intro
            if not cms["allergyOptions"]:
                cms["allergyOptions"] = allergies
            return cms
        return {"heroPlans": [], "introDestinations": intro, "allergyOptions": allergies}

    @app.get("/recommendations/destinations", dependencies=auth)
    def destination_recommendations(
        start_date: str | None = None,
        end_date: str | None = None,
        budget_max_vnd: int | None = Query(default=None, ge=0),
        travelers: int = Query(default=1, ge=1, le=50),
        style: str | None = None,
        dna_focus: str | None = None,
        db=Depends(database),
    ):
        """Return deterministic destination suggestions from live catalog data.

        This endpoint intentionally does not invent weather, prices, or images;
        unavailable facts are represented as null as required by the contract.
        """
        data = rows(db, """SELECT d.id, d.slug, d.display_name, d.admin_name,
            (SELECT COALESCE(NULLIF(pi.thumbnail_url, ''), pi.image_url)
               FROM places p
               JOIN place_images pi ON pi.place_id = p.id
              WHERE p.destination_id = d.id
                AND COALESCE(NULLIF(pi.thumbnail_url, ''), pi.image_url) IS NOT NULL
              ORDER BY pi.created_at ASC, pi.id ASC
              LIMIT 1) AS image_url
            FROM destinations d
            WHERE d.enabled=1 ORDER BY d.id LIMIT 5""")
        items = []
        for item in data:
            items.append({"id": item["slug"], "name": item["display_name"],
                          "region": item["admin_name"], "country": "Vietnam",
                          "imageUrl": item["image_url"], "durationDays": None,
                          "estimatedCostVnd": None, "visualMatchPct": None,
                          "budgetMatchPct": None, "seasonMatchPct": None,
                          "vibe": None, "tags": [], "goldenHour": None,
                          "transportSummary": None,
                          "rationale": "Đề xuất từ danh mục điểm đến đang hoạt động.",
                          "realityCheck": None, "bestMoments": None, "details": None})
        return {"period": {"from": start_date, "to": end_date}, "items": items,
                "generatedAt": now()}

    def plan_card(db, item, viewer_id=None):
        request = json.loads(item["request_json"])
        destination_item = row(db, "SELECT slug,display_name FROM destinations WHERE id=?",
                               (item["destination_id"],))
        likes = row(db, "SELECT COUNT(*) AS count FROM community_plan_likes WHERE trip_id=?", (item["id"],))["count"]
        liked = bool(viewer_id and row(db, "SELECT 1 FROM community_plan_likes WHERE trip_id=? AND user_id=?",
                                       (item["id"], viewer_id)))
        start = request.get("start_date")
        days = request.get("days", 1)
        end = None
        if start and days:
            try:
                end = (datetime.fromisoformat(start) + timedelta(days=int(days) - 1)).date().isoformat()
            except (TypeError, ValueError):
                end = None
        cover = row(db, """SELECT COALESCE(NULLIF(pi.thumbnail_url, ''), pi.image_url) AS image_url
                           FROM places p
                           JOIN place_images pi ON pi.place_id = p.id
                          WHERE p.destination_id = ?
                            AND COALESCE(NULLIF(pi.thumbnail_url, ''), pi.image_url) IS NOT NULL
                          ORDER BY pi.created_at ASC, pi.id ASC
                          LIMIT 1""", (item["destination_id"],))
        return {"id": item["id"], "title": request.get("title") or f"Trip to {destination_item['display_name']}",
                "origin": request.get("origin"), "destination": destination_item["display_name"],
                "coverImageUrl": cover["image_url"] if cover else None, "startDate": start,
                "endDate": end, "durationDays": days,
                "budgetMinVnd": request.get("budget_vnd"), "budgetMaxVnd": request.get("budget_vnd"),
                "estimatedCostVnd": request.get("lodging_total_vnd") + request.get("transport_total_vnd")
                    if request.get("lodging_total_vnd") is not None and request.get("transport_total_vnd") is not None else None,
                "status": item.get("status", "draft"),
                "isPublished": bool(item.get("is_published")), "updatedAt": item.get("updated_at"),
                "tags": request.get("interests", []), "likesCount": likes, "likedByMe": liked}

    @app.get("/community/plans")
    def community_plans(page: int = Query(default=1, ge=1), page_size: int = Query(default=9, ge=1, le=50),
                        q: str = "", province: str | None = None, duration: int | None = Query(default=None, ge=1),
                        tag: str | None = None, budget_min_vnd: int | None = Query(default=None, ge=0),
                        budget_max_vnd: int | None = Query(default=None, ge=0), liked_by_me: bool | None = None,
                        vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        viewer = session_user(db, vistra_session)
        conditions = ["t.is_published=1", "t.status='confirmed'", "t.deleted_at IS NULL"]
        params = []
        if q:
            conditions.append("LOWER(t.request_json) LIKE ?")
            params.append(f"%{q.lower()}%")
        if province:
            conditions.append("d.slug=?")
            params.append(province)
        where = " AND ".join(conditions)
        base = f"FROM trips t JOIN destinations d ON d.id=t.destination_id WHERE {where}"
        items = rows(db, "SELECT t.* " + base + " ORDER BY t.created_at DESC", params)
        cards = []
        for item in items:
            request = json.loads(item["request_json"])
            if duration and request.get("days") != duration:
                continue
            budget = request.get("budget_vnd")
            if budget_min_vnd is not None and (budget is None or budget < budget_min_vnd):
                continue
            if budget_max_vnd is not None and (budget is None or budget > budget_max_vnd):
                continue
            if tag and tag not in request.get("interests", []):
                continue
            cards.append(plan_card(db, item, viewer["id"] if viewer else None))
        if liked_by_me is not None:
            cards = [card for card in cards if card["likedByMe"] == liked_by_me]
        total = len(cards)
        cards = cards[(page - 1) * page_size:page * page_size]
        return {"items": cards, "page": page, "pageSize": page_size, "total": total,
                "totalPages": (total + page_size - 1) // page_size}

    @app.put("/community/plans/{trip_id}/like")
    def like_community_plan(trip_id: str, data: LikeRequest,
                            vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        if not row(db, "SELECT id FROM trips WHERE id=? AND is_published=1 AND status='confirmed' AND deleted_at IS NULL",
                   (trip_id,)):
            raise HTTPException(404, "Public plan not found")
        if data.liked:
            db.execute("INSERT INTO community_plan_likes(trip_id,user_id,created_at) VALUES (?,?,?) ON CONFLICT DO NOTHING",
                       (trip_id, user["id"], now()))
        else:
            db.execute("DELETE FROM community_plan_likes WHERE trip_id=? AND user_id=?", (trip_id, user["id"]))
        count = row(db, "SELECT COUNT(*) AS count FROM community_plan_likes WHERE trip_id=?", (trip_id,))["count"]
        return {"planId": trip_id, "likedByMe": data.liked, "likesCount": count}

    @app.post("/community/plans/{trip_id}/clone", status_code=201)
    def clone_community_plan(trip_id: str,
                             vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        source = row(db, "SELECT * FROM trips WHERE id=? AND is_published=1 AND status='confirmed' AND deleted_at IS NULL",
                     (trip_id,))
        if not source:
            raise HTTPException(404, "Public plan not found")
        clone_id = str(uuid4())
        request = json.loads(source["request_json"])
        db.execute("""INSERT INTO trips(id,destination_id,request_json,current_version,created_at,owner_user_id,status,is_published)
            VALUES (?,?,?,?,?,?,?,0)""",
                   (clone_id, source["destination_id"], json.dumps(request, ensure_ascii=False), 0, now(), user["id"], "draft"))
        return {"plan": trip(db, clone_id)}

    @app.post("/trips/{trip_id}/agent", dependencies=auth)
    def travel_agent(trip_id: str, data: ChatRequest, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        current = trip(db, trip_id)
        if current.get("owner_user_id") != user["id"]:
            raise HTTPException(404, "Trip not found")
        def make_preview(request):
            result = preview(trip_id, request, db)
            # Previews do not change the itinerary. Release the write lock before the next model call.
            db.commit()
            return result
        result = chat(settings, db, current, data, make_preview,
                      client=app.state.gemini)
        db.execute("""INSERT INTO chat_messages
            (id,trip_id,user_id,role,content,metadata_json,created_at)
            VALUES (?,?,?,?,?,?,?)""", (str(uuid4()), trip_id, user["id"], "user", data.text,
            json.dumps({"base_version": data.base_version}, ensure_ascii=False), now()))
        db.execute("""INSERT INTO chat_messages
            (id,trip_id,user_id,role,content,metadata_json,created_at)
            VALUES (?,?,?,?,?,?,?)""", (str(uuid4()), trip_id, user["id"], "assistant", result["reply"],
            json.dumps({"tools_used": result.get("tools_used", []),
                        "base_version": result.get("base_version")}, ensure_ascii=False), now()))
        return result

    @app.get("/trips/{trip_id}/chat/history", dependencies=auth)
    def chat_history(trip_id: str, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        current = trip(db, trip_id)
        if current.get("owner_user_id") != user["id"]:
            raise HTTPException(404, "Trip not found")
        items = rows(db, """SELECT id,role,content,metadata_json,created_at
            FROM chat_messages WHERE trip_id=? AND user_id=? ORDER BY created_at,id""", (trip_id, user["id"]))
        for item in items:
            item["metadata"] = json.loads(item.pop("metadata_json") or "{}")
        return {"trip_id": trip_id, "items": items}

    @app.post("/feedback/tickets", status_code=201)
    def create_feedback(data: FeedbackCreate, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        ticket_id, timestamp = str(uuid4()), now()
        db.execute("""INSERT INTO feedback_tickets(id,user_id,subject,description,route_origin,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?)""", (ticket_id, user["id"], data.subject, data.description,
                                         data.route_origin, timestamp, timestamp))
        return {"ticket": feedback_payload(db, row(db, "SELECT * FROM feedback_tickets WHERE id=?", (ticket_id,)))}

    @app.get("/me/feedback/tickets")
    def my_feedback(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=50),
                    status: str | None = None, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        conditions, params = ["user_id=?"], [user["id"]]
        if status:
            conditions.append("status=?"); params.append(status)
        where = " AND ".join(conditions)
        total = db.execute(f"SELECT COUNT(*) FROM feedback_tickets WHERE {where}", params).fetchone()[0]
        tickets = rows(db, f"SELECT * FROM feedback_tickets WHERE {where} ORDER BY updated_at DESC LIMIT ? OFFSET ?",
                       (*params, page_size, (page - 1) * page_size))
        return {"items": [feedback_payload(db, t) for t in tickets], "page": page, "pageSize": page_size,
                "total": total, "totalPages": (total + page_size - 1) // page_size}

    @app.post("/me/feedback/tickets/{ticket_id}/rating")
    def rate_feedback(ticket_id: str, data: FeedbackRating,
                      vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        timestamp = now()
        changed = db.execute("UPDATE feedback_tickets SET user_answer_rating=?,rating_comment=?,updated_at=? "
                             "WHERE id=? AND user_id=? AND EXISTS (SELECT 1 FROM feedback_replies WHERE ticket_id=?)",
                             (data.rating, data.comment, timestamp, ticket_id, user["id"], ticket_id)).rowcount
        if changed != 1:
            raise HTTPException(404, "Ticket not found or has no staff reply")
        return {"ticketId": ticket_id, "userAnswerRating": data.rating,
                "ratingComment": data.comment, "updatedAt": timestamp}

    @app.get("/admin/feedback/tickets")
    def admin_feedback(page: int = Query(default=1, ge=1), page_size: int = Query(default=5, ge=1, le=50),
                       q: str = "", status: str | None = None,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        conditions, params = ["1=1"], []
        if q: conditions.append("LOWER(subject||' '||description) LIKE ?"); params.append(f"%{q.lower()}%")
        if status: conditions.append("status=?"); params.append(status)
        where = " AND ".join(conditions)
        total = db.execute(f"SELECT COUNT(*) FROM feedback_tickets WHERE {where}", params).fetchone()[0]
        tickets = rows(db, f"SELECT * FROM feedback_tickets WHERE {where} ORDER BY updated_at DESC LIMIT ? OFFSET ?",
                       (*params, page_size, (page - 1) * page_size))
        counts = {s: db.execute("SELECT COUNT(*) FROM feedback_tickets WHERE status=?", (s,)).fetchone()[0]
                  for s in ("unassigned", "in_progress", "answered", "resolved")}
        return {"items": [feedback_payload(db, t) for t in tickets], "page": page, "pageSize": page_size,
                "total": total, "totalPages": (total + page_size - 1) // page_size, "counts": counts}

    @app.patch("/admin/feedback/tickets/{ticket_id}")
    def patch_feedback(ticket_id: str, data: AdminFeedbackPatch,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        values = data.model_dump(exclude_unset=True)
        if not values: raise HTTPException(422, "No fields to update")
        fields = [(k, v) for k, v in values.items()]
        db.execute(f"UPDATE feedback_tickets SET {','.join(k+'=?' for k,_ in fields)},updated_at=? WHERE id=?",
                   (*[v for _, v in fields], now(), ticket_id))
        ticket = row(db, "SELECT * FROM feedback_tickets WHERE id=?", (ticket_id,))
        if not ticket: raise HTTPException(404, "Ticket not found")
        return {"ticket": feedback_payload(db, ticket)}

    @app.post("/admin/feedback/tickets/{ticket_id}/replies")
    def reply_feedback(ticket_id: str, data: FeedbackReply,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        admin = require_admin(vistra_session, db)
        if not row(db, "SELECT id FROM feedback_tickets WHERE id=?", (ticket_id,)):
            raise HTTPException(404, "Ticket not found")
        timestamp = now()
        db.execute("INSERT INTO feedback_replies(id,ticket_id,sender_user_id,message,created_at) VALUES (?,?,?,?,?)",
                   (str(uuid4()), ticket_id, admin["id"], data.message, timestamp))
        db.execute("UPDATE feedback_tickets SET status='answered',updated_at=? WHERE id=?", (timestamp, ticket_id))
        return {"ticket": feedback_payload(db, row(db, "SELECT * FROM feedback_tickets WHERE id=?", (ticket_id,)))}

    @app.post("/api/v1/admin/import/places")
    def import_places(data: PlacesImportRequest, request: Request,
                      vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        admin = require_admin(vistra_session, db)
        import_body_limit(request, 2 * 1024 * 1024)
        existing_batch = row(db, "SELECT * FROM data_import_batches WHERE batch_id=?", (data.batch_id,))
        if existing_batch:
            return {"batch_id": data.batch_id, "status": "already_processed", **existing_batch, "errors": []}
        mapping = import_mapping()
        # Imported dataset records need an evidence link before they can be
        # considered by the planner.  Keep them discovered (not reviewed),
        # but make the provenance explicit and idempotent.
        source_name = data.source.strip()
        source = row(db, "SELECT id FROM sources WHERE name=?", (source_name,))
        if not source:
            db.execute("""INSERT INTO sources
                (name,host,base_url,source_type,collection_approved,notes)
                VALUES (?,?,?,?,?,?)""", (source_name,
                f"import.{source_name.lower().replace(' ', '-')}.local",
                f"import://{source_name}", "open_dataset", 1,
                "Imported dataset; records require review before production promotion"))
            source = row(db, "SELECT id FROM sources WHERE name=?", (source_name,))
        source_id = source["id"]
        counters = {"received": len(data.items), "inserted": 0, "updated": 0, "skipped": 0, "failed": 0}
        errors = []
        for index, item in enumerate(data.items):
            province_code = mapping.get(item.province)
            # Fallback to the canonical destination catalog. This keeps old
            # deployments with a mojibake mapping file compatible after the
            # destination rows have been repaired.
            if not province_code:
                destination_match = row(db, "SELECT province_code FROM destinations "
                                        "WHERE source_name=? OR display_name=? LIMIT 1",
                                        (item.province, item.province))
                province_code = destination_match["province_code"] if destination_match else None
            if not province_code:
                counters["failed"] += 1
                errors.append({"index": index, "code": "PROVINCE_UNMAPPED", "message": "Province has no destination mapping"})
                continue
            dest = row(db, "SELECT id FROM destinations WHERE province_code=? OR slug=?", (province_code, province_code))
            if not dest:
                counters["failed"] += 1
                errors.append({"index": index, "code": "DESTINATION_NOT_FOUND", "message": "Destination mapping is not configured"})
                continue
            duplicate = row(db, "SELECT id FROM places WHERE source_place_id=?", (item.source_place_id,))
            values = (dest["id"], item.name, item.name.lower(), item.address, item.latitude, item.longitude,
                      import_kind(item.category), item.category, json.dumps(item.metadata, ensure_ascii=False),
                      item.source_updated_at, now())
            if duplicate:
                db.execute("""UPDATE places SET destination_id=?,display_name=?,normalized_name=?,address=?,latitude=?,longitude=?,
                    kind=?,source_category=?,source_metadata_json=?,source_updated_at=?,updated_at=? WHERE source_place_id=?""",
                    (*values, item.source_place_id))
                place_id = duplicate["id"]
                counters["updated"] += 1
            else:
                inserted_place = db.execute("""INSERT INTO places(destination_id,display_name,normalized_name,address,latitude,longitude,kind,
                    source_place_id,source_category,source_metadata_json,source_updated_at,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (dest["id"], item.name, item.name.lower(), item.address, item.latitude, item.longitude,
                     import_kind(item.category), item.source_place_id, item.category,
                     json.dumps(item.metadata, ensure_ascii=False), item.source_updated_at, now(), now()))
                place_id = inserted_place.fetchone()["id"] if inserted_place.description and "id" in [d[0] for d in inserted_place.description] else None
                if place_id is None:
                    place_id = row(db, "SELECT id FROM places WHERE source_place_id=?", (item.source_place_id,))["id"]
                counters["inserted"] += 1
            timestamp = now()
            db.execute("""INSERT INTO place_sources
                (place_id,source_id,source_url,external_place_id,first_seen_at,last_seen_at)
                VALUES (?,?,?,?,?,?)
                ON CONFLICT (source_id, external_place_id) DO UPDATE SET
                    place_id=excluded.place_id,last_seen_at=excluded.last_seen_at""",
                (place_id, source_id, f"import://{source_name}/{item.source_place_id}",
                 item.source_place_id, timestamp, timestamp))
        db.execute("""INSERT INTO data_import_batches(batch_id,source,kind,received,inserted,updated,skipped,failed,created_by,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)""", (data.batch_id, data.source, "places", counters["received"], counters["inserted"],
            counters["updated"], counters["skipped"], counters["failed"], admin["id"], now()))
        return {"batch_id": data.batch_id, "status": "completed_with_errors" if errors else "completed",
                **counters, "errors": errors, "next_cursor": None}

    @app.post("/api/v1/admin/import/place-images")
    def import_place_images(data: PlaceImagesImportRequest, request: Request,
                            vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        admin = require_admin(vistra_session, db)
        import_body_limit(request, 1 * 1024 * 1024)
        existing_batch = row(db, "SELECT * FROM data_import_batches WHERE batch_id=?", (data.batch_id,))
        if existing_batch:
            return {"batch_id": data.batch_id, "status": "already_processed", **existing_batch, "errors": []}
        allowed_hosts = {"upload.wikimedia.org", "thumb.wikimedia.org", "res.cloudinary.com"}
        counters = {"received": len(data.items), "inserted": 0, "updated": 0, "skipped": 0, "failed": 0}
        errors = []
        for index, item in enumerate(data.items):
            host = (urlparse(item.image_url).hostname or "").lower()
            if host not in allowed_hosts and not host.endswith(".cloudinary.com"):
                counters["failed"] += 1
                errors.append({"index": index, "code": "IMAGE_HOST_NOT_ALLOWED", "message": "Image URL host is not allowed"})
                continue
            place = row(db, "SELECT id FROM places WHERE source_place_id=?", (item.source_place_id,))
            if not place:
                counters["failed"] += 1
                errors.append({"index": index, "code": "PLACE_NOT_FOUND", "message": "Source place has not been imported"})
                continue
            duplicate = row(db, "SELECT id FROM place_images WHERE source_image_id=? OR (sha256 IS NOT NULL AND sha256=?)",
                            (item.source_image_id, item.sha256))
            if duplicate:
                counters["skipped"] += 1
                continue
            timestamp = now()
            db.execute("""INSERT INTO place_images(id,place_id,source_image_id,image_url,thumbnail_url,source,license,author,
                width,height,file_size_bytes,sha256,metadata_json,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (str(uuid4()), place["id"], item.source_image_id, item.image_url, item.thumbnail_url, data.source,
                 item.license, item.author, item.width, item.height, item.file_size_bytes, item.sha256,
                 json.dumps(item.metadata, ensure_ascii=False), timestamp, timestamp))
            counters["inserted"] += 1
        db.execute("""INSERT INTO data_import_batches(batch_id,source,kind,received,inserted,updated,skipped,failed,created_by,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)""", (data.batch_id, data.source, "place_images", counters["received"], counters["inserted"],
            counters["updated"], counters["skipped"], counters["failed"], admin["id"], now()))
        return {"batch_id": data.batch_id, "status": "completed_with_errors" if errors else "completed",
                **counters, "errors": errors}

    @app.get("/admin/content")
    def admin_content(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        result = {"heroPlans": [], "introDestinations": [], "allergyOptions": []}
        mapping = {"hero-plans": "heroPlans", "intro-destinations": "introDestinations", "allergy-options": "allergyOptions"}
        for collection, key in mapping.items():
            result[key] = [{**json.loads(item["payload_json"]), "id": item["id"],
                            "active": bool(item["active"]), "order": item["sort_order"]}
                           for item in rows(db, "SELECT * FROM content_items WHERE collection=? AND active=1 ORDER BY sort_order,id", (collection,))]
        if not result["introDestinations"]:
            destinations_data = rows(db, "SELECT id,slug,display_name FROM destinations WHERE enabled=1 ORDER BY id")
            result["introDestinations"] = [{"id": str(item["id"]), "active": True, "order": item["id"],
                "label": item["display_name"], "provinceCode": item["slug"], "imageUrl": None, "tagline": None}
                for item in destinations_data]
        if not result["allergyOptions"]:
            result["allergyOptions"] = [{"id": "seafood", "active": True, "label": "Hải sản"},
                {"id": "peanut", "active": True, "label": "Đậu phộng"},
                {"id": "dairy", "active": True, "label": "Sữa"},
                {"id": "gluten", "active": True, "label": "Gluten"}]
        return result

    @app.post("/admin/content/{collection}", status_code=201)
    def create_content(collection: Literal["hero-plans", "intro-destinations", "allergy-options"], payload: dict,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        if collection == "hero-plans" and not payload.get("title"):
            raise HTTPException(422, "title is required")
        if collection == "intro-destinations" and not payload.get("label"):
            raise HTTPException(422, "label is required")
        if collection == "allergy-options" and not payload.get("label"):
            raise HTTPException(422, "label is required")
        item_id, timestamp = str(uuid4()), now()
        db.execute("INSERT INTO content_items(id,collection,payload_json,created_at,updated_at) VALUES (?,?,?,?,?)",
                   (item_id, collection, json.dumps(payload, ensure_ascii=False), timestamp, timestamp))
        return {"item": {**payload, "id": item_id, "active": True, "order": 0}}

    @app.patch("/admin/content/{collection}/{item_id}")
    def update_content(collection: str, item_id: str, payload: dict,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        item = row(db, "SELECT * FROM content_items WHERE id=? AND collection=?", (item_id, collection))
        if not item: raise HTTPException(404, "Content item not found")
        current = json.loads(item["payload_json"]); current.update(payload)
        active = int(payload.pop("active", bool(item["active"]))) if "active" in payload else item["active"]
        order = int(payload.pop("order", item["sort_order"])) if "order" in payload else item["sort_order"]
        db.execute("UPDATE content_items SET payload_json=?,active=?,sort_order=?,updated_at=? WHERE id=?",
                   (json.dumps(current, ensure_ascii=False), active, order, now(), item_id))
        return {"item": {**current, "id": item_id, "active": bool(active), "order": order}, "updatedAt": now()}

    @app.delete("/admin/content/{collection}/{item_id}", status_code=204)
    def delete_content(collection: str, item_id: str,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        if db.execute("DELETE FROM content_items WHERE id=? AND collection=?", (item_id, collection)).rowcount != 1:
            raise HTTPException(404, "Content item not found")

    @app.get("/admin/evaluation/datasets")
    def evaluation_datasets(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100),
                            vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        total = db.execute("SELECT COUNT(*) FROM evaluation_datasets").fetchone()[0]
        datasets = rows(db, "SELECT * FROM evaluation_datasets ORDER BY updated_at DESC LIMIT ? OFFSET ?",
                        (page_size, (page - 1) * page_size))
        items = []
        for dataset in datasets:
            count = db.execute("SELECT COUNT(*) FROM evaluation_cases WHERE dataset_id=?", (dataset["id"],)).fetchone()[0]
            items.append({"id": dataset["id"], "name": dataset["name"], "description": dataset["description"],
                          "testCasesCount": count, "isBuiltin": bool(dataset["is_builtin"]), "testCases": []})
        return {"items": items, "page": page, "pageSize": page_size, "total": total,
                "totalPages": (total + page_size - 1) // page_size}

    @app.post("/admin/evaluation/datasets", status_code=201)
    def create_dataset(data: DatasetCreate, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        dataset_id, timestamp = str(uuid4()), now()
        db.execute("INSERT INTO evaluation_datasets(id,name,description,created_at,updated_at) VALUES (?,?,?,?,?)",
                   (dataset_id, data.name, data.description, timestamp, timestamp))
        for index, case in enumerate(data.test_cases):
            if not isinstance(case, dict) or not case.get("name"):
                raise HTTPException(422, detail={"code": "INVALID_CASE", "index": index})
            db.execute("INSERT INTO evaluation_cases(id,dataset_id,name,input_json,expected_json) VALUES (?,?,?,?,?)",
                       (str(uuid4()), dataset_id, case["name"], json.dumps(case.get("input")), json.dumps(case.get("expected"))))
        return {"dataset": {"id": dataset_id, "name": data.name, "testCasesCount": len(data.test_cases),
                             "isBuiltin": False, "version": 1}}

    @app.post("/admin/evaluation/runs", status_code=202)
    def start_evaluation(payload: dict, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        dataset_id = payload.get("datasetId")
        if not row(db, "SELECT id FROM evaluation_datasets WHERE id=?", (dataset_id,)):
            raise HTTPException(404, "Dataset not found")
        run_id = str(uuid4())
        db.execute("INSERT INTO evaluation_runs(id,dataset_id,status,created_at) VALUES (?,?,?,?)",
                   (run_id, dataset_id, "queued", now()))
        return {"runId": run_id, "status": "queued"}

    @app.get("/admin/evaluation/runs/{run_id}")
    def evaluation_run(run_id: str, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        run = row(db, "SELECT * FROM evaluation_runs WHERE id=?", (run_id,))
        if not run: raise HTTPException(404, "Evaluation run not found")
        summary = json.loads(run["summary_json"]) if run["summary_json"] else None
        return {"runId": run_id, "datasetId": run["dataset_id"], "status": run["status"],
                "scorePct": summary.get("scorePct") if summary else None,
                "counts": summary.get("counts", {"passed": 0, "warning": 0, "failed": 0}) if summary else None,
                "cases": None}

    @app.get("/admin/system/summary")
    def system_summary(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        return {"availabilityPct": None, "aiResponseLatencyMs": {"avg": None, "p95": None},
                "apiLatencyMs": {"avg": None, "p95": None}, "planAcceptancePct": None,
                "checkedAt": now(), "benchmarkGroups": []}

    @app.get("/admin/traces")
    def list_traces(page: int = Query(default=1, ge=1), page_size: int = Query(default=5, ge=1, le=100),
                    vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        total = db.execute("SELECT COUNT(*) FROM system_traces").fetchone()[0]
        items = rows(db, "SELECT id,created_at,trace_type,status,latency_ms,confidence,context_json FROM system_traces "
                     "ORDER BY created_at DESC LIMIT ? OFFSET ?", (page_size, (page - 1) * page_size))
        return {"items": [{"id": i["id"], "timestamp": i["created_at"], "traceType": i["trace_type"],
                           "status": i["status"], "latencyMs": i["latency_ms"], "confidence": i["confidence"],
                           "context": json.loads(i["context_json"])} for i in items],
                "page": page, "pageSize": page_size, "total": total,
                "totalPages": (total + page_size - 1) // page_size}

    @app.get("/admin/traces/{trace_id}")
    def trace_detail(trace_id: str, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        trace = row(db, "SELECT * FROM system_traces WHERE id=?", (trace_id,))
        if not trace: raise HTTPException(404, "Trace not found")
        return {"id": trace["id"], "timestamp": trace["created_at"], "traceType": trace["trace_type"],
                "status": trace["status"], "latencyMs": trace["latency_ms"], "confidence": trace["confidence"],
                "context": json.loads(trace["context_json"]), "details": json.loads(trace["details_json"])}

    # Admin contract used by the current frontend. These routes are deliberately
    # allow-listed; arbitrary table names or SQL are never accepted from clients.
    @app.get("/api/v1/admin/overview")
    def v1_admin_overview(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        return {"data": {"users": db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
                          "places": db.execute("SELECT COUNT(*) FROM places").fetchone()[0],
                          "trips": db.execute("SELECT COUNT(*) FROM trips WHERE deleted_at IS NULL").fetchone()[0],
                          "feedback": db.execute("SELECT COUNT(*) FROM feedback_tickets").fetchone()[0],
                          "updatedAt": now()}}

    @app.get("/api/v1/admin/content")
    def v1_admin_content(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return {"data": admin_content(vistra_session=vistra_session, db=db)}

    @app.post("/api/v1/admin/content/{collection}", status_code=201)
    def v1_create_content(collection: Literal["hero-plans", "intro-destinations", "allergy-options"], payload: dict,
                           vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return {"data": create_content(collection, payload, vistra_session=vistra_session, db=db)["item"]}

    @app.patch("/api/v1/admin/content/{collection}/{item_id}")
    def v1_update_content(collection: str, item_id: str, payload: dict,
                          vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return {"data": update_content(collection, item_id, payload, vistra_session=vistra_session, db=db)["item"]}

    @app.delete("/api/v1/admin/content/{collection}/{item_id}", status_code=204)
    def v1_delete_content(collection: str, item_id: str,
                          vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return delete_content(collection, item_id, vistra_session=vistra_session, db=db)

    @app.get("/api/v1/admin/revenue")
    def v1_admin_revenue(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        # No payment/plan-history table exists yet; never infer revenue from trip budgets.
        return {"data": {"currency": "VND", "total": None, "mrr": None, "items": [],
                          "available": False, "message": "Payment history is not configured"}}

    @app.get("/api/v1/admin/ai/provider")
    def v1_ai_provider_status(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        config = row(db, "SELECT provider,model,updated_at FROM ai_provider_settings WHERE id=1")
        return {"data": {"provider": config["provider"] if config else settings.ai_provider,
                          "model": config["model"] if config else (settings.gemini_model or settings.openai_model),
                          "hasKey": bool(config), "updatedAt": config["updated_at"] if config else None,
                          "supportedProviders": ["gemini", "openai"],
                          "recommendedModels": {"gemini": ["gemini-3.5-flash-lite"],
                                                 "openai": ["gpt-4o-mini"]}}}

    @app.put("/api/v1/admin/ai/provider")
    def v1_ai_provider_update(payload: dict, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        admin = require_admin(vistra_session, db)
        provider = str(payload.get("provider", "")).lower()
        api_key = str(payload.get("apiKey", "")).strip()
        default_models = {"gemini": "gemini-3.5-flash-lite", "openai": "gpt-4o-mini"}
        model = str(payload.get("model") or default_models[provider]).strip()
        if provider not in ("gemini", "openai"):
            raise HTTPException(422, detail={"code": "UNSUPPORTED_PROVIDER", "allowed": ["gemini", "openai"]})
        if not api_key or len(api_key) > 500:
            raise HTTPException(422, detail={"code": "API_KEY_REQUIRED"})
        if not model or len(model) > 120:
            raise HTTPException(422, detail={"code": "MODEL_REQUIRED"})
        encrypted = _ai_fernet(settings).encrypt(api_key.encode()).decode()
        timestamp = now()
        db.execute("""INSERT INTO ai_provider_settings(id,provider,model,encrypted_api_key,updated_by,updated_at)
                     VALUES (1,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET provider=excluded.provider,
                     model=excluded.model,encrypted_api_key=excluded.encrypted_api_key,
                     updated_by=excluded.updated_by,updated_at=excluded.updated_at""",
                   (provider, model, encrypted, admin["id"], timestamp))
        settings.ai_provider = provider
        if provider == "gemini":
            settings.gemini_api_key, settings.gemini_model = api_key, model
        else:
            settings.openai_api_key, settings.openai_model = api_key, model
        # Force request-time client creation with the new provider configuration.
        app.state.gemini = None
        return {"data": {"provider": provider, "model": model, "hasKey": True,
                          "updatedAt": timestamp, "message": "AI provider updated",
                          "recommendedModels": {"gemini": ["gemini-3.5-flash-lite"],
                                                 "openai": ["gpt-4o-mini"]}}}

    @app.get("/api/v1/admin/users")
    def v1_admin_users(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                       q: str = "", vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        like = f"%{q.strip()}%"
        total = db.execute("SELECT COUNT(*) FROM users WHERE email LIKE ? OR full_name LIKE ?", (like, like)).fetchone()[0]
        items = rows(db, """SELECT id,full_name,email,role,status,avatar_url,created_at,updated_at FROM users
                         WHERE email LIKE ? OR full_name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?""",
                     (like, like, page_size, (page - 1) * page_size))
        return {"data": {"items": items, "page": page, "pageSize": page_size, "total": total}}

    @app.patch("/api/v1/admin/users/{user_id}/status")
    def v1_admin_user_status(user_id: str, payload: dict,
                             vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        status = payload.get("status")
        if status not in ("active", "suspended", "disabled"):
            raise HTTPException(422, detail={"code": "INVALID_STATUS", "allowed": ["active", "suspended", "disabled"]})
        if db.execute("UPDATE users SET status=?,updated_at=? WHERE id=?", (status, now(), user_id)).rowcount != 1:
            raise HTTPException(404, "User not found")
        return {"data": {"id": user_id, "status": status}}

    @app.get("/api/v1/admin/entities/metadata")
    def v1_entity_metadata(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        specs = {
            "destinations": ("Destinations", "Destination catalog", ["id", "slug", "display_name", "province_code", "enabled"]),
            "plans": ("Plans", "Travel plans", ["id", "owner_user_id", "destination_id", "status", "is_published"]),
            "itinerary_days": ("Itinerary days", "Trip itinerary versions", ["id", "trip_id", "version"]),
            "activities": ("Activities", "Places and activities", ["id", "destination_id", "display_name", "kind"]),
            "feedback_tickets": ("Feedback", "User feedback tickets", ["id", "user_id", "subject", "status"]),
        }
        tables = []
        for table, (name, description, fields) in specs.items():
            actual = {"plans": "trips", "itinerary_days": "itinerary_versions", "activities": "places"}.get(table, table)
            count = db.execute(f"SELECT COUNT(*) FROM {actual}").fetchone()[0]
            tables.append({"tableName": table, "name": name, "description": description,
                           "recordCount": count, "fields": [{"name": f, "type": "string", "required": f == "id"}
                                                               for f in fields]})
        return {"data": {"tables": tables}}

    @app.get("/api/v1/admin/entities/{table}/records")
    def v1_entity_records(table: str, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                           q: str = "", vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        actual = {"destinations": "destinations", "plans": "trips", "itinerary_days": "itinerary_versions",
                  "activities": "places", "feedback_tickets": "feedback_tickets"}.get(table)
        if not actual:
            raise HTTPException(404, "Entity not found")
        allowed = {"destinations": ["id", "slug", "display_name", "province_code", "enabled"],
                   "trips": ["id", "owner_user_id", "destination_id", "status", "is_published"],
                   "itinerary_versions": ["id", "trip_id", "version"],
                   "places": ["id", "destination_id", "display_name", "kind"],
                   "feedback_tickets": ["id", "user_id", "subject", "status"]}[actual]
        where, params = "", []
        if q:
            text_fields = [f for f in allowed if f not in ("id", "enabled", "is_published")]
            where = " WHERE " + " OR ".join(f"CAST({f} AS TEXT) LIKE ?" for f in text_fields)
            params = [f"%{q}%"] * len(text_fields)
        total = db.execute(f"SELECT COUNT(*) FROM {actual}{where}", params).fetchone()[0]
        items = rows(db, f"SELECT {','.join(allowed)} FROM {actual}{where} LIMIT ? OFFSET ?",
                     [*params, page_size, (page - 1) * page_size])
        return {"data": {"table": table, "items": items, "page": page, "pageSize": page_size, "total": total}}

    @app.get("/api/v1/admin/golden-datasets")
    def v1_golden_datasets(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        # Pass concrete values when reusing the root handler; FastAPI Query
        # defaults are marker objects outside dependency injection.
        return {"data": evaluation_datasets(page=1, page_size=20,
                                              vistra_session=vistra_session, db=db)}

    @app.post("/api/v1/admin/golden-datasets")
    def v1_create_golden_dataset(payload: dict, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        cases = payload.get("testCases") or payload.get("test_cases") or []
        data = DatasetCreate(name=payload.get("name", ""), description=payload.get("description", ""),
                             test_cases=[{"name": c.get("name", c.get("id", "case")), "input": c.get("input", {}),
                                          "expected": c.get("expected", {})} for c in cases])
        return {"data": create_dataset(data, vistra_session=vistra_session, db=db)["dataset"]}

    @app.post("/api/v1/admin/golden-datasets/{dataset_id}/runs", status_code=202)
    def v1_run_golden_dataset(dataset_id: str, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return {"data": start_evaluation({"datasetId": dataset_id}, vistra_session=vistra_session, db=db)}

    @app.get("/api/v1/admin/safety-presets")
    def v1_safety_presets(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        return {"data": {"mode": "reference", "items": []}}

    @app.post("/api/v1/admin/safety-evaluations")
    def v1_safety_evaluation(payload: dict, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        prompt = str(payload.get("prompt", "")).strip()
        if not prompt:
            raise HTTPException(422, detail={"code": "PROMPT_REQUIRED"})
        return {"data": {"executionMode": "reference", "prompt": prompt, "presetId": payload.get("presetId"),
                          "blocked": False, "blockedCount": 0, "attackType": None,
                          "latencyMs": None, "defenseLayer": None, "sanitizedResponse": None,
                          "expectedDefense": None}}

    # ------------------------------------------------------------------
    # Versioned frontend contract. Root routes above remain supported for
    # existing clients; these aliases are the canonical /api/v1 surface.
    # ------------------------------------------------------------------
    @app.post("/api/v1/auth/register", status_code=201)
    def v1_register(data: RegisterRequest, response: Response, db=Depends(database)):
        result = register(data, response, db)
        result["user"] = {"id": result["user"]["id"], "full_name": result["user"]["fullName"],
                           "email": result["user"]["email"], "role": result["user"]["role"],
                           "avatar_url": result["user"].get("avatarUrl")}
        result["session"]["expires_at"] = result["session"].pop("expiresAt")
        return result

    @app.post("/api/v1/auth/login")
    def v1_login(data: LoginRequest, response: Response, db=Depends(database)):
        result = login(data, response, db)
        result["user"] = {"id": result["user"]["id"], "full_name": result["user"]["fullName"],
                           "email": result["user"]["email"], "role": result["user"]["role"],
                           "avatar_url": result["user"].get("avatarUrl")}
        result["session"]["expires_at"] = result["session"].pop("expiresAt")
        return result

    @app.get("/api/v1/auth/me")
    def v1_me(response: Response, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        result = auth_me(response, vistra_session, db)
        result["user"] = {"id": result["user"]["id"], "full_name": result["user"]["fullName"],
                           "email": result["user"]["email"], "role": result["user"]["role"],
                           "avatar_url": result["user"].get("avatarUrl")}
        result["session"]["expires_at"] = result["session"].pop("expiresAt")
        return result

    @app.post("/api/v1/auth/logout")
    def v1_logout(response: Response, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return logout(response, vistra_session, db)

    @app.patch("/api/v1/users/me")
    def v1_profile(data: ProfilePatch, response: Response,
                   vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return update_profile(data, response, vistra_session, db)

    @app.get("/api/v1/users/me")
    def v1_get_profile(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return get_profile(vistra_session, db)

    @app.get("/api/v1/users/me/dna")
    def v1_dna(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return get_travel_dna(vistra_session, db)

    @app.put("/api/v1/users/me/dna")
    def v1_dna_update(data: TravelDnaPatch, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return update_travel_dna(data, vistra_session, db)

    @app.get("/api/v1/public/landing")
    def v1_landing(db=Depends(database)):
        content = public_content(db)
        return {**content, "stats": {"destinations": len(content["introDestinations"]), "places": None}}

    @app.get("/api/v1/catalog/{catalog_type}")
    def v1_catalog(catalog_type: str, db=Depends(database)):
        if catalog_type == "provinces":
            return {"type": catalog_type, "items": rows(db, """SELECT id,slug,COALESCE(province_code,slug) AS province_code,
                display_name AS name,COALESCE(source_name,display_name) AS source_name,
                parent_destination_id, destination_type
                FROM destinations WHERE enabled=1 ORDER BY id""")}
        if catalog_type == "allergies":
            return {"type": catalog_type, "items": public_content(db)["allergyOptions"]}
        if catalog_type == "moodboard":
            return {"type": catalog_type, "items": []}
        raise HTTPException(404, "Catalog not found")

    @app.get("/api/v1/destinations/recommendations")
    def v1_destination_recommendations(db=Depends(database)):
        return destination_recommendations(db=db)

    @app.get("/api/v1/destinations/{destination_id}")
    def v1_destination_detail(destination_id: str, ids: str | None = None, db=Depends(database)):
        requested = [part.strip() for part in (ids.split(",") if ids else [destination_id]) if part.strip()]
        result = []
        for value in requested:
            item = row(db, """SELECT d.id,d.slug,d.display_name,d.admin_name,d.center_lat,d.center_lon,d.target_places,
                       parent.id AS parent_id, parent.slug AS parent_slug, parent.display_name AS parent_name,
                       d.destination_type
                       FROM destinations d
                       LEFT JOIN destinations parent ON parent.id=d.parent_destination_id
                       WHERE (d.slug=? OR CAST(d.id AS TEXT)=?) AND d.enabled=1""", (value, value))
            if item:
                result.append({"id": item["id"], "slug": item["slug"], "name": item["display_name"],
                               "region": item["admin_name"], "coordinates": {"lat": item["center_lat"], "lng": item["center_lon"]},
                               "targetPlaces": item["target_places"], "highlights": [],
                               "destinationType": item["destination_type"],
                               "parentDestination": ({"id": item["parent_id"], "slug": item["parent_slug"],
                                                       "name": item["parent_name"]}
                                                      if item["parent_id"] is not None else None)})
        if not result: raise HTTPException(404, "Destination not found")
        return {"destinations": result}

    @app.get("/api/v1/trips/me")
    def v1_my_trips(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=50),
                    vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        total = db.execute("SELECT COUNT(*) FROM trips WHERE owner_user_id=? AND deleted_at IS NULL", (user["id"],)).fetchone()[0]
        items = rows(db, "SELECT * FROM trips WHERE owner_user_id=? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?",
                     (user["id"], page_size, (page - 1) * page_size))
        return {"items": [plan_card(db, item, user["id"]) for item in items],
                "pagination": {"page": page, "page_size": page_size, "total_records": total}}

    @app.post("/api/v1/trips", status_code=201)
    def v1_create_trip(data: TripCreate, generate_itinerary: bool = False,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return create_trip(data, generate_itinerary, vistra_session, db)

    @app.get("/api/v1/trips/{trip_id}")
    def v1_get_trip(trip_id: str, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        owner = row(db, "SELECT owner_user_id FROM trips WHERE id=? AND deleted_at IS NULL", (trip_id,))
        if not owner or owner["owner_user_id"] != user["id"]:
            raise HTTPException(404, "Trip not found")
        return get_trip(trip_id, db)

    @app.post("/api/v1/feedback", status_code=201)
    def v1_feedback(data: FeedbackCreate, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return create_feedback(data, vistra_session, db)

    @app.get("/api/v1/feedback/me")
    def v1_feedback_me(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=50),
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return my_feedback(page, page_size, None, vistra_session, db)

    @app.post("/api/v1/feedback/{ticket_id}/rating")
    def v1_feedback_rating(ticket_id: str, data: FeedbackRating,
                           vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return rate_feedback(ticket_id, data, vistra_session, db)

    @app.get("/api/v1/community/trips")
    def v1_community(page: int = Query(default=1, ge=1), page_size: int = Query(default=9, ge=1, le=50),
                     q: str = "", province: str | None = None, duration: int | None = Query(default=None, ge=1),
                     tag: str | None = None, budget_min_vnd: int | None = Query(default=None, ge=0),
                     budget_max_vnd: int | None = Query(default=None, ge=0), liked_by_me: bool | None = None,
                     vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return community_plans(page=page, page_size=page_size, q=q, province=province, duration=duration,
                               tag=tag, budget_min_vnd=budget_min_vnd, budget_max_vnd=budget_max_vnd,
                               liked_by_me=liked_by_me,
                               vistra_session=vistra_session, db=db)

    @app.post("/api/v1/community/trips/{trip_id}/like")
    def v1_like(trip_id: str, data: LikeRequest,
                vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        result = like_community_plan(trip_id, data, vistra_session, db)
        return {"trip_id": result["planId"], "liked": result["likedByMe"], "total_likes": result["likesCount"]}

    @app.post("/api/v1/community/trips/{trip_id}/fork", status_code=201)
    def v1_fork(trip_id: str, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        result = clone_community_plan(trip_id, vistra_session, db)
        return {"new_trip_id": result["plan"]["id"], "status": "draft", "base_version": 0,
                "message": "Trip cloned as a private draft"}

    @app.patch("/api/v1/trips/{trip_id}")
    def v1_update_trip(trip_id: str, payload: dict,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        user = require_session(vistra_session, db)
        unsupported = set(payload) - {"base_version", "status", "is_published"}
        if unsupported:
            raise HTTPException(422, detail={"code": "UNSUPPORTED_TRIP_FIELDS", "fields": sorted(unsupported)})
        item = row(db, "SELECT owner_user_id,current_version,status,is_published FROM trips WHERE id=? AND deleted_at IS NULL", (trip_id,))
        if not item: raise HTTPException(404, "Trip not found")
        if item["owner_user_id"] and item["owner_user_id"] != user["id"]:
            raise HTTPException(403, "Only the owner can update this trip")
        base = payload.get("base_version", item["current_version"])
        if base != item["current_version"]:
            raise HTTPException(409, "Stale base_version")
        updates, values = [], []
        if payload.get("status") in ("draft", "confirmed"):
            updates.append("status=?"); values.append(payload["status"])
        if "is_published" in payload:
            if payload["is_published"] and item["status"] != "confirmed" and payload.get("status") != "confirmed":
                raise HTTPException(422, "Only confirmed trips can be published")
            updates.extend(["is_published=?", "published_at=?"])
            values.extend([1 if payload["is_published"] else 0, now() if payload["is_published"] else None])
        if updates:
            changed = db.execute(f"UPDATE trips SET {','.join(updates)},owner_user_id=COALESCE(owner_user_id,?),updated_at=? "
                                 "WHERE id=? AND owner_user_id=? AND current_version=? AND deleted_at IS NULL",
                                 (*values, user["id"], now(), trip_id, user["id"], item["current_version"])).rowcount
            if changed != 1:
                raise HTTPException(409, "Trip changed. Reload before updating")
        return {"id": trip_id, "base_version": item["current_version"],
                "status": payload.get("status", item["status"]),
                "is_published": bool(payload.get("is_published", item["is_published"])),
                "message": "Trip updated successfully"}

    @app.post("/api/v1/trips/{trip_id}/chat")
    def v1_trip_chat(trip_id: str, data: ChatRequest,
                     vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return travel_agent(trip_id, data, vistra_session, db)

    @app.get("/api/v1/trips/{trip_id}/chat/history")
    def v1_chat_history(trip_id: str, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return chat_history(trip_id, vistra_session, db)

    @app.get("/api/v1/admin/feedback")
    def v1_admin_feedback(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=50),
                          vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return admin_feedback(page, page_size, "", None, vistra_session, db)

    @app.patch("/api/v1/admin/feedback/{ticket_id}")
    def v1_admin_feedback_patch(ticket_id: str, data: AdminFeedbackPatch,
                                vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return patch_feedback(ticket_id, data, vistra_session, db)

    @app.post("/api/v1/admin/feedback/{ticket_id}/replies", status_code=201)
    def v1_admin_feedback_reply(ticket_id: str, data: FeedbackReply,
                                vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return reply_feedback(ticket_id, data, vistra_session, db)

    @app.get("/api/v1/admin/traces")
    def v1_admin_traces(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100),
                        vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return list_traces(page, page_size, vistra_session, db)

    @app.get("/api/v1/admin/traces/{trace_id}")
    def v1_admin_trace(trace_id: str, vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return trace_detail(trace_id, vistra_session, db)

    @app.get("/api/v1/admin/system/metrics")
    def v1_admin_metrics(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return system_summary(vistra_session, db)

    return app


app = create_app()

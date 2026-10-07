import json
import hashlib
import logging
import hmac
import secrets
import sqlite3
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import uuid4

from fastapi import Cookie, Depends, FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import Settings
from backend.agents.orchestrator import ChatRequest, chat
from backend.agents.agent import IntentRequest
from backend.agents.gemini import create_client
from backend.db import connect, initialize, now, row, rows
from backend.models import (CommitRequest, ExpenseCreate, GenerateSelection, Kind, LikeRequest, LoginRequest,
                            AdminFeedbackPatch, DatasetCreate, FeedbackCreate, FeedbackRating, FeedbackReply,
                            PlaceReview, PreviewRequest, ProfilePatch, PublicationRequest, RegisterRequest,
                            TravelDnaPatch, TripCreate, VersionRequest)
from backend.places import detail, resolve_duplicate, review
from backend.planner import build
from backend.recommendations import recommendations, candidates as place_candidates
from backend.services import ExternalServices
from backend.catalog import ATTRIBUTION, DESTINATIONS, normalized

logger = logging.getLogger(__name__)


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
            for slug, config in DESTINATIONS.items():
                db.execute("UPDATE destinations SET center_lat=?,center_lon=? WHERE slug=?", (*config["center"], slug))
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
                            samesite="lax", max_age=settings.auth_access_minutes * 60, path="/")
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
                            samesite="lax", max_age=settings.auth_refresh_days * 86400, path="/")
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
        owner = session_user(db, vistra_session)
        for place_id in data.must_visit:
            p = detail(db, place_id)
            if p["destination_id"] != dest["id"]:
                raise HTTPException(422, "Must-visit place belongs to another destination")
        db.execute("""INSERT INTO trips(id,destination_id,request_json,current_version,created_at,owner_user_id)
            VALUES (?,?,?,?,?,?)""",
                   (trip_id, dest["id"], data.model_dump_json(), 0, now(), owner["id"] if owner else None))
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
        db.execute("UPDATE trips SET status='confirmed',confirmed_at=?,owner_user_id=COALESCE(owner_user_id,?) WHERE id=?",
                   (timestamp, user["id"], trip_id))
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
        db.execute("UPDATE trips SET is_published=?,published_at=? WHERE id=? AND current_version=?",
                   (1 if data.is_published else 0, timestamp, trip_id, data.base_version))
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
        payload = build(db, request, destination(db, request.destination), external)
        db.execute('UPDATE trips SET request_json=?,generation_error=NULL WHERE id=?', (request.model_dump_json(), trip_id))
        return save_version(db, trip_id, 0, payload)

    @app.post("/trips/{trip_id}/revisions/preview", dependencies=auth)
    def preview(trip_id: str, data: PreviewRequest, db=Depends(database)):
        current = trip(db, trip_id)
        if current["current_version"] != data.base_version:
            raise HTTPException(409, "Stale base_version")
        request = TripCreate.model_validate(current["request"])
        payload = build(db, request, destination(db, request.destination), external, data.stops)
        preview_id = str(uuid4())
        db.execute("INSERT INTO revision_previews(id,trip_id,base_version,payload_json,created_at,expires_at) VALUES (?,?,?,?,?,?)",
                   (preview_id, trip_id, data.base_version, json.dumps(payload, ensure_ascii=False), now(),
                    (datetime.now(UTC)+timedelta(minutes=30)).isoformat()))
        return dict(preview_id=preview_id, base_version=data.base_version, itinerary=payload,
                    known_cost_delta_vnd=payload["budget"]["known_max_vnd"]-current["itinerary"]["budget"]["known_max_vnd"])

    @app.post("/trips/{trip_id}/revisions/commit", dependencies=auth)
    def commit(trip_id: str, data: CommitRequest, db=Depends(database)):
        # Serialize validation and CAS; a preview can be applied only once.
        db.execute("BEGIN IMMEDIATE")
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
        return {"enabled": bool(settings.gemini_api_key and settings.gemini_model),
                "model": settings.gemini_model or None, "provider": "google-genai",
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
        destinations_data = rows(db, """SELECT id, slug, display_name, admin_name,
            target_places FROM destinations WHERE enabled=1 ORDER BY id""")
        intro = [{"id": str(item["id"]), "active": True, "order": item["id"],
                  "label": item["display_name"], "provinceCode": item["slug"],
                  "imageUrl": None, "tagline": None} for item in destinations_data]
        allergies = [
            {"id": "seafood", "active": True, "label": "Hải sản"},
            {"id": "peanut", "active": True, "label": "Đậu phộng"},
            {"id": "dairy", "active": True, "label": "Sữa"},
            {"id": "gluten", "active": True, "label": "Gluten"},
        ]
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
        data = rows(db, "SELECT id,slug,display_name,admin_name FROM destinations "
                     "WHERE enabled=1 ORDER BY id LIMIT 5")
        items = []
        for item in data:
            items.append({"id": item["slug"], "name": item["display_name"],
                          "region": item["admin_name"], "country": "Vietnam",
                          "imageUrl": None, "durationDays": None,
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
        return {"id": item["id"], "title": request.get("title") or f"Trip to {destination_item['display_name']}",
                "origin": request.get("origin"), "destination": destination_item["display_name"],
                "coverImageUrl": None, "startDate": start,
                "endDate": start, "durationDays": days,
                "budgetMinVnd": request.get("budget_vnd"), "budgetMaxVnd": request.get("budget_vnd"),
                "estimatedCostVnd": None, "status": item.get("status", "draft"),
                "isPublished": bool(item.get("is_published")), "updatedAt": item.get("created_at"),
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
    def travel_agent(trip_id: str, data: ChatRequest, db=Depends(database)):
        current = trip(db, trip_id)
        def make_preview(request):
            result = preview(trip_id, request, db)
            # Previews do not change the itinerary. Release the write lock before the next model call.
            db.commit()
            return result
        return chat(settings, db, current, data, make_preview,
                    client=app.state.gemini)

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

    @app.get("/admin/content")
    def admin_content(vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        result = {"heroPlans": [], "introDestinations": [], "allergyOptions": []}
        mapping = {"hero-plans": "heroPlans", "intro-destinations": "introDestinations", "allergy-options": "allergyOptions"}
        for collection, key in mapping.items():
            result[key] = [{**json.loads(item["payload_json"]), "id": item["id"],
                            "active": bool(item["active"]), "order": item["sort_order"]}
                           for item in rows(db, "SELECT * FROM content_items WHERE collection=? ORDER BY sort_order,id", (collection,))]
        return result

    @app.post("/admin/content/{collection}", status_code=201)
    def create_content(collection: Literal["hero-plans", "allergy-options"], payload: dict,
                       vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        require_admin(vistra_session, db)
        if collection == "hero-plans" and not payload.get("title"):
            raise HTTPException(422, "title is required")
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
            return {"type": catalog_type, "items": rows(db, "SELECT id,slug,display_name AS name FROM destinations WHERE enabled=1 ORDER BY id")}
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
            item = row(db, "SELECT id,slug,display_name,admin_name,center_lat,center_lon,target_places FROM destinations WHERE (slug=? OR CAST(id AS TEXT)=?) AND enabled=1", (value, value))
            if item:
                result.append({"id": item["id"], "slug": item["slug"], "name": item["display_name"],
                               "region": item["admin_name"], "coordinates": {"lat": item["center_lat"], "lng": item["center_lon"]},
                               "targetPlaces": item["target_places"], "highlights": []})
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
                     vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return community_plans(page=page, page_size=page_size, q="", province=None, duration=None,
                               tag=None, budget_min_vnd=None, budget_max_vnd=None, liked_by_me=None,
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
            db.execute(f"UPDATE trips SET {','.join(updates)},owner_user_id=COALESCE(owner_user_id,?) WHERE id=?",
                       (*values, user["id"], trip_id))
        return {"id": trip_id, "base_version": item["current_version"],
                "status": payload.get("status", item["status"]),
                "is_published": bool(payload.get("is_published", item["is_published"])),
                "message": "Trip updated successfully"}

    @app.post("/api/v1/trips/{trip_id}/chat")
    def v1_trip_chat(trip_id: str, data: ChatRequest,
                     vistra_session: str | None = Cookie(default=None), db=Depends(database)):
        return travel_agent(trip_id, data, db)

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

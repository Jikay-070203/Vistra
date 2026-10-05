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
from backend.models import (CommitRequest, ExpenseCreate, GenerateSelection, Kind, LoginRequest,
                            PlaceReview, PreviewRequest, RegisterRequest, TripCreate)
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

    def issue_session(db, user_id: str, response: Response):
        raw = secrets.token_urlsafe(48)
        created = datetime.now(UTC)
        expires = created + timedelta(days=settings.auth_session_days)
        db.execute("INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)",
                   (str(uuid4()), user_id, hashlib.sha256(raw.encode()).hexdigest(),
                    expires.isoformat(), created.isoformat()))
        response.set_cookie("vistra_session", raw, httponly=True, secure=settings.auth_cookie_secure,
                            samesite="lax", max_age=settings.auth_session_days * 86400, path="/")
        return expires.isoformat()

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
        expires = issue_session(db, user_id, response)
        return {"user": _public_user(user), "session": {"expiresAt": expires}}

    @app.post("/auth/login")
    def login(data: LoginRequest, response: Response, db=Depends(database)):
        user = row(db, "SELECT * FROM users WHERE email=?", (data.email.lower(),))
        if not user or not _password_matches(data.password, user["password_hash"]):
            raise HTTPException(401, detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"})
        if user["status"] != "active":
            raise HTTPException(403, detail={"code": "ACCOUNT_SUSPENDED", "message": "Account is suspended"})
        expires = issue_session(db, user["id"], response)
        return {"user": _public_user(user), "session": {"expiresAt": expires}}

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
        response.delete_cookie("vistra_session", path="/")
        return {"success": True}

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
    def create_trip(data: TripCreate, generate_itinerary: bool = False, db=Depends(database)):
        dest = destination(db, data.destination)
        trip_id = str(uuid4())
        for place_id in data.must_visit:
            p = detail(db, place_id)
            if p["destination_id"] != dest["id"]:
                raise HTTPException(422, "Must-visit place belongs to another destination")
        db.execute("INSERT INTO trips(id,destination_id,request_json,current_version,created_at) VALUES (?,?,?,?,?)",
                   (trip_id, dest["id"], data.model_dump_json(), 0, now()))
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

    return app


app = create_app()

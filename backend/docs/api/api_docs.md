# Vistra Backend API — Frontend integration

Base URL: `http://localhost:8000` or the Railway backend URL. Swagger: `/docs`; OpenAPI: `/openapi.json`.

## Authentication

Use `credentials: "include"` for account APIs. Login/register create an HttpOnly `vistra_session` cookie. Do not send user IDs or roles from the client. Legacy catalog APIs may also require `X-API-Key: <API_TOKEN>`.

Roles are `traveler`, `staff`, and `admin`; staff/admin endpoints return `403` for travelers.

### Auth/profile

```text
POST  /api/v1/auth/register
POST  /api/v1/auth/login
GET   /api/v1/auth/me
POST  /api/v1/auth/logout
POST  /api/v1/auth/refresh
PATCH /api/v1/users/me
GET   /api/v1/users/me/dna
PUT   /api/v1/users/me/dna
```

Register/login body. Login/register create an HttpOnly `vistra_session` and `vistra_refresh` cookie. `POST /api/v1/auth/refresh` rotates the refresh cookie and issues a new short-lived access session; call it once after a `401`, then retry the original request. Never store either token in localStorage.

Register/login body:

```json
{"full_name":"Nguyen Van A","email":"a@example.com","password":"Password123!"}
```

Profile patch fields: `full_name,email,phone,default_origin,bio,preferred_pace,preferred_stay,dietary_preference`.

Travel DNA body: `{"metrics":[{"key":"nature","score":80}],"pace":"relaxed","scenery_focus":"mountains","cuisine_priority":"local"}`.

## Catalog and destinations

```text
GET /health
GET /api/v1/status
GET /api/v1/public/landing
GET /api/v1/catalog/{type}                 # provinces, allergies, moodboard
GET /api/v1/destinations/recommendations
GET /api/v1/destinations/{id}?ids=1,2,3
GET /destinations
GET /places?destination=ninh-binh&q=lake&limit=30&offset=0
GET /places/{id}
```

Missing weather, price, image, geometry, and score values are nullable; the frontend must not invent them.

## Trips and planner

```text
POST  /api/v1/trips
GET   /api/v1/trips/me
GET   /api/v1/trips/{id}
PATCH /api/v1/trips/{id}
POST  /api/v1/trips/{id}/chat
POST  /api/v1/trips/{id}/confirm
PATCH /api/v1/trips/{id}/publication
POST  /trips/{id}/revisions/preview
POST  /trips/{id}/revisions/commit
POST  /trips/{id}/expenses
GET   /trips/{id}/expenses
GET   /trips/{id}/budget
```

Trip creation example:

```json
{"destination":"ninh-binh","start_date":"2026-11-01","days":4,"people":2,"budget_vnd":3200000,"budget_scope":"total","transport":"car","pace":"relaxed","interests":["attraction","food"],"must_visit":[]}
```

Confirm body: `{"base_version":1}`. Publication body: `{"is_published":true,"base_version":1}`. Revision preview body: `{"base_version":1,"stops":[{"place_id":1,"day":1,"start_time":"09:00"}]}`.

## Community

```text
GET  /api/v1/community/trips?page=1&page_size=9
POST /api/v1/community/trips/{id}/like       # {"liked":true}
POST /api/v1/community/trips/{id}/fork
GET  /community/plans
PUT  /community/plans/{id}/like
POST /community/plans/{id}/clone
```

Only confirmed and published trips are public. Fork/clone creates a private draft and does not copy private chat data.

## Feedback

```text
POST /api/v1/feedback
GET  /api/v1/feedback/me
POST /api/v1/feedback/{id}/rating          # {"rating":1..5,"comment":"..."}
GET  /admin/feedback/tickets
PATCH /admin/feedback/tickets/{id}
POST /admin/feedback/tickets/{id}/replies
```

Feedback body: `{"subject":"Map issue","description":"...","route_origin":"/planner"}`.

## Admin content, evaluation, and observability

Staff/admin only:

```text
GET    /admin/content
POST   /admin/content/{collection}
PATCH  /admin/content/{collection}/{id}
DELETE /admin/content/{collection}/{id}
GET    /admin/evaluation/datasets
POST   /admin/evaluation/datasets
POST   /admin/evaluation/runs
GET    /admin/evaluation/runs/{id}
GET    /admin/system/summary
GET    /admin/traces
GET    /admin/traces/{id}
```

Collections are `hero-plans`, `intro-destinations`, and `allergy-options`. Evaluation runs initially return `queued`; a worker is required to complete scores.

## Errors and database

Handle `401` by redirecting to login, `403` as forbidden, `404` as missing, `409` by reloading the current version, and `422` as validation failure.

Migrations run at startup for SQLite local and PostgreSQL production. Important tables include `users`, `sessions`, `travel_dna_preferences`, `trips`, `community_plan_likes`, `feedback_tickets`, `feedback_replies`, `content_items`, `evaluation_datasets`, `evaluation_cases`, `evaluation_runs`, and `system_traces`.

Verify PostgreSQL tables:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' ORDER BY table_name;
```

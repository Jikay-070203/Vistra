# Vistra Backend API — Frontend integration

Base URL local: `http://localhost:8000`  
Production: `https://<railway-backend-domain>`  
Swagger: `/docs` · OpenAPI: `/openapi.json`

Frontend requests that use an account must set `credentials: "include"`. Amounts are integer VND. Dates use `YYYY-MM-DD`; timestamps include timezone.

## Authentication

Public: `GET /health`, `GET /api/v1/status`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /public/content`, `GET /community/plans`.

Legacy/catalog endpoints use `X-API-Key: <API_TOKEN>` when `API_TOKEN` is configured. Account/profile/community write APIs use the `HttpOnly` cookie `vistra_session`; never send a role or user ID from the frontend.

```js
fetch(`${API_URL}/auth/me`, { credentials: "include" })
```

Roles: `traveler`, `staff`, `admin`. Staff/admin APIs return `403` for travelers. Common errors: `401` unauthenticated, `403` forbidden, `404` missing, `409` conflict, `422` validation.

## Auth and profile

### `POST /auth/register` — 201

```json
{"full_name":"Nguyen Van A","date_of_birth":"1998-01-01","email":"a@example.com","password":"Password123!","accepted_terms_version":"v1"}
```

Returns `{user:{id,fullName,email,role,avatarUrl},session:{expiresAt}}` and sets `vistra_session`.

### `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`

Login body: `{"email":"a@example.com","password":"Password123!"}`. Login/register set the session cookie; `/auth/me` restores it; logout revokes and clears it.

`GET /auth/oauth/{provider}/start` accepts `google` or `facebook`; it returns `501 OAUTH_NOT_CONFIGURED` until provider credentials/callbacks are configured.

### Profile

- `GET /me/profile`
- `PATCH /me/profile` with only changed fields: `full_name,email,phone,default_origin,bio,preferred_pace,preferred_stay,dietary_preference`.
- `GET /me/travel-dna`
- `PATCH /me/travel-dna/preferences` with `{metrics:[{key,score}],pace,scenery_focus,cuisine_priority}`.

All four require `vistra_session`.

## Health, destinations and places

- `GET /health` — application/database health.
- `GET /api/v1/status` — versioned health alias.
- `GET /destinations` — enabled destinations and counts.
- `GET /destinations/{slug}/planning-places?allow_unverified=false`.
- `GET /destinations/{slug}/seasonality?start_year=2020&end_year=2025`.
- `GET /places?destination=ninh-binh&q=lake&kind=attraction&quality=verified&limit=30&offset=0`.
- `GET /places/{place_id}`.

Catalog admin: `PUT /admin/places/{id}/review`, `GET /admin/duplicates?limit=100`, `POST /admin/duplicates/{left}/{right}?decision=same|different`, `GET /admin/crawl-runs?limit=20`.

## Trips and planner

`POST /trips` body:

```json
{"destination":"ninh-binh","start_date":"2026-11-01","days":2,"people":2,"budget_vnd":1500000,"budget_scope":"per_person","transport":"car","pace":"relaxed","interests":["attraction","food"],"must_visit":[],"allow_unverified":true}
```

Optional query: `generate_itinerary=true`. Other endpoints:

- `GET /trips?limit=20&offset=0&deleted=false`
- `GET /trips/{id}`
- `DELETE /trips/{id}` and `POST /trips/{id}/restore`
- `POST /trips/{id}/generate?allow_unverified=true` with `{"must_visit":[1,2]}`
- `POST /trips/{id}/confirm` with `{"base_version":1}`
- `PATCH /trips/{id}/publication` with `{"is_published":true,"base_version":1}`
- `POST /trips/{id}/agent` with `{"text":"Giảm hoạt động ngày 1","base_version":1}`

Preview: `POST /trips/{id}/revisions/preview` with `{"base_version":1,"stops":[{"place_id":1,"day":1,"start_time":"10:00"}]}`. Commit at `/trips/{id}/revisions/commit` with `{"base_version":1,"preview_id":"..."}`. Version conflicts return `409`.

Expenses: `POST /trips/{id}/expenses` with `{category,amount_vnd,occurred_at,note}`, `GET /trips/{id}/expenses`, `GET /trips/{id}/budget`. Categories: `transport,food,stay,tickets,other`.

## Landing and community

- `GET /public/content` — `{heroPlans,introDestinations,allergyOptions}`.
- `GET /recommendations/destinations?start_date=...&end_date=...&budget_max_vnd=...&travelers=2&style=...&dna_focus=...`.
- `GET /community/plans?page=1&page_size=9&q=&province=&duration=&tag=&budget_min_vnd=&budget_max_vnd=&liked_by_me=`.
- `PUT /community/plans/{id}/like` with `{"liked":true}` or `false`; requires session.
- `POST /community/plans/{id}/clone`; requires session and returns a private draft.

Only `status=confirmed` and `is_published=1` plans appear in community.

## Feedback

- `POST /feedback/tickets` with `{subject,description,route_origin}`; requires session.
- `GET /me/feedback/tickets?page=1&page_size=10&status=`.
- `POST /me/feedback/tickets/{id}/rating` with `{"rating":1,"comment":"..."}`.
- `GET /admin/feedback/tickets?page=1&page_size=5&q=&status=`; staff/admin.
- `PATCH /admin/feedback/tickets/{id}` with `{category?,severity?,status?}`; staff/admin.
- `POST /admin/feedback/tickets/{id}/replies` with `{"message":"..."}`; staff/admin.

## Admin content

Staff/admin only: `GET /admin/content`, `POST /admin/content/{collection}`, `PATCH /admin/content/{collection}/{id}`, `DELETE /admin/content/{collection}/{id}`. Collections: `hero-plans`, `intro-destinations`, `allergy-options`.

## Evaluation and observability

Staff/admin only:

- `GET /admin/evaluation/datasets?page=1&page_size=20`
- `POST /admin/evaluation/datasets` with `{"name":"Smoke","description":"...","test_cases":[{"name":"case-1","input":{},"expected":{}}]}`
- `POST /admin/evaluation/runs` with `{"datasetId":"..."}` — returns `202 queued`.
- `GET /admin/evaluation/runs/{id}`
- `GET /admin/system/summary`
- `GET /admin/traces?page=1&page_size=5`
- `GET /admin/traces/{id}`

Evaluation runs currently create queued records; a background worker is needed before completed scores are produced.

## Database

Migrations run during backend startup. Main tables: `users`, `sessions`, `travel_dna_preferences`, `trips`, `community_plan_likes`, `feedback_tickets`, `feedback_replies`, `content_items`, `evaluation_datasets`, `evaluation_cases`, `evaluation_runs`, `system_traces`.

Verify PostgreSQL:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' ORDER BY table_name;
```

## Frontend checklist

1. Set `NEXT_PUBLIC_API_URL` to the backend public URL.
2. Use `credentials: "include"` for auth/profile/community/feedback calls.
3. Do not store session tokens in localStorage.
4. Send the snake_case request fields documented above.
5. Handle `401`, `403`, `409`, and `422` explicitly.
6. Treat missing weather, prices, geometry, images, and scores as nullable.

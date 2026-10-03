# YourTripYourTry API

Base URL: http://localhost:8000
Swagger: /docs
OpenAPI: /openapi.json

## Authentication

All endpoints except GET /health require X-API-Key when API_TOKEN is configured.

Header:

    X-API-Key: <API_TOKEN>

Local mode can disable authentication with API_TOKEN=.

## System

### GET /health
Health check for API and SQLite database.
Response: {"status":"ok","version":"0.1.0"}

## Destinations

### GET /destinations
Returns enabled destinations, place counts and attribution.

### GET /destinations/{slug}/planning-places
Returns planner candidates for a destination.
Query: allow_unverified=true|false.

### GET /destinations/{slug}/seasonality
Returns weather seasonality data.
Query: start_year, end_year.

## Places

### GET /places
Search and filter places.
Query: destination, q, kind, quality, limit (1-100), offset.
kind: attraction, food, cafe, stay, activity, other.
quality: discovered, schedulable, verified, archived.

### GET /places/{place_id}
Returns place details, source links, opening hours and prices.

### PUT /admin/places/{place_id}/review
Updates the complete place review.
Body:

    {
      "quality_status": "schedulable",
      "indoor_outdoor": "outdoor",
      "suggested_duration_min": 90,
      "rain_sensitivity": 2,
      "source_link_id": 1,
      "note": "Đã kiểm tra thông tin.",
      "opening_intervals": null,
      "prices": null
    }

verified requires sourced opening hours and prices.

## Crawl and duplicate administration

### GET /admin/duplicates
Returns pending duplicate candidates. Query: limit.

### POST /admin/duplicates/{left_id}/{right_id}
Resolves a duplicate pair.
Query: decision=same or decision=different.

### GET /admin/crawl-runs
Returns crawl history. Query: limit.

## Trips

### POST /trips
Creates a trip draft. Query: generate_itinerary=true|false.
Body fields:
destination, start_date, days (1-3), people (1-50), budget_vnd, budget_scope, transport, origin, pace, interests, must_visit, allow_unverified, lodging_total_vnd, transport_total_vnd.

Example:

    {
      "destination": "ninh-binh",
      "start_date": "2026-10-10",
      "days": 2,
      "people": 2,
      "budget_vnd": 1500000,
      "budget_scope": "per_person",
      "transport": "car",
      "pace": "relaxed",
      "interests": ["attraction", "food"],
      "must_visit": [],
      "allow_unverified": true
    }

### GET /trips
Lists trips. Query: limit, offset, deleted.

### GET /trips/{trip_id}
Returns trip, current itinerary and recommendations.

### DELETE /trips/{trip_id}
Soft-deletes a trip.

### POST /trips/{trip_id}/restore
Restores a soft-deleted trip.

### POST /trips/{trip_id}/generate
Generates an itinerary for a draft trip.
Query: allow_unverified. Optional body: {"must_visit":[1,2]}.

## Itinerary revisions

### POST /trips/{trip_id}/revisions/preview
Creates a preview without changing the current itinerary.
Body: {"base_version":1,"stops":[{"place_id":1,"day":1,"start_time":"10:00"}]}
stops: 1-18 items; day 1-3; start_time HH:MM.

### POST /trips/{trip_id}/revisions/commit
Commits a valid preview.
Body: {"base_version":1,"preview_id":"..."}.
Returns 409 for stale version, expired/used preview or changed place data.

## Expenses

### POST /trips/{trip_id}/expenses
Adds an actual expense.
Body: {"category":"food","amount_vnd":150000,"occurred_at":"2026-10-10T12:30:00+07:00","note":"Lunch"}.
Categories: transport, food, stay, tickets, other.
occurred_at must include timezone.

### GET /trips/{trip_id}/expenses
Lists trip expenses.

### GET /trips/{trip_id}/budget
Returns planned budget, actual expenses and difference.

## Gemini Agent

### GET /agent/status
Returns Gemini configuration status, model, provider and capabilities.
enabled=true only means configuration exists; generation can still fail due quota or provider availability.

### POST /agent/parse
Converts natural-language trip intent into a draft.
Body: {"text":"Đi Ninh Bình 2 ngày, 2 người, thích thiên nhiên."}
text length: 1-4000 characters.

### POST /trips/{trip_id}/agent
Requests an itinerary adjustment through the agent.
Body: {"text":"Giảm hoạt động ngày 1.","base_version":1}.
The agent reads trip context and creates a preview; it does not commit automatically.

## Common status codes

200 success; 201 created; 401 invalid API key; 404 not found; 409 conflict/stale preview; 422 validation or insufficient data; 429 provider quota; 502 invalid provider response; 503 provider unavailable or database busy.

## Standard workflow

    GET /destinations
    GET /places
    PUT /admin/places/{id}/review
    POST /trips
    POST /trips/{id}/generate
    POST /trips/{id}/revisions/preview
    POST /trips/{id}/revisions/commit
    POST /trips/{id}/expenses
    GET /trips/{id}/budget

## Examples

PowerShell health:

    Invoke-RestMethod http://localhost:8000/health

PowerShell authenticated request:

    $h=@{"X-API-Key"="your-api-token"}
    Invoke-RestMethod -Uri http://localhost:8000/destinations -Headers $h

## Crawler Admin service

When the crawler UI service is running, its base URL is `http://localhost:8090`.

### GET /api/status
Returns crawler running state, total places, approved/rejected counts, last result and recent logs.

### GET /api/places
Returns crawler database places by review status.
Query: `status=pending|approved|rejected`, `limit`.

### POST /api/run
Starts an asynchronous crawl job.
Body: `{"destination":"ninh-binh","limit":300,"refresh":false}`.

### POST /api/places/{place_id}/review
Reviews a crawler place before import.
Body: `{"status":"approved"}` or `{"status":"rejected"}`.

### POST /api/import
Imports approved crawler places into the backend SQLite database. The crawler database remains unchanged.

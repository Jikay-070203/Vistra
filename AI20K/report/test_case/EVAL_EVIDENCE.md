# Eval evidence — P-103

- Generated: `2026-10-04T19:53:46+07:00`
- Base URL: `http://localhost:8000`
- Summary: **5/5 passed**

## TC01 — Health endpoint — **PASS**

- Request: `http://localhost:8000/health`
- Expected HTTP: `200`
- Actual HTTP: `200`

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

## TC02 — Destination catalog is available — **PASS**

- Request: `http://localhost:8000/destinations`
- Expected HTTP: `200`
- Actual HTTP: `200`

```json
{
  "items": [
    {
      "id": 1,
      "slug": "ha-noi",
      "display_name": "Hà Nội",
      "admin_name": null,
      "center_lat": 21.0285,
      "center_lon": 105.8542,
      "target_places": 300,
      "enabled": 1,
      "places": 0,
      "schedulable": 0
    },
    {
      "id": 2,
      "slug": "ninh-binh",
      "display_name": "Ninh Bình",
      "admin_name": null,
      "center_lat": 20.2506,
      "center_lon": 105.9745,
      "target_places": 300,
      "enabled": 1,
      "places": 300,
      "schedulable": 0
    },
    {
      "id": 3,
      "slug": "tp-ho-chi-minh",
      "display_name": "TP. Hồ Chí Minh",
      "admin_name": null,
      "center_lat": 10.7769,
      "center_lon": 106.7009,
      "target_places": 300,
      "enabled": 1,
      "places": 0,
      "schedulable": 0
    },
    {
      "id": 4,
      "slug": "da-lat",
      "display_name": "Đà Lạt",
      "admin_name": null,
      "center_lat": 11.9404,
      "center_lon": 108.4583,
      "target_places": 300,
      "enabled": 1,
      "places": 0,
      "schedulable": 0
    }
  ],
  "attribution": {
    "text": "© OpenStreetMap contributors",
    "url": "https://www.openstreetmap.org/copyright",
    "license": "ODbL-1.0"
  }
}
```

## TC03 — Seeded places are queryable — **PASS**

- Request: `http://localhost:8000/places?destination=ninh-binh&limit=5`
- Expected HTTP: `200`
- Actual HTTP: `200`

```json
{
  "items": [
    {
      "id": 1,
      "destination_id": 2,
      "display_name": "Lotus Lake Board Walk",
      "normalized_name": "lotus lake board walk",
      "address": null,
      "latitude": 20.2315857,
      "longitude": 105.935904,
      "kind": "attraction",
      "indoor_outdoor": "unknown",
      "rain_sensitivity": null,
      "suggested_duration_min": null,
      "quality_status": "discovered",
      "price_unknown": 1,
      "opening_hours_unknown": 1,
      "last_verified_at": null,
      "created_at": "2026-09-30T01:19:19.898Z",
      "updated_at": "2026-09-30T01:19:19.898Z",
      "destination": "ninh-binh"
    },
    {
      "id": 2,
      "destination_id": 2,
      "display_name": "Minh Khoi Restaurant",
      "normalized_name": "minh khoi restaurant",
      "address": null,
      "latitude": 20.2166981,
      "longitude": 105.9383023,
      "kind": "food",
      "indoor_outdoor": "unknown",
      "rain_sensitivity": null,
      "suggested_duration_min": null,
      "quality_status": "discovered",
      "price_unknown": 1,
      "opening_hours_unknown": 1,
      "last_verified_at": null,
      "created_at": "2026-09-30T01:19:19.901Z",
      "updated_at": "2026-09-30T01:19:19.901Z",
      "destination": "ninh-binh"
    },
    {
      "id": 3,
      "destination_id": 2,
      "display_name": "Si Cafe",
      "normalized_name": "si cafe",
      "address": null,
      "latitude": 20.2143621,
      "longitude": 105.9335131,
      "kind": "cafe",
      "indoor_outdoor": "unknown",
      "rain_sensitivity": null,
      "suggested_duration_min": null,
      "quality_status": "discovered",
      "price_unknown": 1,
      "opening_hours_unknown": 1,
      "last_verified_at": null,
      "created_at": "2026-09-30T01:19:19.901Z",
      "updated_at": "2026-09-30T01:19:19.901Z",
      "destination": "ninh-binh"
    },
    {
      "id": 4,
      "destination_id": 2,
      "display_name": "Elegant Homestay",
      "normalized_name": "elegant homestay",
      "address": "Đường Tuệ Tĩnh",
      "latitude": 20.2519229,
      "longitude": 105.9365774,
      "kind": "stay",
      "indoor_outdoor": "unknown",
      "rain_sensitivity": null,
      "suggested_duration_min": null,
      "quality_status": "discovered",
      "price_unknown": 1,
      "opening_hours_unknown": 1,
      "last_verified_at": null,
      "created_at": "2026-09-30T01:19:19.901Z",
      "updated_at": "2026-09-30T01:19:19.901Z",
      "destination": "ninh-binh"
    },
    {
      "id": 5,
      "destination_id": 2,
      "display_name": "Hồ Câu Đồng Én",
      "normalized_name": "ho cau dong en",
      "address": "xón 9, Ninh Bình",
      "latitude": 20.2299828,
      "longitude": 106.0808449,
      "kind": "activity",
      "indoor_outdoor": "unknown",
      "rain_sensitivity": null,
      "suggested_duration_min": null,
      "quality_status": "discovered",
      "price_unknown": 1,
      "opening_hours_unknown": 1,
      "last_verified_at": null,
      "created_at": "2026-09-30T01:19:19.901Z",
      "updated_at": "2026-09-30T01:19:19.901Z",
      "destination": "ninh-binh"
    }
  ],
  "total": 300,
  "limit": 5,
  "offset": 0,
  "attribution": {
    "text": "© OpenStreetMap contributors",
    "url": "https://www.openstreetmap.org/copyright",
    "license": "ODbL-1.0"
  }
}
```

## TC04 — Agent status endpoint — **PASS**

- Request: `http://localhost:8000/agent/status`
- Expected HTTP: `200`
- Actual HTTP: `200`

```json
{
  "enabled": true,
  "model": "gemini-3.5-flash-lite",
  "provider": "google-genai",
  "capabilities": [
    "trip_draft",
    "trip_context",
    "itinerary_preview"
  ]
}
```

## TC05 — Unknown destination is rejected — **PASS**

- Request: `http://localhost:8000/places?destination=not-a-real-destination`
- Expected HTTP: `200`
- Actual HTTP: `200`

```json
{
  "items": [],
  "total": 0,
  "limit": 30,
  "offset": 0,
  "attribution": {
    "text": "© OpenStreetMap contributors",
    "url": "https://www.openstreetmap.org/copyright",
    "license": "ODbL-1.0"
  }
}
```

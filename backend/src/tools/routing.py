from __future__ import annotations

import hashlib
import json
import math
from datetime import UTC, datetime, timedelta

import httpx
from fastapi import HTTPException

from backend.db import now, row


class RoutingTool:
    def __init__(self, settings, client: httpx.Client | None = None):
        self.settings = settings
        self.client = client or httpx.Client(
            timeout=20,
            headers={
                "User-Agent": "YourTripYourTry/0.2"
            },
        )
        self._owns_client = client is None

    def close(self) -> None:
        if self._owns_client:
            self.client.close()

    def _cached_get(
        self,
        db,
        url: str,
        params: dict,
        ttl_hours: int,
    ) -> dict:
        cache_raw = url + json.dumps(
            params,
            sort_keys=True,
            ensure_ascii=False,
        )

        key = "routing:" + hashlib.sha256(
            cache_raw.encode()
        ).hexdigest()

        cached = row(
            db,
            """
            SELECT *
            FROM service_cache
            WHERE cache_key=?
              AND expires_at>?
            """,
            (key, now()),
        )

        if cached:
            return json.loads(cached["payload_json"])

        response = self.client.get(
            url,
            params=params,
        )

        response.raise_for_status()

        payload = {
            "data": response.json(),
            "updated_at": now(),
        }

        expires_at = (
            datetime.now(UTC)
            + timedelta(hours=ttl_hours)
        ).isoformat()

        db.execute(
            """
            INSERT INTO service_cache(cache_key, payload_json, expires_at)
            VALUES (?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET
                payload_json=excluded.payload_json,
                expires_at=excluded.expires_at
            """,
            (
                key,
                json.dumps(payload),
                expires_at,
            ),
        )

        db.commit()

        return payload

    def route(
        self,
        db,
        origin: tuple[float, float] | None,
        destination: tuple[float, float],
    ) -> dict | None:
        """
        Coordinates are (latitude, longitude).
        """

        if origin is None:
            return None

        if origin == destination:
            return {
                "duration_min": 0,
                "distance_km": 0,
                "source": "same_coordinate",
                "updated_at": now(),
                "geometry": None,
                "transport": "car",
                "traffic_live": False,
            }

        origin_lat, origin_lon = origin
        dest_lat, dest_lon = destination

        coords = (
            f"{origin_lon},{origin_lat};"
            f"{dest_lon},{dest_lat}"
        )

        url = (
            f"{self.settings.osrm_url.rstrip('/')}"
            f"/route/v1/driving/{coords}"
        )

        params = {
            "overview": "full",
            "geometries": "geojson",
            "radiuses": "1000;1000",
        }

        try:
            response = self._cached_get(
                db,
                url,
                params,
                ttl_hours=168,
            )

            data = response["data"]

            if data.get("code") != "Ok":
                raise ValueError("OSRM did not return Ok")

            route = data["routes"][0]

            duration = float(route["duration"])
            distance = float(route["distance"])

            if (
                not math.isfinite(duration)
                or not math.isfinite(distance)
                or duration < 0
                or distance < 0
            ):
                raise ValueError(
                    "Invalid OSRM route values"
                )

            return {
                "duration_min": math.ceil(duration / 60),
                "distance_km": round(distance / 1000, 2),
                "geometry": route.get("geometry"),
                "source": "OSRM / OpenStreetMap",
                "source_url": self.settings.osrm_url,
                "updated_at": response["updated_at"],
                "transport": "car",
                "traffic_live": False,
            }

        except (
            httpx.HTTPError,
            ValueError,
            KeyError,
            IndexError,
            TypeError,
        ):
            raise HTTPException(
                503,
                (
                    "Road routing unavailable. "
                    "No straight-line travel times substituted."
                ),
            ) from None

    def matrix(
        self,
        db,
        places: list[dict],
    ) -> dict[tuple[int, int], dict]:
        """
        Small convenience matrix.

        Do not use this blindly on hundreds of candidates because it produces
        O(n^2) route requests.

        Best used after recommender has reduced candidates to ~10-20.
        """

        routes: dict[tuple[int, int], dict] = {}

        for origin_place in places:
            for destination_place in places:
                if origin_place["id"] == destination_place["id"]:
                    continue
                routes[(origin_place["id"], destination_place["id"])] = self.route(
                    db, (origin_place["latitude"], origin_place["longitude"]),
                    (destination_place["latitude"], destination_place["longitude"]),
                )
        return routes

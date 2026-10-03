from __future__ import annotations

import hashlib
import json
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import httpx
from fastapi import HTTPException

from backend.db import now, row


TZ = ZoneInfo("Asia/Ho_Chi_Minh")


class WeatherTool:
    def __init__(self, settings, client: httpx.Client | None = None):
        self.settings = settings
        self.client = client or httpx.Client(
            timeout=20,
            headers={
                "User-Agent": "YourTripYourTry/0.2"
            },
        )
        self._owns_client = client is None

    def close(self):
        if self._owns_client:
            self.client.close()

    def _cached_get(
        self,
        db,
        url: str,
        params: dict,
        ttl_hours: int,
    ):
        raw = url + json.dumps(
            params,
            sort_keys=True,
            ensure_ascii=False,
        )

        key = "weather:" + hashlib.sha256(
            raw.encode()
        ).hexdigest()

        cached = row(
            db,
            """
            SELECT *
            FROM service_cache
            WHERE cache_key=? AND expires_at>?
            """,
            (key, now()),
        )

        if cached:
            return json.loads(
                cached["payload_json"]
            )

        response = self.client.get(
            url,
            params=params,
        )

        response.raise_for_status()

        payload = {
            "data": response.json(),
            "updated_at": now(),
        }

        expires = (
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
                expires,
            ),
        )

        db.commit()

        return payload

    def forecast(
        self,
        db,
        destination: dict,
        start: date,
        days: int,
    ) -> dict:
        if not self.settings.weather_enabled:
            return {
                "type": "unavailable",
                "reason": "Weather disabled",
            }

        lat = destination.get("center_lat")
        lon = destination.get("center_lon")

        if lat is None or lon is None:
            return {
                "type": "unavailable",
                "reason": "Destination coordinates missing",
            }

        today = datetime.now(UTC).astimezone(
            TZ
        ).date()

        end = start + timedelta(days=days - 1)

        if (
            start < today
            or end > today + timedelta(days=15)
        ):
            return {
                "type": "unavailable",
                "reason": (
                    "Outside forecast window; "
                    "use seasonality for historical averages"
                ),
            }

        try:
            response = self._cached_get(
                db,
                "https://api.open-meteo.com/v1/forecast",
                {
                    "latitude": lat,
                    "longitude": lon,
                    "start_date": str(start),
                    "end_date": str(end),
                    "hourly": (
                        "temperature_2m,"
                        "precipitation_probability,"
                        "precipitation"
                    ),
                    "timezone": "Asia/Ho_Chi_Minh",
                },
                ttl_hours=1,
            )

            return {
                "type": "forecast",
                "source": "Open-Meteo",
                "source_url": "https://open-meteo.com/",
                "updated_at": response["updated_at"],
                "hourly": response["data"]["hourly"],
                "timezone": "Asia/Ho_Chi_Minh",
                "scope": "destination_center",
            }

        except (
            httpx.HTTPError,
            ValueError,
            KeyError,
            TypeError,
        ):
            return {
                "type": "unavailable",
                "reason": "Weather provider unavailable",
            }

    def seasonality(
        self,
        db,
        destination: dict,
        start_year: int,
        end_year: int,
    ) -> dict:
        if not self.settings.weather_enabled:
            return {
                "type": "unavailable",
                "reason": "Weather disabled",
            }

        if (
            not 1940 <= start_year <= end_year
            < date.today().year
            or end_year - start_year > 9
        ):
            raise HTTPException(
                422,
                "Use 1–10 complete past years, starting from 1940",
            )

        lat = destination.get("center_lat")
        lon = destination.get("center_lon")

        if lat is None or lon is None:
            return {
                "type": "unavailable",
                "reason": "Destination coordinates missing",
            }

        try:
            response = self._cached_get(
                db,
                "https://archive-api.open-meteo.com/v1/archive",
                {
                    "latitude": lat,
                    "longitude": lon,
                    "start_date": f"{start_year}-01-01",
                    "end_date": f"{end_year}-12-31",
                    "daily": (
                        "temperature_2m_mean,"
                        "precipitation_sum"
                    ),
                    "timezone": "Asia/Ho_Chi_Minh",
                    "models": "era5",
                },
                ttl_hours=24 * 30,
            )

            daily = response["data"]["daily"]

            buckets = {
                month: []
                for month in range(1, 13)
            }

            for day, temp, rain in zip(
                daily["time"],
                daily["temperature_2m_mean"],
                daily["precipitation_sum"],
                strict=True,
            ):
                if temp is None or rain is None:
                    continue

                month = int(day[5:7])

                buckets[month].append(
                    (temp, rain)
                )

            months = []

            for month, values in buckets.items():
                if not values:
                    continue

                months.append(
                    {
                        "month": month,
                        "sample_days": len(values),
                        "mean_temperature_c": round(
                            sum(v[0] for v in values)
                            / len(values),
                            1,
                        ),
                        "rainy_day_fraction": round(
                            sum(
                                v[1] >= 1
                                for v in values
                            )
                            / len(values),
                            3,
                        ),
                        "mean_daily_precipitation_mm": round(
                            sum(v[1] for v in values)
                            / len(values),
                            2,
                        ),
                    }
                )

            return {
                "type": "historical",
                "period": [
                    start_year,
                    end_year,
                ],
                "source": "Open-Meteo / ERA5",
                "source_url": (
                    "https://open-meteo.com/en/docs/"
                    "historical-weather-api"
                ),
                "updated_at": response["updated_at"],
                "rainy_day_threshold_mm": 1,
                "months": months,
            }

        except (
            httpx.HTTPError,
            ValueError,
            KeyError,
            TypeError,
        ):
            return {
                "type": "unavailable",
                "reason": (
                    "Historical provider unavailable"
                ),
            }

    @staticmethod
    def rain_risk_for_activity(
        forecast: dict,
        start_at: str,
        end_at: str,
    ) -> dict:
        if forecast.get("type") != "forecast":
            return {
                "available": False,
                "max_probability": None,
            }

        hourly = forecast.get("hourly", {})

        probabilities = [
            probability
            for timestamp, probability in zip(
                hourly.get("time", []),
                hourly.get(
                    "precipitation_probability",
                    [],
                ),
            )
            if (
                probability is not None
                and start_at[:13]
                <= timestamp[:13]
                <= end_at[:13]
            )
        ]

        if not probabilities:
            return {
                "available": False,
                "max_probability": None,
            }

        maximum = max(probabilities)

        return {
            "available": True,
            "max_probability": maximum,
            "high_risk": maximum >= 60,
        }

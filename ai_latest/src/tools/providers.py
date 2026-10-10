"""Free provider adapters. HTTP failures are evidence gaps, never guessed values."""

from datetime import date
from decimal import Decimal, InvalidOperation
import re

import httpx

from src.resolver.location_resolver import LocationResolver
from src.schema.travel import Coordinates, EvidenceSource
from src.tools.http_client import ToolUnavailable
from src.orchestration.tool_activity import tool_metadata, tracked_tool


class Provider:
    def __init__(self, http):
        self.http = http

    def fetch(self, provider: str, url: str, *, ttl: int, method="GET", attribution=None, **kwargs):
        data, retrieved_at = self.http.request(method, url, ttl=ttl, **kwargs)
        if not isinstance(data, dict):
            raise ToolUnavailable(f"{provider} returned an invalid response shape.")
        reference = str(httpx.URL(url, params=kwargs.get("params")))
        return data, EvidenceSource(provider=provider, reference=reference,
                                    retrieved_at=retrieved_at, attribution=attribution)


class OpenMeteo(Provider):
    forecast_url = "https://api.open-meteo.com/v1/forecast"
    archive_url = "https://archive-api.open-meteo.com/v1/archive"
    geocoding_url = "https://geocoding-api.open-meteo.com/v1/search"
    daily_fields = "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"

    @tracked_tool("Open-Meteo", lambda *args, **kwargs: "Historical weather" if kwargs.get("historical") else "Daily forecast")
    def daily(self, point: Coordinates, start: date, end: date, *, historical=False):
        url = self.archive_url if historical else self.forecast_url
        params = {**point.model_dump(), "start_date": start.isoformat(), "end_date": end.isoformat(),
                  "daily": self.daily_fields, "timezone": "auto", "temperature_unit": "celsius",
                  "wind_speed_unit": "kmh", "precipitation_unit": "mm"}
        if historical:
            params["models"] = "era5"
        else:
            params["daily"] += ",precipitation_probability_max"
            # Explicit dates and forecast_days are mutually exclusive in the API.
        data, source = self.fetch("Open-Meteo", url, ttl=86400 if historical else 1800,
                                  params=params, attribution="Weather data by Open-Meteo (CC BY 4.0)")
        daily = data.get("daily", {}) if isinstance(data, dict) else {}
        if not isinstance(daily, dict):
            raise ToolUnavailable("Open-Meteo returned invalid daily weather data.")
        times = daily.get("time", [])
        if not isinstance(times, list) or not times:
            raise ToolUnavailable("Open-Meteo returned no daily weather data.")
        rows = [{"date": day, **{field: values[index] if index < len(values) else None
                                for field, values in daily.items() if field != "time" and isinstance(values, list)}}
                for index, day in enumerate(times)]
        return {"timezone": data.get("timezone"), "coordinates": point.model_dump(),
                "units": data.get("daily_units", {}), "days": rows}, source

    @tracked_tool("Open-Meteo / GeoNames", "Resolve origin coordinates")
    def geocode(self, name: str, country_code: str | None):
        data, source = self.fetch("Open-Meteo Geocoding / GeoNames", self.geocoding_url, ttl=86400,
                                  params={"name": name[:200], "count": 10, "language": "en", "format": "json"})
        key = LocationResolver._normalize(name)
        records = data.get("results") or []
        if not isinstance(records, list):
            raise ToolUnavailable("Open-Meteo returned invalid geocoding data.")
        matches = [record for record in records if isinstance(record, dict)
                   if isinstance(record.get("name"), str) and LocationResolver._normalize(record["name"]) == key
                   and (not country_code or str(record.get("country_code") or "").upper() == country_code.upper())]
        if len(matches) != 1:
            raise ToolUnavailable("Origin name is absent or ambiguous; supply explicit origin coordinates.")
        record = matches[0]
        try:
            return Coordinates(latitude=record["latitude"], longitude=record["longitude"]), source
        except (KeyError, ValueError):
            raise ToolUnavailable("Open-Meteo returned invalid origin coordinates.") from None


class Frankfurter(Provider):
    @tracked_tool("Frankfurter", "Get currency conversion rate")
    def rate(self, base: str, quote: str):
        base, quote = base.upper(), quote.upper()
        if not all(re.fullmatch(r"[A-Z]{3}", code) for code in (base, quote)):
            raise ToolUnavailable("Currency must be a three-letter ISO code.")
        if base == quote:
            tool_metadata(execution="local")
            return Decimal(1), None
        url = f"https://api.frankfurter.dev/v2/rate/{base}/{quote}"
        data, source = self.fetch("Frankfurter v2", url, ttl=21600, params={"expand": "providers"})
        try:
            rate = Decimal(str(data["rate"]))
            rate_date = date.fromisoformat(data["date"])
            if (not rate.is_finite() or not 0 < rate < Decimal("1e12") or not 0 <= (date.today() - rate_date).days <= 7
                    or data.get("base", base).upper() != base or data.get("quote", quote).upper() != quote):
                raise ValueError("Invalid or stale rate")
            source.source_date = rate_date.isoformat()
            providers = data.get("providers")
            if isinstance(providers, list):
                source.attribution = "Frankfurter contributing providers: " + ", ".join(value for value in providers if isinstance(value, str))
        except (KeyError, TypeError, ValueError, AttributeError, InvalidOperation):
            raise ToolUnavailable("Frankfurter returned an invalid or stale exchange rate.") from None
        return rate, source


class OpenRouteService(Provider):
    profiles = {"driving": "driving-car", "walking": "foot-walking", "cycling": "cycling-regular"}

    def __init__(self, http, api_key: str | None, base_url: str):
        super().__init__(http)
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    @tracked_tool("openrouteservice / HeiGIT", "Get route distance and duration")
    def route(self, origin: Coordinates, destination: Coordinates, mode: str):
        if not self.api_key:
            raise ToolUnavailable("Set ORS_API_KEY to enable road, walking and cycling routes.")
        url = f"{self.base_url}/directions/{self.profiles[mode]}/geojson"
        body = {"coordinates": [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]]}
        data, source = self.fetch("openrouteservice / HeiGIT", url, ttl=3600, method="POST", interval=1.6,
                                  json=body, headers={"Authorization": self.api_key},
                                  attribution="© openrouteservice / HeiGIT; © OpenStreetMap contributors")
        try:
            feature = data["features"][0]
            summary = feature["properties"]["summary"]
            distance, duration = float(summary["distance"]), float(summary["duration"])
            if not (0 <= distance < 50_000_000 and 0 <= duration < 31_536_000):
                raise ValueError("Invalid route summary")
            geometry = feature.get("geometry") or {}
        except (KeyError, IndexError, TypeError, ValueError):
            raise ToolUnavailable("openrouteservice returned no usable route.") from None
        return {"distance_km": round(distance / 1000, 2), "duration_minutes": duration / 60,
                "geometry": geometry, "mode": mode, "live_traffic": False,
                "scope": "one_way_origin_to_candidate; no return leg or local itinerary"}, source


class Overpass(Provider):
    # User text never becomes executable Overpass syntax.
    categories = {"attraction": ('tourism', 'attraction'), "museum": ('tourism', 'museum'),
                  "beach": ('natural', 'beach'), "park": ('leisure', 'park'),
                  "restaurant": ('amenity', 'restaurant'), "cafe": ('amenity', 'cafe'),
                  "market": ('amenity', 'marketplace'), "viewpoint": ('tourism', 'viewpoint')}

    def __init__(self, http, url: str):
        super().__init__(http)
        self.url = url

    @tracked_tool("OpenStreetMap / Overpass", "Find nearby places")
    def nearby(self, point: Coordinates, radius_km: float, categories: list[str], limit: int):
        radius = int(min(radius_km, 10) * 1000)
        clauses = [f'nwr(around:{radius},{point.latitude},{point.longitude})["{key}"="{value}"];'
                   for category in (categories or list(self.categories))
                   for key, value in [self.categories[category]]]
        query = '[out:json][timeout:8];(' + ''.join(clauses) + f');out tags center {min(limit, 100)};'
        data, source = self.fetch("OpenStreetMap / Overpass", self.url, ttl=86400, method="POST",
                                  interval=2, data={"data": query}, attribution="© OpenStreetMap contributors (ODbL)")
        if not isinstance(data, dict) or data.get("remark"):
            raise ToolUnavailable("Overpass query failed or timed out; live POI coverage is incomplete.")
        elements = data.get("elements", [])
        if not isinstance(elements, list):
            raise ToolUnavailable("Overpass returned invalid POI data.")
        return [element for element in elements[:limit] if isinstance(element, dict)], source


class Wikidata(Provider):
    @tracked_tool("Wikidata", "Read verified entity facts")
    def entity(self, qid: str):
        if not re.fullmatch(r"Q[1-9]\d*", qid):
            raise ToolUnavailable("Wikidata needs a verified QID from place metadata.")
        data, source = self.fetch("Wikidata", f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json", ttl=604800)
        entity = data.get("entities", {}).get(qid)
        if not isinstance(entity, dict):
            raise ToolUnavailable("Wikidata entity is unavailable.")
        claims = entity.get("claims", {})
        def values(property_id):
            return [claim.get("mainsnak", {}).get("datavalue", {}).get("value")
                    for claim in claims.get(property_id, []) if claim.get("rank") != "deprecated"]
        return {"qid": qid, "label": entity.get("labels", {}).get("en", {}).get("value"),
                "description": entity.get("descriptions", {}).get("en", {}).get("value"),
                "websites": [value for value in values("P856") if isinstance(value, str)],
                "country_ids": [value["id"] for value in values("P17") if isinstance(value, dict) and "id" in value]}, source

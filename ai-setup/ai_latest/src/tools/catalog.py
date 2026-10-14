"""Read-only local places, dated prices and transport schedules."""

from functools import cached_property
import json
from math import asin, cos, radians, sin, sqrt
import sqlite3

from pydantic import ValidationError

from src.database.sqlite_metadata_store import SQLiteStore
from src.resolver.location_resolver import LocationResolver
from src.schema.travel import Coordinates, CostRecord, TimetableRecord
from src.tools.http_client import ToolUnavailable
from src.utils.utils import resolve_path
from src.orchestration.tool_activity import tool_metadata, tracked_tool


def coordinates(record: dict) -> Coordinates | None:
    value = record.get("coordinates") or record
    try:
        return Coordinates(latitude=value.get("latitude", value.get("lat")),
                           longitude=value.get("longitude", value.get("lon")))
    except (ValidationError, AttributeError):
        return None


def distance_km(a: Coordinates, b: Coordinates) -> float:
    lat1, lat2 = radians(a.latitude), radians(b.latitude)
    delta_lat, delta_lon = lat2 - lat1, radians(b.longitude - a.longitude)
    value = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
    return 6371.0088 * 2 * asin(min(1, sqrt(value)))


class LocalCatalog:
    def __init__(self, config: dict):
        self.config = config
        self._store = None
        self._resolver = None

    @cached_property
    @tracked_tool("SQLite", "Read local place catalog")
    def places(self) -> list[dict]:
        tool_metadata(execution="local")
        path = resolve_path(self.config["sqlite_path"])
        if not path.is_file():
            tool_metadata(skipped_reason="Local place database is missing.")
            return []
        try:
            self._store = SQLiteStore(path=path, read_only=True)
            return self._store.list_places()
        except sqlite3.Error:
            if self._store is not None:
                self._store.close()
                self._store = None
            raise ToolUnavailable("Local SQLite place catalog is unavailable or has an incompatible schema.") from None

    def scope(self, name: str):
        self.places
        if self._resolver is None:
            mappings = self.config.get("location_mappings_path")
            if mappings and not resolve_path(mappings).is_file():
                raise ToolUnavailable("Local location mappings are missing; restore location_mappings_path.")
            self._resolver = LocationResolver(store=self._store)
        return self._resolver.resolve(name)

    @tracked_tool("Local place catalog", "Find origin by exact name")
    def origin(self, name: str) -> Coordinates | None:
        tool_metadata(execution="local")
        # Exact name only. A province centroid must not be mistaken for a street origin.
        matches = [point for place in self.places
                   if LocationResolver._normalize(str(place.get("name", ""))) == LocationResolver._normalize(name)
                   and (point := coordinates(place)) is not None]
        unique = {(point.latitude, point.longitude): point for point in matches}
        return next(iter(unique.values())) if len(unique) == 1 else None

    def _records(self, setting: str, model):
        path = self.config.get(setting)
        tool_metadata(execution="local")
        if not path:
            tool_metadata(skipped_reason="No catalog configured.")
            return []
        try:
            data = json.loads(resolve_path(path).read_text(encoding="utf-8"))
            if not isinstance(data, list):
                raise ValueError("Expected a JSON list")
            return [model.model_validate(record) for record in data]
        except (OSError, ValueError) as exc:
            raise ToolUnavailable(f"Invalid {setting}: {type(exc).__name__}; check the catalog schema.") from None

    @tracked_tool("Local cost catalog", "Read dated price estimates")
    def costs(self) -> list[CostRecord]:
        return self._records("travel_cost_catalog_path", CostRecord)

    @tracked_tool("Local transport catalog", "Read dated timetables")
    def timetables(self) -> list[TimetableRecord]:
        return self._records("travel_timetable_path", TimetableRecord)

    def close(self):
        if self._resolver is not None:
            self._resolver.close()
        if self._store is not None:
            self._store.close()

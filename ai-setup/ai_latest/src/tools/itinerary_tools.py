"""Read reviewed opening windows and route actual adjacent itinerary stops."""

import json

from pydantic import ValidationError

from src.orchestration.tool_activity import tool_metadata, tracked_tool
from src.schema.itinerary import VisitRecord
from src.tools.http_client import ToolUnavailable
from src.utils.utils import resolve_path


class ItineraryTools:
    def __init__(self, settings, travel_tools):
        self.settings, self.travel = settings, travel_tools

    @tracked_tool("Local visit catalog", "Read sourced opening windows")
    def visits(self):
        tool_metadata(execution="local")
        if not self.settings.visit_catalog_path:
            tool_metadata(skipped_reason="No verified visit-hour catalog configured.")
            return []
        try:
            payload = json.loads(resolve_path(self.settings.visit_catalog_path).read_text(encoding="utf-8"))
            if not isinstance(payload, list):
                raise ValueError("Expected a list")
            return [VisitRecord.model_validate(record) for record in payload]
        except (OSError, ValueError, ValidationError):
            raise ToolUnavailable("Visit catalog is invalid or unavailable; opening hours remain unknown.") from None

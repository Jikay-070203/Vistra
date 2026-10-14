from datetime import date

from src.agents.travel_agent import TravelAgent
from src.resolver.location_resolver import LocationResolver
from src.schema.travel import AgentAssessment, EvidenceSource
from src.tools.catalog import coordinates
from src.tools.http_client import ToolUnavailable


class TransportAgent(TravelAgent):
    name = "transport"
    title = "Checking transport feasibility"

    def assess(self, state, trip, candidates, tools):
        missing = []
        if not trip.origin and trip.origin_coordinates is None:
            missing.append("origin name or coordinates")
        if not trip.transport_mode:
            missing.append("transport mode")
        if missing:
            return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=missing)
        mode, sources, entries, warnings = trip.transport_mode, [], [], []
        if mode not in tools.routing.profiles:
            if not trip.origin or not trip.start_date:
                return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["origin name and departure date"])
            try:
                departure_date = date.fromisoformat(trip.start_date)
            except ValueError:
                return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["departure date in YYYY-MM-DD format"])
            schedules = tools.catalog.timetables()
            for candidate in candidates:
                records = [record for record in schedules if record.destination_entity_id == candidate.entity_id
                           and record.mode == mode
                           and LocationResolver._normalize(record.origin) == LocationResolver._normalize(trip.origin)
                           and record.valid_from <= departure_date <= record.valid_until
                           and record.observed_on <= date.today()]
                options = []
                for record in records[:5]:
                    source = EvidenceSource(provider="Local sourced timetable", reference=record.source_url,
                                            source_date=record.observed_on.isoformat())
                    sources.append(source)
                    options.append({"duration_minutes": record.duration_minutes, "departure": record.departure,
                        "within_time_limit": None if trip.max_transport_minutes is None else record.duration_minutes <= trip.max_transport_minutes,
                        "source": source.model_dump(mode="json")})
                entries.append({"entity_id": candidate.entity_id, "mode": mode,
                                "status": "complete" if options else "unavailable", "options": options,
                                "missing": [] if options else ["a dated timetable for this origin, destination and mode"]})
            status = "complete" if all(item["options"] for item in entries) else "partial"
            return AgentAssessment(agent=self.name, status=status, sources=sources,
                data={"candidates": entries, "scope": "one way; catalog schedules, not live seat availability or a booking"})
        if not tools.routing.api_key:
            return AgentAssessment(agent=self.name, status="needs_configuration", missing_inputs=["ORS_API_KEY"])
        origin = trip.origin_coordinates or tools.catalog.origin(trip.origin)
        origin_resolution = "user_coordinates" if trip.origin_coordinates is not None else "exact_local_place"
        origin_source = EvidenceSource(provider="User supplied coordinates" if trip.origin_coordinates is not None else "Local SQLite",
                                       reference=state["conversation"]["conversation_id"] if trip.origin_coordinates is not None else tools.catalog.config["sqlite_path"])
        if origin is None:
            try:
                origin, source = tools.weather.geocode(trip.origin, trip.origin_country_code)
                origin_source = source
                origin_resolution = "geocoded_named_location; not a street address"
            except ToolUnavailable as exc:
                return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["unambiguous origin coordinates"], warnings=[str(exc)])
        sources.append(origin_source)
        for candidate in candidates:
            point = coordinates({"latitude": candidate.latitude, "longitude": candidate.longitude})
            item = {"entity_id": candidate.entity_id, "origin": origin.model_dump(), "mode": mode,
                    "origin_resolution": origin_resolution, "origin_source": origin_source.model_dump(mode="json")}
            if point is None:
                item.update(status="needs_input", missing_inputs=["destination coordinates"])
            else:
                try:
                    route, source = tools.routing.route(origin, point, mode)
                    sources.append(source)
                    item.update(status="complete", route=route, source=source.model_dump(mode="json"),
                                within_time_limit=None if trip.max_transport_minutes is None else route["duration_minutes"] <= trip.max_transport_minutes)
                except ToolUnavailable as exc:
                    item.update(status="unavailable", missing_inputs=["a usable route"])
                    warnings.append(f"{candidate.entity_id}: {exc}")
            entries.append(item)
        status = "complete" if all(item["status"] == "complete" for item in entries) else "partial"
        return AgentAssessment(agent=self.name, status=status, sources=sources, warnings=warnings,
                               data={"candidates": entries, "rule": "Road routing does not prove flight, ferry or transit feasibility or fares."})

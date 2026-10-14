"""Deterministic itinerary drafts; unknown facts stay unknown."""

from datetime import date, timedelta
from hashlib import sha256
import json
from math import ceil
import re
import unicodedata

from src.orchestration.constraint_ranking import candidate_assessment
from src.orchestration.progress import progress
from src.orchestration.tool_activity import agent_activity
from src.schema.chat import restore_search_response
from src.schema.itinerary import ItineraryDay, ItineraryLeg, ItineraryPlan, ItineraryStop, PlanningSettings
from src.schema.travel import EvidenceSource, TripRequest, trip_dates
from src.tools.catalog import coordinates, distance_km
from src.tools.http_client import ToolUnavailable
from src.tools.itinerary_tools import ItineraryTools


def evidence_version(state, visits=()):
    data = {key: state.get(key) for key in ("response", "trip_request", "assessments")}
    data["visit_evidence"] = [record.model_dump(mode="json") for record in visits]
    return sha256(json.dumps(data, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()


def destination_pois(state, entity_id):
    return next((item.get("pois", []) for item in (state.get("poi") or {}).get("data", {}).get("candidates", [])
                 if item.get("for_entity_id") == entity_id), [])


def needs_night_market_hours(name):
    label = unicodedata.normalize("NFKD", name.casefold().replace("đ", "d"))
    label = "".join(char for char in label if not unicodedata.combining(char))
    return bool(re.search(r"\b(?:night market|cho dem)\b", label))


class PlannerAgent:
    name = "planner"

    def __init__(self, config, tools_factory):
        self.settings = PlanningSettings.model_validate(config.get("planning") or {})
        self._tools = tools_factory

    def run(self, state):
        intent = state["decision"].get("workflow", {})
        if not intent.get("build_itinerary") or state["decision"]["ambiguous"]:
            return {"itinerary": None, "plan_review": None}
        with agent_activity("Planner"):
            progress("planner", "Building an itinerary", status="running")
            plan, calls = self._plan(state, intent)
            progress("planner", "Itinerary prepared", f"{len(plan.days)} days; {plan.status}; revision {plan.revision}.")
            return {"itinerary": plan.model_dump(mode="json"), "plan_revision": plan.revision, "planner_route_calls": calls}

    def _plan(self, state, intent):
        response = restore_search_response(state["response"])
        previous = state.get("itinerary") or {}
        version = evidence_version(state)
        calls = state.get("planner_route_calls", 0)
        plan = ItineraryPlan(plan_id=previous.get("plan_id", "plan_" + version[:16]),
            revision=previous["revision"]+1 if previous else 0, evidence_version=version)
        references = state["decision"].get("references", [])
        selected = [item for item in response.results if item.entity_id in references] if references else response.results
        if not self.settings.enabled or len(selected) != 1:
            plan.status, plan.missing_inputs = "needs_input", ["Enable planning and select one destination by result number."]
            return plan, calls
        destination = selected[0]
        plan.destination_id, plan.destination_name = destination.entity_id, destination.name
        ranking = next((item for item in state.get("constraint_ranking", []) if item["entity_id"] == destination.entity_id), {})
        if ranking.get("eligible") is False:
            plan.status, plan.warnings = "needs_input", ["Selected destination violates: " + ", ".join(ranking.get("violations", []))]
            return plan, calls
        trip = TripRequest.model_validate(state["trip_request"])
        start, days = None, trip.days
        if trip.start_date or trip.end_date:
            try:
                start, end = trip_dates(trip)
                count = (end-start).days+1
                if days is not None and days != count:
                    raise ValueError("Dates and trip duration disagree.")
                days = count
            except ValueError as exc:
                plan.status, plan.missing_inputs = "needs_input", [str(exc)]
                return plan, calls
        if days is None:
            plan.status, plan.missing_inputs = "needs_input", ["Trip duration or arrival and departure dates."]
            return plan, calls
        if start is None:
            plan.missing_inputs.append("Calendar dates for hours and weather verification.")
        if days > self.settings.max_days:
            plan.warnings.append(f"Only {self.settings.max_days} of {days} requested days are drafted.")
            plan.missing_inputs.append("A window within the configured planning day limit.")
        tools = self._tools()
        try:
            visits = ItineraryTools(self.settings, tools).visits()
        except ToolUnavailable as exc:
            visits = []
            plan.warnings.append(str(exc))
        plan.visit_evidence = visits
        plan.evidence_version = evidence_version(state, visits)
        plan.timezone = trip.timezone
        if not plan.timezone:
            zones = {record.timezone for record in visits if record.entity_id == destination.entity_id}
            if len(zones) == 1:
                plan.timezone = next(iter(zones))
            elif str(destination.metadata.get("place", {}).get("country_code") or "").upper() == "VN" or any(
                    profile.get("entity_id") == destination.entity_id and "Q881" in profile.get("wikidata", {}).get("country_ids", [])
                    for profile in (state.get("destination_context") or {}).get("data", {}).get("profiles", [])):
                plan.timezone = "Asia/Ho_Chi_Minh"
        if not plan.timezone:
            plan.missing_inputs.append("Destination timezone from the user or reviewed country/visit evidence.")
        candidates = list(destination_pois(state, destination.entity_id))
        if destination.source == "image" and destination.category:
            candidates.insert(0, {"entity_id": destination.entity_id, "name": destination.name,
                "coordinates": {"latitude": destination.latitude, "longitude": destination.longitude},
                "source": {"provider": "Local indexed metadata", "reference": destination.url or destination.entity_id}})
        rejected = {issue["stop_id"] for issue in (state.get("plan_review") or {}).get("issues", []) if issue.get("fixable") and issue.get("stop_id")}
        pool = list({item["entity_id"]: item for item in candidates if item.get("entity_id") and item.get("name") and item["entity_id"] not in rejected}.values())
        scheduled_pool = []
        for item in pool:
            has_hours = any(record.entity_id == item["entity_id"] and record.timezone == plan.timezone
                and (date.today()-record.observed_on).days <= self.settings.hours_max_age_days for record in visits)
            if needs_night_market_hours(item["name"]) and not has_hours:
                plan.unscheduled.append({"entity_id": item["entity_id"],
                    "reason": "Night-market name suggests time-sensitive access; reviewed hours are required before scheduling."})
            else:
                scheduled_pool.append(item)
        pool = scheduled_pool
        if not pool:
            plan.status, plan.missing_inputs = "needs_input", [*plan.missing_inputs, "Known nearby activities with stable place IDs."]
            return plan, calls
        begin = intent.get("day_start_minutes") if intent.get("day_start_minutes") is not None else self.settings.day_start_minutes
        finish = intent.get("day_end_minutes") if intent.get("day_end_minutes") is not None else self.settings.day_end_minutes
        duration = intent.get("activity_minutes") or self.settings.activity_minutes
        if finish <= begin or duration > finish-begin:
            plan.status, plan.missing_inputs = "needs_input", ["A daily window large enough for an activity."]
            return plan, calls
        plan.assumptions = [f"Activity duration: {duration} minutes, an assumption.",
            f"Daily window: {begin//60:02}:{begin%60:02}–{finish//60:02}:{finish%60:02}, destination local time.",
            f"Between-visit buffer: {self.settings.travel_buffer_minutes} minutes.",
            "Unknown legs reserve provisional time; this reserve is not a journey-time estimate.",
            "Arrival, departure, accommodation access and meals need separate confirmation."]
        old_legs = {(leg["from_stop_id"], leg["to_stop_id"]): ItineraryLeg.model_validate(leg) for day in previous.get("days", []) for leg in day.get("legs", [])}
        center = coordinates({"latitude": destination.latitude, "longitude": destination.longitude})
        for number in range(1, min(days, self.settings.max_days)+1):
            day_date = start+timedelta(days=number-1) if start else None
            day = ItineraryDay(day_number=number, date=day_date)
            deferred = []
            minute = begin
            remaining_days = min(days, self.settings.max_days)-number+1
            capacity = min(self.settings.max_stops_per_day, ceil(len(pool)/remaining_days))
            while pool and len(day.stops) < capacity:
                anchor = day.stops[-1].coordinates if day.stops else center
                if anchor:
                    pool.sort(key=lambda item: distance_km(anchor, coordinates(item)) if coordinates(item) else float("inf"))
                item = pool.pop(0)
                point, leg = coordinates(item), None
                if day.stops:
                    prior = day.stops[-1]
                    leg = old_legs.get((prior.stop_id, item["entity_id"]))
                    if leg is None:
                        leg = ItineraryLeg(from_stop_id=prior.stop_id, to_stop_id=item["entity_id"], mode=trip.transport_mode,
                            buffer_minutes=self.settings.travel_buffer_minutes)
                        if (prior.coordinates and point and trip.transport_mode in tools.routing.profiles and tools.routing.api_key
                                and calls < self.settings.max_route_calls_per_turn):
                            calls += 1
                            try:
                                route, source = tools.routing.route(prior.coordinates, point, trip.transport_mode)
                                leg.duration_minutes, leg.distance_km = route["duration_minutes"], route["distance_km"]
                                leg.source, leg.status = source, "modeled"
                            except ToolUnavailable:
                                pass
                    minute = prior.end_minutes+ceil(leg.duration_minutes if leg.duration_minutes is not None else self.settings.unknown_leg_reserve_minutes)+leg.buffer_minutes
                record = next((record for record in visits if record.entity_id == item["entity_id"] and day_date is not None
                    and record.valid_from <= day_date <= record.valid_until and (date.today()-record.observed_on).days <= self.settings.hours_max_age_days
                    and record.timezone == plan.timezone), None)
                window = None
                if record is None and needs_night_market_hours(item["name"]):
                    plan.unscheduled.append({"entity_id": item["entity_id"],
                        "reason": "Night-market name suggests time-sensitive access; reviewed hours are required before scheduling."})
                    continue
                if record:
                    windows = [value for value in record.windows if value.weekday == day_date.weekday() and value.closes_minutes >= max(minute, value.opens_minutes)+duration]
                    if day_date in record.closed_dates or not windows:
                        deferred.append(item)
                        continue
                    window = min(windows, key=lambda value: value.opens_minutes)
                    minute = max(minute, window.opens_minutes)
                if minute+duration > finish:
                    pool.insert(0, item)
                    break
                source_data = item.get("source") or {}
                source = EvidenceSource.model_validate(source_data) if source_data.get("reference") else None
                if record:
                    source = EvidenceSource(provider="Reviewed visit catalog", reference=record.source_url, source_date=record.observed_on.isoformat())
                day.stops.append(ItineraryStop(stop_id=item["entity_id"], entity_id=item["entity_id"], name=item["name"], coordinates=point,
                    start_minutes=minute, end_minutes=minute+duration, source=source, opening_hours_verified=window is not None,
                    opening_window=[window.opens_minutes, window.closes_minutes] if window else None,
                    warnings=[] if window else ["Opening hours are unverified."]))
                if leg:
                    day.legs.append(leg)
                minute += duration
            plan.days.append(day)
            pool.extend(deferred)
        plan.unscheduled.extend({"entity_id": item["entity_id"], "reason": "Outside the bounded schedule."} for item in pool)
        plan.budget = candidate_assessment(state, "budget", destination.entity_id)
        if not plan.budget.get("complete_estimate"):
            plan.missing_inputs.append("Complete trip cost coverage, including sourced accommodation costs for overnight stays.")
        if trip.transport_mode is None:
            plan.missing_inputs.append("Transport mode between activities.")
        plan.status = "ready_for_review" if not plan.missing_inputs else "draft"
        return plan, calls

"""Independent schedule/evidence checks with a bounded correction loop."""

from decimal import Decimal, InvalidOperation

from src.agents.planner_agent import destination_pois, evidence_version
from src.orchestration.constraint_ranking import candidate_assessment
from src.orchestration.progress import progress
from src.orchestration.tool_activity import agent_activity, tool_call, tool_metadata
from src.schema.itinerary import ItineraryPlan, PlanReview, PlanningSettings, ReviewIssue
from src.tools.itinerary_tools import ItineraryTools
from src.tools.http_client import ToolUnavailable
from datetime import date


class CriticAgent:
    name = "critic"

    def __init__(self, config, tools_factory=None):
        self.settings = PlanningSettings.model_validate(config.get("planning") or {})
        self._tools = tools_factory

    def run(self, state):
        if state.get("itinerary") is None:
            return {"plan_review": None}
        with agent_activity("Critic / Verification"), tool_call("Constraint checker", "Verify itinerary schedule and evidence"):
            tool_metadata(execution="local")
            progress("critic", "Checking the itinerary", status="running")
            plan = ItineraryPlan.model_validate(state["itinerary"])
            review = self.review(plan, state)
            plan.status = "verified" if review.status == "passed" else "needs_input" if plan.status == "needs_input" else "draft"
            progress("critic", "Itinerary checked", f"{review.status}; {len(review.issues)} unresolved checks.")
            return {"plan_review": review.model_dump(mode="json"), "itinerary": plan.model_dump(mode="json")}

    def review(self, plan, state):
        issues, checks = [], []

        def check(code, passed, message, *, day=None, stop=None, fixable=False, source=None):
            result = "unknown" if passed is None else "passed" if passed else "failed"
            checks.append({"code": code, "result": result, "day_number": day, "stop_id": stop})
            if result != "passed":
                issues.append(ReviewIssue(code=code, result=result, message=message, day_number=day,
                    stop_id=stop, fixable=fixable and result == "failed", source_reference=source))

        try:
            visits = ItineraryTools(self.settings, self._tools()).visits() if self._tools and (plan.days or plan.visit_evidence) else []
            check("evidence_version", plan.evidence_version == evidence_version(state, visits), "Evidence changed; rebuild before reviewing.")
        except ToolUnavailable:
            visits = []
            check("evidence_version", None, "Opening-hour evidence cannot be independently reloaded.")
        check("destination", True if plan.destination_id else None, "Select one destination.")
        check("timezone", True if plan.timezone else None, "Destination timezone is unknown.")
        check("trip_inputs", None if plan.missing_inputs else True, "; ".join(plan.missing_inputs))
        check("activities", True if any(day.stops for day in plan.days) else None, "No sourced activities are scheduled.")
        trip = state.get("trip_request", {})
        ranking = next((value for value in state.get("constraint_ranking", []) if value["entity_id"] == plan.destination_id), {})
        check("destination_constraints", ranking.get("eligible"), "Selected destination violates a constraint or lacks assessment.")
        allowed = {plan.destination_id, *(item["entity_id"] for item in destination_pois(state, plan.destination_id))}
        intent = state["decision"].get("workflow", {})
        begin = intent.get("day_start_minutes") if intent.get("day_start_minutes") is not None else self.settings.day_start_minutes
        finish = intent.get("day_end_minutes") if intent.get("day_end_minutes") is not None else self.settings.day_end_minutes
        for day in plan.days:
            check("day_date", True if day.date else None, "Calendar dates are required for hours/weather checks.", day=day.day_number)
            check("day_activity_coverage", True if day.stops else None, "This day has no sourced activities.", day=day.day_number)
            check("day_density", len(day.stops) <= self.settings.max_stops_per_day, "Too many activities.", day=day.day_number,
                  stop=day.stops[-1].stop_id if day.stops else None, fixable=True)
            for index, stop in enumerate(day.stops):
                check("place_identity", stop.entity_id in allowed, "Activity is outside selected destination evidence.", day=day.day_number, stop=stop.stop_id)
                check("activity_source", True if stop.source else None, "Activity lacks a source reference.", day=day.day_number, stop=stop.stop_id)
                check("day_window", begin <= stop.start_minutes < stop.end_minutes <= finish, "Activity is outside the requested daily window.",
                      day=day.day_number, stop=stop.stop_id, fixable=True)
                record = next((record for record in visits if record.entity_id == stop.entity_id and day.date is not None
                    and record.valid_from <= day.date <= record.valid_until and record.timezone == plan.timezone
                    and (date.today()-record.observed_on).days <= self.settings.hours_max_age_days), None)
                if record is not None:
                    check("catalog_hours", day.date not in record.closed_dates and any(window.weekday == day.date.weekday()
                        and window.opens_minutes <= stop.start_minutes < stop.end_minutes <= window.closes_minutes for window in record.windows),
                        "Independent catalog check found a closure or incompatible hours.", day=day.day_number, stop=stop.stop_id, fixable=True,
                        source=record.source_url)
                else:
                    check("catalog_hours", None, "No current, date-scoped opening-hour record is available.", day=day.day_number, stop=stop.stop_id)
                check("opening_hours", (stop.opening_window[0] <= stop.start_minutes < stop.end_minutes <= stop.opening_window[1])
                      if stop.opening_hours_verified and stop.opening_window else None,
                      "Visit hours are unknown or do not fit.", day=day.day_number, stop=stop.stop_id, fixable=True,
                      source=stop.source.reference if stop.source else None)
                if index:
                    prior = day.stops[index-1]
                    check("overlap", prior.end_minutes <= stop.start_minutes, "Activities overlap.", day=day.day_number, stop=stop.stop_id, fixable=True)
                    leg = next((leg for leg in day.legs if leg.from_stop_id == prior.stop_id and leg.to_stop_id == stop.stop_id), None)
                    duration = leg.duration_minutes if leg else None
                    check("route_source", True if leg and leg.source and leg.mode == trip.get("transport_mode") else None,
                          "An adjacent route lacks source evidence for the requested mode.", day=day.day_number, stop=stop.stop_id)
                    check("travel_time", None if duration is None else prior.end_minutes+duration+leg.buffer_minutes <= stop.start_minutes,
                          "Adjacent route is unknown or does not fit.", day=day.day_number, stop=stop.stop_id, fixable=True,
                          source=leg.source.reference if leg and leg.source else None)
        budget = plan.budget
        check("cost_coverage", True if budget.get("complete_estimate") else None, "Whole-trip cost coverage is incomplete.")
        if budget:
            check("cost_scope", budget.get("entity_id") == plan.destination_id and budget.get("travelers") == trip.get("travelers")
                  and budget.get("currency") == str(trip.get("currency") or "").upper(), "Budget scope, traveler count, or currency differs from the request.")
        if budget.get("lines"):
            try:
                low = sum((Decimal(line["low"]) for line in budget["lines"]), Decimal(0))
                high = sum((Decimal(line["high"]) for line in budget["lines"]), Decimal(0))
                quantum = Decimal(1) if budget.get("currency") in {"VND", "JPY", "KRW"} else Decimal("0.01")
                tolerance = len(budget["lines"])*quantum
                check("cost_arithmetic", abs(low-Decimal(budget["known_subtotal_low"])) <= tolerance and abs(high-Decimal(budget["known_subtotal_high"])) <= tolerance,
                      "Budget lines disagree with the supplied subtotal.")
            except (KeyError, InvalidOperation, TypeError):
                check("cost_arithmetic", False, "Budget arithmetic cannot be validated.")
        if trip.get("budget") is not None:
            verdict = budget.get("budget_verdict")
            check("budget_limit", False if verdict == "known_costs_exceed_budget" else True if verdict == "estimated_within_budget" else None,
                  "Budget compliance is unknown or known costs exceed the limit.")
        weather = candidate_assessment(state, "weather", plan.destination_id)
        check("daily_weather", True if weather.get("status") == "complete" and weather.get("forecast") else None,
              "Daily forecast coverage is incomplete; seasonal history is not a forecast.")
        for constraint in ranking.get("constraints", []):
            if constraint["constraint"] != "budget":
                check(constraint["constraint"], True if constraint["status"] == "satisfied" else False if constraint["status"] == "violated" else None,
                      f"{constraint['constraint']} is violated or unverified.")
        check("arrival_departure", None, "Arrival/departure, meals, lodging access, and return travel need confirmation outside this activity schedule.")
        status = "needs_revision" if any(issue.result == "failed" for issue in issues) else "unverified" if issues else "passed"
        return PlanReview(plan_id=plan.plan_id, revision=plan.revision, evidence_version=plan.evidence_version,
                          status=status, checks=checks, issues=issues)

    def next_node(self, state):
        review, plan = state.get("plan_review") or {}, state.get("itinerary") or {}
        if (review.get("status") == "needs_revision" and plan.get("revision", 0) < self.settings.max_revisions
                and any(issue.get("fixable") for issue in review.get("issues", []))):
            return "planner"
        return "respond"

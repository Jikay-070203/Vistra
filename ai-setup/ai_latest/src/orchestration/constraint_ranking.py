"""Transparent ordering of candidate feasibility; original result numbers stay stable."""

from src.schema.chat import restore_search_response
from src.orchestration.tool_activity import tracked_tool, tool_metadata


def candidate_assessment(state, agent, entity_id):
    return next((item for item in (state.get(agent) or {}).get("data", {}).get("candidates", [])
                 if item.get("entity_id") == entity_id), {})


@tracked_tool("Constraint ranking", "Compare sourced candidates with trip limits", agent="Constraint ranking")
def rank_constraints(state):
    tool_metadata(execution="local")
    response = restore_search_response(state["response"])
    trip = state.get("trip_request", {})
    output = []
    for index, result in enumerate(response.results, 1):
        constraints = []
        budget = candidate_assessment(state, "budget", result.entity_id)
        route = candidate_assessment(state, "transport", result.entity_id)
        weather = candidate_assessment(state, "weather", result.entity_id)
        if trip.get("budget") is not None:
            verdict = budget.get("budget_verdict")
            status = "violated" if verdict == "known_costs_exceed_budget" else "satisfied" if verdict == "estimated_within_budget" else "unknown"
            constraints.append({"constraint": "budget", "status": status, "reason": verdict or "No complete cost evidence", "sources": budget.get("lines", [])})
        if trip.get("max_transport_minutes") is not None:
            verdict = route.get("within_time_limit")
            options = route.get("options", [])
            if verdict is None and options:
                values = [option.get("within_time_limit") for option in options]
                verdict = True if True in values else False if all(value is False for value in values) else None
            constraints.append({"constraint": "transport_time", "status": "satisfied" if verdict is True else "violated" if verdict is False else "unknown",
                                "reason": "Assessed outward route only", "source": route.get("source")})
        if any(trip.get(key) is not None for key in ("min_temperature_c", "max_temperature_c", "max_rain_mm", "max_wind_kmh")):
            verdict = weather.get("within_explicit_weather_limits")
            constraints.append({"constraint": "weather", "status": "satisfied" if verdict is True else "violated" if verdict is False else "unknown",
                                "reason": "Forecast coverage only; seasonal history does not verify future daily weather"})
        violations = [item["constraint"] for item in constraints if item["status"] == "violated"]
        unknown = [item["constraint"] for item in constraints if item["status"] == "unknown"]
        output.append({"entity_id": result.entity_id, "result_number": result.result_number or index,
            "constraints": constraints, "eligible": not violations, "provisional": bool(unknown),
            "violations": violations, "unknown_constraints": unknown, "original_order": index})
    output.sort(key=lambda item: (not item["eligible"], item["provisional"], item["original_order"]))
    for index, item in enumerate(output, 1):
        item["rank"] = index
    return {"constraint_ranking": output}

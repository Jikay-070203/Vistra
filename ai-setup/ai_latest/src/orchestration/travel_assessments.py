"""Collect current-turn evidence without inventing a fused recommendation score."""

from src.schema.travel import AgentAssessment


AGENT_ORDER = ("destination_context", "poi", "transport", "budget", "weather")


def next_after_sources(state: dict) -> str:
    if state.get("remix", {}).get("conflicts"):
        return "respond"
    if state["decision"].get("requested_agents"):
        return "aggregate_assessments" if state["decision"]["ambiguous"] else "destination_context"
    return "constraint_ranking" if state["response"].get("results") and not state["decision"]["ambiguous"] else "respond"


def aggregate_assessments(state: dict) -> dict:
    requested = state["decision"].get("requested_agents", [])
    assessments = {}
    for name in AGENT_ORDER:
        if name not in requested:
            continue
        value = state.get(name)
        if value is None:
            value = AgentAssessment(agent=name, status="needs_input", missing_inputs=["an unambiguous destination reference"]).model_dump(mode="json")
        assessments[name] = value
    return {"assessments": assessments}

"""Common specialist lifecycle; each node writes only its own assessment field."""

from src.orchestration.progress import progress
from src.schema.chat import restore_search_response
from src.schema.travel import AgentAssessment, TripRequest
from src.tools.http_client import ToolUnavailable
from src.orchestration.tool_activity import agent_activity


class TravelAgent:
    name = None
    title = None

    def __init__(self, config: dict, tools_factory):
        self.config = config
        self._tools = tools_factory

    def run(self, state: dict) -> dict:
        with agent_activity(self.title):
            return self._run(state)

    def _run(self, state: dict) -> dict:
        if self.name not in state["decision"].get("requested_agents", []):
            return {self.name: None}
        progress(self.name, self.title, status="running")
        response = restore_search_response(state["response"])
        limit = self.config.get("travel_candidate_limit", 3)
        candidates = response.results[:limit]
        if not candidates:
            assessment = AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["a resolved destination candidate"])
        else:
            try:
                assessment = self.assess(state, TripRequest.model_validate(state["trip_request"]), candidates, self._tools())
            except ToolUnavailable as exc:
                assessment = AgentAssessment(agent=self.name, status="unavailable", warnings=[str(exc)])
            if len(response.results) > limit:
                assessment.warnings.append(f"Only the first {limit} candidates were assessed; remaining results are unassessed.")
                if assessment.status == "complete":
                    assessment.status = "partial"
        progress(self.name, self.title, f"Status: {assessment.status}. " + "; ".join(assessment.missing_inputs + assessment.warnings),
                 assessment_status=assessment.status,
                 sources=[source.model_dump(mode="json") for source in assessment.sources])
        return {self.name: assessment.model_dump(mode="json")}

    def assess(self, state, trip, candidates, tools) -> AgentAssessment:
        raise NotImplementedError

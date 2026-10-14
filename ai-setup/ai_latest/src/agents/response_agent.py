from dataclasses import asdict

from openai import OpenAIError

from src.guardrails.policy import GuardrailViolation
from src.orchestration.presentation import result_images, result_places
from src.orchestration.progress import current_activity, progress
from src.schema.chat import ChatResponse, ChatState, Conversation, restore_search_response
from src.schema.verification import GuardrailSettings
from src.verification.evidence import evidence_snapshot


class ResponseAgent:
    def __init__(self, generation_factory, config):
        self._generation = generation_factory
        self.settings = GuardrailSettings.model_validate(config.get("guardrails") or {})

    def run(self, state: ChatState) -> dict:
        conversation = Conversation.from_dict(state["conversation"])
        decision = state["decision"]
        response = restore_search_response(state["response"])
        evidence = evidence_snapshot(state, self.settings)
        deterministic = bool(state.get("guardrail_answer") or state.get("remix", {}).get("conflicts")
            or decision.get("ambiguous") or (response.location_status and not response.results))
        if (decision["action"] == "reply" and not response.results and not state.get("itinerary")
                and not decision.get("memory_updates") and not decision.get("requested_agents")):
            deterministic = True
        draft = None
        progress("context", "Evidence prepared for answer review",
            f"{len(evidence['records'])} bounded evidence records. History and visual observations are not independent factual evidence.")
        if not deterministic and self.settings.model_review_enabled:
            progress("generation", "Drafting an answer with evidence identifiers", status="running")
            try:
                draft = self._generation().generate_grounded(state["message"], evidence,
                    history=conversation.messages, summary=decision["summary"], memory=state["memory"],
                    image=decision["active_image"]).model_dump(mode="json")
                progress("generation", "Draft ready for verification", "The draft is not yet released or saved.")
            except (OpenAIError, ValueError, RuntimeError, GuardrailViolation):
                progress("generation", "Draft unavailable", "The verifier will return a fixed evidence summary.")
        additional = {key: state.get(key) for key in
            ("itinerary", "plan_review", "constraint_ranking", "visual_preferences", "remix", "travel_dna")
            if state.get(key) is not None}
        result = ChatResponse(conversation_id=conversation.conversation_id, answer="",
            search_query=decision["search_query"] if decision["action"] == "search" else "",
            search_response=response, action=decision["action"], images=result_images(response),
            places=result_places(response), activity=current_activity(), assessments=state.get("assessments", {}),
            **additional)
        return {"result": asdict(result), "answer_draft": draft, "answer_evidence": evidence,
                "answer_mode": "deterministic" if deterministic else "generated"}

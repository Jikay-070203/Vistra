"""Graph entry and manager-output checks, before retrieval or persistence."""

from src.guardrails.policy import CredentialRedactor, EXFILTRATION, INJECTION, allowed_memory_updates
from src.orchestration.progress import progress
from src.schema.verification import GuardrailReport, GuardrailSettings


class GuardrailNodes:
    def __init__(self, config):
        self.settings = GuardrailSettings.model_validate(config.get("guardrails") or {})

    def input(self, state):
        redactor = CredentialRedactor()
        original = state["message"]
        message = redactor.text(original)
        redacted = original != message
        codes = []
        blocked = None
        if len(original) > self.settings.max_message_chars or "\x00" in original:
            codes.append("invalid_message")
            blocked = "Please send a shorter travel request without null characters."
            message = message[:self.settings.max_message_chars].replace("\x00", "")
        elif EXFILTRATION.search(message):
            codes.append("credential_or_instruction_exfiltration")
            blocked = "I can help with travel planning, but cannot disclose server credentials or hidden instructions."
        if redacted:
            codes.append("credentials_redacted")
        if INJECTION.search(message):
            codes.append("instruction_override_detected")
            blocked = "Please send your travel request without instructions to override the system rules."
        route = state.get("route")
        if route not in {None, "text", "image_text", "image_image"}:
            codes.append("invalid_route")
            blocked = "Please choose a supported travel search route."
        elif route == "image_image" and not state.get("image_path"):
            codes.append("image_required")
            blocked = "Please upload an image to use image-to-image search."
        limit = state.get("limit")
        if limit is not None and (type(limit) is not int or not 1 <= limit <= self.settings.max_search_limit):
            codes.append("invalid_search_limit")
            blocked = f"Choose a result limit between 1 and {self.settings.max_search_limit}."
        conversation = redactor.data(state["conversation"])
        report = GuardrailReport(status="blocked" if blocked else "redacted" if redacted else "passed", codes=codes)
        progress("input_guardrails", "Input guardrails checked", ", ".join(codes) or "Input boundaries passed.")
        return {"message": message, "conversation": conversation, "guardrails": report.model_dump(mode="json"),
                "guardrail_answer": blocked, "answer_draft": None, "answer_verification": None,
                "memory": {}, "assessments": {}, "itinerary": None, "plan_review": None,
                "loaded_memory": {}, "trip_request": conversation.get("trip_request", {}),
                "inspiration_paths": [], "inspiration_vectors": [], "remix_vector": None,
                "constraint_ranking": [], "visual_preferences": {}, "remix": {}, "travel_dna": {},
                "answer_mode": "deterministic" if blocked else "generated",
                "decision": {"action": "reply", "search_query": "", "active_image": None, "route": None,
                    "search_options": {}, "references": [], "follow_up": False, "ambiguous": False,
                    "summary": conversation.get("summary", ""), "memory_updates": [], "requested_agents": [], "workflow": {}},
                "response": {"route": "text", "results": []}}

    @staticmethod
    def after_input(state):
        return "respond" if state.get("guardrail_answer") else "load_memory"

    def plan(self, state):
        redactor = CredentialRedactor()
        decision = redactor.data(dict(state["decision"]))
        from src.schema.chat import MemoryFact

        proposed = [MemoryFact.model_validate(item) for item in decision.get("memory_updates", [])]
        allowed = allowed_memory_updates(state["message"], proposed, redactor)
        decision["memory_updates"] = [item.model_dump() for item in allowed]
        # Manager's provisional memory must not bypass the persistence gate or
        # influence this turn when its update lacked explicit consent/evidence.
        memory = redactor.data(dict(state["memory"]))
        stored = state.get("loaded_memory", {})
        for fact in proposed:
            memory.pop(fact.name, None)
            if fact.name in stored:
                memory[fact.name] = redactor.text(stored[fact.name])
        memory.update({fact.name: fact.value for fact in allowed})
        report = dict(state["guardrails"])
        if len(allowed) != len(proposed):
            report["codes"] = [*report["codes"], "unconfirmed_memory_updates_dropped"]
        query = decision["search_query"]
        decision["search_query"] = query[:self.settings.max_message_chars]
        if INJECTION.search(decision["summary"]):
            decision["summary"] = state["conversation"].get("summary", "")
            report["codes"].append("unsafe_summary_dropped")
        progress("plan_guardrails", "Plan guardrails checked", "Memory writes require explicit, grounded stable preferences.")
        return {"decision": decision, "memory": memory, "guardrails": report}

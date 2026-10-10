from dataclasses import asdict

from src.orchestration.progress import current_activity, progress
from src.schema.chat import ChatState, Conversation, MemoryFact, restore_search_response
from src.guardrails.policy import CredentialRedactor, allowed_memory_updates
from src.verification.evidence import digest


class MemoryAgent:
    def __init__(
        self, 
        memory_store, 
        config: dict, 
        max_messages: int
    ):
        self.long_term = memory_store
        self.config = config
        self.max_messages = max_messages


    def load(
        self, 
        state: ChatState
    ) -> dict:
        
        conversation = Conversation.from_dict(state["conversation"])
        message = state["message"]

        progress(
            "memory",
            "Reading conversation and saved preferences",
            status="running"
        )
        
        memory = self.long_term.search_memories(
            conversation.user_id,
            f"{conversation.summary}\n{message}",
            self.config["chat_memory_limit"],
        )
        progress("memory", "Conversation context loaded", f"{len(conversation.messages)} recent messages; {len(memory)} relevant saved preferences.")
        
        memory = CredentialRedactor().data(memory)
        return {"memory": memory, "loaded_memory": dict(memory)}


    def save(
        self, 
        state: ChatState
    ) -> dict:
        redactor = CredentialRedactor()
        conversation = Conversation.from_dict(redactor.data(state["conversation"]))
        decision, result = state["decision"], redactor.data(state["result"])
        report = result.get("answer_verification") or {}
        if report.get("final_hash") != digest(result["answer"]) or report.get("release_mode") not in {"reviewed_generation", "deterministic"}:
            raise RuntimeError("Only a released, verified answer may be persisted.")
        response = restore_search_response(redactor.data(state["response"]))
        previous = conversation.search_response
        message, image_path = state["message"], state["image_path"]
        action, follow_up = decision["action"], decision["follow_up"]
        references, summary = decision["references"], decision["summary"]
        answer = result["answer"]
        images, places, activity = result["images"], result["places"], result["activity"]
        updates = allowed_memory_updates(message, [MemoryFact(**fact) for fact in decision["memory_updates"]], redactor)
        summary = redactor.text(summary)
        messages = [{"role": "user", "content": message}, {"role": "assistant", "content": answer, "images": images, "activity": activity, "places": places}]
        messages[1]["assessments"] = result.get("assessments", {})
        for key in ("itinerary", "plan_review", "constraint_ranking", "visual_preferences", "remix", "travel_dna", "answer_verification", "guardrails"):
            messages[1][key] = result.get(key)
        # Include preference-embedding calls that happen before message persistence.
        messages[1]["activity"] = current_activity(snapshot=False)

        if image_path is not None:
            messages[0]["image_path"] = image_path
            conversation.image_path = image_path
        if state.get("inspiration_paths"):
            conversation.inspiration_paths = state["inspiration_paths"]
            conversation.visual_preferences = state.get("visual_preferences", {})
        elif state.get("visual_preferences") and state["decision"].get("workflow", {}).get("refine_visual_preferences"):
            conversation.visual_preferences = state["visual_preferences"]
        if state.get("image_paths"):
            messages[0]["image_paths"] = state["image_paths"]

        conversation.messages.extend(messages)
        conversation.summary = summary
        conversation.trip_request = redactor.data(state.get("trip_request", {}))

        if action != "reply":
            if follow_up and image_path is None:
                updated = {result.entity_id: result for result in response.results}
                previous.results = [updated.get(result.entity_id, result) for result in previous.results]
                related = {result.entity_id: result for result in [*previous.related_results, *response.related_results]}
                previous.related_results = list(related.values())
                previous.follow_up_status = response.follow_up_status
                conversation.selected_entity_ids = references
            else:
                conversation.search_response = response
                conversation.selected_entity_ids = []

        self.long_term.save_turn(conversation, messages, updates)
        result["activity"] = current_activity()
        conversation.messages = conversation.messages[-self.max_messages:]

        return {"conversation": asdict(conversation), "result": result}

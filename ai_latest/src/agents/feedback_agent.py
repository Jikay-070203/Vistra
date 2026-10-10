"""Persist deliberate feedback only; liking a place never infers every attribute."""

import sqlite3

from src.orchestration.tool_activity import agent_activity, tool_call, tool_metadata
from src.schema.preferences import FeedbackRequest, PreferenceUpdateProposal
from src.guardrails.policy import CredentialRedactor


class FeedbackAgent:
    name = "feedback"

    def __init__(self, store, memory_store):
        self.store, self.memory = store, memory_store

    def record(self, request: FeedbackRequest, *, user_id: str, allowed_entity_ids):
        request = FeedbackRequest.model_validate(request)
        request = request.model_copy(update={"reason": CredentialRedactor().text(request.reason)})
        if request.entity_id not in allowed_entity_ids:
            raise ValueError("Feedback must refer to a result in this user's conversation.")
        if request.save_preferences and not request.attributes:
            return PreferenceUpdateProposal(event_id=request.event_id, entity_id=request.entity_id,
                status="needs_confirmation", warnings=["Choose the specific preferences to save; liking a place alone does not establish them."])
        with agent_activity("Feedback / Travel DNA"), tool_call("SQLite feedback", "Record explicit preference feedback"):
            tool_metadata(execution="local")
            status = self.store.record(user_id, request)
            if request.save_preferences:
                self.sync_memory(user_id)
            return PreferenceUpdateProposal(event_id=request.event_id, entity_id=request.entity_id, status=status,
                proposed_attributes=request.attributes, saved=request.save_preferences)

    def sync_memory(self, user_id):
        # Deterministic upserts can be retried after a Qdrant failure without adding
        # another feedback event. SQLite remains the provenance source of truth.
        profile = self.store.profile(user_id)
        if profile.attributes:
            values = ", ".join(f"{item.attribute}: {item.weight:+.2f}" for item in profile.attributes)
            self.memory.remember(user_id, "travel_dna", values)
        else:
            self.memory.forget(user_id, "travel_dna")

    def run(self, state):
        # Normal turns only read confirmed preferences. Persistence requires the
        # separate explicit feedback contract, never an inferred manager flag.
        user_id = state["conversation"]["user_id"]
        try:
            return {"travel_dna": self.store.profile(user_id).model_dump(mode="json")}
        except (OSError, sqlite3.Error):
            return {"travel_dna": {"attributes": [], "status": "unavailable", "warnings": ["Saved feedback preferences are unavailable for this turn."]}}

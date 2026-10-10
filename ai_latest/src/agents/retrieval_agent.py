from dataclasses import asdict

from src.orchestration.progress import progress
from src.schema.chat import ChatState, Conversation, TurnDecision
from src.schema.models import SearchResponse
from src.orchestration.tool_activity import agent_activity


class RetrievalAgent:
    def __init__(self, search_factory):
        self._search = search_factory


    def search(self, state: ChatState) -> dict:
        with agent_activity("Retrieval"):
            return self._retrieve(state)

    def _retrieve(self, state: ChatState) -> dict:
        conversation = Conversation.from_dict(state["conversation"])
        decision = dict(state["decision"])
        progress("retrieval", "Retrieving sources", "Routing the request and loading the required model if needed.", status="running")

        if decision["follow_up"] and state["image_path"] is None:
            decision["active_image"] = None
            selected = self._selected_response(conversation.search_response, decision["references"])
            response = self._search().search_follow_up(decision["search_query"], selected, limit=state["limit"])
        elif (state.get("remix_vector") is not None or state.get("remix", {}).get("attributes")) and not decision["follow_up"]:
            response = self._search().search_remix(state.get("remix_vector"), attributes=state.get("remix", {}).get("attributes", []),
                query=state.get("remix", {}).get("query") or decision["search_query"], location=decision["search_options"].get("location"),
                categories=decision["search_options"].get("categories"),
                limit=state["limit"], on_progress=lambda event: progress(**event))
        else:
            response = self._search().search(
                decision["search_query"],
                image=decision["active_image"],
                route=decision["route"],
                limit=state["limit"],
                on_progress=lambda event: progress(**event),
                **decision["search_options"],
            )

            if state["image_path"] is None:
                conversation.image_path = decision["active_image"]

        return self._finish(state, conversation, decision, response)


    def prepare_sources(self, state: ChatState) -> dict:
        conversation = Conversation.from_dict(state["conversation"])
        decision = dict(state["decision"])
        previous = conversation.search_response
        progress("retrieval", "Preparing conversation sources", status="running")

        if state.get("remix", {}).get("conflicts"):
            decision.update(action="reply", active_image=None, follow_up=False)
            response = SearchResponse(route="text")
        elif decision["ambiguous"]:
            decision.update(action="reply", active_image=None)
            response = SearchResponse(
                route=previous.route if previous else "text",
                results=previous.results if previous else [],
                follow_up_status="clarification_required",
                location=previous.location if previous else None,
                location_status=previous.location_status if previous else "",
            )
        elif decision["follow_up"]:
            decision.update(action="reuse", active_image=None)
            response = self._selected_response(previous, decision["references"])
        else:
            decision["action"] = "reply"
            response = SearchResponse(route="text")
            
        return self._finish(state, conversation, decision, response)


    @staticmethod
    def _selected_response(previous: SearchResponse, references: list[str]) -> SearchResponse:
        selected = [result for result in previous.results if result.entity_id in references]
        page_ids = {result.destination.page_id for result in selected if result.destination is not None}
        return SearchResponse(
            route=previous.route,
            results=selected,
            related_results=[result for result in previous.related_results if result.place_id in page_ids],
            follow_up_status=previous.follow_up_status,
            location=previous.location,
            location_status=previous.location_status,
            requested_categories=previous.requested_categories,
        )


    @staticmethod
    def _finish(state: ChatState, conversation: Conversation, decision: TurnDecision,
                response: SearchResponse) -> dict:
        image_path = state["image_path"]
        action = decision["action"]
        follow_up, ambiguous = decision["follow_up"], decision["ambiguous"]

        lookup = not state.get("remix", {}).get("conflicts") and (image_path is not None or (action == "search" and not ambiguous)) and response.follow_up_status != "metadata_only"
        title = "Follow-up sources prepared" if follow_up and not ambiguous and image_path is None else "Search completed" if lookup else "Previous sources reused" if response.results else "Retrieval skipped"
        detail = f"Route: {response.route}\n{len(response.results)} accepted places or destinations; {len(response.related_results)} related results."
        if response.location:
            detail += f"\nLocation: {response.location}"
        if response.requested_categories:
            detail += f"\nRequired photo categories: {', '.join(response.requested_categories)}"
        if response.location_status or response.follow_up_status:
            detail += f"\nStatus: {response.location_status or response.follow_up_status}"
        if not lookup:
            detail += "\nNo new travel search was performed."
        if response.location_status in {"unresolved", "no_indexed_text"}:
            detail += "\nNo travel index query was performed."
        progress("retrieval", title, detail, route=response.route, lookup=lookup)

        if action == "search" and not (follow_up and image_path is None):
            for index, result in enumerate(response.results, 1):
                result.result_number = index

        return {"decision": decision, "response": asdict(response), "conversation": asdict(conversation)}

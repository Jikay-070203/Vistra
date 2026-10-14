from pathlib import Path
import re

from src.orchestration.progress import progress
from src.resolver.location_resolver import LocationResolver
from src.schema.chat import ChatState, Conversation, MemoryFact
from src.orchestration.travel_assessments import AGENT_ORDER
from src.retrieval.category_filters import explicit_photo_categories


def explicit_result_numbers(message):
    numbers = []
    pattern = r"\bresults?\s*#?\s*\d+(?:(?:\s*,\s*(?:and\s+)?|\s+(?:and|or|vs\.?|versus|&)\s+)#?\s*\d+)*"
    for match in re.finditer(pattern, message, re.I):
        prefix = message[max(0, match.start()-40):match.start()]
        if re.search(r"\b(?:instead of|ignore|forget|skip|not|replace|rather than|don't want|do not want)\s+(?:the\s+)?$", prefix, re.I):
            continue
        numbers.extend(int(value) for value in re.findall(r"\d+", match.group()))
    return list(dict.fromkeys(numbers))


def explicit_itinerary_request(message):
    pattern = r"\b(?:plan|build|create|draft|prepare|make|give me)\b[^.!?\n]{0,80}\b(?:itinerary|day[- ]by[- ]day (?:plan|schedule))\b"
    for match in re.finditer(pattern, message, re.I):
        prefix = message[max(0, match.start()-30):match.start()]
        if not re.search(r"\b(?:don't|do not|never|not|no need to)\s*$", prefix, re.I):
            return True
    return False


class ManagerAgent:
    def __init__(
        self, 
        config: dict, 
        generation_factory
    ):
        self.config = config
        self._generation = generation_factory


    def run(
        self, 
        state: ChatState
    ) -> dict:
        
        conversation = Conversation.from_dict(state["conversation"])
        message, image_path = state["message"], state["image_path"]
        route = state["route"]
        memory = dict(state["memory"])

        generation = self._generation()
        previous_image = conversation.image_path
        has_previous_image = previous_image is not None and Path(previous_image).is_file()
        progress("plan", "Planning the request", status="running")

        plan = generation.prepare_turn(
            message,
            history=conversation.messages,
            summary=conversation.summary,
            response=conversation.search_response,
            memory=memory,
            has_image=image_path is not None,
            has_previous_image=has_previous_image,
            selected_entity_ids=conversation.selected_entity_ids,
            trip_request=conversation.trip_request,
            inspiration_count=len(state.get("image_paths") or []) or len(conversation.inspiration_paths),
            visual_preferences=conversation.visual_preferences,
        )

        active_image = image_path or (previous_image if plan.use_previous_image and has_previous_image else None)
        action = "search" if image_path is not None or route is not None else plan.action
        search_query = plan.search_query.strip() or message
        previous = conversation.search_response
        location = plan.location.strip() if plan.location and plan.location.strip() else None

        search_options = {}
        if location is not None:
            search_options["location"] = location

        if plan.visual_query.strip():
            search_options["visual_query"] = plan.visual_query.strip()

            if active_image is None and route is None:
                route = "image_text"
        direct_categories = explicit_photo_categories(message)
        categories = direct_categories or plan.search_categories
        if categories:
            search_options["categories"] = categories

        references = list(dict.fromkeys(plan.referenced_entity_ids))
        by_id = {result.entity_id: result for result in previous.results} if previous else {}
        follow_up = plan.reference == "selected" or bool(references) or action == "reuse"

        if follow_up and not references:
            references = conversation.selected_entity_ids or (list(by_id) if len(by_id) == 1 else [])

        ambiguous = (plan.reference == "ambiguous"
                     or any(entity_id not in by_id for entity_id in references)
                     or (follow_up and not references))

        # A direct new photo request must not inherit an unrelated selection.
        # Explicit result numbers and deictic references still use the binding
        # rules below rather than silently replacing the selected place.
        new_photo_search = bool(direct_categories) and not explicit_result_numbers(message) and not re.search(
            r"\b(?:this|that|these|those|same|there|above|previous|selected)\b", message, re.I)
        if new_photo_search:
            action, follow_up, ambiguous, references = "search", False, False, []
            active_image = image_path
            search_query = message
            if state["route"] is None:
                route = "image_image" if image_path else "image_text"
            # Some manager responses put the explicit location only in the trip
            # destination field. Use it only when the current message names it.
            destination = (plan.trip.destination or "").strip()
            destination_key = LocationResolver._normalize(destination)
            if not location and len(destination_key) > 3 and destination_key in LocationResolver._normalize(message):
                location = destination
                search_options["location"] = destination
        
        location_changed = (previous is not None and location is not None
                            and LocationResolver._normalize(location) != LocationResolver._normalize(previous.location or ""))
        if location_changed:
            action, follow_up, ambiguous = "search", False, False
            references = []

        # Bind explicit result numbers locally, even if the model proposes a
        # different destination. An unavailable number must ask for clarification.
        numbers = explicit_result_numbers(message)
        if numbers:
            by_number = {item.result_number or index: item.entity_id
                         for index, item in enumerate(previous.results, 1)} if previous else {}
            ambiguous = any(number not in by_number for number in numbers)
            follow_up = True
            references = list(dict.fromkeys(by_number[number] for number in numbers if number in by_number))
            if not ambiguous:
                action = "reuse" if plan.requested_agents or plan.workflow.build_itinerary else action
                # Origin names in a follow-up must not replace its destination.
                search_options.pop("location", None)
                if previous.location:
                    search_options["location"] = previous.location

        updates = [MemoryFact(
            name=fact.name.strip()[:80],
            value=fact.value.strip()[:self.config["chat_memory_fact_chars"]],
        ) for fact in plan.memory_updates[:self.config["chat_memory_limit"]] if fact.name.strip() and fact.value.strip()]

        memory.update({fact.name: fact.value for fact in updates})
        summary = plan.summary[:self.config["chat_summary_chars"]]
        requested_agents = list(dict.fromkeys(plan.requested_agents))
        workflow = plan.workflow.model_dump(mode="json")
        if new_photo_search and image_path is None and not state.get("preference_input", {}).get("confirmed"):
            workflow.update(use_inspiration_gallery=False, refine_visual_preferences=False, visual_preferences=[])
        # Preserve an explicit planning command if the model omits its flag.
        # Trip dates, budget and other facts still come from the structured plan.
        if explicit_itinerary_request(message):
            workflow["build_itinerary"] = True
        if state.get("preference_input", {}).get("confirmed"):
            workflow["refine_visual_preferences"] = True
            if conversation.inspiration_paths and not state.get("image_paths"):
                workflow["use_inspiration_gallery"] = True
            if action == "reply" and not ambiguous:
                action = "search"
            if not ambiguous:
                action, follow_up, references = "search", False, []
        if len(state.get("image_paths") or []) > 1:
            workflow["use_inspiration_gallery"] = True
        if workflow["build_itinerary"]:
            requested_agents = list(dict.fromkeys([*requested_agents, "destination_context", "poi", "transport", "budget", "weather"]))
            if not ambiguous:
                if follow_up:
                    action = "reuse"
                elif action == "reply" and location:
                    action = "search"
        if requested_agents and "destination_context" not in requested_agents:
            requested_agents.insert(0, "destination_context")
        if "budget" in requested_agents and plan.trip.origin and "transport" not in requested_agents:
            requested_agents.append("transport")

        progress("plan", "Request planned",
            f"Action: {action}\nQuery: {search_query}\nLocation: {search_options.get('location') or 'Unrestricted'}"
            f"\nSelected: {', '.join(references) or 'None'}\nAgents: {', '.join(requested_agents) or 'None'}"
            f"\nRequired photo categories: {', '.join(categories) or 'None'}"
            f"\nPlanner requested: {workflow['build_itinerary']}\nClarification required: {ambiguous}")

        decision = {
            "action": action,
            "search_query": search_query,
            "active_image": active_image,
            "route": route,
            "search_options": search_options,
            "references": references,
            "follow_up": follow_up,
            "ambiguous": ambiguous,
            "summary": summary,
            "memory_updates": [fact.model_dump() for fact in updates],
            "requested_agents": requested_agents,
            "workflow": workflow,
        }
        
        return {"decision": decision, "memory": memory, "trip_request": plan.trip.model_dump(mode="json"),
                "assessments": {}, **{name: None for name in AGENT_ORDER},
                "itinerary": None, "plan_review": None, "plan_revision": 0,
                "planner_route_calls": 0,
                "constraint_ranking": [], "visual_preferences": {}, "remix": {}, "remix_vector": None, "inspiration_vectors": []}


    @staticmethod
    def next_node(state: ChatState) -> str:
        decision = state["decision"]
        if state.get("remix", {}).get("conflicts"):
            return "prepare_sources"
        if decision["ambiguous"] or decision["action"] != "search":
            return "prepare_sources"
        return "retrieve"

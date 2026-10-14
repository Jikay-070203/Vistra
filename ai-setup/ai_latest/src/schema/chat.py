from dataclasses import dataclass, field
from typing import Literal, NotRequired, TypedDict

from pydantic import BaseModel, Field

from src.schema.models import DestinationResolution, EnrichedRetrievalResult, RetrievalRoute, SearchResponse, SearchResult, PhotoCategory
from src.schema.travel import AgentName, TripRequest
from src.schema.preferences import WorkflowRequest


def restore_search_response(value: dict | None) -> SearchResponse | None:
    if value is None:
        return None

    def restore_result(result: dict) -> SearchResult:
        destination = result.get("destination")
        return SearchResult(
            **{key: item for key, item in result.items() if key not in ("evidence", "destination")},
            evidence=[EnrichedRetrievalResult(**hit) for hit in result.get("evidence", [])],
            destination=DestinationResolution(**destination) if destination else None,
        )

    return SearchResponse(
        route=value["route"],
        results=[restore_result(result) for result in value["results"]],
        related_results=[restore_result(result) for result in value.get("related_results", [])],
        follow_up_status=value.get("follow_up_status", ""),
        location=value.get("location"),
        location_status=value.get("location_status", ""),
        requested_categories=value.get("requested_categories", []),
    )


class MemoryFact(BaseModel):
    name: str
    value: str


class ChatPlan(BaseModel):
    action: Literal["search", "reuse", "reply"]
    search_query: str
    use_previous_image: bool
    summary: str
    memory_updates: list[MemoryFact]
    reference: Literal["none", "selected", "ambiguous"] = "none"
    referenced_entity_ids: list[str] = Field(default_factory=list)
    location: str | None = None
    visual_query: str = ""
    search_categories: list[PhotoCategory] = Field(default_factory=list)
    trip: TripRequest = Field(default_factory=TripRequest)
    requested_agents: list[AgentName] = Field(default_factory=list)
    workflow: WorkflowRequest = Field(default_factory=WorkflowRequest)


@dataclass
class Conversation:
    conversation_id: str
    user_id: str
    messages: list[dict] = field(default_factory=list)
    summary: str = ""
    search_response: SearchResponse | None = None
    image_path: str | None = None
    selected_entity_ids: list[str] = field(default_factory=list)
    trip_request: dict = field(default_factory=dict)
    inspiration_paths: list[str] = field(default_factory=list)
    visual_preferences: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, value: dict):
        return cls(
            **{key: item for key, item in value.items() if key != "search_response"},
            search_response=restore_search_response(value.get("search_response")),
        )


@dataclass
class ChatResponse:
    conversation_id: str
    answer: str
    search_query: str
    search_response: SearchResponse
    action: str
    images: list[dict] = field(default_factory=list)
    activity: list[dict] = field(default_factory=list)
    places: list[dict] = field(default_factory=list)
    assessments: dict = field(default_factory=dict)
    itinerary: dict | None = None
    plan_review: dict | None = None
    constraint_ranking: list[dict] = field(default_factory=list)
    visual_preferences: dict = field(default_factory=dict)
    remix: dict = field(default_factory=dict)
    travel_dna: dict = field(default_factory=dict)
    answer_verification: dict = field(default_factory=dict)
    guardrails: dict = field(default_factory=dict)
    user_message: str = ""


class TurnDecision(TypedDict):
    action: Literal["search", "reuse", "reply"]
    search_query: str
    active_image: str | None
    route: RetrievalRoute | None
    search_options: dict
    references: list[str]
    follow_up: bool
    ambiguous: bool
    summary: str
    memory_updates: list[dict]
    requested_agents: list[AgentName]
    workflow: NotRequired[dict]


class ChatState(TypedDict):
    conversation: dict
    message: str
    image_path: str | None
    image_paths: NotRequired[list[str]]
    preference_input: NotRequired[dict]
    route: RetrievalRoute | None
    limit: int | None
    memory: NotRequired[dict[str, str]]
    decision: NotRequired[TurnDecision]
    response: NotRequired[dict]
    result: NotRequired[dict]
    trip_request: NotRequired[dict]
    destination_context: NotRequired[dict | None]
    poi: NotRequired[dict | None]
    transport: NotRequired[dict | None]
    budget: NotRequired[dict | None]
    weather: NotRequired[dict | None]
    assessments: NotRequired[dict]
    visual_preferences: NotRequired[dict]
    remix: NotRequired[dict]
    remix_vector: NotRequired[list[float] | None]
    inspiration_vectors: NotRequired[list[list[float]]]
    inspiration_paths: NotRequired[list[str]]
    travel_dna: NotRequired[dict]
    constraint_ranking: NotRequired[list[dict]]
    itinerary: NotRequired[dict | None]
    plan_review: NotRequired[dict | None]
    plan_revision: NotRequired[int]
    planner_route_calls: NotRequired[int]
    loaded_memory: NotRequired[dict]
    guardrails: NotRequired[dict]
    guardrail_answer: NotRequired[str | None]
    answer_draft: NotRequired[dict | None]
    answer_evidence: NotRequired[dict]
    answer_mode: NotRequired[str]
    answer_verification: NotRequired[dict | None]

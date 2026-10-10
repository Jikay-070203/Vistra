"""Editable image preferences, remix requests, and explicit feedback contracts."""

from typing import Literal
from math import isfinite

from pydantic import BaseModel, Field, model_validator


VisualAttribute = Literal["coast", "mountains", "forest", "historic_architecture", "modern_architecture",
                          "cafes", "nightlife", "urban", "rural", "water", "museums", "parks"]


class AttributeWeight(BaseModel):
    attribute: VisualAttribute
    weight: float = Field(ge=-1, le=1, allow_inf_nan=False)


class VisualObservation(BaseModel):
    image_id: str
    attribute: VisualAttribute
    similarity: float = Field(ge=-1, le=1, allow_inf_nan=False)
    confirmed: bool = False


class VisualPreferenceProfile(BaseModel):
    status: Literal["complete", "partial", "needs_input", "unavailable"]
    observations: list[VisualObservation] = Field(default_factory=list)
    preferences: list[AttributeWeight] = Field(default_factory=list)
    image_ids: list[str] = Field(default_factory=list)
    confirmed: bool = False
    warnings: list[str] = Field(default_factory=list)


class RemixProfile(BaseModel):
    status: Literal["complete", "partial", "needs_input", "unavailable"]
    image_ids: list[str] = Field(default_factory=list)
    image_weights: list[float] = Field(default_factory=list)
    attributes: list[AttributeWeight] = Field(default_factory=list)
    query: str = ""
    conflicts: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class WorkflowRequest(BaseModel):
    build_itinerary: bool = False
    visual_preferences: list[AttributeWeight] = Field(default_factory=list)
    refine_visual_preferences: bool = False
    use_inspiration_gallery: bool = False
    image_weights: list[float] = Field(default_factory=list)
    day_start_minutes: int | None = Field(default=None, ge=0, le=1380)
    day_end_minutes: int | None = Field(default=None, ge=60, le=1440)
    activity_minutes: int | None = Field(default=None, ge=15, le=480)


class PreferenceInput(BaseModel):
    """User-supplied editor input; absent confirmation cannot authorize saving DNA."""

    attributes: list[AttributeWeight] = Field(default_factory=list, max_length=12)
    confirmed: bool = False
    image_weights: list[float] = Field(default_factory=list, max_length=5)

    @model_validator(mode="after")
    def valid_weights(self):
        if len({item.attribute for item in self.attributes}) != len(self.attributes):
            raise ValueError("Each visual attribute must occur once.")
        if self.image_weights and (any(not isfinite(value) or value < 0 or value > 1 for value in self.image_weights) or sum(self.image_weights) <= 0):
            raise ValueError("Image weights must be nonnegative and have a positive sum.")
        return self


class FeedbackRequest(BaseModel):
    event_id: str = Field(min_length=8, max_length=100, pattern=r"^[A-Za-z0-9_-]+$")
    conversation_id: str
    entity_id: str
    action: Literal["like", "dislike", "save"]
    reason: str = Field(default="", max_length=600)
    attributes: list[AttributeWeight] = Field(default_factory=list, max_length=12)
    save_preferences: bool = False

    @model_validator(mode="after")
    def distinct_attributes(self):
        if len({item.attribute for item in self.attributes}) != len(self.attributes):
            raise ValueError("Feedback attributes must be unique.")
        return self


class PreferenceUpdateProposal(BaseModel):
    event_id: str
    entity_id: str
    status: Literal["recorded", "saved", "duplicate", "needs_confirmation"]
    proposed_attributes: list[AttributeWeight] = Field(default_factory=list)
    saved: bool = False
    warnings: list[str] = Field(default_factory=list)


class TravelDNAProfile(BaseModel):
    attributes: list[AttributeWeight] = Field(default_factory=list)
    event_count: int = 0
    updated_at: str | None = None

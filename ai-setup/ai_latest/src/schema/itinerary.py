"""Itineraries and independent review results, with unknown evidence preserved."""

from datetime import date as Date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from src.schema.travel import Coordinates, EvidenceSource, TravelMode


class VisitWindow(BaseModel):
    weekday: int = Field(ge=0, le=6)
    opens_minutes: int = Field(ge=0, le=1439)
    closes_minutes: int = Field(ge=1, le=1440)

    @model_validator(mode="after")
    def valid_window(self):
        if self.closes_minutes <= self.opens_minutes:
            raise ValueError("Overnight opening windows must be split into separate days.")
        return self


class VisitRecord(BaseModel):
    entity_id: str
    timezone: str
    windows: list[VisitWindow] = Field(default_factory=list)
    closed_dates: list[Date] = Field(default_factory=list)
    valid_from: Date
    valid_until: Date
    observed_on: Date
    source_url: str

    @model_validator(mode="after")
    def valid_source(self):
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        if self.valid_until < self.valid_from or self.observed_on > Date.today() or self.observed_on > self.valid_until:
            raise ValueError("Visit evidence has invalid dates.")
        if not self.source_url.startswith(("https://", "http://")):
            raise ValueError("Visit evidence requires a source URL.")
        try:
            ZoneInfo(self.timezone)
        except ZoneInfoNotFoundError:
            raise ValueError("Unknown timezone; install tzdata if the OS has no timezone database.") from None
        return self


class ItineraryStop(BaseModel):
    stop_id: str
    entity_id: str
    name: str
    coordinates: Coordinates | None = None
    start_minutes: int = Field(ge=0, le=1439)
    end_minutes: int = Field(ge=1, le=1440)
    duration_assumed: bool = True
    opening_window: list[int] | None = None
    opening_hours_verified: bool = False
    source: EvidenceSource | None = None
    warnings: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def valid_time(self):
        if self.end_minutes <= self.start_minutes:
            raise ValueError("Activity end must be after start.")
        return self


class ItineraryLeg(BaseModel):
    from_stop_id: str
    to_stop_id: str
    mode: TravelMode | None = None
    duration_minutes: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    distance_km: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    buffer_minutes: int = Field(default=15, ge=0, le=180)
    source: EvidenceSource | None = None
    status: Literal["modeled", "unknown"] = "unknown"


class ItineraryDay(BaseModel):
    day_number: int = Field(ge=1, le=90)
    date: Date | None = None
    stops: list[ItineraryStop] = Field(default_factory=list)
    legs: list[ItineraryLeg] = Field(default_factory=list)


class ItineraryPlan(BaseModel):
    plan_id: str
    revision: int = Field(default=0, ge=0)
    destination_id: str | None = None
    destination_name: str | None = None
    evidence_version: str
    status: Literal["draft", "needs_input", "ready_for_review", "verified"] = "draft"
    timezone: str | None = None
    days: list[ItineraryDay] = Field(default_factory=list)
    budget: dict = Field(default_factory=dict)
    unscheduled: list[dict] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    missing_inputs: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    visit_evidence: list[VisitRecord] = Field(default_factory=list)


class ReviewIssue(BaseModel):
    code: str
    result: Literal["failed", "unknown"]
    message: str
    fixable: bool = False
    day_number: int | None = None
    stop_id: str | None = None
    source_reference: str | None = None


class PlanReview(BaseModel):
    plan_id: str
    revision: int
    evidence_version: str
    status: Literal["passed", "needs_revision", "unverified"]
    checks: list[dict] = Field(default_factory=list)
    issues: list[ReviewIssue] = Field(default_factory=list)


class PlanningSettings(BaseModel):
    enabled: bool = True
    max_days: int = Field(default=7, ge=1, le=30)
    max_stops_per_day: int = Field(default=3, ge=1, le=6)
    max_route_calls_per_turn: int = Field(default=6, ge=0, le=20)
    max_revisions: int = Field(default=2, ge=0, le=3)
    day_start_minutes: int = Field(default=540, ge=0, le=1380)
    day_end_minutes: int = Field(default=1080, ge=60, le=1440)
    activity_minutes: int = Field(default=90, ge=15, le=480)
    travel_buffer_minutes: int = Field(default=15, ge=0, le=180)
    unknown_leg_reserve_minutes: int = Field(default=60, ge=0, le=360)
    visit_catalog_path: str | None = None
    hours_max_age_days: int = Field(default=30, ge=1, le=365)

    @model_validator(mode="after")
    def valid_day(self):
        if self.day_end_minutes <= self.day_start_minutes:
            raise ValueError("Planning day must have a positive duration.")
        return self

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Kind = Literal["attraction", "food", "cafe", "stay", "activity", "other"]
Category = Literal["transport", "food", "stay", "tickets", "other"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Coordinates(StrictModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class TripCreate(StrictModel):
    destination: str = Field(min_length=1, max_length=60)
    start_date: date
    days: int = Field(default=2, ge=1, le=3)
    people: int = Field(default=1, ge=1, le=50)
    budget_vnd: int = Field(default=1500000, ge=0, le=100000000000)
    budget_scope: Literal["total", "per_person"] = "per_person"
    transport: Literal["car"] = "car"
    origin: Coordinates | None = None
    pace: Literal["relaxed", "normal", "busy"] = "normal"
    interests: list[Kind] = Field(default_factory=list, max_length=6)
    must_visit: list[int] = Field(default_factory=list, max_length=12)
    allow_unverified: bool = False
    # Explicit group estimates; unknown costs remain null elsewhere.
    lodging_total_vnd: int | None = Field(default=None, ge=0, le=100000000000)
    transport_total_vnd: int | None = Field(default=None, ge=0, le=100000000000)

    @model_validator(mode="after")
    def unique_ids(self):
        if len(set(self.must_visit)) != len(self.must_visit):
            raise ValueError("must_visit contains duplicate IDs")
        return self


class GenerateSelection(StrictModel):
    must_visit: list[int] = Field(max_length=12)

    @model_validator(mode='after')
    def unique_ids(self):
        if len(set(self.must_visit)) != len(self.must_visit) or any(p <= 0 for p in self.must_visit):
            raise ValueError('must_visit must contain unique positive IDs')
        return self


class Stop(StrictModel):
    place_id: int = Field(gt=0)
    day: int = Field(ge=1, le=3)
    start_time: str | None = Field(default=None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")


class PreviewRequest(StrictModel):
    base_version: int = Field(ge=1)
    stops: list[Stop] = Field(min_length=1, max_length=18)


class CommitRequest(StrictModel):
    base_version: int = Field(ge=1)
    preview_id: str


class ExpenseCreate(StrictModel):
    category: Category
    amount_vnd: int = Field(ge=0, le=100000000000)
    occurred_at: datetime
    note: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def require_timezone(self):
        if self.occurred_at.utcoffset() is None:
            raise ValueError("occurred_at must include timezone")
        return self


class OpeningInterval(StrictModel):
    weekday: int = Field(ge=0, le=6)
    opens_local: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    closes_local: str = Field(pattern=r"^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$")

    @model_validator(mode="after")
    def ordered(self):
        if self.opens_local >= self.closes_local:
            raise ValueError("Split overnight opening hours into two weekdays")
        return self


class Price(StrictModel):
    price_type: Literal["entry", "meal", "drink", "room", "activity", "other"]
    unit: Literal["person", "ticket", "meal", "drink", "room_night", "group"]
    min_vnd: int = Field(ge=0)
    max_vnd: int = Field(ge=0)
    valid_until: date | None = None

    @model_validator(mode="after")
    def ordered(self):
        if self.max_vnd < self.min_vnd:
            raise ValueError("max_vnd must be >= min_vnd")
        return self


class PlaceReview(StrictModel):
    quality_status: Literal["discovered", "schedulable", "verified", "archived"]
    indoor_outdoor: Literal["indoor", "outdoor", "mixed", "unknown"]
    suggested_duration_min: int = Field(ge=5, le=1440)
    rain_sensitivity: int | None = Field(default=None, ge=0, le=3)
    source_link_id: int = Field(gt=0)
    note: str = Field(min_length=3, max_length=2000)
    # A complete weekly schedule. None = unknown; missing weekdays in a supplied schedule = closed.
    opening_intervals: list[OpeningInterval] | None = Field(default=None, max_length=50)
    prices: list[Price] | None = Field(default=None, max_length=10)

    @model_validator(mode="after")
    def quality(self):
        if self.quality_status in ("schedulable", "verified") and self.indoor_outdoor == "unknown":
            raise ValueError("Scheduling requires indoor_outdoor")
        if self.quality_status == "verified" and (self.opening_intervals is None or not self.prices):
            raise ValueError("Verified requires sourced opening hours and prices (including explicit free entry)")
        intervals = sorted((i.weekday, i.opens_local, i.closes_local) for i in self.opening_intervals or [])
        for previous, current in zip(intervals, intervals[1:]):
            if previous[0] == current[0] and previous[2] > current[1]:
                raise ValueError("Opening intervals overlap")
        return self

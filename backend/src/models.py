from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Kind = Literal["attraction", "food", "cafe", "stay", "activity", "other"]
Category = Literal["transport", "food", "stay", "tickets", "other"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class RegisterRequest(StrictModel):
    full_name: str = Field(min_length=2, max_length=120)
    date_of_birth: date | None = None
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    accepted_terms_version: str | None = Field(default=None, max_length=40)


class LoginRequest(StrictModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class ProfilePatch(StrictModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = Field(default=None, min_length=5, max_length=320)
    phone: str | None = Field(default=None, max_length=40)
    default_origin: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=1000)
    preferred_pace: str | None = Field(default=None, max_length=40)
    preferred_stay: str | None = Field(default=None, max_length=80)
    dietary_preference: str | None = Field(default=None, max_length=200)


class TravelDnaMetric(StrictModel):
    key: str = Field(min_length=1, max_length=60)
    score: float = Field(ge=0, le=100)


class TravelDnaPatch(StrictModel):
    metrics: list[TravelDnaMetric] | None = Field(default=None, max_length=30)
    pace: str | None = Field(default=None, max_length=40)
    scenery_focus: str | None = Field(default=None, max_length=80)
    cuisine_priority: str | None = Field(default=None, max_length=80)


class LikeRequest(StrictModel):
    liked: bool


class VersionRequest(StrictModel):
    base_version: int = Field(ge=0)


class PublicationRequest(VersionRequest):
    is_published: bool


class FeedbackCreate(StrictModel):
    subject: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    route_origin: str = Field(min_length=1, max_length=300)


class FeedbackRating(StrictModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class AdminFeedbackPatch(StrictModel):
    category: str | None = Field(default=None, max_length=80)
    severity: str | None = Field(default=None, max_length=40)
    status: Literal["unassigned", "in_progress", "answered", "resolved"] | None = None


class FeedbackReply(StrictModel):
    message: str = Field(min_length=1, max_length=5000)


class DatasetCreate(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    test_cases: list[dict] = Field(min_length=1, max_length=1000)


class PlaceImportItem(StrictModel):
    source_place_id: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=300)
    province: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=80)
    address: str | None = Field(default=None, max_length=1000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    metadata: dict = Field(default_factory=dict)
    source_updated_at: str | None = Field(default=None, max_length=40)


class PlacesImportRequest(StrictModel):
    source: str = Field(min_length=1, max_length=80)
    batch_id: str = Field(min_length=1, max_length=120)
    items: list[PlaceImportItem] = Field(min_length=1, max_length=100)


class PlaceImageImportItem(StrictModel):
    source_image_id: str = Field(min_length=1, max_length=160)
    source_place_id: str = Field(min_length=1, max_length=120)
    image_url: str = Field(pattern=r"^https://", max_length=2000)
    thumbnail_url: str | None = Field(default=None, pattern=r"^https://", max_length=2000)
    license: str | None = Field(default=None, max_length=160)
    author: str | None = Field(default=None, max_length=300)
    width: int | None = Field(default=None, ge=1, le=50000)
    height: int | None = Field(default=None, ge=1, le=50000)
    file_size_bytes: int | None = Field(default=None, ge=0, le=10 * 1024 * 1024)
    sha256: str | None = Field(default=None, min_length=32, max_length=128)
    metadata: dict = Field(default_factory=dict)


class PlaceImagesImportRequest(StrictModel):
    source: str = Field(min_length=1, max_length=80)
    batch_id: str = Field(min_length=1, max_length=120)
    items: list[PlaceImageImportItem] = Field(min_length=1, max_length=50)


class Coordinates(StrictModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class TripCreate(StrictModel):
    destination: str = Field(min_length=1, max_length=60)
    start_date: date
    # The user may plan any number of days; only zero/negative durations are invalid.
    days: int = Field(default=2, ge=1)
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
    notes: str = Field(default="", max_length=5000)
    dna_analysis_id: str | None = Field(default=None, max_length=80)
    travel_dna_override: TravelDnaPatch | None = None

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
    day: int = Field(ge=1)
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

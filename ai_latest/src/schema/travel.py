"""Serializable travel inputs and evidence. Specialists never invent missing values."""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator


AgentName = Literal["destination_context", "poi", "transport", "budget", "weather"]
TravelMode = Literal["driving", "walking", "cycling", "bus", "train", "ferry", "flight"]
CostCategory = Literal["lodging", "food", "local_transport", "intercity_transport", "activities", "other"]
CostUnit = Literal["person_day", "person_night", "person_trip", "group_trip"]


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)


class UserPrice(BaseModel):
    """An explicit user estimate, never a verified market quote."""

    category: CostCategory
    low: str
    high: str
    currency: str
    unit: CostUnit
    description: str
    entity_id: str | None = None
    covers_category: bool = False
    includes_taxes_and_fees: bool = False


class TripRequest(BaseModel):
    destination: str | None = None
    timezone: str | None = None
    origin: str | None = None
    origin_country_code: str | None = None
    origin_coordinates: Coordinates | None = None
    start_date: str | None = None
    end_date: str | None = None
    days: int | None = Field(default=None, ge=1, le=90)
    nights: int | None = Field(default=None, ge=0, le=89)
    travelers: int | None = Field(default=None, ge=1, le=100)
    budget: str | None = None
    currency: str | None = None
    budget_scope: Literal["group", "person"] | None = None
    transport_mode: TravelMode | None = None
    max_transport_minutes: int | None = Field(default=None, ge=1, le=10080)
    min_temperature_c: float | None = Field(default=None, ge=-50, le=60, allow_inf_nan=False)
    max_temperature_c: float | None = Field(default=None, ge=-50, le=60, allow_inf_nan=False)
    max_rain_mm: float | None = Field(default=None, ge=0, le=1000, allow_inf_nan=False)
    max_wind_kmh: float | None = Field(default=None, ge=0, le=500, allow_inf_nan=False)
    poi_radius_km: float | None = Field(default=None, gt=0, le=10, allow_inf_nan=False)
    poi_categories: list[Literal["attraction", "museum", "beach", "park", "restaurant", "cafe", "market", "viewpoint"]] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    user_prices: list[UserPrice] = Field(default_factory=list)

    @model_validator(mode="after")
    def valid_timezone(self):
        if self.timezone is not None:
            from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

            try:
                ZoneInfo(self.timezone)
            except (ZoneInfoNotFoundError, ValueError):
                raise ValueError("Timezone must be a valid IANA name; install tzdata if needed.") from None
        return self


class EvidenceSource(BaseModel):
    provider: str
    reference: str
    retrieved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source_date: str | None = None
    attribution: str | None = None


class AgentAssessment(BaseModel):
    agent: AgentName
    status: Literal["complete", "partial", "needs_input", "unavailable", "needs_configuration"]
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    missing_inputs: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    sources: list[EvidenceSource] = Field(default_factory=list)
    data: dict = Field(default_factory=dict)


class CostRecord(BaseModel):
    entity_id: str
    category: CostCategory
    low: Decimal = Field(ge=0, allow_inf_nan=False)
    high: Decimal = Field(ge=0, allow_inf_nan=False)
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    unit: CostUnit
    description: str
    source_url: str
    observed_on: date
    valid_from: date
    valid_until: date
    covers_category: bool = True
    includes_taxes_and_fees: bool = False
    origin: str | None = None
    transport_mode: TravelMode | None = None

    @model_validator(mode="after")
    def validate_range(self):
        if self.high < self.low or self.valid_until < self.valid_from or self.observed_on > self.valid_until:
            raise ValueError("Invalid cost range or validity dates.")
        if not self.source_url.startswith(("https://", "http://")):
            raise ValueError("Catalog prices need a source URL.")
        return self


class TimetableRecord(BaseModel):
    origin: str
    destination_entity_id: str
    mode: TravelMode
    duration_minutes: float = Field(gt=0, allow_inf_nan=False)
    departure: str
    valid_from: date
    valid_until: date
    source_url: str
    observed_on: date

    @model_validator(mode="after")
    def validate_dates(self):
        if (self.valid_until < self.valid_from or self.observed_on > self.valid_until
                or not self.source_url.startswith(("https://", "http://"))):
            raise ValueError("Timetables need valid dates and a source URL.")
        return self


def trip_dates(trip: TripRequest) -> tuple[date, date]:
    if not trip.start_date or not trip.end_date:
        raise ValueError("start_date and end_date")
    start, end = date.fromisoformat(trip.start_date), date.fromisoformat(trip.end_date)
    if end < start or (end - start).days >= 90:
        raise ValueError("a date range of 1–90 days in chronological order")
    return start, end


class TravelSettings(BaseModel):
    """Bound work even when a deployment overrides config.yaml."""

    travel_timeout_seconds: float = Field(default=8, gt=0, le=30, allow_inf_nan=False)
    travel_candidate_limit: int = Field(default=3, ge=1, le=5)
    travel_poi_limit: int = Field(default=5, ge=1, le=10)
    travel_poi_candidate_limit: int = Field(default=40, ge=1, le=100)
    travel_poi_radius_km: float = Field(default=5, gt=0, le=10, allow_inf_nan=False)
    travel_overpass_enabled: bool = False
    travel_overpass_url: str = "https://overpass-api.de/api/interpreter"
    travel_wikidata_enabled: bool = True
    travel_ors_base_url: str = "https://api.heigit.org/openrouteservice/v2"
    travel_cost_catalog_path: str | None = None
    travel_timetable_path: str | None = None
    travel_weather_sample_years: int = Field(default=3, ge=1, le=5)
    travel_weather_heat_c: float = Field(default=34, ge=-50, le=60, allow_inf_nan=False)
    travel_weather_rain_mm: float = Field(default=10, ge=0, le=1000, allow_inf_nan=False)
    travel_weather_wind_kmh: float = Field(default=40, ge=0, le=500, allow_inf_nan=False)

    @model_validator(mode="after")
    def validate_urls(self):
        for url in (self.travel_overpass_url, self.travel_ors_base_url):
            if not url.startswith(("http://", "https://")):
                raise ValueError("Travel provider URLs must use HTTP(S).")
        return self

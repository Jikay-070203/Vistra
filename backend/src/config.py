from pathlib import Path
from urllib.parse import urlsplit

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[1]
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore", env_file_encoding="utf-8")
    database_path: Path = ROOT / "data/yourtripyourtry.db"
    database_url: str = ""
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    api_token: str = ""
    overpass_url: str = "https://overpass-api.de/api/interpreter"
    overpass_endpoints: list[str] = Field(default_factory=lambda: OVERPASS_ENDPOINTS.copy(), min_length=1, max_length=8)
    crawl_connect_timeout_seconds: float = Field(default=10, ge=1, le=60)
    crawl_delay_seconds: float = Field(default=5, ge=1)
    crawl_daily_cap: int = Field(default=40, ge=1, le=100)
    crawl_cache_hours: int = Field(default=24, ge=1)
    osrm_url: str = "https://router.project-osrm.org"
    weather_enabled: bool = True
    gemini_api_key: str = Field(default="", validation_alias=AliasChoices("GEMINI_API_KEY", "Geminai_API_KEY"))
    gemini_model: str = "gemini-3.5-flash-lite"
    auth_cookie_secure: bool = False
    auth_session_days: int = Field(default=30, ge=1, le=365)
    auth_access_minutes: int = Field(default=30, ge=5, le=1440)
    auth_refresh_days: int = Field(default=1, ge=1, le=365)
    ai_provider: str = "gemini"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    ai_config_encryption_key: str = ""
    qdrant_url: str = ""
    qdrant_api_key: str = ""
    qdrant_auto_create: bool = True
    qdrant_text_collection: str = "wikivoyage_voyage"
    qdrant_image_collection: str = "scraped_images"
    qdrant_chat_memory_collection: str = "chat_memory"
    qdrant_chat_memory_vector_size: int = Field(default=2048, ge=1, le=4096)
    qdrant_text_vector_size: int = Field(default=2048, ge=1, le=4096)
    qdrant_image_vector_size: int = Field(default=768, ge=1, le=4096)
    qdrant_distance: str = "Cosine"
    qdrant_startup_timeout_seconds: float = Field(default=10, ge=1, le=60)

    @field_validator("overpass_url")
    @classmethod
    def validate_overpass_url(cls, value: str) -> str:
        parsed = urlsplit(value)
        if (parsed.scheme != "https" or not parsed.hostname or parsed.username is not None
                or parsed.password is not None or parsed.query or parsed.fragment):
            raise ValueError("Overpass endpoints must be HTTPS URLs without credentials, query or fragment")
        return value

    @field_validator("overpass_endpoints")
    @classmethod
    def validate_overpass_endpoints(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(cls.validate_overpass_url(value) for value in values))

    @property
    def effective_overpass_endpoints(self) -> list[str]:
        # An explicit list wins; legacy OVERPASS_URL still selects the primary endpoint.
        endpoints = (self.overpass_endpoints if "overpass_endpoints" in self.model_fields_set
                     else [self.overpass_url, *self.overpass_endpoints[1:]])
        # Kumi is now Private.coffee. Resolve its old name before POSTing so a
        # redirect cannot discard the query body or hide an uncounted request.
        return list(dict.fromkeys(
            "https://overpass.private.coffee/api/interpreter"
            if endpoint == "https://overpass.kumi.systems/api/interpreter" else endpoint
            for endpoint in endpoints
        ))

    @property
    def db_path(self) -> Path:
        if self.database_url.strip():
            return self.database_url  # type: ignore[return-value]
        return self.database_path if self.database_path.is_absolute() else ROOT / self.database_path

    @property
    def uses_postgres(self) -> bool:
        return bool(self.database_url.strip())

"""Provider ownership stays in ChatService; graph construction opens no resources."""

import os

from dotenv import load_dotenv

from src.tools.catalog import LocalCatalog
from src.tools.http_client import CachedHttpClient
from src.tools.providers import Frankfurter, OpenMeteo, OpenRouteService, Overpass, Wikidata
from src.schema.travel import TravelSettings
from src.schema.verification import GuardrailSettings
from src.utils.utils import PROJECT_ROOT


class TravelTools:
    def __init__(self, config: dict, *, embedder_factory=None, http=None, catalog=None):
        config = {**config, **TravelSettings.model_validate(config).model_dump()}
        load_dotenv(PROJECT_ROOT / ".env", override=False)
        self.config = config
        self.embedder_factory = embedder_factory
        self._owns_http, self._owns_catalog = http is None, catalog is None
        guards = GuardrailSettings.model_validate(config.get("guardrails") or {})
        self.http = http if http is not None else CachedHttpClient(timeout=config.get("travel_timeout_seconds", 8),
            allowed_hosts=guards.allowed_tool_hosts)
        self.catalog = catalog if catalog is not None else LocalCatalog(config)
        self.weather = OpenMeteo(self.http)
        self.fx = Frankfurter(self.http)
        self.routing = OpenRouteService(self.http, os.getenv("ORS_API_KEY"),
                                       config.get("travel_ors_base_url", "https://api.heigit.org/openrouteservice/v2"))
        self.poi = Overpass(self.http, config.get("travel_overpass_url", "https://overpass-api.de/api/interpreter"))
        self.wikidata = Wikidata(self.http)

    def close(self):
        try:
            if self._owns_catalog:
                self.catalog.close()
        finally:
            if self._owns_http:
                self.http.close()

from collections import OrderedDict
from copy import deepcopy
from datetime import datetime, timezone
import json
import threading
import time
from urllib.parse import urlsplit

import httpx

from src.orchestration.tool_activity import tool_metadata
from src.guardrails.policy import GuardrailViolation, consume_network_call, validate_provider_url
from src.schema.verification import GuardrailSettings


class ToolUnavailable(RuntimeError):
    """A provider failure that can be returned as missing evidence."""


class CachedHttpClient:
    def __init__(self, *, timeout: float = 8, cache_size: int = 128, client=None, allowed_hosts=None):
        self.client = client if client is not None else httpx.Client(timeout=timeout, follow_redirects=False,
            headers={"User-Agent": "VISTRA/0.1 (+https://github.com/vuog23/visual-Intelligence-system-4-travel-recommendation-agents)"})
        self._owns_client = client is None
        self.cache_size = cache_size
        self.allowed_hosts = set(allowed_hosts if allowed_hosts is not None else GuardrailSettings().allowed_tool_hosts)
        self._cache = OrderedDict()
        self._last_request = {}
        self._lock = threading.Lock()

    def request(self, method: str, url: str, *, ttl: float, interval: float = 0.2, **kwargs):
        kwargs.pop("follow_redirects", None)
        try:
            validate_provider_url(url, self.allowed_hosts)
            if method.upper() not in {"GET", "POST"}:
                raise GuardrailViolation("Travel providers support only read operations through GET or POST.")
        except GuardrailViolation as exc:
            raise ToolUnavailable(str(exc)) from None
        # The cache excludes credentials; this client belongs to one ChatService.
        key = (method, url, json.dumps({k: v for k, v in kwargs.items() if k != "headers"}, sort_keys=True))
        host = urlsplit(url).netloc
        with self._lock:
            cached = self._cache.get(key)
            if cached and cached[0] > time.monotonic():
                tool_metadata(cache_hit=True)
                self._cache.move_to_end(key)
                return deepcopy(cached[1]), cached[2]
            delay = interval - (time.monotonic() - self._last_request.get(host, 0))
            if delay > 0:
                time.sleep(delay)
            self._last_request[host] = time.monotonic()
            tool_metadata(cache_hit=False)
            try:
                consume_network_call(url, self.allowed_hosts)
                response = self.client.request(method, url, follow_redirects=False, **kwargs)
                tool_metadata(http_status=response.status_code)
                response.raise_for_status()
                payload = response.json()
            except GuardrailViolation as exc:
                raise ToolUnavailable(str(exc)) from None
            except (httpx.HTTPError, ValueError) as exc:
                # Do not expose request headers, coordinates, credentials or provider bodies.
                code = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
                raise ToolUnavailable(f"{host} unavailable" + (f" (HTTP {code})" if code else "")) from None
            retrieved_at = datetime.now(timezone.utc).isoformat()
            self._cache[key] = (time.monotonic() + ttl, payload, retrieved_at)
            self._cache.move_to_end(key)
            while len(self._cache) > self.cache_size:
                self._cache.popitem(last=False)
            return deepcopy(payload), retrieved_at

    def close(self):
        if self._owns_client:
            self.client.close()

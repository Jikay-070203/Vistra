"""Input, credential, persistence and provider boundaries shared by all turns."""

from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
import ipaddress
import os
import re
from urllib.parse import parse_qsl, urlsplit

from dotenv import dotenv_values

from src.schema.verification import GuardrailSettings
from src.utils.utils import PROJECT_ROOT


class GuardrailViolation(RuntimeError):
    pass


KEY_NAMES = ("OPENAI_API_KEY", "JEV_API_KEY", "ORS_API_KEY")
KEY_PATTERN = re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b")
ASSIGNMENT = re.compile(r"(?i)\b(?:OPENAI_API_KEY|JEV_API_KEY|ORS_API_KEY|authorization|api[_ -]?key)\s*[:=]\s*[\"']?(?:Bearer\s+)?[A-Za-z0-9_./+\-=]{8,}")
EXFILTRATION = re.compile(r"(?is)\b(?:reveal|dump|print|expose|show|give)\b.{0,70}\b(?:your|server|backend|hidden|system)\b.{0,45}\b(?:api\s*keys?|credentials|secrets?|system\s*prompt)\b")
INJECTION = re.compile(r"(?i)ignore (?:all |the )?(?:previous|system|developer) instructions|<\|(?:system|developer)|(?:system|developer)\s*message\s*:")
MEMORY_CONSENT = re.compile(r"(?i)\b(?:remember|save (?:my|this) preference|keep (?:this|that) in mind)\b|(?:ghi nhớ|hãy nhớ|lưu sở thích)")
MEMORY_DENIAL = re.compile(r"(?i)\b(?:do not|don't|never|stop)\s+(?:remember|save)|(?:đừng|không)\s+(?:ghi nhớ|nhớ|lưu)")
MEMORY_NAMES = {"home_city", "travel_style", "interests", "preferred_transport", "preferred_language",
                "dietary_preferences", "accessibility_preferences"}


class CredentialRedactor:
    def __init__(self):
        values = dotenv_values(PROJECT_ROOT / ".env") if (PROJECT_ROOT / ".env").is_file() else {}
        self._secrets = sorted({str(os.getenv(key) or values.get(key) or "") for key in KEY_NAMES
                                if len(str(os.getenv(key) or values.get(key) or "")) >= 8}, key=len, reverse=True)

    def text(self, value):
        value = str(value)
        for secret in self._secrets:
            value = value.replace(secret, "[credential redacted]")
        return ASSIGNMENT.sub("[credential redacted]", KEY_PATTERN.sub("[credential redacted]", value))

    def data(self, value):
        if isinstance(value, str):
            return self.text(value)
        if isinstance(value, dict):
            return {key: self.data(item) for key, item in value.items()}
        if isinstance(value, (list, tuple)):
            return [self.data(item) for item in value]
        return value


def public_http_url(value):
    """Validate displayed URLs without following them or making DNS requests."""
    try:
        parsed = urlsplit(value)
        host = (parsed.hostname or "").lower()
        if (parsed.scheme not in {"https", "http"} or not host or parsed.username or parsed.password
                or parsed.port not in {None, 80, 443} or any(char in value for char in "\r\n<>\\")
                or host == "localhost" or host.endswith((".localhost", ".local", ".internal"))
                or any(re.search(r"(?i)key|token|secret|authorization|password", key) for key, _ in parse_qsl(parsed.query))):
            return None
        try:
            if not ipaddress.ip_address(host).is_global:
                return None
        except ValueError:
            if "." not in host:
                return None
        return value
    except (ValueError, TypeError):
        return None


@dataclass
class RunBoundary:
    settings: GuardrailSettings
    network_calls: int = 0
    model_calls: int = 0
    violations: list[str] = field(default_factory=list)


_boundary = ContextVar("vistra_run_boundary", default=None)


@contextmanager
def guardrail_scope(settings):
    boundary = RunBoundary(settings)
    token = _boundary.set(boundary)
    try:
        yield boundary
    finally:
        _boundary.reset(token)


def consume_model_call():
    boundary = _boundary.get()
    if boundary:
        if boundary.model_calls >= boundary.settings.max_model_calls:
            boundary.violations.append("model_operation_limit")
            raise GuardrailViolation("Model operation limit reached.")
        boundary.model_calls += 1


def validate_provider_url(url, allowed_hosts):
    valid = public_http_url(url)
    if not valid or urlsplit(valid).scheme != "https" or urlsplit(valid).hostname not in allowed_hosts:
        boundary = _boundary.get()
        if boundary:
            boundary.violations.append("provider_url_denied")
        raise GuardrailViolation("Provider URL is outside the configured HTTPS host allowlist.")


def consume_network_call(url, allowed_hosts):
    validate_provider_url(url, allowed_hosts)
    boundary = _boundary.get()
    if boundary:
        if boundary.network_calls >= boundary.settings.max_network_calls:
            boundary.violations.append("travel_request_limit")
            raise GuardrailViolation("Provider request limit reached.")
        boundary.network_calls += 1


def allowed_memory_updates(message, facts, redactor):
    if not MEMORY_CONSENT.search(message) or MEMORY_DENIAL.search(message):
        return []
    normalize = lambda value: " ".join(re.findall(r"\w+", value.casefold()))
    current = " " + normalize(message) + " "
    return [fact for fact in facts if fact.name in MEMORY_NAMES and not INJECTION.search(fact.value)
            and "[credential redacted]" not in fact.value
            and redactor.text(fact.value) == fact.value and normalize(fact.value)
            and " " + normalize(fact.value) + " " in current]

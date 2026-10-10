"""Contracts for evidence-bound answers and public verification reports."""

from typing import Literal

from pydantic import BaseModel, Field


class AnswerBlock(BaseModel):
    block_id: str
    kind: Literal["fact", "recommendation", "question", "limitation", "preference", "general"]
    text: str
    entity_ids: list[str] = Field(description="Exact entity IDs from evidence.entity_ids.")
    source_ids: list[str] = Field(description="Exact keys from evidence.records, including prefixes such as match:. These are not entity IDs.")


class GroundedAnswer(BaseModel):
    blocks: list[AnswerBlock]


class EvidenceQuote(BaseModel):
    source_id: str
    quote: str


class BlockReview(BaseModel):
    block_id: str
    verdict: Literal["supported", "unsupported", "contradicted", "not_factual"]
    evidence: list[EvidenceQuote]
    reason: str


class SemanticReview(BaseModel):
    # The application checks coverage itself; a model's overall verdict cannot
    # approve an omitted block or override a failed deterministic check.
    blocks: list[BlockReview]


class VerificationIssue(BaseModel):
    code: str
    message: str
    block_id: str | None = None


class AnswerVerification(BaseModel):
    status: Literal["supported", "repaired", "fallback", "blocked", "limited"]
    release_mode: Literal["reviewed_generation", "deterministic"]
    evidence_version: str
    draft_hash: str | None = None
    final_hash: str
    review_calls: int = 0
    repair_calls: int = 0
    checked_blocks: int = 0
    issues: list[VerificationIssue] = Field(default_factory=list)
    resolved_issues: list[VerificationIssue] = Field(default_factory=list)
    scope: str = "Consistency with supplied evidence; not independent real-world fact verification."


class GuardrailSettings(BaseModel):
    model_review_enabled: bool = True
    max_repairs: int = Field(default=1, ge=0, le=1)
    review_timeout_seconds: float = Field(default=20, gt=0, le=60)
    review_max_tokens: int = Field(default=4000, ge=512, le=8000)
    max_answer_chars: int = Field(default=14000, ge=1000, le=30000)
    max_blocks: int = Field(default=40, ge=1, le=80)
    max_evidence_chars: int = Field(default=48000, ge=8000, le=100000)
    max_record_chars: int = Field(default=7000, ge=1000, le=15000)
    max_message_chars: int = Field(default=4000, ge=100, le=12000)
    max_search_limit: int = Field(default=20, ge=1, le=50)
    max_network_calls: int = Field(default=32, ge=1, le=100)
    max_model_calls: int = Field(default=6, ge=1, le=10)
    allowed_tool_hosts: list[str] = Field(default_factory=lambda: [
        "api.open-meteo.com", "archive-api.open-meteo.com", "geocoding-api.open-meteo.com",
        "api.frankfurter.dev", "www.wikidata.org", "overpass-api.de", "api.heigit.org",
    ])


class GuardrailReport(BaseModel):
    status: Literal["passed", "redacted", "blocked", "limited"] = "passed"
    codes: list[str] = Field(default_factory=list)
    network_calls: int = 0
    model_calls: int = 0

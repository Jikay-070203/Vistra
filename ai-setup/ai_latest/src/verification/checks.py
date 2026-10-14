"""Deterministic release checks that model review cannot override."""

import re
import json
from decimal import Decimal, InvalidOperation

from src.guardrails.policy import CredentialRedactor, INJECTION
from src.schema.verification import VerificationIssue


def issue(code, message, block=None):
    return VerificationIssue(code=code, message=message, block_id=block[:80] if block else None)


def numeric_values(text):
    values = set()
    for value in re.findall(r"(?<![\w.])-?\d+(?:[,.]\d+)*(?![\w.])", text):
        try:
            values.add(Decimal(value.replace(",", "")))
        except InvalidOperation:
            pass
    return values


def quoted_evidence_present(quote, content):
    """Literal matching tolerates JSON escaping and display whitespace only."""
    normalize = lambda value: " ".join(value.split())
    wanted = normalize(quote)
    if len(wanted) < 4:
        return False
    if wanted in normalize(content):
        return True
    def strings(value):
        if isinstance(value, str):
            yield value
        elif isinstance(value, dict):
            for item in value.values():
                yield from strings(item)
        elif isinstance(value, list):
            for item in value:
                yield from strings(item)
    try:
        return any(wanted in normalize(value) for value in strings(json.loads(content)))
    except ValueError:
        return False


def asserts_guarantee(text):
    pattern = r"\b(?:guaranteed (?:safe|available)|fully verified|verified (?:trip|itinerary)|confirmed availability)\b"
    for match in re.finditer(pattern, text, flags=re.I):
        # Allow direct negations; semantic review still judges the full sentence.
        prefix = text[max(0, match.start()-45):match.start()]
        if not re.search(r"(?i)\b(?:not|never|no|cannot|can't|isn't|aren't|without)(?:\s+\w+){0,3}\s*$", prefix):
            return True
    return False


def check_draft(draft, evidence, settings):
    issues = []
    records = evidence["records"]
    known = set(evidence["entity_ids"])
    ineligible = {item["entity_id"] for item in evidence["constraints"] if not item["eligible"]}
    redactor = CredentialRedactor()
    if not draft.blocks or len(draft.blocks) > settings.max_blocks:
        issues.append(issue("invalid_block_count", "Answer must contain a bounded, nonempty list of blocks."))
    if sum(len(block.text) for block in draft.blocks) > settings.max_answer_chars:
        issues.append(issue("answer_too_long", "The draft exceeds the answer length limit."))
    seen = set()
    for block in draft.blocks:
        bid = block.block_id
        if not bid or bid in seen or len(bid) > 80 or not block.text.strip():
            issues.append(issue("invalid_block", "Blocks need unique short identifiers and nonempty prose.", bid))
        seen.add(bid)
        if redactor.text(block.text) != block.text or INJECTION.search(block.text):
            issues.append(issue("unsafe_output", "Credential or instruction text cannot be released.", bid))
        if re.search(r"(?i)https?://|www\.|\]\s*\(|<[^>]+>|!\[", block.text):
            issues.append(issue("uncontrolled_link", "Links and HTML must come from the citation renderer.", bid))
        if asserts_guarantee(block.text):
            issues.append(issue("unsupported_guarantee", "Evidence does not establish an end-to-end guarantee.", bid))
        if set(block.entity_ids) - known or set(block.source_ids) - records.keys():
            issues.append(issue("unknown_reference", "The draft references an entity or source outside the snapshot.", bid))
        if block.kind in {"fact", "preference", "limitation", "recommendation"} and not block.source_ids:
            issues.append(issue("missing_evidence", "This block requires explicit evidence identifiers.", bid))
        if block.kind == "recommendation" and (not block.entity_ids or ineligible.intersection(block.entity_ids)):
            issues.append(issue("constraint_violation", "Recommendations must identify eligible entities.", bid))
        supplied = "\n".join(records[sid]["content"] for sid in block.source_ids if sid in records)
        # Check explicit quantities conservatively. Repairs can use original
        # provider units; independent review still checks meaning and conversions.
        quantities = re.findall(r"(?i)(?:[$€£]\s*(-?\d[\d,.]*)|(-?\d[\d,.]*)\s*(?:USD|VND|EUR|GBP|km\b|minutes?\b|hours?\b|°C|mm\b|%))", block.text)
        for first, second in quantities:
            if not numeric_values(first or second).issubset(numeric_values(supplied)):
                issues.append(issue("unsupported_quantity", "An explicit quantity is absent from the block's declared evidence.", bid))
        for date in re.findall(r"\b\d{4}-\d{2}-\d{2}\b", block.text):
            if date not in supplied:
                issues.append(issue("unsupported_date", "A date is absent from the block's declared evidence.", bid))
        for sid in block.source_ids:
            record = records.get(sid)
            if (record and record["entity_ids"] and block.entity_ids
                    and not set(record["entity_ids"]).intersection(block.entity_ids)):
                issues.append(issue("entity_scope_mismatch", "Source and claimed entity do not share an identity.", bid))
        covered = {entity for sid in block.source_ids if sid in records for entity in records[sid]["entity_ids"]}
        if block.kind in {"fact", "recommendation"} and set(block.entity_ids) - covered:
            issues.append(issue("entity_scope_mismatch", "Every claimed entity needs corresponding scoped evidence.", bid))
    return issues


def check_review(draft, review, evidence):
    issues = []
    reviews = {item.block_id: item for item in review.blocks}
    expected = {block.block_id for block in draft.blocks}
    if set(reviews) != expected or len(reviews) != len(review.blocks):
        issues.append(issue("incomplete_review", "Independent review must cover every block exactly once."))
    for block in draft.blocks:
        item = reviews.get(block.block_id)
        if item is None:
            continue
        if item.verdict in {"unsupported", "contradicted"}:
            # Store no rejected prose, evidence quotes or arbitrary reviewer output.
            issues.append(issue("semantic_" + item.verdict, "Independent review could not support the complete block.", block.block_id))
        elif item.verdict == "not_factual":
            if block.kind not in {"general", "question"}:
                issues.append(issue("factual_block_unchecked", "A factual block cannot skip evidence review.", block.block_id))
        else:
            valid = bool(item.evidence)
            for quote in item.evidence:
                record = evidence["records"].get(quote.source_id)
                valid = valid and (quote.source_id in block.source_ids and record is not None
                    and quoted_evidence_present(quote.quote, record["content"]))
            if not valid:
                issues.append(issue("invalid_evidence_quote", "Review must quote the block's supplied evidence verbatim.", block.block_id))
    return issues

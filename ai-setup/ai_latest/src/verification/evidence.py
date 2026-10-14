"""Build the exact, bounded evidence snapshot used by draft and reviewer."""

from copy import deepcopy
from hashlib import sha256
import json

from src.guardrails.policy import CredentialRedactor, public_http_url
from src.schema.chat import restore_search_response


def digest(value):
    return sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()


def bounded_content(data, limit):
    """Reduce excerpts/lists structurally; never cut through a JSON string."""
    dump = lambda value: json.dumps(value, ensure_ascii=False, default=str)
    original = dump(data)
    if len(original) <= limit:
        return original, False

    def trim(value, chars, items):
        if isinstance(value, str):
            return value if len(value) <= chars else value[:chars] + "…"
        if isinstance(value, list):
            return [trim(item, chars, items) for item in value[:items]]
        if isinstance(value, dict):
            return {key: trim(item, chars, items) for key, item in value.items() if key != "geometry"}
        return value

    chars, items = 1500, 12
    while chars >= 24:
        reduced = dump(trim(data, chars, items))
        if len(reduced) <= limit:
            return reduced, True
        chars, items = chars // 2, max(1, items // 2)
    # A record with too much structural metadata is explicitly omitted, not
    # presented as a complete assessment with silently missing negative facts.
    return ('{"evidence_omitted": true}' if limit >= 26 else 'null'), True


def evidence_snapshot(state, settings):
    redactor = CredentialRedactor()
    records, urls, entities, pending = {}, {}, set(), []

    def references(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key in {"reference", "url", "source_url"} and isinstance(item, str):
                    yield item
                else:
                    yield from references(item)
        elif isinstance(value, list):
            for item in value:
                yield from references(item)

    def add(source_id, kind, ids, data, references=()):
        pending.append((source_id, kind, list(ids), redactor.data(data)))
        urls[source_id] = list(dict.fromkeys(url for value in references
            if value and redactor.text(str(value)) == str(value) and (url := public_http_url(str(value)))))
        entities.update(ids)

    # These constraints precede retrieved text so a large corpus cannot displace
    # the request or deterministic verdicts from the review snapshot.
    add("request", "user_input_and_parsed_state", [], {"message": state["message"],
        "parsed_trip": state.get("trip_request", {}),
        "required_photo_categories": state["response"].get("requested_categories", []),
        "search_location": state["response"].get("location"),
        "prior_user_messages": [message["content"][:1000] for message in state["conversation"].get("messages", [])
            if message.get("role") == "user"][-3:]})
    ranking = [{key: item.get(key) for key in ("entity_id", "result_number", "eligible", "provisional", "violations", "unknown_constraints")}
        | {"constraints": [{key: constraint.get(key) for key in ("constraint", "status", "reason")}
                           for constraint in item.get("constraints", [])]}
        for item in state.get("constraint_ranking", [])]
    add("constraints", "computed_constraints", [item["entity_id"] for item in ranking], ranking)
    if state.get("plan_review"):
        add("plan_review", "computed_review", [], state["plan_review"])
    if state.get("itinerary"):
        plan = state["itinerary"]
        ids = [plan["destination_id"]] if plan.get("destination_id") else []
        ids += [stop["entity_id"] for day in plan.get("days", []) for stop in day.get("stops", [])]
        add("itinerary", "computed_draft", ids, plan, references(plan))
    add("preferences", "user_preferences", [], {"visual": state.get("visual_preferences", {}),
        "dna": state.get("travel_dna", {}), "saved_memory": state.get("loaded_memory", {}),
        "pending_memory_updates": state["decision"].get("memory_updates", [])})
    response = restore_search_response(state["response"])
    for result in response.results:
        data = {"entity_id": result.entity_id, "name": result.name, "result_number": result.result_number,
                "source": result.source, "category": result.category, "province": result.province,
                "address": result.address, "latitude": result.latitude, "longitude": result.longitude,
                "missing_metadata": result.missing_metadata}
        excerpts = [{"text": str(hit.payload.get("text") or "")[:settings.max_record_chars], "url": hit.url}
                    for hit in [result, *result.evidence] if hit.source == "text"]
        data["excerpts"] = excerpts
        if result.source == "image":
            data["match_basis"] = "Retrieved by image vector similarity; not visual identification or verified scenery."
        add("match:" + result.entity_id, "retrieved_text" if excerpts else "indexed_metadata", [result.entity_id],
            data, [result.url, *[hit.url for hit in result.evidence]])
    for name, assessment in state.get("assessments", {}).items():
        # Preserve scope/status; do not promote a partial assessment to a fact.
        value = deepcopy(assessment)
        add(name + ":status", "assessment_status", [], {key: item for key, item in value.items()
            if key not in {"data", "sources"}})
        for item in value.get("data", {}).get("candidates", []):
            entity = item.get("entity_id") or item.get("for_entity_id")
            if entity:
                item.get("route", {}).pop("geometry", None)
                ids = [entity, *[poi["entity_id"] for poi in item.get("pois", []) if poi.get("entity_id")]]
                add(name + ":" + entity, "assessment", ids,
                    {"status": value.get("status"), "missing_inputs": value.get("missing_inputs"),
                     "warnings": value.get("warnings"), "data": item},
                    references(item))
        if name == "destination_context":
            for profile in value.get("data", {}).get("profiles", []):
                entity = profile["entity_id"]
                add(name + ":" + entity, "regional_context", [entity], profile,
                    references(profile))
    # Reserve a share for every source, so large retrieval excerpts cannot evict
    # later budget/weather/route evidence. Small records release their unused share.
    remaining = settings.max_evidence_chars
    priority = {"request", "constraints", "plan_review", "itinerary", "preferences"}
    for index, (source_id, kind, ids, data) in enumerate(pending):
        share = remaining // (len(pending) - index)
        if source_id in priority:
            share = max(share, min(settings.max_evidence_chars // 8, remaining - 64 * (len(pending)-index-1)))
        content, truncated = bounded_content(data, max(0, min(settings.max_record_chars, share)))
        records[source_id] = {"source_id": source_id, "kind": kind, "entity_ids": ids,
            "content": content, "truncated": truncated, "status": data.get("status") if isinstance(data, dict) else None}
        remaining -= len(content)
    # Complete compact verdicts remain outside excerpts for local checks.
    snapshot = {"records": records, "urls": urls, "entity_ids": sorted(entities),
                "constraints": ranking, "plan_status": (state.get("plan_review") or {}).get("status"),
                "location_status": response.location_status, "follow_up_status": response.follow_up_status,
                "requested_categories": response.requested_categories}
    snapshot = redactor.data(snapshot)
    snapshot["version"] = digest(snapshot)
    return snapshot

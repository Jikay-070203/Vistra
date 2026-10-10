"""Only this module turns checked prose and registered citations into Markdown."""

import html
import re
from urllib.parse import quote

from src.guardrails.policy import CredentialRedactor, public_http_url
from src.schema.chat import restore_search_response


def plain(value):
    value = html.escape(CredentialRedactor().text(value), quote=False)
    return re.sub(r"([\\`*_[\]{}()#!|>])", r"\\\1", value)


def citation(url, label="Source"):
    if public_http_url(url):
        return f"[{label}]({quote(url, safe=':/?=&%+#@')})"
    return ""


def limitations(state):
    notes = []
    if state.get("itinerary"):
        notes.append("The itinerary is a proposed schedule. Its opening hours, transfers and full-trip feasibility remain subject to the Critic's checks and unknowns.")
    if state.get("assessments"):
        notes.append("Budget figures are estimates; modeled routes are not timetables or bookings. Seasonal history does not verify future weather. Indexed sources do not confirm current safety, closures or availability.")
    return "\n\n".join(notes)


def render_checked(draft, evidence, state):
    paragraphs = []
    for block in draft.blocks:
        urls = list(dict.fromkeys(url for sid in block.source_ids for url in evidence["urls"].get(sid, [])))
        links = [citation(url, f"Source {index}") for index, url in enumerate(urls[:4], 1)]
        paragraphs.append(plain(block.text) + ("\n\n" + " · ".join(filter(None, links)) if links else ""))
    note = limitations(state)
    if note:
        paragraphs.append(note)
    return "\n\n".join(paragraphs)


def fallback_answer(state, evidence):
    """A small fixed template: identities and computed gaps, never failed prose."""
    response = restore_search_response(state["response"])
    if state.get("guardrail_answer"):
        return state["guardrail_answer"]
    conflicts = state.get("remix", {}).get("conflicts", [])
    if conflicts:
        return "Please correct the inspiration settings:\n\n" + "\n".join("- " + plain(item) for item in conflicts[:8])
    if response.location_status == "no_matching_category" and not response.results:
        categories = ", ".join(response.requested_categories)
        location = f" in **{plain(response.location)}**" if response.location else ""
        return f"I found no indexed photos matching the required **{plain(categories)}** category{location}. The dataset may lack matching labels or indexed photos. Please try another location or broaden the category."
    if response.location_status and not response.results:
        return f"I have no reliable indexed matches for **{plain(response.location or 'this location')}** in this search. Please try another location or a broader request."
    ranking = {item["entity_id"]: item for item in evidence["constraints"]}
    lines = []
    if state["decision"].get("ambiguous"):
        lines.append("Please choose a result by its number or name so I can assess the right place.")
    else:
        lines.append("I found the indexed matches below, but could not verify a detailed recommendation from the available evidence.")
    if response.results and all(result.source == "image" for result in response.results):
        lines.append("These are image-similarity candidates. Indexed labels do not verify that a place has every feature in your inspiration.")
    for index, result in enumerate(response.results[:10], 1):
        record = ranking.get(result.entity_id, {})
        labels = [plain(value) for value in (result.category, result.province) if value]
        qualifier = " — indexed as: " + ", ".join(labels) if labels else ""
        if record.get("violations"):
            qualifier += " — does not meet: " + ", ".join(plain(x) for x in record["violations"])
        if record.get("unknown_constraints"):
            qualifier += " — still unknown: " + ", ".join(plain(x) for x in record["unknown_constraints"])
        url = next(iter(evidence["urls"].get("match:" + result.entity_id, [])), None)
        link = citation(url) if url else ""
        lines.append(f"- Result {result.result_number or index}: **{plain(result.name or result.entity_id)}**{qualifier}" + (f" · {link}" if link else ""))
        if not state.get("itinerary"):
            nearby = next((item.get("pois", []) for item in state.get("assessments", {}).get("poi", {}).get("data", {}).get("candidates", [])
                if item.get("for_entity_id") == result.entity_id), [])
            for poi in nearby[:3]:
                if poi.get("name") and poi.get("entity_id") in evidence["entity_ids"]:
                    label = " (" + plain(poi["category"]) + ")" if poi.get("category") else ""
                    lines.append("  - Nearby indexed place: " + plain(poi["name"]) + label + "; visit hours are unverified.")
    plan = state.get("itinerary") or {}
    if plan:
        lines.append("\n**Draft itinerary** — proposed local times; subject to verification.")
        for day in plan.get("days", [])[:7]:
            lines.append(f"\nDay {day['day_number']}" + (f" ({plain(day['date'])})" if day.get("date") else ""))
            for stop in day.get("stops", [])[:6]:
                start, end = stop["start_minutes"], stop["end_minutes"]
                lines.append(f"- {start//60:02d}:{start%60:02d}–{end//60:02d}:{end%60:02d}: {plain(stop['name'])} (proposed)")
            if not day.get("stops"):
                lines.append("- No sourced activities could be scheduled for this day.")
        if plan.get("unscheduled"):
            reasons = list(dict.fromkeys(item["reason"] for item in plan["unscheduled"] if item.get("reason")))
            lines.extend("- Not scheduled: " + plain(reason) for reason in reasons[:3])
        gaps = [*plan.get("missing_inputs", []), *[item["message"] for item in (state.get("plan_review") or {}).get("issues", [])]]
        lines.extend("- Check needed: " + plain(item) for item in list(dict.fromkeys(gaps))[:8])
    if not response.results and not plan:
        return "Please share your destination or inspiration image, travel dates, starting city and budget so I can help with travel planning."
    note = limitations(state)
    if note:
        lines.append("\n" + note)
    return "\n".join(lines)

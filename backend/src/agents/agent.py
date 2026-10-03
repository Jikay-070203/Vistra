"""Optional Gemini intent parser. Output must be reviewed before POST /trips."""
import json

from datetime import datetime
from zoneinfo import ZoneInfo

from backend.agents.gemini import generate
from fastapi import HTTPException
from pydantic import Field, ValidationError

from backend.config import Settings
from backend.models import StrictModel, TripCreate


class IntentRequest(StrictModel):
    text: str = Field(min_length=1, max_length=4000)


def parse(settings: Settings, payload, *, client=None):
    try:
        data = IntentRequest.model_validate(payload)
    except ValidationError:
        raise HTTPException(422, "Expected {text: a non-empty string up to 4000 characters}") from None
    if not settings.gemini_api_key or not settings.gemini_model:
        raise HTTPException(503, "Set GEMINI_API_KEY and GEMINI_MODEL to enable intent parsing")
    # Strip refs for transport compatibility by asking for JSON and validating locally.
    instruction = (
        "Today in Vietnam: " + str(datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date()) + ". "
        "Ask clarification questions in Vietnamese. Extract a draft trip request for a Vietnam travel app. Return JSON only. "
        "Never invent coordinates, dates, place IDs, prices or weather. must_visit must be []. "
        "If required facts are missing, return {\"needs_clarification\": [questions]}. "
        "Destination slug must be ha-noi, ninh-binh, tp-ho-chi-minh or da-lat. "
        "Only car transport supported. Schema: " + json.dumps(TripCreate.model_json_schema())
    )
    try:
        content = generate(settings, [{"role": "user", "parts": [{"text": data.text}]}],
                           instruction, json_output=True, client=client)
        result = json.loads("".join(p.get("text", "") for p in content["parts"] if not p.get("thought")))
        if not isinstance(result, dict):
            raise ValueError("Expected object")
        if "needs_clarification" in result:
            questions = result["needs_clarification"]
            if not isinstance(questions, list) or not questions or not all(isinstance(q, str) and q.strip() for q in questions):
                raise ValueError("Malformed clarification")
            return {"needs_clarification": questions[:5], "requires_confirmation": True}
        draft = TripCreate.model_validate(result)
        if draft.destination not in {"ha-noi", "ninh-binh", "tp-ho-chi-minh", "da-lat"}:
            raise ValueError("Unsupported destination")
        # Model-provided coordinates and IDs are not accepted as facts.
        draft.origin = None
        draft.must_visit = []
        draft.lodging_total_vnd = None
        draft.transport_total_vnd = None
        return {"draft": draft.model_dump(mode="json"), "requires_confirmation": True,
                "note": "Review all extracted fields and select must-visit places from the database before creating a trip."}
    except (KeyError, IndexError, ValueError, TypeError):
        raise HTTPException(502, "AI provider failed or returned invalid structured data") from None

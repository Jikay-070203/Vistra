"""Export additional agent schemas without initializing services or providers."""

import json

from pydantic import TypeAdapter

from src.schema.itinerary import ItineraryPlan, PlanReview, VisitRecord
from src.schema.preferences import PreferenceInput, FeedbackRequest, TravelDNAProfile
from src.schema.verification import GroundedAnswer, AnswerVerification, GuardrailReport
from src.utils.utils import ensure_parent, resolve_path


def main():
    models = {"visit-hours": list[VisitRecord], "itinerary-plan": ItineraryPlan, "plan-review": PlanReview,
        "preference-input": PreferenceInput, "feedback-request": FeedbackRequest, "travel-dna-profile": TravelDNAProfile,
        "grounded-answer": GroundedAnswer, "answer-verification": AnswerVerification, "guardrail-report": GuardrailReport}
    for name, model in models.items():
        path = ensure_parent(resolve_path(f"docs/schemas/{name}.schema.json"))
        path.write_text(json.dumps(TypeAdapter(model).json_schema(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Exported {len(models)} additional agent JSON Schemas.")


if __name__ == "__main__":
    main()

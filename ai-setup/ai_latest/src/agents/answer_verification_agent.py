"""Final release gate, independent of itinerary review and before persistence."""

from openai import OpenAIError
from pydantic import ValidationError

from src.guardrails.policy import CredentialRedactor, GuardrailViolation, _boundary
from src.orchestration.progress import current_activity, progress
from src.schema.verification import AnswerVerification, GroundedAnswer, GuardrailSettings
from src.verification.checks import check_draft, check_review, issue
from src.verification.evidence import digest
from src.verification.render import fallback_answer, render_checked


class AnswerVerificationAgent:
    def __init__(self, config, generation_factory):
        self.settings = GuardrailSettings.model_validate(config.get("guardrails") or {})
        self._generation = generation_factory

    def run(self, state):
        evidence = state["answer_evidence"]
        issues, review_calls, repair_calls = [], 0, 0
        draft = None
        repair_feedback, resolved_issues = None, []
        original_hash = digest(state["answer_draft"]) if state.get("answer_draft") else None
        status = "blocked" if state.get("guardrail_answer") else "limited" if state["answer_mode"] == "deterministic" else "fallback"
        answer = fallback_answer(state, evidence)
        release_mode = "deterministic"
        progress("answer_verification", "Verifying the final answer", status="running")
        if state.get("answer_draft") and self.settings.model_review_enabled:
            try:
                draft = GroundedAnswer.model_validate(state["answer_draft"])
                generation = self._generation()
                issues = check_draft(draft, evidence, self.settings)
                if not issues:
                    review_calls += 1
                    review = generation.review_answer(draft, evidence)
                    issues = check_review(draft, review, evidence)
                    repair_feedback = review.model_dump(mode="json")
                if issues and self.settings.max_repairs:
                    initial_issues = list(issues)
                    repair_calls += 1
                    draft = generation.repair_answer(draft, evidence, issues, review_feedback=repair_feedback)
                    issues = check_draft(draft, evidence, self.settings)
                    if not issues:
                        review_calls += 1
                        issues = check_review(draft, generation.review_answer(draft, evidence), evidence)
                    if not issues:
                        resolved_issues = initial_issues
                if not issues:
                    answer = render_checked(draft, evidence, state)
                    status = "repaired" if repair_calls else "supported"
                    release_mode = "reviewed_generation"
            except (OpenAIError, ValidationError, ValueError, RuntimeError, GuardrailViolation):
                issues.append(issue("review_unavailable", "A complete verification response was unavailable; a fixed sourced fallback was used."))
        elif state["answer_mode"] != "deterministic":
            issues.append(issue("draft_unavailable" if self.settings.model_review_enabled else "model_review_disabled",
                "No fully reviewed draft was available; a fixed sourced fallback was used."))
        redactor = CredentialRedactor()
        if redactor.text(answer) != answer or len(answer) > self.settings.max_answer_chars:
            issues.append(issue("rendered_output_rejected", "Rendered output did not pass the final credential or size boundary."))
            answer = "I could not safely release this answer. Please send a shorter travel request."
            status, release_mode = "fallback", "deterministic"
        report = AnswerVerification(status=status, release_mode=release_mode,
            evidence_version=evidence["version"], draft_hash=original_hash, final_hash=digest(answer),
            review_calls=review_calls, repair_calls=repair_calls, checked_blocks=len(draft.blocks) if draft else 0,
            issues=issues, resolved_issues=resolved_issues).model_dump(mode="json")
        guards = dict(state["guardrails"])
        boundary = _boundary.get()
        if boundary:
            guards.update(network_calls=boundary.network_calls, model_calls=boundary.model_calls)
            if boundary.violations:
                guards["codes"] = list(dict.fromkeys([*guards["codes"], *boundary.violations]))
                if guards["status"] == "passed":
                    guards["status"] = "limited"
        progress("answer_verification", "Final answer: " + status, report["scope"])
        report, guards = redactor.data(report), redactor.data(guards)
        result = redactor.data(dict(state["result"]))
        result.update(answer=answer, answer_verification=report, guardrails=guards,
                      user_message=state["message"], activity=current_activity())
        return {"result": result, "answer_verification": report, "guardrails": guards}

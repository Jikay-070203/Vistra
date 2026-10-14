from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP, localcontext
import re

from src.agents.travel_agent import TravelAgent
from src.resolver.location_resolver import LocationResolver
from src.schema.travel import AgentAssessment, EvidenceSource, trip_dates
from src.tools.http_client import ToolUnavailable


def amount(value) -> Decimal:
    try:
        number = Decimal(str(value))
        if not number.is_finite() or not 0 <= number <= Decimal("1e15"):
            raise ValueError("Amounts must be finite and nonnegative")
        return number
    except (InvalidOperation, ValueError):
        raise ValueError("a nonnegative decimal amount") from None


def money(value: Decimal, currency: str) -> str:
    # Preserve common zero-decimal currencies; keep arithmetic exact until display.
    quantum = Decimal("1") if currency in {"VND", "JPY", "KRW"} else Decimal("0.01")
    return str(value.quantize(quantum, rounding=ROUND_HALF_UP))


class BudgetAgent(TravelAgent):
    name = "budget"
    title = "Estimating the trip budget"

    def assess(self, state, trip, candidates, tools):
        with localcontext() as context:
            context.prec = 50
            return self._estimate(state, trip, candidates, tools)

    def _estimate(self, state, trip, candidates, tools):
        days, nights = trip.days, trip.nights
        start = end = None
        if trip.start_date or trip.end_date:
            try:
                start, end = trip_dates(trip)
                date_days = (end - start).days + 1
                if days is not None and days != date_days:
                    raise ValueError("consistent dates and trip duration")
                days = days or date_days
                nights = nights if nights is not None else date_days - 1
            except ValueError as exc:
                return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=[str(exc)])
        currency = (trip.currency or "").upper()
        missing = [label for label, value in (("trip duration", days), ("number of nights", nights),
                                              ("number of travelers", trip.travelers)) if value is None]
        if not re.fullmatch(r"[A-Z]{3}", currency):
            missing.append("currency (ISO code)")
        if missing:
            return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=missing)
        if nights >= days:
            return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["nights fewer than trip days"])
        budget = None
        if trip.budget is not None:
            try:
                budget = amount(trip.budget)
            except ValueError:
                return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["a numeric budget amount"])
            if trip.budget_scope is None:
                return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["whether the budget is per person or for the group"])
            if trip.budget_scope == "person":
                budget *= trip.travelers
        required = {"food", "local_transport", "intercity_transport", "activities"}
        if nights:
            required.add("lodging")
        records = tools.catalog.costs()
        sources, warnings, estimates = [], [], []
        quantities = {"person_day": days * trip.travelers, "person_night": nights * trip.travelers,
                      "person_trip": trip.travelers, "group_trip": 1}
        for candidate in candidates:
            chosen, covered = [], set()
            catalog_matches = [record for record in records if record.entity_id == candidate.entity_id
                               and start is not None and record.valid_from <= start <= end <= record.valid_until
                               and record.observed_on <= date.today()
                               and (record.category != "intercity_transport" or (
                                   trip.origin and record.origin
                                   and LocationResolver._normalize(record.origin) == LocationResolver._normalize(trip.origin)
                                   and record.transport_mode == trip.transport_mode))]
            # One representative catalog range per category; different suppliers are alternatives.
            for category in sorted(required | {"other"}):
                user_quotes = [quote for quote in trip.user_prices[:30] if quote.category == category
                               and (quote.entity_id is None or quote.entity_id == candidate.entity_id)]
                if user_quotes:
                    chosen.extend((quote, True) for quote in user_quotes)
                else:
                    matches = sorted((record for record in catalog_matches if record.category == category),
                                     key=lambda record: (record.observed_on, record.description), reverse=True)
                    if matches:
                        chosen.append((matches[0], False))
            lines, low_total, high_total = [], Decimal(0), Decimal(0)
            for quote, user_supplied in chosen:
                try:
                    low, high = amount(quote.low), amount(quote.high)
                    if high < low:
                        raise ValueError("Price maximum below minimum")
                    if quote.category == "lodging" and quote.unit == "person_night" and nights == 0:
                        continue
                    rate, fx_source = tools.fx.rate(quote.currency, currency)
                except (ValueError, ToolUnavailable) as exc:
                    warnings.append(f"{candidate.entity_id}, {quote.category}: {exc}")
                    continue
                source = EvidenceSource(provider="User supplied estimate" if user_supplied else "Local sourced cost catalog",
                                        reference=state["conversation"]["conversation_id"] if user_supplied else quote.source_url,
                                        source_date=None if user_supplied else quote.observed_on.isoformat())
                sources.append(source)
                if fx_source:
                    sources.append(fx_source)
                quantity = quantities[quote.unit]
                low, high = low * quantity * rate, high * quantity * rate
                low_total += low
                high_total += high
                if quote.covers_category:
                    covered.add(quote.category)
                lines.append({"category": quote.category, "description": quote.description, "unit": quote.unit,
                    "quantity": quantity, "low": money(low, currency), "high": money(high, currency),
                    "source": source.model_dump(mode="json"), "exchange_rate": str(rate),
                    "exchange_rate_source": fx_source.model_dump(mode="json") if fx_source else None,
                    "verified_market_quote": False, "user_supplied": user_supplied})
                lines[-1]["covers_category"] = quote.covers_category
                lines[-1]["includes_taxes_and_fees"] = quote.includes_taxes_and_fees
            missing_categories = sorted(required - covered)
            if lines and not all(line["includes_taxes_and_fees"] for line in lines):
                missing_categories.append("taxes_and_fees")
            complete = not missing_categories
            verdict = "unknown"
            if budget is not None:
                if low_total > budget:
                    verdict = "known_costs_exceed_budget"
                elif complete and high_total <= budget:
                    verdict = "estimated_within_budget"
                elif complete:
                    verdict = "estimate_overlaps_budget"
            estimates.append({"entity_id": candidate.entity_id, "status": "complete" if complete else "partial",
                "days": days, "nights": nights, "travelers": trip.travelers, "currency": currency,
                "lines": lines, "known_subtotal_low": money(low_total, currency), "known_subtotal_high": money(high_total, currency),
                "complete_estimate": complete, "missing_categories": missing_categories,
                "group_budget": money(budget, currency) if budget is not None else None, "budget_verdict": verdict})
        if records and start is None:
            warnings.append("Catalog costs require travel dates; only explicit user estimates can be used without dates.")
        return AgentAssessment(agent=self.name, status="complete" if all(item["complete_estimate"] for item in estimates) else "partial",
            sources=sources, warnings=warnings, data={"candidates": estimates,
                "assumptions": ["Destination alternatives are assessed separately, not combined into an itinerary.",
                                "Intercity transport must cover the user's intended outward and return journey.",
                                "Catalog ranges are representative estimates; taxes, fees and availability need confirmation."],
                "rule": "An incomplete subtotal cannot establish affordability; no fares are inferred from road distance."})

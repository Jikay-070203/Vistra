from __future__ import annotations

from datetime import date


class BudgetTool:
    CATEGORY_KEYS = (
        "transport",
        "food",
        "stay",
        "tickets",
        "other",
    )

    PRICE_TYPE_BY_KIND = {
        "food": "meal",
        "cafe": "drink",
        "attraction": "entry",
        "activity": "activity",
    }

    BUDGET_CATEGORY_BY_KIND = {
        "food": "food",
        "cafe": "food",
        "attraction": "tickets",
        "activity": "tickets",
    }

    def estimate_place(
        self,
        place: dict,
        people: int,
        travel_date: date,
    ) -> dict | None:
        expected_type = self.PRICE_TYPE_BY_KIND.get(
            place["kind"],
            "other",
        )

        prices = [
            price
            for price in place.get("prices", [])
            if (
                price["price_type"] == expected_type
                and (
                    not price.get("valid_until")
                    or price["valid_until"][:10]
                    >= str(travel_date)
                )
            )
        ]

        if place.get("price_unknown") or not prices:
            return None

        latest = max(
            prices,
            key=lambda price: (
                price["observed_at"],
                price["id"],
            ),
        )

        factor = (
            1
            if latest["unit"] == "group"
            else people
        )

        return {
            "min_vnd": latest["min_vnd"] * factor,
            "max_vnd": latest["max_vnd"] * factor,
            "source_link_id": latest[
                "source_link_id"
            ],
            "observed_at": latest["observed_at"],
        }

    def trip_limit(self, request) -> int:
        if request.budget_scope == "per_person":
            return request.budget_vnd * request.people

        return request.budget_vnd

    def summarize(
        self,
        activities: list[dict],
        request,
    ) -> dict:
        categories = {
            key: {
                "min_vnd": 0,
                "max_vnd": 0,
                "unknown_items": 0,
            }
            for key in self.CATEGORY_KEYS
        }

        for activity in activities:
            category = self.BUDGET_CATEGORY_BY_KIND.get(
                activity["kind"],
                "other",
            )

            estimate = activity.get(
                "estimated_cost"
            )

            if estimate is None:
                categories[category][
                    "unknown_items"
                ] += 1
                continue

            categories[category]["min_vnd"] += (
                estimate["min_vnd"]
            )

            categories[category]["max_vnd"] += (
                estimate["max_vnd"]
            )

        manual = {
            "stay": request.lodging_total_vnd,
            "transport": request.transport_total_vnd,
        }

        for category, value in manual.items():
            if value is None:
                categories[category][
                    "unknown_items"
                ] = max(
                    categories[category][
                        "unknown_items"
                    ],
                    int(
                        category == "transport"
                        or request.days > 1
                    ),
                )
            else:
                categories[category][
                    "min_vnd"
                ] = value

                categories[category][
                    "max_vnd"
                ] = value

        known_min = sum(
            category["min_vnd"]
            for category in categories.values()
        )

        known_max = sum(
            category["max_vnd"]
            for category in categories.values()
        )

        incomplete = any(
            category["unknown_items"]
            for category in categories.values()
        )

        limit = self.trip_limit(request)

        return {
            "categories": categories,
            "known_min_vnd": known_min,
            "known_max_vnd": known_max,
            "complete": not incomplete,
            "limit_vnd": limit,
            "known_over_budget_vnd": max(
                0,
                known_max - limit,
            ),
        }

    def budget_fit_score(
        self,
        estimated_cost: dict | None,
        remaining_budget: int,
    ) -> float:
        """
        Recommender helper.

        1.0 = comfortably fits
        0.0 = strongly over remaining budget
        Unknown cost stays neutral instead of pretending it is free.
        """

        if estimated_cost is None:
            return 0.5

        max_cost = estimated_cost["max_vnd"]

        if remaining_budget <= 0:
            return 0.0

        ratio = max_cost / remaining_budget

        if ratio <= 0.10:
            return 1.0

        if ratio <= 0.25:
            return 0.9

        if ratio <= 0.50:
            return 0.7

        if ratio <= 0.75:
            return 0.4

        if ratio <= 1:
            return 0.2

        return 0.0
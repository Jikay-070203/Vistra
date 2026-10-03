from __future__ import annotations

from typing import Iterable

from backend.db import row, rows
from backend.places import detail, details


class PlaceTool:
    """
    Read-only access layer for travel places.

    Agent/recommender should use this instead of writing SQL directly.
    """

    def get_destination(self, db, slug: str) -> dict | None:
        return row(
            db,
            """
            SELECT *
            FROM destinations
            WHERE slug=? AND enabled=1
            """,
            (slug,),
        )

    def get_place(self, db, place_id: int) -> dict:
        return detail(db, place_id)

    def search(
        self,
        db,
        destination_id: int,
        *,
        kinds: Iterable[str] | None = None,
        quality_statuses: tuple[str, ...] = ("schedulable", "verified"),
        limit: int = 100,
    ) -> list[dict]:
        """
        Return reviewed candidate places for recommendation/planning.

        It intentionally excludes archived/discovered places by default.
        """

        if limit < 1:
            return []

        conditions = ["destination_id=?"]
        params: list[object] = [destination_id]

        if quality_statuses:
            placeholders = ",".join("?" for _ in quality_statuses)
            conditions.append(f"quality_status IN ({placeholders})")
            params.extend(quality_statuses)

        kinds = list(dict.fromkeys(kinds or []))
        if kinds:
            placeholders = ",".join("?" for _ in kinds)
            conditions.append(f"kind IN ({placeholders})")
            params.extend(kinds)

        params.append(min(limit, 500))

        place_rows = rows(
            db,
            f"""
            SELECT *
            FROM places
            WHERE {" AND ".join(conditions)}
            ORDER BY
                CASE quality_status
                    WHEN 'verified' THEN 0
                    WHEN 'schedulable' THEN 1
                    ELSE 2
                END,
                id
            LIMIT ?
            """,
            tuple(params),
        )

        return details(db, place_rows)

    def candidates_for_trip(
        self,
        db,
        destination_id: int,
        interests: list[str] | None = None,
        *,
        include_stay: bool = False,
        limit: int = 100,
    ) -> list[dict]:
        candidates = self.search(
            db,
            destination_id,
            kinds=None,
            limit=limit,
        )

        result = []

        for place in candidates:
            if not include_stay and place["kind"] == "stay":
                continue

            place = dict(place)
            place["interest_match"] = (
                place["kind"] in interests if interests else False
            )

            result.append(place)

        return result

    def get_many(self, db, place_ids: list[int]) -> list[dict]:
        if not place_ids:
            return []

        unique_ids = list(dict.fromkeys(place_ids))
        return [detail(db, place_id) for place_id in unique_ids]

    def schedulable_count(self, db, destination_id: int) -> int:
        result = row(
            db,
            """
            SELECT COUNT(*) AS count
            FROM places
            WHERE destination_id=?
              AND quality_status IN ('schedulable', 'verified')
              AND kind <> 'stay'
            """,
            (destination_id,),
        )

        return int(result["count"]) if result else 0

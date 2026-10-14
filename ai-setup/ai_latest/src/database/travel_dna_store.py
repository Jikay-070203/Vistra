"""User-scoped, idempotent explicit feedback and inspectable preference history."""

from contextlib import closing
from datetime import datetime, timezone
import json
import sqlite3

from src.schema.preferences import AttributeWeight, FeedbackRequest, TravelDNAProfile
from src.utils.utils import ensure_parent, resolve_path
from src.orchestration.tool_activity import tracked_tool, tool_metadata


class TravelDNAStore:
    def __init__(self, path):
        self.path = resolve_path(path)

    def _connect(self):
        ensure_parent(self.path)
        connection = sqlite3.connect(self.path, timeout=3)
        connection.execute("CREATE TABLE IF NOT EXISTS travel_feedback (user_id TEXT NOT NULL, event_id TEXT NOT NULL, "
            "payload_json TEXT NOT NULL, confirmed INTEGER NOT NULL, created_at TEXT NOT NULL, "
            "PRIMARY KEY(user_id, event_id))")
        return connection

    def record(self, user_id, request):
        payload = request.model_dump(mode="json", exclude={"save_preferences"})
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
        with closing(self._connect()) as connection, connection:
            # Lock the read/update pair so concurrent retries cannot apply an event twice.
            connection.execute("BEGIN IMMEDIATE")
            existing = connection.execute("SELECT payload_json, confirmed FROM travel_feedback WHERE user_id=? AND event_id=?",
                (user_id, request.event_id)).fetchone()
            if existing and existing[0] != raw:
                raise ValueError("This feedback event ID was already used for a different action.")
            if existing:
                if request.save_preferences and not existing[1]:
                    connection.execute("UPDATE travel_feedback SET confirmed=1 WHERE user_id=? AND event_id=?", (user_id, request.event_id))
                    return "saved"
                return "duplicate"
            connection.execute("INSERT INTO travel_feedback VALUES (?, ?, ?, ?, ?)",
                (user_id, request.event_id, raw, int(request.save_preferences), datetime.now(timezone.utc).isoformat()))
        return "saved" if request.save_preferences else "recorded"

    @tracked_tool("SQLite feedback", "Read confirmed Travel DNA", agent="Feedback / Travel DNA")
    def profile(self, user_id):
        tool_metadata(execution="local")
        with closing(self._connect()) as connection:
            records = connection.execute("SELECT payload_json, created_at FROM travel_feedback WHERE user_id=? AND confirmed=1 ORDER BY created_at, event_id", (user_id,)).fetchall()
        sums, counts = {}, {}
        for raw, _ in records:
            request = FeedbackRequest.model_validate({**json.loads(raw), "save_preferences": True})
            for item in request.attributes:
                sums[item.attribute] = sums.get(item.attribute, 0) + item.weight
                counts[item.attribute] = counts.get(item.attribute, 0) + 1
        return TravelDNAProfile(attributes=[AttributeWeight(attribute=key, weight=round(sums[key]/counts[key], 4)) for key in sorted(sums)],
            event_count=len(records), updated_at=records[-1][1] if records else None)

    def events(self, user_id):
        with closing(self._connect()) as connection:
            rows = connection.execute("SELECT payload_json, confirmed, created_at FROM travel_feedback WHERE user_id=? ORDER BY created_at DESC LIMIT 100", (user_id,)).fetchall()
        return [{**json.loads(raw), "saved": bool(confirmed), "created_at": created} for raw, confirmed, created in rows]

    def edit(self, user_id, event_id, attributes):
        with closing(self._connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute("SELECT payload_json, confirmed FROM travel_feedback WHERE user_id=? AND event_id=?", (user_id, event_id)).fetchone()
            if row is None:
                raise ValueError("Feedback event not found for this user.")
            request = FeedbackRequest.model_validate({**json.loads(row[0]), "attributes": attributes, "save_preferences": bool(row[1])})
            raw = json.dumps(request.model_dump(mode="json", exclude={"save_preferences"}), sort_keys=True, ensure_ascii=False)
            connection.execute("UPDATE travel_feedback SET payload_json=? WHERE user_id=? AND event_id=?", (raw, user_id, event_id))

    def remove(self, user_id, event_id=None):
        with closing(self._connect()) as connection, connection:
            if event_id is None:
                connection.execute("DELETE FROM travel_feedback WHERE user_id=?", (user_id,))
            else:
                connection.execute("DELETE FROM travel_feedback WHERE user_id=? AND event_id=?", (user_id, event_id))

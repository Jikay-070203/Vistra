from fastapi import HTTPException

from backend.db import now, row, rows
from backend.models import PlaceReview


def detail(db, place_id):
    place = row(db, "SELECT * FROM places WHERE id=?", (place_id,))
    if not place:
        raise HTTPException(404, "Place not found")
    for key, table in (("opening_intervals", "opening_intervals"), ("opening_exceptions", "opening_exceptions"),
                       ("prices", "price_estimates"), ("ratings", "place_ratings")):
        place[key] = rows(db, f"SELECT * FROM {table} WHERE place_id=?", (place_id,))
    place["sources"] = rows(db, """SELECT ps.*,s.name,s.license_url FROM place_sources ps
        JOIN sources s ON s.id=ps.source_id WHERE ps.place_id=?""", (place_id,))
    return place


def details(db, places):
    """Hydrate a candidate set with fixed query count instead of six queries per place."""
    if not places:
        return []
    indexed = {p["id"]: dict(p) for p in places}
    # Chunk below SQLite's variable limit for large destination catalogs.
    ids = list(indexed)
    for key in ("opening_intervals", "opening_exceptions", "prices", "ratings", "sources"):
        for place in indexed.values():
            place[key] = []
    for offset in range(0, len(ids), 400):
        batch = ids[offset:offset+400]
        placeholders = ",".join("?" for _ in batch)
        for key, table in (("opening_intervals", "opening_intervals"), ("opening_exceptions", "opening_exceptions"),
                           ("prices", "price_estimates"), ("ratings", "place_ratings")):
            for item in rows(db, f"SELECT * FROM {table} WHERE place_id IN ({placeholders})", batch):
                indexed[item["place_id"]][key].append(item)
        for item in rows(db, f"""SELECT ps.*,s.name,s.license_url FROM place_sources ps
                JOIN sources s ON s.id=ps.source_id WHERE ps.place_id IN ({placeholders})""", batch):
            indexed[item["place_id"]]["sources"].append(item)
    return list(indexed.values())


def review(db, place_id, data: PlaceReview):
    detail(db, place_id)
    if not row(db, "SELECT id FROM place_sources WHERE id=? AND place_id=?", (data.source_link_id, place_id)):
        raise HTTPException(422, "source_link_id must belong to this place")
    if data.quality_status in ("schedulable", "verified") and row(db, """SELECT 1 FROM dedupe_candidates
        WHERE (left_place_id=? OR right_place_id=?) AND decision='pending'""", (place_id, place_id)):
        raise HTTPException(409, "Resolve pending duplicate candidates before approving this place")
    if data.quality_status in ("schedulable", "verified") and row(db,
            "SELECT 1 FROM dedupe_candidates WHERE right_place_id=? AND decision='same'", (place_id,)):
        raise HTTPException(409, "This place is an archived duplicate; review the canonical left-hand place")
    stamp = now()
    db.execute("""UPDATE places SET quality_status=?, indoor_outdoor=?,suggested_duration_min=?,rain_sensitivity=?,
        price_unknown=?,opening_hours_unknown=?,last_verified_at=?,updated_at=? WHERE id=?""",
               (data.quality_status, data.indoor_outdoor, data.suggested_duration_min, data.rain_sensitivity,
                int(not data.prices), int(data.opening_intervals is None),
                stamp if data.quality_status == "verified" else None, stamp, place_id))
    db.execute("DELETE FROM opening_intervals WHERE place_id=?", (place_id,))
    db.execute("DELETE FROM price_estimates WHERE place_id=?", (place_id,))
    for interval in data.opening_intervals or []:
        db.execute("""INSERT INTO opening_intervals(place_id,weekday,opens_local,closes_local,source_link_id,last_checked_at)
            VALUES (?,?,?,?,?,?)""", (place_id, interval.weekday, interval.opens_local, interval.closes_local,
                                    data.source_link_id, stamp))
    for price in data.prices or []:
        db.execute("""INSERT INTO price_estimates(place_id,price_type,unit,min_vnd,max_vnd,source_link_id,observed_at,valid_until)
            VALUES (?,?,?,?,?,?,?,?)""", (place_id, price.price_type, price.unit, price.min_vnd, price.max_vnd,
                                        data.source_link_id, stamp, str(price.valid_until) if price.valid_until else None))
    db.execute("INSERT INTO place_reviews(place_id,payload_json,reviewed_at) VALUES (?,?,?)",
               (place_id, data.model_dump_json(), stamp))
    return detail(db, place_id)


def resolve_duplicate(db, left_id, right_id, decision):
    candidate = row(db, "SELECT * FROM dedupe_candidates WHERE left_place_id=? AND right_place_id=?", (left_id, right_id))
    if not candidate:
        raise HTTPException(404, "Duplicate candidate not found")
    if decision == "same":
        # Keep evidence/IDs stable. Right-hand place is archived, not deleted or silently merged.
        db.execute("UPDATE places SET quality_status='archived',updated_at=? WHERE id=?", (now(), right_id))
    db.execute("UPDATE dedupe_candidates SET decision=?,reviewed_at=? WHERE left_place_id=? AND right_place_id=?",
               (decision, now(), left_id, right_id))
    return {"left_place_id": left_id, "right_place_id": right_id, "decision": decision}

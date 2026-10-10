"""Source-backed candidates; never promote discovery records to reviewed facts."""
from backend.db import rows
from backend.places import details
from backend.catalog import distance_km


def candidates(db, destination_id, allow_unverified=False):
    statuses = ('verified', 'schedulable', 'discovered') if allow_unverified else ('verified', 'schedulable')
    placeholders = ','.join('?' for _ in statuses)
    return details(db, rows(db, f"""SELECT p.* FROM places p
        WHERE p.destination_id=? AND p.quality_status IN ({placeholders})
        AND EXISTS (SELECT 1 FROM place_sources s WHERE s.place_id=p.id)
        AND NOT EXISTS (SELECT 1 FROM dedupe_candidates d
            WHERE (d.left_place_id=p.id OR d.right_place_id=p.id) AND d.decision='pending')
        ORDER BY p.id""", (destination_id, *statuses)))


def recommendations(db, destination, itinerary=None):
    places = [p for p in candidates(db, destination['id'], allow_unverified=True)
              if p.get('latitude') is not None and p.get('longitude') is not None]
    activities = (itinerary or {}).get('activities', [])
    first = activities[0] if activities else None
    anchor = ((first.get('latitude'), first.get('longitude'))
              if first and first.get('latitude') is not None and first.get('longitude') is not None
              else (destination['center_lat'], destination['center_lon']))
    if anchor[0] is None or anchor[1] is None:
        anchor = (0.0, 0.0)
    places.sort(key=lambda p: (p['quality_status'] == 'discovered',
                              distance_km(anchor, (p['latitude'], p['longitude'])), p['id']))
    # Return every eligible, source-backed place. The frontend controls the
    # visible panel height with scrolling; recommendations must not be
    # silently truncated to a fixed number.
    return {kind: [p for p in places if p['kind'] == kind]
            for kind in ('attraction', 'food', 'stay')}

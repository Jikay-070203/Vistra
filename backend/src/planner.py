"""Deterministic MVP scheduler. Fails closed on unknown routes; warns on unknown prices/hours."""
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException

from backend.models import Stop, TripCreate
from backend.recommendations import candidates as place_candidates
from backend.catalog import distance_km

TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def minutes(text):
    h, m = map(int, text.split(":"))
    return h*60+m


def opening_windows(place, day):
    exception = next((x for x in place["opening_exceptions"] if x["local_date"] == str(day)), None)
    if exception:
        return [] if exception["closed_all_day"] else [(minutes(exception["opens_local"]), minutes(exception["closes_local"]))]
    if place["opening_hours_unknown"]:
        return None
    return [(minutes(x["opens_local"]), minutes(x["closes_local"]))
            for x in place["opening_intervals"] if x["weekday"] == day.weekday()]


def fit_start(place, day, earliest, duration, fixed=None):
    windows = opening_windows(place, day)
    windows = [(9*60, 18*60)] if windows is None else windows
    for opens, closes in sorted(windows):
        start = fixed if fixed is not None else max(earliest, opens)
        if start >= max(earliest, opens, 9*60) and start+duration <= min(closes, 18*60):
            return start
    return None


def estimated_cost(place, people, day):
    expected = {"food": "meal", "cafe": "drink", "attraction": "entry", "activity": "activity"}.get(place["kind"], "other")
    prices = [p for p in place["prices"] if p["price_type"] == expected and
              (not p["valid_until"] or p["valid_until"][:10] >= str(day))]
    if place["price_unknown"] or not prices:
        return None
    # The admin's most recent estimate for the relevant category. Never sum alternatives.
    price = max(prices, key=lambda p: (p["observed_at"], p["id"]))
    factor = 1 if price["unit"] == "group" else people
    return {"min_vnd": price["min_vnd"]*factor, "max_vnd": price["max_vnd"]*factor,
            "source_link_id": price["source_link_id"], "observed_at": price["observed_at"]}


def build(db, request: TripCreate, destination, services, stops: list[Stop] | None = None):
    # Imported records can be valid metadata while still lacking coordinates.
    # They must not enter route-distance calculations until coordinates exist.
    candidates = [p for p in place_candidates(db, destination['id'], request.allow_unverified)
                  if p['kind'] != 'stay' and p.get('latitude') is not None and p.get('longitude') is not None]
    for p in candidates:
        p['duration_estimated'] = p['suggested_duration_min'] is None
        if p['duration_estimated']:
            p['suggested_duration_min'] = {'food': 60, 'cafe': 45, 'attraction': 90, 'activity': 90}.get(p['kind'], 60)
    available = {p["id"]: p for p in candidates}
    missing = set(request.must_visit) - available.keys()
    if missing:
        raise HTTPException(422, {"code": "must_visit_unavailable", "place_ids": sorted(missing)})
    if not candidates:
        raise HTTPException(422, "No reviewed schedulable places. Crawl and review data first.")
    if stops:
        ids = [s.place_id for s in stops]
        if len(set(ids)) != len(ids) or set(ids) - available.keys() or any(s.day > request.days for s in stops):
            raise HTTPException(422, "Stops must be unique, reviewed, in destination and within trip dates")
        if set(request.must_visit) - set(ids):
            raise HTTPException(422, "Revision would remove a must-visit place")
    activities, legs, warnings, used = [], [], [], set()
    last_coord = ((request.origin.latitude, request.origin.longitude) if request.origin else
                  (destination['center_lat'], destination['center_lon']))
    if last_coord[0] is None or last_coord[1] is None:
        last_coord = None
    # The destination center orders the first candidates; it is not an inbound route.
    first_stop = True
    last_place = None
    target = {"relaxed": 3, "normal": 4, "busy": 5}[request.pace]
    break_min = {"relaxed": 30, "normal": 15, "busy": 10}[request.pace]
    if request.origin is None:
        warnings.append("Chưa cung cấp điểm xuất phát: không tính chặng di chuyển vào điểm đến.")
    for day_index in range(1, request.days+1):
        day = request.start_date + timedelta(days=day_index-1)
        cursor = 9*60
        count = 0
        food_selected = False
        pending = [s for s in stops or [] if s.day == day_index]
        if stops and not pending:
            warnings.append(f"Ngày {day_index}: chưa có hoạt động phù hợp.")
        while pending if stops else count < target:
            if stops:
                ordered = [available[pending[0].place_id]]
            else:
                remaining = [p for p in candidates if p["id"] not in used]
                # Must-visits first; reserve a meal when possible. Distance only orders candidates, never estimates travel time.
                meal_slot = not food_selected and (cursor >= 11*60 or count == target-1)
                # Keep one ordinary meal per day; don't consume tomorrow's restaurants
                # just because today's last restaurant is closest. Explicit must-visits win.
                remaining = [p for p in remaining if p['kind'] != 'food'
                             or p['id'] in request.must_visit or meal_slot]
                ordered = sorted(remaining, key=lambda p: (
                    p["id"] not in request.must_visit,
                    not (meal_slot and p["kind"] == "food"),
                    p["kind"] not in request.interests if request.interests else False,
            distance_km(last_coord, (p["latitude"], p["longitude"]))
            if last_coord and last_coord[0] is not None and last_coord[1] is not None else 0,
                    p["quality_status"] != "verified", p["id"]))[:15]
            chosen = None
            for place in ordered:
                # Reject closed/full-day candidates before requesting a road route.
                fixed = minutes(pending[0].start_time) if stops and pending[0].start_time else None
                if fit_start(place, day, cursor, place["suggested_duration_min"], fixed) is None:
                    continue
                coord = (place["latitude"], place["longitude"])
                route = services.route(db, last_coord, coord) if not first_stop or request.origin else None
                travel = route["duration_min"] if route else 0
                earliest = cursor+travel
                if not stops and place["kind"] == "food":
                    earliest = max(earliest, 11*60)
                fixed = minutes(pending[0].start_time) if stops and pending[0].start_time else None
                start = fit_start(place, day, earliest, place["suggested_duration_min"], fixed)
                if start is not None:
                    chosen = (place, coord, route, start)
                    break
            if not chosen:
                if stops:
                    raise HTTPException(422, {"code": "schedule_conflict", "place_id": pending[0].place_id,
                                              "day": day_index, "reason": "Opening hours, travel time or 09:00–18:00 day window conflict"})
                break
            place, coord, route, start = chosen
            duration = place["suggested_duration_min"]
            base = datetime.combine(day, time(), tzinfo=TZ)
            cost = estimated_cost(place, request.people, day)
            notes = []
            if place['quality_status'] == 'discovered':
                notes.append('Địa điểm chưa được kiểm chứng; đây là gợi ý tham khảo, cần xác nhận trước khi đi.')
            if place['duration_estimated']:
                notes.append(f'Thời lượng {duration} phút là ước tính để xếp lịch, chưa được kiểm chứng tại địa điểm.')
            if place["opening_hours_unknown"]:
                notes.append("Opening hours unverified; confirm before visiting.")
            if cost is None:
                notes.append("Price unknown; excluded from known subtotal.")
            if route:
                legs.append({**route, "day": day_index, "from_place_id": last_place, "to_place_id": place["id"],
                             "depart_at": (base+timedelta(minutes=cursor)).isoformat(),
                             "arrive_at": (base+timedelta(minutes=cursor+route["duration_min"])).isoformat()})
            activities.append(dict(place_id=place["id"], name=place["display_name"], kind=place["kind"], day=day_index,
                                   place_updated_at=place["updated_at"],
                                   quality_status=place['quality_status'], duration_estimated=place['duration_estimated'],
                                   latitude=place["latitude"], longitude=place["longitude"],
                                   start_at=(base+timedelta(minutes=start)).isoformat(),
                                   end_at=(base+timedelta(minutes=start+duration)).isoformat(),
                                   estimated_cost=cost, notes=notes, indoor_outdoor=place["indoor_outdoor"],
                                   sources=place["sources"], reason="Required by traveler" if place["id"] in request.must_visit else "Fits daily schedule and selected preferences"))
            used.add(place["id"])
            last_coord, last_place = coord, place["id"]
            first_stop = False
            cursor = start+duration+break_min
            count += 1
            food_selected |= place["kind"] == "food"
            if stops:
                pending.pop(0)
        if not food_selected:
            warnings.append(f"Ngày {day_index}: chưa có điểm ăn uống phù hợp; bạn có thể thêm thủ công.")
        if count == 0 and not stops:
            warnings.append(f"Ngày {day_index}: chưa có hoạt động đã kiểm duyệt phù hợp với các lựa chọn còn lại.")
    missing = set(request.must_visit) - used
    if missing:
        raise HTTPException(422, {"code": "must_visit_cannot_fit", "place_ids": sorted(missing),
                                  "reason": "Heuristic could not fit these places; adjust pace, days or opening constraints"})
    if not activities:
        raise HTTPException(422, "No activities fit opening hours and available time")
    weather = services.weather(db, destination, request.start_date, request.days)
    if weather["type"] == "forecast":
        hourly = weather["hourly"]
        for activity in activities:
            probabilities = [p for t, p in zip(hourly.get("time", []), hourly.get("precipitation_probability", []))
                             if p is not None and t[:13] >= activity["start_at"][:13] and t[:13] <= activity["end_at"][:13]]
            if probabilities and max(probabilities) >= 60 and activity["indoor_outdoor"] != "indoor":
                activity["notes"].append("Rain forecast >=60% during this activity; consider an indoor alternative.")
    else:
        warnings.append("Chưa có dữ liệu thời tiết cho các ngày này; lịch trình chưa được tối ưu theo thời tiết.")
    budget = {category: {"min_vnd": 0, "max_vnd": 0, "unknown_items": 0}
              for category in ("transport", "food", "stay", "tickets", "other")}
    for activity in activities:
        category = "food" if activity["kind"] in ("food", "cafe") else "tickets"
        if activity["estimated_cost"] is None:
            budget[category]["unknown_items"] += 1
        else:
            for key in ("min_vnd", "max_vnd"):
                budget[category][key] += activity["estimated_cost"][key]
    for category, value in (("stay", request.lodging_total_vnd), ("transport", request.transport_total_vnd)):
        if value is None:
            budget[category]["unknown_items"] = int(category == "transport" or request.days > 1)
        else:
            budget[category].update(min_vnd=value, max_vnd=value)
    total = sum(x["max_vnd"] for x in budget.values())
    limit = request.budget_vnd * (request.people if request.budget_scope == "per_person" else 1)
    incomplete = any(x["unknown_items"] for x in budget.values())
    if total > limit:
        warnings.append(f"Ước tính chi phí tối đa đã biết vượt ngân sách {total-limit:,} VNĐ.")
    if incomplete:
        warnings.append("Ngân sách chưa đầy đủ: chi phí chưa biết không được xem là bằng 0 hoặc chắc chắn nằm trong ngân sách.")
    warnings.append("Tuyến đường là ước tính bằng ô tô, chưa tính giao thông trực tiếp; không bao gồm đường vòng đến khách sạn và chặng quay về.")
    return dict(activities=activities, route_legs=legs, weather=weather, warnings=warnings,
                provisional=any(a['quality_status'] == 'discovered' for a in activities),
                budget=dict(categories=budget, known_min_vnd=sum(x["min_vnd"] for x in budget.values()),
                            known_max_vnd=total, complete=not incomplete, limit_vnd=limit,
                            known_over_budget_vnd=max(0, total-limit)), timezone="Asia/Ho_Chi_Minh")

import re

import numpy as np

from src.agents.travel_agent import TravelAgent
from src.resolver.location_resolver import LocationResolver
from src.schema.travel import AgentAssessment, EvidenceSource
from src.tools.catalog import coordinates, distance_km
from src.tools.http_client import ToolUnavailable
from src.tools.providers import Overpass


class POIAgent(TravelAgent):
    name = "poi"
    title = "Finding local experiences"

    @staticmethod
    def category(record):
        tags = record.get("tags") or {}
        category = str(record.get("category") or "").casefold()
        for label, (key, value) in Overpass.categories.items():
            if tags.get(key) == value or category == label or category == value:
                return label
        return category or None

    def assess(self, state, trip, candidates, tools):
        radius = trip.poi_radius_km or self.config.get("travel_poi_radius_km", 5)
        location = state["response"].get("location")
        scope = tools.catalog.scope(location) if location else None
        if location and scope is None:
            return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["a verified POI location scope"])
        allowed = set(scope.place_ids) if scope else None
        entries, sources, warnings = [], [], []
        limit = self.config.get("travel_poi_candidate_limit", 40)
        for candidate in candidates:
            center = coordinates({"latitude": candidate.latitude, "longitude": candidate.longitude})
            if center is None:
                warnings.append(f"{candidate.entity_id}: no coordinates; nearby POIs cannot be assessed.")
                continue
            nearby = []
            for place in tools.catalog.places:
                place_id = str(place.get("osm_id", ""))
                point = coordinates(place)
                category = self.category(place)
                if (point is None or (allowed is not None and place_id not in allowed)
                        or (trip.poi_categories and category not in trip.poi_categories)):
                    continue
                distance = distance_km(center, point)
                if distance <= radius and place.get("name"):
                    nearby.append({"entity_id": f"osm:{place_id}", "name": place["name"], "category": category,
                        "coordinates": point.model_dump(), "distance_km": round(distance, 3),
                        "tags": place.get("tags") or {}, "url": place.get("url"), "provider": "Local SQLite"})
            nearby.sort(key=lambda item: item["distance_km"])
            nearby = nearby[:limit]
            local_source = EvidenceSource(provider="Local SQLite", reference=str(tools.catalog.config["sqlite_path"]))
            sources.append(local_source)
            for item in nearby:
                item["source"] = local_source.model_dump(mode="json")
            if self.config.get("travel_overpass_enabled", False) and len(nearby) < self.config.get("travel_poi_limit", 5):
                try:
                    elements, source = tools.poi.nearby(center, radius, trip.poi_categories, limit)
                    sources.append(source)
                    for element in elements:
                        tags = element.get("tags") or {}
                        place_id = f'{element.get("type")}/{element.get("id")}'
                        point = coordinates(element.get("center") or element)
                        address_labels = [tags.get(key, "") for key in ("addr:province", "addr:city", "addr:state")]
                        # Radius alone cannot prove membership in a requested administrative location.
                        verified_scope = (allowed is None or place_id in allowed or any(
                            label and LocationResolver._normalize(label) == LocationResolver._normalize(scope.name)
                            for label in address_labels))
                        if (not verified_scope or not tags.get("name") or point is None
                                or distance_km(center, point) > radius or not re.fullmatch(r"(?:node|way|relation)/\d+", place_id)):
                            continue
                        nearby.append({"entity_id": f"osm:{place_id}", "name": tags["name"], "category": self.category({"tags": tags}),
                            "coordinates": point.model_dump(), "distance_km": round(distance_km(center, point), 3),
                            "tags": tags, "url": f"https://www.openstreetmap.org/{place_id}", "provider": "Overpass",
                            "source": source.model_dump(mode="json")})
                except ToolUnavailable as exc:
                    warnings.append(f"{candidate.entity_id}: {exc}")
            unique = {item["entity_id"]: item for item in nearby if item["entity_id"] != candidate.entity_id}
            ranked = list(unique.values())
            if trip.interests and ranked and tools.embedder_factory:
                try:
                    embedder = tools.embedder_factory()
                    documents = [f'{item["name"]} {item["category"] or ""}' for item in ranked]
                    vectors = np.asarray(embedder.embed_documents(documents), dtype=float)
                    query = np.asarray(embedder.embed_query(" ".join(trip.interests[:10])), dtype=float)
                    denominator = np.linalg.norm(vectors, axis=1) * np.linalg.norm(query)
                    scores = np.divide(vectors @ query, denominator, out=np.zeros(len(ranked)), where=denominator != 0)
                    for item, score in zip(ranked, scores, strict=True):
                        item["interest_similarity"] = round(float(score), 4)
                    ranked.sort(key=lambda item: (-item["interest_similarity"], item["distance_km"]))
                except (OSError, RuntimeError):
                    warnings.append(f"{candidate.entity_id}: local interest ranking unavailable; POIs ordered by distance.")
                    ranked.sort(key=lambda item: item["distance_km"])
            else:
                ranked.sort(key=lambda item: item["distance_km"])
            ranked = ranked[:self.config.get("travel_poi_limit", 5)]
            for item in ranked:
                # Only verified IDs from OSM tags can connect a POI to Wikidata.
                qid = item["tags"].get("wikidata")
                if qid and self.config.get("travel_wikidata_enabled", True):
                    try:
                        item["wikidata"], source = tools.wikidata.entity(str(qid))
                        item["wikidata_source"] = source.model_dump(mode="json")
                        sources.append(source)
                    except ToolUnavailable as exc:
                        warnings.append(f'{item["entity_id"]}: {exc}')
                item["tags"] = {key: str(value)[:500] for key, value in item["tags"].items()
                                if key in {"opening_hours", "wheelchair", "website", "cuisine", "fee", "wikidata"}}
            entries.append({"for_entity_id": candidate.entity_id, "radius_km": radius,
                            "scope": scope.name if scope else "radius around candidate",
                            "pois": ranked})
        if not entries:
            return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["destination coordinates"], warnings=warnings)
        return AgentAssessment(agent=self.name, status="partial", sources=sources, warnings=warnings,
            data={"candidates": entries, "distance_kind": "straight_line; not walking distance",
                  "coverage": "bounded local catalog and optional live query; not exhaustive",
                  "crowding": "unmeasured", "availability": "opening_hours tags are unverified; live availability unknown"})

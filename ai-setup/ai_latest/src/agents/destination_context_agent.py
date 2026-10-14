from src.agents.travel_agent import TravelAgent
from src.schema.chat import restore_search_response
from src.schema.travel import AgentAssessment, EvidenceSource
from src.tools.http_client import ToolUnavailable


class DestinationContextAgent(TravelAgent):
    name = "destination_context"
    title = "Reading destination context"

    def assess(self, state, trip, candidates, tools):
        response = restore_search_response(state["response"])
        profiles, sources, warnings = [], [], []
        for result in candidates:
            record = result.metadata.get("place") or {}
            tags = record.get("tags") or {}
            source = EvidenceSource(provider="Local indexed metadata", reference=result.url or result.entity_id,
                                    source_date=record.get("last_checked"))
            sources.append(source)
            profile = {"entity_id": result.entity_id, "name": result.name,
                       "coordinates": {"latitude": result.latitude, "longitude": result.longitude},
                       "facts": {"category": result.category, "province": result.province,
                                 "address": result.address, "opening_hours": tags.get("opening_hours"),
                                 "wheelchair": tags.get("wheelchair"), "website": tags.get("website")},
                       "metadata_source": source.model_dump(mode="json"), "guide_excerpts": []}
            # Only reviewed mappings can attach regional guide context to an image POI.
            guide_results = [result] if result.source == "text" else []
            destination = result.destination
            if (destination and destination.method == "curated_mapping"
                    and destination.source_entity_id == result.entity_id
                    and destination.page_id is not None
                    and destination.destination_id == f"wikivoyage:{destination.page_id}"):
                guide_results.extend(hit for hit in response.related_results if hit.entity_id == destination.destination_id)
            seen = set()
            for guide in guide_results:
                for hit in [guide, *guide.evidence]:
                    text = hit.payload.get("text") if hit.source == "text" else None
                    if not text or text in seen:
                        continue
                    seen.add(text)
                    excerpt_source = EvidenceSource(provider="Wikivoyage index", reference=hit.url or hit.entity_id)
                    sources.append(excerpt_source)
                    profile["guide_excerpts"].append({"entity_id": guide.entity_id,
                        "scope": "destination" if guide.entity_id != result.entity_id else "this_entity",
                        "section": hit.payload.get("section"), "text": text[:self.config["generation_excerpt_chars"]],
                        "source": excerpt_source.model_dump(mode="json")})
                    if len(profile["guide_excerpts"]) >= self.config["generation_context_hits"]:
                        break
            qid = tags.get("wikidata") or record.get("wikidata")
            if qid and self.config.get("travel_wikidata_enabled", True):
                try:
                    profile["wikidata"], wikidata_source = tools.wikidata.entity(str(qid))
                    sources.append(wikidata_source)
                    profile["wikidata_source"] = wikidata_source.model_dump(mode="json")
                except ToolUnavailable as exc:
                    warnings.append(f"{result.entity_id}: {exc}")
            profile["missing_facts"] = [key for key, value in profile["facts"].items() if value in (None, "")]
            profile["missing_facts"].extend(["verified_current_safety_advisories", "verified_current_closures"])
            profiles.append(profile)
        return AgentAssessment(agent=self.name, status="partial", sources=sources, warnings=warnings,
                               data={"profiles": profiles, "rule": "Regional excerpts do not establish individual POI facts."})

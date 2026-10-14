"""Compose same-model image inspirations; constraints remain structured."""

import numpy as np

from src.orchestration.progress import progress
from src.orchestration.tool_activity import agent_activity, tool_call, tool_metadata
from src.schema.preferences import PreferenceInput, RemixProfile


class TravelRemixAgent:
    name = "travel_remix"

    def run(self, state):
        profile = state.get("visual_preferences") or {}
        paths, vectors = state.get("inspiration_paths", []), state.get("inspiration_vectors", [])
        if not paths and not profile.get("preferences"):
            return {"remix": {}, "remix_vector": None}
        intent = state["decision"].get("workflow", {})
        supplied = PreferenceInput.model_validate(state.get("preference_input") or {})
        raw_weights = supplied.image_weights or intent.get("image_weights") or [1.0] * len(paths)
        warnings, conflicts = [], []
        try:
            weights = np.asarray(raw_weights, dtype=float)
            if len(weights) != len(paths) or not np.isfinite(weights).all() or np.any(weights < 0) or (len(paths) and weights.sum() <= 0):
                raise ValueError("Image weights must align with inspiration images")
            weights = weights / weights.sum() if len(weights) else weights
        except ValueError:
            weights = np.zeros(len(paths))
            conflicts.append("Provide one nonnegative weight per image, with a positive total.")
        preferences = profile.get("preferences", [])
        desired = [item["attribute"].replace("_", " ") for item in preferences if item["weight"] > 0]
        avoided = [item["attribute"].replace("_", " ") for item in preferences if item["weight"] < 0]
        query = ", ".join(desired)
        if {"urban", "rural"} <= {item["attribute"] for item in preferences if item["weight"] > 0}:
            warnings.append("Urban and rural preferences may require different experiences within a destination.")
        fused = None
        with agent_activity("Travel Remix"), tool_call("Local vector composition", "Combine inspiration weights"):
            tool_metadata(execution="local")
            progress("travel_remix", "Combining travel inspirations", status="running")
            if vectors and len(vectors) == len(paths) and not conflicts:
                try:
                    matrix = np.asarray(vectors, dtype=float)
                    if matrix.ndim == 2 and np.isfinite(matrix).all():
                        vector = weights @ matrix
                        norm = np.linalg.norm(vector)
                        if norm > 0:
                            fused = (vector / norm).tolist()
                except ValueError:
                    pass
                if fused is None:
                    conflicts.append("The supplied inspiration vectors cannot form a compatible query.")
            if len(paths) > 1:
                warnings.append("Whole-image blending combines overall appearance; it does not isolate architecture or scenery from individual photos.")
            if avoided:
                warnings.append("Avoided attributes affect preference reranking; absence cannot be verified from similarity alone.")
            remix = RemixProfile(status="needs_input" if conflicts else "complete" if fused or query else "partial",
                image_ids=profile.get("image_ids", []), image_weights=weights.tolist(), attributes=preferences,
                query=query, conflicts=conflicts, warnings=warnings)
            decision = dict(state["decision"])
            if query and not decision["follow_up"]:
                decision["search_options"] = {**decision["search_options"], "visual_query": query}
                if fused is None:
                    decision["route"] = "image_text"
            progress("travel_remix", "Travel inspirations combined", f"{len(paths)} images; {len(preferences)} editable attributes.")
            return {"remix": remix.model_dump(mode="json"), "remix_vector": fused, "decision": decision}

"""Suggest visual attributes locally; only explicit preferences drive attribute edits."""

from pathlib import Path

import numpy as np

from src.orchestration.progress import progress
from src.orchestration.tool_activity import agent_activity
from src.schema.chat import Conversation
from src.schema.preferences import AttributeWeight, PreferenceInput, VisualObservation, VisualPreferenceProfile


ATTRIBUTE_PROMPTS = {
    "coast": "A travel photograph of a beach and coastline",
    "mountains": "A travel photograph of mountain scenery",
    "forest": "A travel photograph of a forest and trees",
    "historic_architecture": "A travel photograph of historic traditional architecture",
    "modern_architecture": "A travel photograph of modern buildings",
    "cafes": "A travel photograph of a cafe and outdoor seating",
    "nightlife": "A travel photograph of nightlife and illuminated streets",
    "urban": "A travel photograph of a dense city street",
    "rural": "A travel photograph of countryside and a rural village",
    "water": "A travel photograph of a lake or river",
    "museums": "A travel photograph of a museum exhibition",
    "parks": "A travel photograph of a public park and gardens",
}


class VisualPreferenceAgent:
    name = "visual_preference"

    def __init__(self, config, embedder_factory):
        self.config, self._embedder = config, embedder_factory
        self._prompt_vectors = None
        self._images = {}

    def run(self, state):
        intent = state["decision"].get("workflow", {})
        conversation = Conversation.from_dict(state["conversation"])
        supplied = PreferenceInput.model_validate(state.get("preference_input") or {})
        paths = list(state.get("image_paths") or ([state["image_path"]] if state["image_path"] else []))
        if not paths and (intent.get("use_inspiration_gallery") or intent.get("refine_visual_preferences") or supplied.confirmed):
            paths = conversation.inspiration_paths or ([conversation.image_path] if conversation.image_path else [])
        if not paths and state["decision"].get("active_image"):
            paths = [state["decision"]["active_image"]]
        paths = [path for path in paths[:5] if Path(path).is_file()]
        explicit = supplied.attributes if supplied.confirmed else [AttributeWeight.model_validate(item) for item in intent.get("visual_preferences", [])]
        if not explicit and intent.get("refine_visual_preferences"):
            explicit = [AttributeWeight.model_validate(item) for item in conversation.visual_preferences.get("preferences", [])]
        elif explicit and intent.get("refine_visual_preferences") and not supplied.confirmed:
            merged = {item["attribute"]: AttributeWeight.model_validate(item) for item in conversation.visual_preferences.get("preferences", [])}
            merged.update({item.attribute: item for item in explicit})
            explicit = list(merged.values())
        if not explicit and paths:
            explicit = [AttributeWeight.model_validate(item) for item in state.get("travel_dna", {}).get("attributes", [])]
        if not paths and not explicit:
            return {"visual_preferences": {}, "inspiration_paths": [], "inspiration_vectors": []}
        with agent_activity("Visual Preference"):
            progress("visual_preference", "Reading inspiration preferences", status="running")
            observations, vectors, warnings = [], [], []
            image_ids = [Path(path).stem for path in paths]
            try:
                if paths:
                    if self._embedder is None:
                        raise RuntimeError("Visual embedding service is not configured")
                    embedder = self._embedder()
                    if self._prompt_vectors is None:
                        self._prompt_vectors = self._unit(np.asarray(embedder.embed_text(list(ATTRIBUTE_PROMPTS.values())), dtype=float))
                    for image_id, path in zip(image_ids, paths, strict=True):
                        stamp = (str(Path(path).resolve()), Path(path).stat().st_mtime_ns)
                        vector = self._images.get(stamp)
                        if vector is None:
                            vector = self._unit(np.asarray(embedder.embed_image(path), dtype=float).reshape(1, -1))[0]
                            self._images[stamp] = vector
                            while len(self._images) > 16:
                                self._images.pop(next(iter(self._images)))
                        if vector.shape[0] != self._prompt_vectors.shape[1]:
                            raise ValueError("Incompatible visual embedding dimensions")
                        vectors.append(vector.tolist())
                        scores = self._prompt_vectors @ vector
                        for attribute, score in zip(ATTRIBUTE_PROMPTS, scores, strict=True):
                            observations.append(VisualObservation(image_id=image_id, attribute=attribute,
                                similarity=float(np.clip(score, -1, 1))))
            except (OSError, RuntimeError, ValueError, ImportError):
                vectors = []
                warnings.append("Local visual attribute suggestions are unavailable; explicit preferences remain usable.")
            warnings.append("Visual similarities are tentative observations, not confidence percentages or proof of crowding, safety, identity, or accessibility.")
            profile = VisualPreferenceProfile(status="complete" if explicit else "partial", observations=observations,
                preferences=explicit, image_ids=image_ids, confirmed=bool(explicit), warnings=warnings)
            progress("visual_preference", "Inspiration preferences prepared", f"{len(paths)} images; {len(explicit)} explicit attributes.")
            return {"visual_preferences": profile.model_dump(mode="json"), "inspiration_vectors": vectors, "inspiration_paths": paths}

    @staticmethod
    def _unit(vectors):
        if vectors.ndim != 2 or not np.isfinite(vectors).all():
            raise ValueError("Expected finite embedding vectors")
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        if np.any(norms <= 0):
            raise ValueError("Cannot normalize empty vectors")
        return vectors / norms

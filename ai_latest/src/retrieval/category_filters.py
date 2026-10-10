"""Explicit photo categories narrow the metadata scope before vector ranking."""

import re


CATEGORY_ALIASES = {
    "beach": {"beach"}, "museum": {"museum"}, "park": {"park", "garden"},
    "restaurant": {"restaurant"}, "cafe": {"cafe"},
    "market": {"market", "marketplace"}, "viewpoint": {"viewpoint"},
    "attraction": {"attraction"},
}


def explicit_photo_categories(query):
    """Recognize direct English photo requests; other phrasing uses ChatPlan."""
    match = re.search(r"\b(?:images?|photos?|pictures?)\s+(?:of|showing)\s+(.+)", query or "", re.I)
    if not match:
        return []
    subject = match.group(1)
    categories = []
    for category in CATEGORY_ALIASES:
        plural = "beaches" if category == "beach" else category + "s"
        for token in re.finditer(r"\b(?:" + category + "|" + plural + r")\b", subject, re.I):
            prefix = subject[max(0, token.start()-25):token.start()]
            if not re.search(r"\b(?:not|no|without|excluding)(?:\s+\w+){0,2}\s*$", prefix, re.I):
                categories.append(category)
                break
    return categories


def checked_categories(values):
    categories = list(dict.fromkeys(values or []))
    if set(categories) - CATEGORY_ALIASES.keys():
        raise ValueError("Unsupported photo category")
    return categories


def place_category(place):
    raw = str(place.get("category") or "").casefold()
    tags = place.get("tags") or {}
    values = {raw, str(tags.get("natural") or "").casefold(),
              str(tags.get("tourism") or "").casefold(), str(tags.get("amenity") or "").casefold(),
              str(tags.get("leisure") or "").casefold()}
    return next((category for category, aliases in CATEGORY_ALIASES.items() if values & aliases), None)

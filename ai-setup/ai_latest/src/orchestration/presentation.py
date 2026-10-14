from src.schema.models import SearchResponse


def result_images(response: SearchResponse) -> list[dict]:
    images, seen = [], set()
    for index, result in enumerate(response.results, 1):
        for hit in [result, *result.evidence]:
            photo = hit.image or {}
            image_id = photo.get("image_id")
            if not image_id or image_id in seen:
                continue
            seen.add(image_id)
            images.append({
                **photo,
                "name": result.name or result.entity_id,
                "place_url": result.url,
                "entity_id": result.entity_id,
                "result_number": result.result_number or index,
            })
            break
    return images


def result_places(response: SearchResponse) -> list[dict]:
    return [{
        "entity_id": result.entity_id,
        "result_number": result.result_number or index,
        "name": result.name or result.entity_id,
        "source": result.source,
        "latitude": result.latitude,
        "longitude": result.longitude,
        "url": result.url,
        "category": result.category,
        "province": result.province,
        "address": result.address,
        "excerpt": str(result.payload.get("text") or "")[:350] if result.source == "text" else "",
        "image_id": next((hit.image["image_id"] for hit in [result, *result.evidence]
                          if hit.image and hit.image.get("image_id")), None),
    } for index, result in enumerate(response.results, 1)]


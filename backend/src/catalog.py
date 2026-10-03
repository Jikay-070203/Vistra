import math
import unicodedata

DESTINATIONS = {"ha-noi": {"center": [21.0285, 105.8542]}, "ninh-binh": {"center": [20.2506, 105.9745]}, "tp-ho-chi-minh": {"center": [10.7769, 106.7009]}, "da-lat": {"center": [11.9404, 108.4583]}}
ATTRIBUTION = {"text": "© OpenStreetMap contributors", "url": "https://www.openstreetmap.org/copyright", "license": "ODbL-1.0"}

def normalized(value: str) -> str:
    value = value.lower().replace("đ", "d")
    return " ".join("".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn").split())

def distance_km(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))

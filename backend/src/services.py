"""Shared provider connections for routing, weather and Gemini."""
import httpx

from backend.tools.routing import RoutingTool
from backend.tools.weather import WeatherTool


class ExternalServices:
    def __init__(self, settings, client=None):
        self.client = client or httpx.Client(timeout=20, headers={"User-Agent": "YourTripYourTry/0.2"})
        self._owns_client = client is None
        self.routing = RoutingTool(settings, client=self.client)
        self.weather_tool = WeatherTool(settings, client=self.client)

    def close(self):
        if self._owns_client:
            self.client.close()

    def route(self, db, origin, destination):
        return self.routing.route(db, origin, destination)

    def weather(self, db, destination, start, days):
        return self.weather_tool.forecast(db, destination, start, days)

    def seasonality(self, db, destination, start_year, end_year):
        return self.weather_tool.seasonality(db, destination, start_year, end_year)

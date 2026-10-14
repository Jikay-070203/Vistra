import calendar
from datetime import date, timedelta
from math import isfinite
from statistics import mean

from src.agents.travel_agent import TravelAgent
from src.schema.travel import AgentAssessment, trip_dates
from src.tools.catalog import coordinates
from src.tools.http_client import ToolUnavailable


class WeatherSeasonAgent(TravelAgent):
    name = "weather"
    title = "Checking weather and season"
    metrics = ("temperature_2m_max", "temperature_2m_min", "precipitation_sum", "wind_speed_10m_max")

    @staticmethod
    def shifted(day: date, years: int) -> date:
        year = day.year - years
        return date(year, day.month, min(day.day, calendar.monthrange(year, day.month)[1]))

    @classmethod
    def usable(cls, rows):
        return [row for row in rows if all(isinstance(row.get(key), (int, float))
                and not isinstance(row[key], bool) and isfinite(row[key]) for key in cls.metrics)]

    def assess(self, state, trip, candidates, tools):
        try:
            start, end = trip_dates(trip)
        except ValueError as exc:
            return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=[str(exc)])
        today = date.today()
        horizon = today + timedelta(days=15)
        if (trip.min_temperature_c is not None and trip.max_temperature_c is not None
                and trip.min_temperature_c > trip.max_temperature_c):
            return AgentAssessment(agent=self.name, status="needs_input", missing_inputs=["consistent minimum and maximum temperatures"])
        thresholds = {"temperature_2m_max": trip.max_temperature_c if trip.max_temperature_c is not None else self.config.get("travel_weather_heat_c", 34),
                      "precipitation_sum": trip.max_rain_mm if trip.max_rain_mm is not None else self.config.get("travel_weather_rain_mm", 10),
                      "wind_speed_10m_max": trip.max_wind_kmh if trip.max_wind_kmh is not None else self.config.get("travel_weather_wind_kmh", 40)}
        assessments, sources, warnings = [], [], []
        for candidate in candidates:
            item = {"entity_id": candidate.entity_id, "requested_start": start.isoformat(),
                    "requested_end": end.isoformat(), "forecast": None, "seasonal": None,
                    "status": "partial", "missing_dates": []}
            item["within_explicit_weather_limits"] = None
            point = coordinates({"latitude": candidate.latitude, "longitude": candidate.longitude})
            if point is None:
                item.update(status="needs_input", missing_inputs=["destination coordinates"])
                assessments.append(item)
                continue
            if start < today:
                item.update(status="needs_input", missing_inputs=["future travel dates"])
                assessments.append(item)
                continue
            forecast_end = min(end, horizon)
            if start <= horizon:
                try:
                    data, source = tools.weather.daily(point, start, forecast_end)
                    sources.append(source)
                    wanted = {(start + timedelta(days=index)).isoformat() for index in range((forecast_end - start).days + 1)}
                    rows = self.usable([row for row in data["days"] if row["date"] in wanted])
                    item["forecast"] = {**data, "days": rows, "source": source.model_dump(mode="json"),
                        "outdoor_cautions": [{"date": row["date"], "metric": metric, "value": row[metric],
                                              "threshold": threshold} for row in rows
                                             for metric, threshold in thresholds.items() if row[metric] >= threshold]}
                    if trip.min_temperature_c is not None:
                        item["forecast"]["outdoor_cautions"].extend({"date": row["date"], "metric": "temperature_2m_min",
                            "value": row["temperature_2m_min"], "minimum": trip.min_temperature_c}
                            for row in rows if row["temperature_2m_min"] < trip.min_temperature_c)
                    item["missing_dates"] = sorted(wanted - {row["date"] for row in rows})
                    if end <= horizon and not item["missing_dates"]:
                        item["status"] = "complete"
                    explicit_limits = (("temperature_2m_max", trip.max_temperature_c, "max"),
                                       ("temperature_2m_min", trip.min_temperature_c, "min"),
                                       ("precipitation_sum", trip.max_rain_mm, "max"),
                                       ("wind_speed_10m_max", trip.max_wind_kmh, "max"))
                    has_limits = any(limit is not None for _, limit, _ in explicit_limits)
                    violates = any(row[metric] > limit if direction == "max" else row[metric] < limit
                                   for row in rows for metric, limit, direction in explicit_limits if limit is not None)
                    if has_limits and violates:
                        item["within_explicit_weather_limits"] = False
                    elif has_limits and item["status"] == "complete":
                        item["within_explicit_weather_limits"] = True
                except ToolUnavailable as exc:
                    warnings.append(f"{candidate.entity_id}: {exc}")
                    item["missing_dates"] = [(start + timedelta(days=index)).isoformat()
                                             for index in range((forecast_end - start).days + 1)]
            if end > horizon:
                sample_start = max(start, horizon + timedelta(days=1))
                samples = []
                sample_sources = []
                sample_windows = []
                # Use three completed historical seasons, even for trips several years ahead.
                years_back = start.year - today.year + 1
                for offset in range(years_back, years_back + self.config.get("travel_weather_sample_years", 3)):
                    historical_start, historical_end = self.shifted(sample_start, offset), self.shifted(end, offset)
                    if historical_end >= today - timedelta(days=7):
                        historical_start, historical_end = self.shifted(sample_start, offset + 1), self.shifted(end, offset + 1)
                    try:
                        data, source = tools.weather.daily(point, historical_start, historical_end, historical=True)
                        wanted = {(historical_start + timedelta(days=index)).isoformat()
                                  for index in range((historical_end - historical_start).days + 1)}
                        rows = self.usable([row for row in data["days"] if row["date"] in wanted])
                        sources.append(source)
                        sample_sources.append(source.model_dump(mode="json"))
                        samples.extend(rows)
                        sample_windows.append({"start": historical_start.isoformat(), "end": historical_end.isoformat(),
                                               "expected_days": len(wanted), "available_days": len(rows)})
                        if len(rows) != len(wanted):
                            warnings.append(f"{candidate.entity_id}: incomplete historical sample {historical_start.year}.")
                    except ToolUnavailable as exc:
                        sample_windows.append({"start": historical_start.isoformat(), "end": historical_end.isoformat(),
                                               "expected_days": (historical_end - historical_start).days + 1, "available_days": 0})
                        warnings.append(f"{candidate.entity_id}: seasonal sample {historical_start.year}: {exc}")
                if samples:
                    item["seasonal"] = {"kind": "historical seasonal average, not a forecast",
                        "requested_start": sample_start.isoformat(), "requested_end": end.isoformat(),
                        "sample_days": len(samples), "sample_years": sorted({row["date"][:4] for row in samples}),
                        "sample_windows": sample_windows,
                        "means": {metric: round(mean(row[metric] for row in samples), 1) for metric in self.metrics},
                        "rainy_day_fraction": round(sum(row["precipitation_sum"] >= 1 for row in samples) / len(samples), 3),
                        "units": {"temperature": "°C", "precipitation": "mm/day", "wind": "km/h"},
                        "sources": sample_sources}
            if item["forecast"] is None and item["seasonal"] is None:
                item["status"] = "unavailable"
            assessments.append(item)
        statuses = {item["status"] for item in assessments}
        status = next(iter(statuses)) if len(statuses) == 1 and "partial" not in statuses else "partial"
        return AgentAssessment(agent=self.name, status=status, sources=sources, warnings=warnings,
            data={"candidates": assessments, "thresholds": thresholds,
                  "rule": "Thresholds are planning cautions, not severe-weather alerts, closure reports or safety guarantees."})

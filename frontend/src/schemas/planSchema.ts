import { boolean, list, nullable, number, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import type { PlanActivityDto, PlanItineraryDto, PlanPublicationView, PlanRequestDto,
  PlanRouteLegDto, PlanWeatherDto } from '@/types/planApi';
import type { BudgetDto } from '@/types/tripApi';

export const planRequestSchema = {
  parse(value: unknown): PlanRequestDto {
    const raw = record(value, 'plan request');
    const origin = nullable(raw.origin, record, 'plan request.origin');
    return {
      destination: string(raw.destination, 'plan request.destination'),
      start_date: string(raw.start_date, 'plan request.start_date'),
      days: number(raw.days, 'plan request.days'),
      people: number(raw.people, 'plan request.people'),
      budget_vnd: number(raw.budget_vnd, 'plan request.budget_vnd'),
      budget_scope: oneOf(raw.budget_scope, ['total', 'per_person'] as const, 'plan request.budget_scope'),
      transport: oneOf(raw.transport, ['car'] as const, 'plan request.transport'),
      origin: origin ? {
        latitude: number(origin.latitude, 'plan request.origin.latitude'),
        longitude: number(origin.longitude, 'plan request.origin.longitude'),
      } : null,
      pace: oneOf(raw.pace, ['relaxed', 'normal', 'busy'] as const, 'plan request.pace'),
      interests: list(raw.interests, 'plan request.interests').map(value => string(value, 'plan request.interest')),
      must_visit: list(raw.must_visit, 'plan request.must_visit').map(value => number(value, 'plan request.place id')),
      allow_unverified: boolean(raw.allow_unverified, 'plan request.allow_unverified'),
      lodging_total_vnd: nullable(raw.lodging_total_vnd, number, 'plan request.lodging_total_vnd'),
      transport_total_vnd: nullable(raw.transport_total_vnd, number, 'plan request.transport_total_vnd'),
    };
  },
};

function activity(value: unknown): PlanActivityDto {
  const raw = record(value, 'plan activity');
  const cost = nullable(raw.estimated_cost, record, 'plan activity.estimated_cost');
  return {
    place_id: number(raw.place_id, 'plan activity.place_id'),
    name: string(raw.name, 'plan activity.name'),
    kind: string(raw.kind, 'plan activity.kind'),
    day: number(raw.day, 'plan activity.day'),
    place_updated_at: string(raw.place_updated_at, 'plan activity.place_updated_at'),
    quality_status: string(raw.quality_status, 'plan activity.quality_status'),
    duration_estimated: boolean(raw.duration_estimated, 'plan activity.duration_estimated'),
    latitude: coordinate(raw.latitude, -90, 90),
    longitude: coordinate(raw.longitude, -180, 180),
    start_at: string(raw.start_at, 'plan activity.start_at'),
    end_at: string(raw.end_at, 'plan activity.end_at'),
    estimated_cost: cost ? {
      min_vnd: number(cost.min_vnd, 'plan activity.cost.min_vnd'),
      max_vnd: number(cost.max_vnd, 'plan activity.cost.max_vnd'),
    } : null,
    notes: list(raw.notes, 'plan activity.notes').map(value => string(value, 'plan activity.note')),
    indoor_outdoor: string(raw.indoor_outdoor, 'plan activity.indoor_outdoor'),
    reason: string(raw.reason, 'plan activity.reason'),
  };
}

function coordinate(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function routeLeg(value: unknown): PlanRouteLegDto {
  const raw = record(value, 'plan route leg');
  const geometry = nullable(raw.geometry, record, 'plan route leg.geometry');
  if (raw.traffic_live !== false) throw new TypeError('Live traffic is not supported by this route');
  return {
    day: number(raw.day, 'plan route leg.day'),
    from_place_id: nullable(raw.from_place_id, number, 'plan route leg.from_place_id'),
    to_place_id: number(raw.to_place_id, 'plan route leg.to_place_id'),
    depart_at: string(raw.depart_at, 'plan route leg.depart_at'),
    arrive_at: string(raw.arrive_at, 'plan route leg.arrive_at'),
    duration_min: number(raw.duration_min, 'plan route leg.duration_min'),
    distance_km: number(raw.distance_km, 'plan route leg.distance_km'),
    transport: oneOf(raw.transport, ['car'] as const, 'plan route leg.transport'),
    traffic_live: false,
    geometry: geometry ? {
      type: string(geometry.type, 'plan route leg.geometry.type'),
      coordinates: list(geometry.coordinates, 'plan route leg.geometry.coordinates').map(point =>
        list(point, 'plan route leg.geometry.point').map(value => number(value, 'plan route leg.geometry.coordinate'))),
    } : null,
    source: string(raw.source, 'plan route leg.source'),
    updated_at: string(raw.updated_at, 'plan route leg.updated_at'),
  };
}

function weather(value: unknown): PlanWeatherDto {
  const raw = record(value, 'plan weather');
  const type = oneOf(raw.type, ['forecast', 'unavailable'] as const, 'plan weather.type');
  if (type === 'unavailable') return { type, reason: string(raw.reason, 'plan weather.reason') };
  const hourly = record(raw.hourly, 'plan weather.hourly');
  const parsed = {
    time: list(hourly.time, 'weather.time').map(value => string(value, 'weather.time')),
    temperature_2m: list(hourly.temperature_2m, 'weather.temperature').map(value => nullable(value, number, 'weather.temperature')),
    precipitation_probability: list(hourly.precipitation_probability, 'weather.rain').map(value => nullable(value, number, 'weather.rain')),
  };
  if (parsed.time.length !== parsed.temperature_2m.length || parsed.time.length !== parsed.precipitation_probability.length) {
    throw new TypeError('Weather hourly arrays must have matching lengths');
  }
  return { type, source: string(raw.source, 'plan weather.source'), updated_at: string(raw.updated_at, 'plan weather.updated_at'), hourly: parsed };
}

export function planItinerary(value: unknown, budget: (value: unknown) => BudgetDto): PlanItineraryDto {
  const raw = record(value, 'plan itinerary');
  return {
    activities: list(raw.activities, 'plan itinerary.activities').map(activity),
    route_legs: list(raw.route_legs, 'plan itinerary.route_legs').map(routeLeg),
    weather: weather(raw.weather),
    warnings: list(raw.warnings, 'plan itinerary.warnings').map(value => string(value, 'plan warning')),
    provisional: boolean(raw.provisional, 'plan itinerary.provisional'),
    budget: budget(raw.budget),
    timezone: string(raw.timezone, 'plan itinerary.timezone'),
    ...(raw.trip_id === undefined ? {} : { trip_id: string(raw.trip_id, 'plan itinerary.trip_id') }),
    ...(raw.version === undefined ? {} : { version: number(raw.version, 'plan itinerary.version') }),
  };
}

export const planPublicationSchema = {
  parse(value: unknown): PlanPublicationView {
    const raw = record(value, 'plan publication');
    return {
      id: string(raw.id, 'plan publication.id'),
      isPublished: boolean(raw.isPublished, 'plan publication.isPublished'),
      publishedAt: nullable(raw.publishedAt, string, 'plan publication.publishedAt'),
      version: number(raw.version, 'plan publication.version'),
    };
  },
};

import type { BudgetDto } from '@/types/tripApi';

export type PlanPace = 'relaxed' | 'normal' | 'busy';
export type PlanBudgetScope = 'total' | 'per_person';

export interface PlanRequestDto {
  destination: string;
  start_date: string;
  days: number;
  people: number;
  budget_vnd: number;
  budget_scope: PlanBudgetScope;
  transport: 'car';
  origin: { latitude: number; longitude: number } | null;
  pace: PlanPace;
  interests: string[];
  must_visit: number[];
  allow_unverified: boolean;
  lodging_total_vnd: number | null;
  transport_total_vnd: number | null;
}

export interface PlanActivityDto {
  place_id: number;
  name: string;
  kind: string;
  day: number;
  place_updated_at: string;
  quality_status: string;
  duration_estimated: boolean;
  latitude: number | null;
  longitude: number | null;
  start_at: string;
  end_at: string;
  estimated_cost: { min_vnd: number; max_vnd: number } | null;
  notes: string[];
  indoor_outdoor: string;
  reason: string;
}

export interface PlanRouteLegDto {
  day: number;
  from_place_id: number | null;
  to_place_id: number;
  depart_at: string;
  arrive_at: string;
  duration_min: number;
  distance_km: number;
  transport: 'car';
  traffic_live: false;
  geometry: { type: string; coordinates: number[][] } | null;
  source: string;
  updated_at: string;
}

export interface PlanWeatherDto {
  type: 'forecast' | 'unavailable';
  reason?: string;
  source?: string;
  updated_at?: string;
  hourly?: {
    time: string[];
    temperature_2m: Array<number | null>;
    precipitation_probability: Array<number | null>;
  };
}

export interface PlanItineraryDto {
  activities: PlanActivityDto[];
  route_legs: PlanRouteLegDto[];
  weather: PlanWeatherDto;
  warnings: string[];
  provisional: boolean;
  budget: BudgetDto;
  timezone: string;
  trip_id?: string;
  version?: number;
}

export interface PlanDayView {
  dayNumber: number;
  date: string;
  activities: Array<PlanActivityDto & { stableId: string }>;
  routeLegs: PlanRouteLegDto[];
}

export interface PlanPreviewView {
  id: string;
  version: number;
  destinationId: number;
  request: PlanRequestDto;
  days: PlanDayView[];
  weather: PlanWeatherDto | null;
  budget: BudgetDto | null;
  warnings: string[];
  generationError: string | Record<string, unknown> | null;
}

export interface PlanPublicationView {
  id: string;
  isPublished: boolean;
  publishedAt: string | null;
  version: number;
}

export interface RevisionPreviewDto {
  preview_id: string;
  base_version: number;
  itinerary: PlanItineraryDto;
  known_cost_delta_vnd: number;
}

export interface RevisionRequest {
  base_version: number;
  stops: Array<{ place_id: number; day: number; start_time?: string }>;
}

export interface TripChatResponse {
  reply: string;
  preview: RevisionPreviewDto | null;
  tools_used: Array<{ name: string; ok: boolean }>;
  base_version: number;
}

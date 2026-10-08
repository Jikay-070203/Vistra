export interface DestinationDto {
  id: number;
  slug: string;
  display_name: string;
  admin_name: string | null;
  center_lat: number | null;
  center_lon: number | null;
  target_places: number;
  enabled: 0 | 1;
  places: number;
  schedulable: number;
}

export interface DestinationListResponse {
  items: DestinationDto[];
  attribution: string;
}

export type PlaceKind = 'attraction' | 'food' | 'cafe' | 'stay' | 'activity' | 'other';
export type PlaceQuality = 'discovered' | 'schedulable' | 'verified' | 'archived';

export interface PlaceDto {
  id: number;
  destination_id: number;
  destination?: string;
  display_name: string;
  normalized_name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  kind: PlaceKind;
  quality_status: PlaceQuality;
  indoor_outdoor: 'indoor' | 'outdoor' | 'mixed' | 'unknown';
  rain_sensitivity: number | null;
  suggested_duration_min: number | null;
  price_unknown: 0 | 1;
  opening_hours_unknown: 0 | 1;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
  opening_intervals?: Record<string, unknown>[];
  opening_exceptions?: Record<string, unknown>[];
  prices?: Record<string, unknown>[];
  ratings?: Record<string, unknown>[];
  sources?: Record<string, unknown>[];
  attribution?: string;
}

export interface PlaceListParams {
  destination?: string;
  q?: string;
  kind?: PlaceKind;
  quality?: PlaceQuality;
  limit?: number;
  offset?: number;
}

export interface PlaceListResponse {
  items: PlaceDto[];
  total: number;
  limit: number;
  offset: number;
  attribution: string;
}

export type SeasonalityResponse =
  | {
      type: 'historical';
      period: [number, number];
      source: string;
      source_url: string;
      updated_at: string;
      rainy_day_threshold_mm: number;
      months: Array<{
        month: number;
        sample_days: number;
        mean_temperature_c: number;
        rainy_day_fraction: number;
        mean_daily_precipitation_mm: number;
      }>;
    }
  | { type: 'unavailable'; reason: string };

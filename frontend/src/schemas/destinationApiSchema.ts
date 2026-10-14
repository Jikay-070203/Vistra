import { list, nullable, number, objectList, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import type {
  DestinationDto,
  DestinationListResponse,
  PlaceDto,
  PlaceListResponse,
  SeasonalityResponse,
} from '@/types/destinationApi';

const kinds = ['attraction', 'food', 'cafe', 'stay', 'activity', 'other'] as const;
const qualities = ['discovered', 'schedulable', 'verified', 'archived'] as const;
const indoors = ['indoor', 'outdoor', 'mixed', 'unknown'] as const;

function bit(value: unknown, label: string): 0 | 1 {
  if (value !== 0 && value !== 1) throw new TypeError(label + ' must be 0 or 1');
  return value;
}

function destination(value: unknown): DestinationDto {
  const item = record(value, 'destination');
  return {
    id: number(item.id, 'destination.id'),
    slug: string(item.slug, 'destination.slug'),
    display_name: string(item.display_name, 'destination.display_name'),
    admin_name: nullable(item.admin_name, string, 'destination.admin_name'),
    center_lat: nullable(item.center_lat, number, 'destination.center_lat'),
    center_lon: nullable(item.center_lon, number, 'destination.center_lon'),
    target_places: number(item.target_places, 'destination.target_places'),
    enabled: bit(item.enabled, 'destination.enabled'),
    places: number(item.places, 'destination.places'),
    schedulable: number(item.schedulable, 'destination.schedulable'),
  };
}

function place(value: unknown): PlaceDto {
  const item = record(value, 'place');
  return {
    id: number(item.id, 'place.id'),
    destination_id: number(item.destination_id, 'place.destination_id'),
    ...(item.destination === undefined ? {} : { destination: string(item.destination, 'place.destination') }),
    display_name: string(item.display_name, 'place.display_name'),
    ...(item.image_url === undefined ? {} : { image_url: nullable(item.image_url, string, 'place.image_url') }),
    normalized_name: string(item.normalized_name, 'place.normalized_name'),
    address: nullable(item.address, string, 'place.address'),
    latitude: number(item.latitude, 'place.latitude'),
    longitude: number(item.longitude, 'place.longitude'),
    kind: oneOf(item.kind, kinds, 'place.kind'),
    quality_status: oneOf(item.quality_status, qualities, 'place.quality_status'),
    indoor_outdoor: oneOf(item.indoor_outdoor, indoors, 'place.indoor_outdoor'),
    rain_sensitivity: nullable(item.rain_sensitivity, number, 'place.rain_sensitivity'),
    suggested_duration_min: nullable(item.suggested_duration_min, number, 'place.suggested_duration_min'),
    price_unknown: bit(item.price_unknown, 'place.price_unknown'),
    opening_hours_unknown: bit(item.opening_hours_unknown, 'place.opening_hours_unknown'),
    last_verified_at: nullable(item.last_verified_at, string, 'place.last_verified_at'),
    created_at: string(item.created_at, 'place.created_at'),
    updated_at: string(item.updated_at, 'place.updated_at'),
    ...(item.opening_intervals === undefined ? {} : { opening_intervals: objectList(item.opening_intervals, 'place.opening_intervals') }),
    ...(item.opening_exceptions === undefined ? {} : { opening_exceptions: objectList(item.opening_exceptions, 'place.opening_exceptions') }),
    ...(item.prices === undefined ? {} : { prices: objectList(item.prices, 'place.prices') }),
    ...(item.ratings === undefined ? {} : { ratings: objectList(item.ratings, 'place.ratings') }),
    ...(item.sources === undefined ? {} : { sources: objectList(item.sources, 'place.sources') }),
    ...(item.attribution === undefined ? {} : { attribution: string(item.attribution, 'place.attribution') }),
  };
}

export const destinationListResponseSchema = {
  parse(value: unknown): DestinationListResponse {
    const response = record(value, 'destinations response');
    return {
      items: list(response.items, 'destinations.items').map(destination),
      attribution: string(response.attribution, 'destinations.attribution'),
    };
  },
};

export const placeListResponseSchema = {
  parse(value: unknown): PlaceListResponse {
    const response = record(value, 'places response');
    return {
      items: list(response.items, 'places.items').map(place),
      total: number(response.total, 'places.total'),
      limit: number(response.limit, 'places.limit'),
      offset: number(response.offset, 'places.offset'),
      attribution: string(response.attribution, 'places.attribution'),
    };
  },
};

export const placeDetailResponseSchema = {
  parse(value: unknown): PlaceDto {
    const item = place(value);
    if (!item.opening_intervals || !item.opening_exceptions || !item.prices || !item.ratings || !item.sources) {
      throw new TypeError('Place detail is missing relationship arrays');
    }
    return item;
  },
};

export const seasonalityResponseSchema = {
  parse(value: unknown): SeasonalityResponse {
    const response = record(value, 'seasonality response');
    if (response.type === 'unavailable') {
      return { type: 'unavailable', reason: string(response.reason, 'seasonality.reason') };
    }
    if (response.type !== 'historical') throw new TypeError('Unknown seasonality type');
    const period = list(response.period, 'seasonality.period');
    if (period.length !== 2) throw new TypeError('seasonality.period must have two years');
    return {
      type: 'historical',
      period: [number(period[0], 'seasonality.period[0]'), number(period[1], 'seasonality.period[1]')],
      source: string(response.source, 'seasonality.source'),
      source_url: string(response.source_url, 'seasonality.source_url'),
      updated_at: string(response.updated_at, 'seasonality.updated_at'),
      rainy_day_threshold_mm: number(response.rainy_day_threshold_mm, 'seasonality.rainy_day_threshold_mm'),
      months: list(response.months, 'seasonality.months').map((value) => {
        const month = record(value, 'seasonality.month');
        return {
          month: number(month.month, 'seasonality.month.month'),
          sample_days: number(month.sample_days, 'seasonality.month.sample_days'),
          mean_temperature_c: number(month.mean_temperature_c, 'seasonality.month.mean_temperature_c'),
          rainy_day_fraction: number(month.rainy_day_fraction, 'seasonality.month.rainy_day_fraction'),
          mean_daily_precipitation_mm: number(month.mean_daily_precipitation_mm, 'seasonality.month.mean_daily_precipitation_mm'),
        };
      }),
    };
  },
};

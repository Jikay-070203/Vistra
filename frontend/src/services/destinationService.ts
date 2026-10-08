import { getApiBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import {
  destinationListResponseSchema,
  placeDetailResponseSchema,
  placeListResponseSchema,
  seasonalityResponseSchema,
} from '@/schemas/destinationApiSchema';
import { destinationDetailsSchema, recommendationSchema } from '@/schemas/recommendationSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type {
  DestinationListResponse,
  PlaceDto,
  PlaceListParams,
  PlaceListResponse,
  SeasonalityResponse,
} from '@/types/destinationApi';
import type { DestinationDetailsView, DestinationRecommendationsView } from '@/types/recommendationApi';

/** V1 ignores UI filters; do not pass them or label the result as personalized. */
export async function getRecommendations(): Promise<ApiRequestResult<DestinationRecommendationsView>> {
  const result = await apiRequest(API_ENDPOINTS.RECOMMENDATIONS.LIST, getApiBaseUrl());
  return { ...result, data: recommendationSchema.parse(result.data) };
}

export async function getDestinationDetails(ids: readonly string[]): Promise<ApiRequestResult<DestinationDetailsView>> {
  if (ids.length < 1 || ids.length > 3) throw new RangeError('Select one to three destination IDs');
  const path = API_ENDPOINTS.RECOMMENDATIONS.DETAILS(ids[0]);
  const query = new URLSearchParams({ ids: ids.join(',') });
  const result = await apiRequest(path + '?' + query, getApiBaseUrl());
  return { ...result, data: destinationDetailsSchema.parse(result.data) };
}

export async function getDestinations(): Promise<ApiRequestResult<DestinationListResponse>> {
  const result = await apiRequest(API_ENDPOINTS.DESTINATIONS.LIST, getApiBaseUrl());
  return { ...result, data: destinationListResponseSchema.parse(result.data) };
}

export async function getDestinationSeasonality(
  slug: string,
  years: { startYear?: number; endYear?: number } = {},
): Promise<ApiRequestResult<SeasonalityResponse>> {
  const query = new URLSearchParams();
  if (years.startYear !== undefined) query.set('start_year', String(years.startYear));
  if (years.endYear !== undefined) query.set('end_year', String(years.endYear));
  const path = API_ENDPOINTS.DESTINATIONS.SEASONALITY(slug);
  const result = await apiRequest(path + (query.size ? '?' + query : ''), getApiBaseUrl());
  return { ...result, data: seasonalityResponseSchema.parse(result.data) };
}

export async function getPlaces(params: PlaceListParams = {}): Promise<ApiRequestResult<PlaceListResponse>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const result = await apiRequest(
    API_ENDPOINTS.PLACES.LIST + (query.size ? '?' + query : ''),
    getApiBaseUrl(),
  );
  return { ...result, data: placeListResponseSchema.parse(result.data) };
}

export async function getPlace(id: number): Promise<ApiRequestResult<PlaceDto>> {
  const result = await apiRequest(API_ENDPOINTS.PLACES.DETAIL(id), getApiBaseUrl());
  return { ...result, data: placeDetailResponseSchema.parse(result.data) };
}

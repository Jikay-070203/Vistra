import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { DISCOVERY_ENDPOINTS } from '@/constants/discoveryEndpoints';
import { communityTripCardsSchema } from '@/schemas/tripCollectionSchema';
import { communityLikeSchema, communityCloneSchema } from '@/schemas/communityApiSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { CommunityTripQuery, PagedTripCardsView, TripLikeView } from '@/types/tripCollectionApi';

export async function getCommunityTrips(query: CommunityTripQuery): Promise<ApiRequestResult<PagedTripCardsView>> {
  const params = new URLSearchParams({ page: String(query.page), page_size: String(query.pageSize) });
  if (query.q) params.set('q', query.q);
  if (query.provinceSlug) params.set('province', query.provinceSlug);
  if (query.durationDays !== undefined) params.set('duration', String(query.durationDays));
  if (query.tag) params.set('tag', query.tag);
  if (query.budgetMinVnd !== undefined) params.set('budget_min_vnd', String(query.budgetMinVnd));
  if (query.budgetMaxVnd !== undefined) params.set('budget_max_vnd', String(query.budgetMaxVnd));
  if (query.likedByMe !== undefined) params.set('liked_by_me', String(query.likedByMe));
  const result = await apiRequest(API_ENDPOINTS.TRIP_COLLECTION.COMMUNITY + '?' + params, getSessionProxyBaseUrl());
  return { ...result, data: communityTripCardsSchema.parse(result.data) };
}

export async function cloneCommunityTrip(id: string): Promise<ApiRequestResult<{ id: string }>> {
  const result = await apiRequest(DISCOVERY_ENDPOINTS.CLONE(id), getSessionProxyBaseUrl(), { method: 'POST' });
  return { ...result, data: communityCloneSchema.parse(result.data) };
}

/** Send the desired final state. The backend operation is idempotent. */
export async function setTripLike(id: string, liked: boolean): Promise<ApiRequestResult<TripLikeView>> {
  const result = await apiRequest(DISCOVERY_ENDPOINTS.LIKE(id), getSessionProxyBaseUrl(), {
    method: 'PUT', jsonBody: { liked },
  });
  return { ...result, data: communityLikeSchema.parse(result.data) };
}

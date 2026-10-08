import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { profileSchema, profileUpdateSchema, travelDnaSchema } from '@/schemas/profileApiSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { ProfilePatchView, ProfileUpdateView, ProfileView, TravelDnaPatchView, TravelDnaView } from '@/types/profileApi';

export async function getProfile(): Promise<ApiRequestResult<ProfileView>> {
  const result = await apiRequest(API_ENDPOINTS.PROFILE.ME, getSessionProxyBaseUrl());
  return { ...result, data: profileSchema.parse(result.data) };
}

export async function updateProfile(patch: ProfilePatchView): Promise<ApiRequestResult<ProfileUpdateView>> {
  const body = {
    ...(patch.fullName !== undefined && { full_name: patch.fullName }),
    ...(patch.email !== undefined && { email: patch.email }),
    ...(patch.phone !== undefined && { phone: patch.phone }),
    ...(patch.defaultOrigin !== undefined && { default_origin: patch.defaultOrigin }),
    ...(patch.bio !== undefined && { bio: patch.bio }),
    ...(patch.preferredPace !== undefined && { preferred_pace: patch.preferredPace }),
    ...(patch.preferredStay !== undefined && { preferred_stay: patch.preferredStay }),
    ...(patch.dietaryPreference !== undefined && { dietary_preference: patch.dietaryPreference }),
  };
  const result = await apiRequest(API_ENDPOINTS.PROFILE.ME, getSessionProxyBaseUrl(), { method: 'PATCH', jsonBody: body });
  return { ...result, data: profileUpdateSchema.parse(result.data) };
}

export async function getTravelDna(): Promise<ApiRequestResult<TravelDnaView>> {
  const result = await apiRequest(API_ENDPOINTS.PROFILE.DNA, getSessionProxyBaseUrl());
  return { ...result, data: travelDnaSchema.parse(result.data) };
}

export async function updateTravelDna(patch: TravelDnaPatchView): Promise<ApiRequestResult<TravelDnaView>> {
  if (patch.metrics && (patch.metrics.length > 30 || patch.metrics.some(item =>
    !item.key.trim() || !Number.isFinite(item.score) || item.score < 0 || item.score > 100))) {
  throw new RangeError('Invalid DNA metrics');
  }
  for (const value of [patch.pace, patch.sceneryFocus, patch.cuisinePriority]) {
    if (value !== undefined && value !== null && typeof value !== 'string') {
      throw new TypeError('DNA preference must be text or null');
    }
  }
  const body = {
    ...(patch.metrics !== undefined && { metrics: patch.metrics }),
    ...(patch.pace !== undefined && { pace: patch.pace }),
    ...(patch.sceneryFocus !== undefined && { scenery_focus: patch.sceneryFocus }),
    ...(patch.cuisinePriority !== undefined && { cuisine_priority: patch.cuisinePriority }),
  };
  const result = await apiRequest(API_ENDPOINTS.PROFILE.DNA, getSessionProxyBaseUrl(), { method: 'PUT', jsonBody: body });
  return { ...result, data: travelDnaSchema.parse(result.data) };
}

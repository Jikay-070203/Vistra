import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { publicLandingSchema } from '@/schemas/publicLandingSchema';
import { apiRequest } from '@/services/apiClient';
import type { PublicLandingView } from '@/types/publicLandingApi';

export async function getPublicLanding(): Promise<PublicLandingView> {
  const result = await apiRequest(API_ENDPOINTS.CONTENT.PUBLIC_LANDING, getSessionProxyBaseUrl());
  return publicLandingSchema.parse(result.data);
}

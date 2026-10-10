import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { dnaAnalysisResponseSchema } from '@/schemas/dnaAnalysisSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { TravelDnaAnalysisView } from '@/types/tripDna';

export async function analyzeTripImages(imageUrls: string[]): Promise<ApiRequestResult<TravelDnaAnalysisView>> {
  if (imageUrls.length < 1 || imageUrls.length > 3 || imageUrls.some((url) => !url.startsWith('https://res.cloudinary.com/'))) {
    throw new RangeError('DNA analysis requires one to three secure Cloudinary image URLs.');
  }

  const result = await apiRequest(API_ENDPOINTS.DNA.ANALYZE, getSessionProxyBaseUrl(), {
    method: 'POST',
    jsonBody: { image_urls: imageUrls },
    credentials: 'include',
  });
  return { ...result, data: dnaAnalysisResponseSchema.parse(result.data) };
}

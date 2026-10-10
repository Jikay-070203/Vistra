import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { aiProviderSettingsSchema, aiProviderUpdateRequestSchema } from '@/schemas/adminAiProviderSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AiProviderSettings, AiProviderUpdateRequest } from '@/types/adminAiProviderApi';

export async function getAiProviderSettings(signal?: AbortSignal): Promise<ApiRequestResult<AiProviderSettings>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.AI_PROVIDER, getSessionProxyBaseUrl(), {
    credentials: 'include',
    signal,
  });
  return { ...result, data: aiProviderSettingsSchema.parse(result.data) };
}

export async function updateAiProviderSettings(
  request: AiProviderUpdateRequest,
  signal?: AbortSignal,
): Promise<ApiRequestResult<AiProviderSettings>> {
  const body = aiProviderUpdateRequestSchema.parse(request);
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.AI_PROVIDER, getSessionProxyBaseUrl(), {
    method: 'PUT',
    jsonBody: body,
    credentials: 'include',
    signal,
  });
  return { ...result, data: aiProviderSettingsSchema.parse(result.data) };
}

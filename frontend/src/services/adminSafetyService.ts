import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { adminSafetyEvaluationSchema, adminSafetyPresetsSchema } from '@/schemas/adminSafetySchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AdminSafetyEvaluation, AdminSafetyPresets } from '@/types/adminSafetyApi';

export async function getAdminSafetyPresets(signal?: AbortSignal): Promise<ApiRequestResult<AdminSafetyPresets>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.SAFETY_PRESETS, getSessionProxyBaseUrl(), { credentials: 'include', signal });
  return { ...result, data: adminSafetyPresetsSchema.parse(result.data) };
}

export async function evaluateAdminSafetyPrompt(
  prompt: string,
  presetId?: string,
  signal?: AbortSignal,
): Promise<ApiRequestResult<AdminSafetyEvaluation>> {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) throw new TypeError('Vui lòng nhập prompt cần kiểm tra.');
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.SAFETY_EVALUATIONS, getSessionProxyBaseUrl(), {
    method: 'POST',
    jsonBody: { prompt: normalizedPrompt, ...(presetId ? { presetId } : {}) },
    credentials: 'include',
    signal,
  });
  return { ...result, data: adminSafetyEvaluationSchema.parse(result.data) };
}

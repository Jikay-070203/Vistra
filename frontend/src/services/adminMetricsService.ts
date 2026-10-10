import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { adminMetricsSchema } from '@/schemas/adminEvaluationSchema';
import { apiRequest } from '@/services/apiClient';
export async function getAdminMetrics(signal?: AbortSignal) {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.METRICS, getSessionProxyBaseUrl(), { credentials: 'include', signal });
  return { ...result, data: adminMetricsSchema.parse(result.data) };
}

import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { ADMIN_METRICS_ENDPOINT } from '@/constants/adminEvaluationEndpoints';
import { adminMetricsSchema } from '@/schemas/adminEvaluationSchema';
import { apiRequest } from '@/services/apiClient';
export async function getAdminMetrics(signal?: AbortSignal) {
  const result = await apiRequest(ADMIN_METRICS_ENDPOINT, getSessionProxyBaseUrl(), { signal });
  return { ...result, data: adminMetricsSchema.parse(result.data) };
}

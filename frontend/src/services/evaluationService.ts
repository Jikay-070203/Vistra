import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { ADMIN_EVALUATION_ENDPOINTS } from '@/constants/adminEvaluationEndpoints';
import { datasetListSchema } from '@/schemas/adminSystemSchema';
import { createdDatasetSchema, createDatasetSchema, evaluationRunSchema } from '@/schemas/adminEvaluationSchema';
import { apiRequest } from '@/services/apiClient';
import type { AdminPageQuery, AdminPageView, GoldenDatasetMetadataView } from '@/types/adminSystemApi';
import type { CreateDatasetRequest } from '@/types/adminEvaluationApi';
import type { ApiRequestResult } from '@/types/api';

export async function getDatasets(query: AdminPageQuery, signal?: AbortSignal): Promise<ApiRequestResult<AdminPageView<GoldenDatasetMetadataView>>> {
  const params = new URLSearchParams({ page: String(query.page), page_size: String(query.pageSize) });
  const result = await apiRequest(ADMIN_EVALUATION_ENDPOINTS.DATASETS + '?' + params, getSessionProxyBaseUrl(), { signal });
  return { ...result, data: datasetListSchema.parse(result.data) };
}
export async function createDataset(request: CreateDatasetRequest, signal?: AbortSignal) {
  const body = createDatasetSchema.parse(request);
  const result = await apiRequest(ADMIN_EVALUATION_ENDPOINTS.DATASETS, getSessionProxyBaseUrl(), { method: 'POST', jsonBody: body, signal });
  return { ...result, data: createdDatasetSchema.parse(result.data) };
}
export async function startEvaluation(datasetId: string, signal?: AbortSignal) {
  if (!datasetId.trim()) throw new TypeError('Vui lòng chọn bộ dữ liệu.');
  const result = await apiRequest(ADMIN_EVALUATION_ENDPOINTS.RUNS, getSessionProxyBaseUrl(), { method: 'POST', jsonBody: { datasetId }, signal });
  return { ...result, data: evaluationRunSchema.parse(result.data) };
}
export async function getEvaluationRun(id: string, signal?: AbortSignal) {
  const result = await apiRequest(ADMIN_EVALUATION_ENDPOINTS.RUN(id), getSessionProxyBaseUrl(), { signal });
  return { ...result, data: evaluationRunSchema.parse(result.data) };
}

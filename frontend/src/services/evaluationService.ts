import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { ADMIN_EVALUATION_ENDPOINTS } from '@/constants/adminEvaluationEndpoints';
import { datasetListSchema } from '@/schemas/adminSystemSchema';
import { createdDatasetSchema, createDatasetSchema, evaluationRunSchema } from '@/schemas/adminEvaluationSchema';
import { record } from '@/schemas/apiSchemaHelpers';
import { apiRequest } from '@/services/apiClient';
import type { AdminPageView, GoldenDatasetMetadataView } from '@/types/adminSystemApi';
import type { CreateDatasetRequest } from '@/types/adminEvaluationApi';
import type { ApiRequestResult } from '@/types/api';

export async function getDatasets(signal?: AbortSignal): Promise<ApiRequestResult<AdminPageView<GoldenDatasetMetadataView>>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.GOLDEN_DATASETS, getSessionProxyBaseUrl(), { credentials: 'include', signal });
  const envelope = record(result.data, 'golden datasets response');
  return { ...result, data: datasetListSchema.parse(envelope.data) };
}
export async function createDataset(request: CreateDatasetRequest, signal?: AbortSignal) {
  const body = createDatasetSchema.parse(request);
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.GOLDEN_DATASETS, getSessionProxyBaseUrl(), {
    method: 'POST',
    jsonBody: {
      name: body.name,
      description: body.description,
      testCases: body.test_cases.map((item, index) => ({
        id: `case-${index + 1}`,
        name: item.name,
        input: item.input ?? {},
        expected: item.expected ?? {},
      })),
    },
    credentials: 'include',
    signal,
  });
  const envelope = record(result.data, 'created dataset response');
  return { ...result, data: createdDatasetSchema.parse({ dataset: envelope.data }) };
}
export async function startEvaluation(datasetId: string, signal?: AbortSignal) {
  if (!datasetId.trim()) throw new TypeError('Vui lòng chọn bộ dữ liệu.');
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.GOLDEN_DATASET_RUNS(datasetId), getSessionProxyBaseUrl(), { method: 'POST', credentials: 'include', signal });
  const envelope = record(result.data, 'evaluation start response');
  return { ...result, data: evaluationRunSchema.parse(envelope.data) };
}
export async function getEvaluationRun(id: string, signal?: AbortSignal) {
  const result = await apiRequest(ADMIN_EVALUATION_ENDPOINTS.RUN(id), getSessionProxyBaseUrl(), { credentials: 'include', signal });
  return { ...result, data: evaluationRunSchema.parse(result.data) };
}

export async function getDatasetDetail(id: string, signal?: AbortSignal) {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.GOLDEN_DATASET(id), getSessionProxyBaseUrl(), { credentials: 'include', signal });
  return { ...result, data: (result.data as { data: import('@/types/adminSystemApi').GoldenDatasetDetailView }).data };
}

export async function getDatasetRuns(id: string, signal?: AbortSignal) {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.GOLDEN_DATASET_RUNS(id), getSessionProxyBaseUrl(), { credentials: 'include', signal });
  return { ...result, data: (result.data as { data: { items: import('@/types/adminSystemApi').GoldenDatasetRunView[] } }).data };
}

import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AdminBenchmarkRun, AdminBenchmarks } from '@/types/adminEvaluationApi';

function parseRun(value: unknown): AdminBenchmarkRun {
  const item = value as Record<string, unknown>;
  return { runId: String(item.runId), datasetId: String(item.datasetId), datasetName: String(item.datasetName), status: String(item.status), createdAt: String(item.createdAt), completedAt: item.completedAt == null ? null : String(item.completedAt), scorePct: typeof item.scorePct === 'number' ? item.scorePct : null, clipScore: typeof item.clipScore === 'number' ? item.clipScore : null, retrievalAccuracyPct: typeof item.retrievalAccuracyPct === 'number' ? item.retrievalAccuracyPct : null, llmScore: typeof item.llmScore === 'number' ? item.llmScore : null, counts: item.counts && typeof item.counts === 'object' ? item.counts as AdminBenchmarkRun['counts'] : null, cases: item.cases ?? null };
}

export async function getAdminBenchmarks(signal?: AbortSignal): Promise<ApiRequestResult<AdminBenchmarks>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.BENCHMARKS, getSessionProxyBaseUrl(), { credentials: 'include', signal });
  const data = (result.data as { data?: { available?: boolean; latest?: unknown; history?: unknown[] } }).data ?? {};
  return { ...result, data: { available: data.available === true, latest: data.latest ? parseRun(data.latest) : null, history: (data.history ?? []).map(parseRun) } };
}

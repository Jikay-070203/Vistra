import { getApiBaseUrl, getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { healthResponseSchema } from '@/schemas/systemSchema';
import { traceDetailSchema, traceListSchema } from '@/schemas/adminSystemSchema';
import { ApiClientError, apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { HealthResponse, HealthErrorType } from '@/types/system';
import type { AdminPageQuery, AdminPageView, TraceDetailView, TraceListItemView } from '@/types/adminSystemApi';

export async function getTraces(query: AdminPageQuery): Promise<ApiRequestResult<AdminPageView<TraceListItemView>>> {
  const params = new URLSearchParams({ page: String(query.page), page_size: String(query.pageSize) });
  const result = await apiRequest(API_ENDPOINTS.ADMIN_SYSTEM.TRACES + '?' + params, getSessionProxyBaseUrl(), { credentials: 'include' });
  return { ...result, data: traceListSchema.parse(result.data) };
}

export async function getTrace(id: string): Promise<ApiRequestResult<TraceDetailView>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_SYSTEM.TRACE(id), getSessionProxyBaseUrl(), { credentials: 'include' });
  return { ...result, data: traceDetailSchema.parse(result.data) };
}

/** Custom error class kept as the UI-facing contract for health checks. */
export class HealthServiceError extends Error {
  public httpStatus?: number;
  public endpoint: string;
  public errorType: HealthErrorType;

  constructor(
    message: string,
    options: {
      httpStatus?: number;
      endpoint: string;
      errorType: HealthErrorType;
    },
  ) {
    super(message);
    this.name = 'HealthServiceError';
    this.httpStatus = options.httpStatus;
    this.endpoint = options.endpoint;
    this.errorType = options.errorType;
  }
}

/** Preserves the previous export while the base URL now lives in config. */
export function getBackendBaseUrl(): string | undefined {
  return getApiBaseUrl();
}

const healthErrorTypes: Record<ApiClientError['errorType'], HealthErrorType> = {
  missing_base_url: 'missing_url',
  network_error: 'network_cors',
  aborted: 'aborted',
  http_error: 'http_error',
  invalid_json: 'invalid_response',
};

/** Calls GET /health through the same-origin proxy and validates the backend contract. */
export async function getSystemHealth(customBaseUrl?: string): Promise<{
  data: HealthResponse;
  httpStatus: number;
  endpoint: string;
}> {
  void customBaseUrl;
  let result: ApiRequestResult;
  try {
    result = await apiRequest(
      API_ENDPOINTS.SYSTEM.HEALTH,
      getSessionProxyBaseUrl(),
      { method: 'GET' },
    );
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw new HealthServiceError(error.message, {
        httpStatus: error.httpStatus,
        endpoint: error.endpoint,
        errorType: healthErrorTypes[error.errorType],
      });
    }
    throw error;
  }

  try {
    return {
      ...result,
      data: healthResponseSchema.parse(result.data),
    };
  } catch {
    throw new HealthServiceError(
      'Dữ liệu phản hồi từ /health không đúng schema dự kiến ({ status: "ok", version: string }).',
      {
        httpStatus: result.httpStatus,
        endpoint: result.endpoint,
        errorType: 'invalid_response',
      },
    );
  }
}

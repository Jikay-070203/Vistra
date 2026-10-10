import { BACKEND_PROXY_BASE_URL } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import type { ApiClientErrorType, ApiFieldErrors, ApiRequestOptions, ApiRequestResult } from '@/types/api';

export class ApiClientError extends Error {
  public httpStatus?: number;
  public endpoint: string;
  public errorType: ApiClientErrorType;
  public responseData?: unknown;
  public code?: string;
  public fieldErrors?: ApiFieldErrors;

  constructor(
    message: string,
    options: {
      httpStatus?: number;
      endpoint: string;
      errorType: ApiClientErrorType;
      responseData?: unknown;
      code?: string;
      fieldErrors?: ApiFieldErrors;
    },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.httpStatus = options.httpStatus;
    this.endpoint = options.endpoint;
    this.errorType = options.errorType;
    this.responseData = options.responseData;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
  }
}

/** Shared fetch transport. Domain services validate the returned JSON schema. */
let sessionRefreshInFlight: Promise<void> | null = null;

const SESSION_REFRESH_EXCLUDED_ENDPOINTS: readonly string[] = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.LOGOUT,
  API_ENDPOINTS.AUTH.REFRESH,
  API_ENDPOINTS.SYSTEM.HEALTH,
  API_ENDPOINTS.CATALOG.ALLERGIES,
  API_ENDPOINTS.CATALOG.PROVINCES,
  API_ENDPOINTS.CONTENT.PUBLIC_LANDING,
  API_ENDPOINTS.RECOMMENDATIONS.LIST,
  API_ENDPOINTS.DESTINATIONS.LIST,
  API_ENDPOINTS.TRIPS.LIST,
  API_ENDPOINTS.PLACES.LIST,
];

function isPublicBackendEndpoint(endpoint: string): boolean {
  const path = endpoint.split('?')[0];
  return SESSION_REFRESH_EXCLUDED_ENDPOINTS.includes(path) ||
    /^\/api\/v1\/destinations\/[A-Za-z0-9_-]+$/.test(path) ||
    /^\/destinations\/[A-Za-z0-9_-]+\/seasonality$/.test(path) ||
    /^\/places\/[0-9]+$/.test(path);
}

function shouldRefreshSession(endpoint: string, baseUrl: string | undefined, options: ApiRequestOptions): boolean {
  return typeof window !== 'undefined' &&
    options.transport !== 'internal' && options.transport !== 'server-backend' &&
    baseUrl?.trim().replace(/\/+$/, '') === BACKEND_PROXY_BASE_URL &&
    !isPublicBackendEndpoint(endpoint);
}

function refreshSession(): Promise<void> {
  if (!sessionRefreshInFlight) {
    sessionRefreshInFlight = requestApi(
      API_ENDPOINTS.AUTH.REFRESH,
      BACKEND_PROXY_BASE_URL,
      { method: 'POST', credentials: 'include' },
      false,
    ).then(() => undefined).finally(() => {
      sessionRefreshInFlight = null;
    });
  }
  return sessionRefreshInFlight;
}

export function apiRequest(
  endpoint: string,
  baseUrl: string | undefined,
  options: ApiRequestOptions = {},
): Promise<ApiRequestResult> {
  return requestApi(endpoint, baseUrl, options, true);
}

/** Server-only backend lookup used inside Next.js proxy handlers for authorization checks. */
export function apiRequestToBackend(
  endpoint: string,
  backendOrigin: URL,
  options: Omit<ApiRequestOptions, 'transport'> = {},
): Promise<ApiRequestResult> {
  if (typeof window !== 'undefined') {
    throw new ApiClientError('Yêu cầu gọi thẳng backend chỉ được dùng phía server.', {
      endpoint,
      errorType: 'network_error',
    });
  }
  if (!['http:', 'https:'].includes(backendOrigin.protocol) || backendOrigin.username || backendOrigin.password) {
    throw new ApiClientError('Backend origin không hợp lệ.', {
      endpoint,
      errorType: 'missing_base_url',
    });
  }
  return requestApi(endpoint, backendOrigin.origin, { ...options, transport: 'server-backend' }, true);
}

async function requestApi(
  endpoint: string,
  baseUrl: string | undefined,
  options: ApiRequestOptions,
  allowSessionRefresh: boolean,
): Promise<ApiRequestResult> {
  let requestUrl: string;

  if (options.transport === 'internal') {
    if (
      typeof endpoint !== 'string' ||
      !endpoint.startsWith('/') ||
      endpoint.startsWith('//') ||
      endpoint.includes('\\')
    ) {
      throw new ApiClientError('Đường dẫn nội bộ không hợp lệ.', {
        endpoint: String(endpoint),
        errorType: 'network_error',
      });
    }
    try {
      const parsed = new URL(endpoint, 'http://localhost');
      if (parsed.origin !== 'http://localhost' || !parsed.pathname.startsWith('/')) {
        throw new Error();
      }
    } catch {
      throw new ApiClientError('Đường dẫn nội bộ không hợp lệ.', {
        endpoint,
        errorType: 'network_error',
      });
    }
    requestUrl = endpoint;
  } else if (options.transport === 'server-backend') {
    if (typeof window !== 'undefined' || !baseUrl) {
      throw new ApiClientError('Yêu cầu gọi thẳng backend chỉ được dùng phía server.', {
        endpoint,
        errorType: 'network_error',
      });
    }
    requestUrl = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  } else {
    const normalizedBase = baseUrl?.trim().replace(/\/+$/, '');
    if (normalizedBase !== BACKEND_PROXY_BASE_URL) {
      throw new ApiClientError(
        `API VISTRA từ trình duyệt phải đi qua Next.js proxy ${BACKEND_PROXY_BASE_URL}.`,
        { endpoint: normalizedBase || '(Chưa cấu hình proxy)', errorType: 'missing_base_url' },
      );
    }

    const normalizedPath = '/' + endpoint.replace(/^\/+/, '');
    requestUrl = `${normalizedBase}${normalizedPath}`;
  }

  const { jsonBody, transport: _transport, ...requestOptions } = options;
  void _transport;
  const headers = new Headers(requestOptions.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  let body = requestOptions.body;
  if (Object.prototype.hasOwnProperty.call(options, 'jsonBody')) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    body = JSON.stringify(jsonBody);
  }

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...requestOptions,
      credentials: requestOptions.credentials ?? 'same-origin',
      method: options.method ?? 'GET',
      cache: options.cache ?? 'no-store',
      headers,
      body,
    });
  } catch (cause: unknown) {
    if (options.signal?.aborted || (cause instanceof Error && cause.name === 'AbortError')) {
      throw new ApiClientError('Yêu cầu đã bị hủy.', { endpoint: requestUrl, errorType: 'aborted' });
    }
    const detail = cause instanceof Error ? cause.message : 'Network error';
    throw new ApiClientError(
      `Không thể kết nối tới backend (${detail}). Vui lòng kiểm tra backend và cấu hình CORS.`,
      { endpoint: requestUrl, errorType: 'network_error' },
    );
  }

  if (response.status === 401 && allowSessionRefresh && shouldRefreshSession(endpoint, baseUrl, options)) {
    let refreshed = false;
    try {
      await refreshSession();
      refreshed = true;
    } catch {
      // Preserve the original request's 401 details when refresh fails.
    }
    if (refreshed) return requestApi(endpoint, baseUrl, options, false);
  }

  if (!response.ok) {
    let errorDetail = '';
    let responseData: unknown;
    let code: string | undefined;
    let fieldErrors: ApiFieldErrors | undefined;
    try {
      const rawBody = await response.text();
      if (rawBody) {
        try {
          responseData = JSON.parse(rawBody);
          if (typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)) {
            const body = responseData as { detail?: unknown; message?: unknown; code?: unknown; fieldErrors?: unknown };
            const detail = body.detail ?? body;
            const detailObject = typeof detail === 'object' && detail !== null && !Array.isArray(detail)
              ? detail as { code?: unknown; message?: unknown; fieldErrors?: unknown }
              : undefined;
            code = typeof detailObject?.code === 'string' ? detailObject.code :
              typeof body.code === 'string' ? body.code : undefined;
            const rawFieldErrors = detailObject?.fieldErrors ?? body.fieldErrors;
            if (typeof rawFieldErrors === 'object' && rawFieldErrors !== null && !Array.isArray(rawFieldErrors)) {
              fieldErrors = Object.fromEntries(
                Object.entries(rawFieldErrors).filter((entry): entry is [string, string[]] =>
                  Array.isArray(entry[1]) && entry[1].every(item => typeof item === 'string')),
              );
            }
            if (!fieldErrors && Array.isArray(detail)) {
              const parsed: ApiFieldErrors = {};
              for (const issue of detail) {
                if (typeof issue !== 'object' || issue === null || Array.isArray(issue)) continue;
                const { loc, msg } = issue as { loc?: unknown; msg?: unknown };
                if (!Array.isArray(loc) || typeof msg !== 'string') continue;
                const field = loc.slice(1).map(String).join('.');
                if (field) (parsed[field] ??= []).push(msg);
              }
              if (Object.keys(parsed).length) fieldErrors = parsed;
            }
            errorDetail = typeof detail === 'string' ? detail :
              typeof detailObject?.message === 'string' ? detailObject.message :
              typeof body.message === 'string' ? body.message : JSON.stringify(responseData);
          } else {
            errorDetail = String(responseData);
          }
        } catch {
          responseData = rawBody;
          errorDetail = rawBody;
        }
      }
    } catch {
      errorDetail = '';
    }

    const message = errorDetail
      ? `Backend phản hồi lỗi HTTP ${response.status}: ${errorDetail.slice(0, 120)}`
      : `Backend phản hồi lỗi HTTP ${response.status} (${response.statusText || 'Lỗi máy chủ'})`;

    throw new ApiClientError(message, {
      httpStatus: response.status,
      endpoint: requestUrl,
      errorType: 'http_error',
      responseData,
      code,
      fieldErrors,
    });
  }

  if (response.status === 204) {
    return { data: null, httpStatus: response.status, endpoint: requestUrl };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiClientError('Phản hồi từ backend không phải định dạng JSON hợp lệ.', {
      httpStatus: response.status,
      endpoint: requestUrl,
      errorType: 'invalid_json',
    });
  }

  return { data, httpStatus: response.status, endpoint: requestUrl };
}

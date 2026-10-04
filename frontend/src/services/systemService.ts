import type { HealthResponse, HealthErrorType } from '@/types/system';

/**
 * Custom error class for Health Check operations
 */
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
    }
  ) {
    super(message);
    this.name = 'HealthServiceError';
    this.httpStatus = options.httpStatus;
    this.endpoint = options.endpoint;
    this.errorType = options.errorType;
  }
}

/**
 * Normalizes backend base URL by stripping trailing slashes.
 */
export function getBackendBaseUrl(customBaseUrl?: string): string {
  const rawUrl = customBaseUrl !== undefined ? customBaseUrl : process.env.NEXT_PUBLIC_API_URL;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }
  return rawUrl.trim().replace(/\/+$/, '');
}

/**
 * Invokes GET /health endpoint from the configured backend base URL.
 *
 * @param customBaseUrl Optional override for testing or simulation
 * @returns Object containing parsed HealthResponse, HTTP status, and endpoint called
 * @throws HealthServiceError on missing URL, network/CORS error, HTTP error, or malformed response
 */
export async function getSystemHealth(customBaseUrl?: string): Promise<{
  data: HealthResponse;
  httpStatus: number;
  endpoint: string;
}> {
  const baseUrl = getBackendBaseUrl(customBaseUrl);

  if (!baseUrl) {
    throw new HealthServiceError(
      'Chưa cấu hình biến môi trường NEXT_PUBLIC_API_URL. Vui lòng thiết lập base URL của backend trong file môi trường.',
      {
        endpoint: '(Chưa cấu hình)',
        errorType: 'missing_url',
      }
    );
  }

  const endpoint = `${baseUrl}/health`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (cause: unknown) {
    const detail = cause instanceof Error ? cause.message : 'Network error';
    throw new HealthServiceError(
      `Không thể kết nối tới backend (${detail}). Vui lòng đảm bảo backend đang chạy và cấu hình CORS_ORIGINS cho phép origin của frontend.`,
      {
        endpoint,
        errorType: 'network_cors',
      }
    );
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail =
        typeof errJson === 'object' && errJson !== null
          ? (errJson as { detail?: string; message?: string }).detail ||
            (errJson as { detail?: string; message?: string }).message ||
            JSON.stringify(errJson)
          : String(errJson);
    } catch {
      try {
        errorDetail = await response.text();
      } catch {
        errorDetail = '';
      }
    }

    const message = errorDetail
      ? `Backend phản hồi lỗi HTTP ${response.status}: ${errorDetail.slice(0, 120)}`
      : `Backend phản hồi lỗi HTTP ${response.status} (${response.statusText || 'Lỗi máy chủ'})`;

    throw new HealthServiceError(message, {
      httpStatus: response.status,
      endpoint,
      errorType: 'http_error',
    });
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new HealthServiceError(
      'Phản hồi từ backend không phải định dạng JSON hợp lệ.',
      {
        httpStatus: response.status,
        endpoint,
        errorType: 'invalid_response',
      }
    );
  }

  if (typeof data !== 'object' || data === null) {
    throw new HealthServiceError(
      'Dữ liệu phản hồi từ /health không đúng định dạng đối tượng JSON.',
      {
        httpStatus: response.status,
        endpoint,
        errorType: 'invalid_response',
      }
    );
  }

  return {
    data: data as HealthResponse,
    httpStatus: response.status,
    endpoint,
  };
}

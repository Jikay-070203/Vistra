/**
 * System and Health API Types
 *
 * Contract verified with Backend GET /health:
 * Response: { status: "ok", version?: "0.1.0" }
 */

export interface HealthResponse {
  status: string;
  version?: string;
  [key: string]: unknown;
}

export type HealthCheckStatus = 'idle' | 'loading' | 'success' | 'error';

export type HealthErrorType = 'missing_url' | 'network_cors' | 'http_error' | 'invalid_response';

export interface HealthCheckState {
  status: HealthCheckStatus;
  httpStatus?: number;
  data?: HealthResponse;
  errorMessage?: string;
  endpoint?: string;
  checkedAt?: string;
  errorType?: HealthErrorType;
}

/**
 * System and Health API Types
 *
 * Contract verified with Backend GET /health:
 * Response: { status: "ok", version: "0.1.0" }
 */

export interface HealthResponse {
  status: 'ok';
  version: string;
}

export type HealthCheckStatus = 'idle' | 'loading' | 'success' | 'error';

export type HealthErrorType = 'missing_url' | 'network_cors' | 'aborted' | 'http_error' | 'invalid_response';

export interface HealthCheckState {
  status: HealthCheckStatus;
  httpStatus?: number;
  data?: HealthResponse;
  errorMessage?: string;
  endpoint?: string;
  checkedAt?: string;
  errorType?: HealthErrorType;
}

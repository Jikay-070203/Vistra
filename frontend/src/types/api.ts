export type ApiClientErrorType =
  | 'missing_base_url'
  | 'network_error'
  | 'aborted'
  | 'http_error'
  | 'invalid_json';

export interface ApiFieldErrors {
  [field: string]: string[];
}

export interface ApiRequestResult<T = unknown> {
  data: T;
  httpStatus: number;
  endpoint: string;
}

export type ApiRequestTransport = 'internal';

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: RequestInit['body'];
  jsonBody?: unknown;
  transport?: ApiRequestTransport;
};

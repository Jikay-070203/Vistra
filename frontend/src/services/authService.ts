import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { authResponseSchema, logoutResponseSchema } from '@/schemas/authSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AuthView, LoginRequest, RegisterRequest } from '@/types/auth';

function parseAuth(result: ApiRequestResult): ApiRequestResult<AuthView> {
  return { ...result, data: authResponseSchema.parse(result.data) };
}

export async function login(request: LoginRequest): Promise<ApiRequestResult<AuthView>> {
  return parseAuth(await apiRequest(API_ENDPOINTS.AUTH.LOGIN, getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: request,
  }));
}

export async function register(request: RegisterRequest): Promise<ApiRequestResult<AuthView>> {
  const body = {
    full_name: request.fullName,
    date_of_birth: request.dateOfBirth,
    email: request.email,
    password: request.password,
    ...(request.acceptedTermsVersion === undefined ? {} : { accepted_terms_version: request.acceptedTermsVersion }),
  };
  return parseAuth(await apiRequest(API_ENDPOINTS.AUTH.REGISTER, getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: body,
  }));
}

export async function getSession(): Promise<ApiRequestResult<AuthView>> {
  return parseAuth(await apiRequest(API_ENDPOINTS.AUTH.ME, getSessionProxyBaseUrl()));
}

export async function logout(): Promise<ApiRequestResult<{ success: true }>> {
  const result = await apiRequest(API_ENDPOINTS.AUTH.LOGOUT, getSessionProxyBaseUrl(), { method: 'POST' });
  return { ...result, data: logoutResponseSchema.parse(result.data) };
}

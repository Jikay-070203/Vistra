import { API_ENDPOINTS } from '@/constants/endpoints';
import { adminAuthResponseSchema } from '@/schemas/adminAuthSchema';
import { ApiClientError, apiRequest } from '@/services/apiClient';
import type { ApiRequestOptions } from '@/types/api';
import type { AdminAuthResult, AdminLoginCredentials } from '@/types/adminAuth';

function getFailure(error: unknown): AdminAuthResult {
  if (error instanceof ApiClientError) {
    try {
      const response = adminAuthResponseSchema.parse(error.responseData);
      return { ...response, httpStatus: error.httpStatus };
    } catch {
      return { success: false, message: error.message, httpStatus: error.httpStatus };
    }
  }

  return {
    success: false,
    message: error instanceof Error ? error.message : 'Yêu cầu xác thực không thành công.',
  };
}

async function requestAdminAuth(
  endpoint: string,
  options: ApiRequestOptions,
): Promise<AdminAuthResult> {
  try {
    // Explicit internal transport for internal Next.js auth route aliases (/api/admin/auth/*)
    const result = await apiRequest(endpoint, undefined, {
      ...options,
      transport: 'internal',
    });
    return { ...adminAuthResponseSchema.parse(result.data), httpStatus: result.httpStatus };
  } catch (error: unknown) {
    return getFailure(error);
  }
}

export async function loginAdmin(
  credentials: AdminLoginCredentials
): Promise<AdminAuthResult> {
  return requestAdminAuth(API_ENDPOINTS.ADMIN_AUTH.LOGIN, {
    method: 'POST',
    jsonBody: credentials,
  });
}

export async function logoutAdmin(): Promise<AdminAuthResult> {
  return requestAdminAuth(API_ENDPOINTS.ADMIN_AUTH.LOGOUT, { method: 'POST' });
}

import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { adminOverviewSchema, adminRevenueSchema, adminUserStatusSchema, adminUsersPageSchema } from '@/schemas/adminOperationsSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AdminOverviewView, AdminRevenueView, AdminUserView, AdminUsersPageView } from '@/types/adminOperationsApi';

export async function getAdminOverview(signal?: AbortSignal): Promise<ApiRequestResult<AdminOverviewView>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.OVERVIEW, getSessionProxyBaseUrl(), {
    credentials: 'include', signal,
  });
  return { ...result, data: adminOverviewSchema.parse(result.data) };
}

export async function getAdminUsers(query: { page: number; pageSize: number; q?: string }, signal?: AbortSignal): Promise<ApiRequestResult<AdminUsersPageView>> {
  const params = new URLSearchParams({ page: String(query.page), page_size: String(query.pageSize) });
  if (query.q?.trim()) params.set('q', query.q.trim());
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.USERS + '?' + params, getSessionProxyBaseUrl(), {
    credentials: 'include', signal,
  });
  return { ...result, data: adminUsersPageSchema.parse(result.data) };
}

export async function updateAdminUserStatus(id: string, status: AdminUserView['status'], signal?: AbortSignal): Promise<ApiRequestResult<{ id: string; status: AdminUserView['status'] }>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.USER_STATUS(id), getSessionProxyBaseUrl(), {
    method: 'PATCH', credentials: 'include', jsonBody: { status }, signal,
  });
  return { ...result, data: adminUserStatusSchema.parse(result.data) };
}

export async function getAdminRevenue(query: { dateFrom?: string; dateTo?: string; status?: string } = {}, signal?: AbortSignal): Promise<ApiRequestResult<AdminRevenueView>> {
  const params = new URLSearchParams();
  if (query.dateFrom) params.set('date_from', query.dateFrom);
  if (query.dateTo) params.set('date_to', query.dateTo);
  if (query.status) params.set('status', query.status);
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.REVENUE + (params.size ? `?${params}` : ''), getSessionProxyBaseUrl(), {
    credentials: 'include', signal,
  });
  return { ...result, data: adminRevenueSchema.parse(result.data) };
}

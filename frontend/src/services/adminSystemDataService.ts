import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { adminEntityMetadataSchema, adminEntityRecordsSchema } from '@/schemas/adminSystemDataSchema';
import { adminImportResultSchema, adminPlaceImagesImportSchema, adminPlacesImportSchema } from '@/schemas/adminDataImportSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AdminEntityMetadata, AdminEntityRecords, AdminEntityTableId, AdminEntityMutationResult, AdminImportResult } from '@/types/adminSystemDataApi';

export async function getAdminEntityMetadata(signal?: AbortSignal): Promise<ApiRequestResult<AdminEntityMetadata>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.ENTITY_METADATA, getSessionProxyBaseUrl(), { credentials: 'include', signal });
  return { ...result, data: adminEntityMetadataSchema.parse(result.data) };
}

export async function getAdminEntityRecords(
  table: AdminEntityTableId,
  query: { page: number; pageSize: number; q?: string },
  signal?: AbortSignal,
): Promise<ApiRequestResult<AdminEntityRecords>> {
  const params = new URLSearchParams({ page: String(query.page), page_size: String(query.pageSize) });
  if (query.q?.trim()) params.set('q', query.q.trim());
  const result = await apiRequest(
    API_ENDPOINTS.ADMIN_V1.ENTITY_RECORDS(table) + '?' + params,
    getSessionProxyBaseUrl(),
    { credentials: 'include', signal },
  );
  return { ...result, data: adminEntityRecordsSchema.parse(result.data) };
}

function parseMutation(value: unknown): AdminEntityMutationResult {
  const envelope = value as { data?: unknown };
  const data = envelope.data as Record<string, unknown> | undefined;
  if (!data || typeof data.table !== 'string' || typeof data.id !== 'string') {
    throw new TypeError('Invalid admin entity mutation response');
  }
  return { table: data.table as AdminEntityTableId, id: data.id, updated: data.updated === true, deleted: data.deleted === true };
}

export async function createAdminEntity(table: AdminEntityTableId, payload: Record<string, unknown>) {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.ENTITY_RECORDS(table), getSessionProxyBaseUrl(), {
    method: 'POST', credentials: 'include', jsonBody: payload,
  });
  return { ...result, data: parseMutation(result.data) };
}

export async function updateAdminEntity(table: AdminEntityTableId, id: string, payload: Record<string, unknown>) {
  const result = await apiRequest(`${API_ENDPOINTS.ADMIN_V1.ENTITY_RECORDS(table)}/${encodeURIComponent(id)}`, getSessionProxyBaseUrl(), {
    method: 'PATCH', credentials: 'include', jsonBody: payload,
  });
  return { ...result, data: parseMutation(result.data) };
}

export async function deleteAdminEntity(table: AdminEntityTableId, id: string) {
  const result = await apiRequest(`${API_ENDPOINTS.ADMIN_V1.ENTITY_RECORDS(table)}/${encodeURIComponent(id)}`, getSessionProxyBaseUrl(), {
    method: 'DELETE', credentials: 'include',
  });
  return { ...result, data: parseMutation(result.data) };
}

export async function importAdminPlaces(payload: unknown): Promise<ApiRequestResult<AdminImportResult>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.IMPORT_PLACES, getSessionProxyBaseUrl(), {
    method: 'POST', credentials: 'include', jsonBody: adminPlacesImportSchema.parse(payload),
  });
  return { ...result, data: adminImportResultSchema.parse(result.data) };
}

export async function importAdminPlaceImages(payload: unknown): Promise<ApiRequestResult<AdminImportResult>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.IMPORT_PLACE_IMAGES, getSessionProxyBaseUrl(), {
    method: 'POST', credentials: 'include', jsonBody: adminPlaceImagesImportSchema.parse(payload),
  });
  return { ...result, data: adminImportResultSchema.parse(result.data) };
}

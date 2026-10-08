import { getApiBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { DISCOVERY_ENDPOINTS } from '@/constants/discoveryEndpoints';
import { allergyCatalogSchema, provinceCatalogSchema } from '@/schemas/catalogApiSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AllergyCatalogItem, ProvinceCatalogItem } from '@/types/catalogApi';

export async function getAllergyCatalog(): Promise<ApiRequestResult<AllergyCatalogItem[]>> {
  const result = await apiRequest(API_ENDPOINTS.CATALOG.ALLERGIES, getApiBaseUrl());
  return { ...result, data: allergyCatalogSchema.parse(result.data) };
}

export async function getProvinceCatalog(): Promise<ApiRequestResult<ProvinceCatalogItem[]>> {
  const result = await apiRequest(DISCOVERY_ENDPOINTS.PROVINCES, getApiBaseUrl());
  return { ...result, data: provinceCatalogSchema.parse(result.data) };
}

import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { adminContentSchema, parseAllergyContent, parseHeroContent, parseIntroContent } from '@/schemas/contentSchema';
import { record } from '@/schemas/apiSchemaHelpers';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AdminContentView, AllergyContentItem, AllergyContentPayload, ContentCollection,
  ContentFlags, HeroContentItem, HeroContentPayload, IntroContentItem, IntroContentPayload } from '@/types/contentApi';

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new TypeError(label + ' is required');
  return trimmed;
}

function imageUrl(value: string): string {
  const image = required(value, 'image');
  if (image.startsWith('/') && !image.startsWith('//')) return image;
  try {
    const parsed = new URL(image);
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.username && !parsed.password) return image;
  } catch { /* Invalid external URL. */ }
  throw new TypeError('image must be a local path or HTTP(S) URL');
}

export async function getAdminContent(): Promise<ApiRequestResult<AdminContentView>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.CONTENT, getSessionProxyBaseUrl(), {
    credentials: 'include',
  });
  const response = record(result.data, 'admin content response');
  return { ...result, data: adminContentSchema.parse(response.data) };
}

function parseContentResponse<T>(value: unknown, parse: (value: unknown) => T): T {
  return parse(record(record(value, 'admin content response').data, 'admin content response.data'));
}

export async function createHeroContent(payload: HeroContentPayload): Promise<ApiRequestResult<HeroContentItem>> {
  const body = { ...payload, title: required(payload.title, 'title'),
    destination: required(payload.destination, 'destination'), image: imageUrl(payload.image) };
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.CONTENT_COLLECTION('hero-plans'), getSessionProxyBaseUrl(), {
    method: 'POST', credentials: 'include', jsonBody: body,
  });
  return { ...result, data: parseContentResponse(result.data, parseHeroContent) };
}

export async function createAllergyContent(payload: AllergyContentPayload): Promise<ApiRequestResult<AllergyContentItem>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.CONTENT_COLLECTION('allergy-options'), getSessionProxyBaseUrl(), {
    method: 'POST', credentials: 'include', jsonBody: { label: required(payload.label, 'label') },
  });
  return { ...result, data: parseContentResponse(result.data, parseAllergyContent) };
}

async function patchContent<T>(collection: ContentCollection, id: string, patch: object,
  parse: (value: unknown) => T): Promise<ApiRequestResult<T>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.CONTENT_ITEM(collection, id), getSessionProxyBaseUrl(), {
    method: 'PATCH', credentials: 'include', jsonBody: patch,
  });
  return { ...result, data: parseContentResponse(result.data, parse) };
}

export function updateHeroContent(id: string, patch: Partial<HeroContentPayload> & ContentFlags): Promise<ApiRequestResult<HeroContentItem>> {
  return patchContent('hero-plans', id, {
    ...patch,
    ...(patch.title !== undefined && { title: required(patch.title, 'title') }),
    ...(patch.destination !== undefined && { destination: required(patch.destination, 'destination') }),
    ...(patch.image !== undefined && { image: imageUrl(patch.image) }),
  }, parseHeroContent);
}

export function updateIntroContent(id: string, patch: Partial<IntroContentPayload> & ContentFlags): Promise<ApiRequestResult<IntroContentItem>> {
  const { image, ...fields } = patch;
  return patchContent('intro-destinations', id, {
    ...fields,
    ...(patch.label !== undefined && { label: required(patch.label, 'label') }),
    ...(image !== undefined && { imageUrl: imageUrl(image) }),
  }, parseIntroContent);
}

export function updateAllergyContent(id: string, patch: Partial<AllergyContentPayload> & ContentFlags): Promise<ApiRequestResult<AllergyContentItem>> {
  return patchContent('allergy-options', id, {
    ...patch,
    ...(patch.label !== undefined && { label: required(patch.label, 'label') }),
  }, parseAllergyContent);
}

export async function deleteContent(collection: ContentCollection, id: string): Promise<ApiRequestResult<null>> {
  const result = await apiRequest(API_ENDPOINTS.ADMIN_V1.CONTENT_ITEM(collection, id), getSessionProxyBaseUrl(), {
    method: 'DELETE', credentials: 'include',
  });
  if (result.httpStatus !== 204) throw new TypeError('Content delete response must be HTTP 204');
  return { ...result, data: null };
}

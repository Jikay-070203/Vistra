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
  const result = await apiRequest(API_ENDPOINTS.CONTENT.ADMIN_LIST, getSessionProxyBaseUrl());
  return { ...result, data: adminContentSchema.parse(result.data) };
}

export async function createHeroContent(payload: HeroContentPayload): Promise<ApiRequestResult<HeroContentItem>> {
  const body = { ...payload, title: required(payload.title, 'title'),
    destination: required(payload.destination, 'destination'), image: imageUrl(payload.image) };
  const result = await apiRequest(API_ENDPOINTS.CONTENT.COLLECTION('hero-plans'), getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: body,
  });
  return { ...result, data: parseHeroContent(record(result.data, 'content create response').item) };
}

export async function createAllergyContent(payload: AllergyContentPayload): Promise<ApiRequestResult<AllergyContentItem>> {
  const result = await apiRequest(API_ENDPOINTS.CONTENT.COLLECTION('allergy-options'), getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: { label: required(payload.label, 'label') },
  });
  return { ...result, data: parseAllergyContent(record(result.data, 'content create response').item) };
}

async function patchContent<T>(collection: ContentCollection, id: string, patch: object,
  parse: (value: unknown) => T): Promise<ApiRequestResult<T>> {
  const result = await apiRequest(API_ENDPOINTS.CONTENT.ITEM(collection, id), getSessionProxyBaseUrl(), {
    method: 'PATCH', jsonBody: patch,
  });
  return { ...result, data: parse(record(result.data, 'content patch response').item) };
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
  return patchContent('intro-destinations', id, {
    ...patch,
    ...(patch.label !== undefined && { label: required(patch.label, 'label') }),
    ...(patch.image !== undefined && { image: imageUrl(patch.image) }),
  }, parseIntroContent);
}

export function updateAllergyContent(id: string, patch: Partial<AllergyContentPayload> & ContentFlags): Promise<ApiRequestResult<AllergyContentItem>> {
  return patchContent('allergy-options', id, {
    ...patch,
    ...(patch.label !== undefined && { label: required(patch.label, 'label') }),
  }, parseAllergyContent);
}

export async function deleteContent(collection: ContentCollection, id: string): Promise<ApiRequestResult<null>> {
  const result = await apiRequest(API_ENDPOINTS.CONTENT.ITEM(collection, id), getSessionProxyBaseUrl(), { method: 'DELETE' });
  if (result.httpStatus !== 204) throw new TypeError('Content delete response must be HTTP 204');
  return { ...result, data: null };
}

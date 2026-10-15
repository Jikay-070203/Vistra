import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import {
  tripBudgetResponseSchema,
  tripDetailResponseSchema,
  tripListResponseSchema,
} from '@/schemas/tripApiSchema';
import { myTripCardsSchema } from '@/schemas/tripCollectionSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type {
  TripBudgetResponse,
  TripDetailDto,
  TripListParams,
  TripListResponse,
} from '@/types/tripApi';
import type { PagedTripCardsView, TripCardView, TripPageQuery } from '@/types/tripCollectionApi';
import type { CreatedTripView, TripCreateRequest } from '@/types/tripCreateApi';
import { tripCreateResponseSchema } from '@/schemas/tripCreateSchema';
import { confirmedTripSchema, revisionPreviewSchema, savedItinerarySchema, tripChatSchema } from '@/schemas/tripWorkspaceSchema';
import { planPublicationSchema } from '@/schemas/planSchema';
import type { RevisionRequest } from '@/types/planApi';

export async function createTrip(request: TripCreateRequest): Promise<ApiRequestResult<CreatedTripView>> {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.CREATE + '?generate_itinerary=false', getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: request,
  });
  return { ...result, data: tripCreateResponseSchema.parse(result.data) };
}

export async function getMyTrips(query: TripPageQuery): Promise<ApiRequestResult<PagedTripCardsView>> {
  const params = new URLSearchParams({ page: String(query.page), page_size: String(query.pageSize) });
  const result = await apiRequest(API_ENDPOINTS.TRIP_COLLECTION.MINE + '?' + params, getSessionProxyBaseUrl());
  return { ...result, data: myTripCardsSchema.parse(result.data) };
}

// shortcut: Loads every owner page for client-side filters; move filters server-side if collections grow large.
export async function getAllMyTrips(): Promise<TripCardView[]> {
  const pageSize = 50;
  const firstPage = await getMyTrips({ page: 1, pageSize });
  const items = [...firstPage.data.items];
  for (let page = 2; page <= firstPage.data.totalPages; page += 1) {
    const result = await getMyTrips({ page, pageSize });
    items.push(...result.data.items);
  }
  return items;
}

export async function getTrips(params: TripListParams = {}): Promise<ApiRequestResult<TripListResponse>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const result = await apiRequest(
    API_ENDPOINTS.TRIPS.LIST + (query.size ? '?' + query : ''),
    getSessionProxyBaseUrl(),
  );
  return { ...result, data: tripListResponseSchema.parse(result.data) };
}

export async function getTrip(id: string): Promise<ApiRequestResult<TripDetailDto>> {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.DETAIL(id), getSessionProxyBaseUrl());
  return { ...result, data: tripDetailResponseSchema.parse(result.data) };
}

export async function getTripBudget(id: string): Promise<ApiRequestResult<TripBudgetResponse>> {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.BUDGET(id), getSessionProxyBaseUrl());
  return { ...result, data: tripBudgetResponseSchema.parse(result.data) };
}

export async function sendTripMessage(id: string, text: string, baseVersion: number) {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.CHAT(id), getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: { text, base_version: baseVersion },
  });
  return { ...result, data: tripChatSchema.parse(result.data) };
}

export async function sendTripMessageStream(id: string, text: string, baseVersion: number) {
  const response = await fetch(`${getSessionProxyBaseUrl()}${API_ENDPOINTS.TRIPS.CHAT_STREAM(id)}`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ text, base_version: baseVersion }),
  });
  if (!response.ok) throw new Error(`Backend phản hồi lỗi HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Backend không trả về luồng SSE');
  const decoder = new TextDecoder(); let buffer = ''; let result: unknown;
  while (true) {
    const chunk = await reader.read();
    buffer += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !chunk.done });
    const events = buffer.split('\n\n'); buffer = events.pop() ?? '';
    for (const event of events) {
      const line = event.split('\n').find(item => item.startsWith('data:'));
      if (line) { const payload = JSON.parse(line.slice(5).trim()); if (payload.type === 'complete') result = payload.data; }
    }
    if (chunk.done) break;
  }
  return { data: tripChatSchema.parse(result) };
}

export async function getTripChatHistory(id: string) {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.CHAT_HISTORY(id), getSessionProxyBaseUrl());
  return result as ApiRequestResult<{ trip_id: string; items: Array<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }> }>;
}

export async function generateTrip(
  id: string,
  selectedIds: number[],
  allowUnverified: boolean,
) {
  const query = allowUnverified ? '?allow_unverified=true' : '';
  const result = await apiRequest(
    API_ENDPOINTS.TRIPS.GENERATE(id) + query,
    getSessionProxyBaseUrl(),
    { method: 'POST', jsonBody: { must_visit: selectedIds } },
  );
  return { ...result, data: savedItinerarySchema.parse(result.data) };
}

export async function previewTripRevision(id: string, request: RevisionRequest) {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.PREVIEW(id), getSessionProxyBaseUrl(), { method: 'POST', jsonBody: request });
  return { ...result, data: revisionPreviewSchema.parse(result.data) };
}

export async function commitTripRevision(id: string, previewId: string, baseVersion: number) {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.COMMIT(id), getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: { preview_id: previewId, base_version: baseVersion },
  });
  return { ...result, data: savedItinerarySchema.parse(result.data) };
}

export async function confirmTrip(id: string, baseVersion: number) {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.CONFIRM(id), getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: { base_version: baseVersion },
  });
  return { ...result, data: confirmedTripSchema.parse(result.data) };
}

export async function setTripPublication(id: string, isPublished: boolean, baseVersion: number) {
  const result = await apiRequest(API_ENDPOINTS.TRIPS.PUBLICATION(id), getSessionProxyBaseUrl(), {
    method: 'PATCH', jsonBody: { is_published: isPublished, base_version: baseVersion },
  });
  return { ...result, data: planPublicationSchema.parse(result.data) };
}

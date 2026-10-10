import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { adminFeedbackPageSchema, feedbackMutationSchema, feedbackPageSchema,
  feedbackRatingSchema } from '@/schemas/feedbackSchema';
import { apiRequest } from '@/services/apiClient';
import type { ApiRequestResult } from '@/types/api';
import type { AdminFeedbackPageView, AdminFeedbackPatchDto, AdminFeedbackQuery,
  FeedbackCounts, FeedbackCreateDto, FeedbackListQuery, FeedbackPageView,
  FeedbackRatingDto, FeedbackRatingView, FeedbackTicketView } from '@/types/feedbackApi';

function pageQuery(query: FeedbackListQuery): URLSearchParams {
  return new URLSearchParams({ page: String(query.page), page_size: String(query.pageSize) });
}

export async function getMyFeedback(query: FeedbackListQuery): Promise<ApiRequestResult<FeedbackPageView>> {
  const result = await apiRequest(API_ENDPOINTS.FEEDBACK.MINE + '?' + pageQuery(query), getSessionProxyBaseUrl());
  return { ...result, data: feedbackPageSchema.parse(result.data) };
}

export async function getAdminFeedback(query: AdminFeedbackQuery): Promise<ApiRequestResult<AdminFeedbackPageView>> {
  const params = pageQuery(query);
  if (query.q) params.set('q', query.q);
  if (query.status) params.set('status', query.status);
  const result = await apiRequest(API_ENDPOINTS.FEEDBACK.ADMIN_LIST + '?' + params, getSessionProxyBaseUrl(), {
    credentials: 'include',
  });
  return { ...result, data: adminFeedbackPageSchema.parse(result.data) };
}

export async function getFeedbackCounts(): Promise<ApiRequestResult<FeedbackCounts>> {
  const result = await getAdminFeedback({ page: 1, pageSize: 1 });
  return { ...result, data: result.data.counts };
}

export async function createFeedback(request: FeedbackCreateDto): Promise<ApiRequestResult<FeedbackTicketView>> {
  if (!request.subject.trim() || !request.description.trim() || !request.routeOrigin.trim()) {
    throw new TypeError('Feedback subject, description and route are required');
  }
  const result = await apiRequest(API_ENDPOINTS.FEEDBACK.CREATE, getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: { subject: request.subject, description: request.description,
      route_origin: request.routeOrigin },
  });
  return { ...result, data: feedbackMutationSchema.parse(result.data) };
}

export async function rateFeedback(id: string, request: FeedbackRatingDto): Promise<ApiRequestResult<FeedbackRatingView>> {
  if (!Number.isInteger(request.rating) || request.rating < 1 || request.rating > 5) {
    throw new RangeError('Feedback rating must be 1–5');
  }
  const result = await apiRequest(API_ENDPOINTS.FEEDBACK.RATE(id), getSessionProxyBaseUrl(), {
    method: 'POST', jsonBody: { rating: request.rating, comment: request.comment ?? null },
  });
  return { ...result, data: feedbackRatingSchema.parse(result.data) };
}

export async function classifyFeedback(id: string, patch: AdminFeedbackPatchDto): Promise<ApiRequestResult<FeedbackTicketView>> {
  if (patch.status && !['unassigned', 'in_progress', 'answered', 'resolved'].includes(patch.status)) {
    throw new TypeError('Unsupported feedback status');
  }
  if (!Object.keys(patch).length) throw new TypeError('Feedback patch must contain a change');
  const result = await apiRequest(API_ENDPOINTS.FEEDBACK.ADMIN_ITEM(id), getSessionProxyBaseUrl(), {
    method: 'PATCH', credentials: 'include', jsonBody: patch,
  });
  return { ...result, data: feedbackMutationSchema.parse(result.data) };
}

export async function replyFeedback(id: string, request: { message: string }): Promise<ApiRequestResult<FeedbackTicketView>> {
  if (!request.message.trim()) throw new TypeError('Reply message is required');
  const result = await apiRequest(API_ENDPOINTS.FEEDBACK.ADMIN_REPLY(id), getSessionProxyBaseUrl(), {
    method: 'POST', credentials: 'include', jsonBody: { message: request.message },
  });
  return { ...result, data: feedbackMutationSchema.parse(result.data) };
}

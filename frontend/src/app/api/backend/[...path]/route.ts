import { getBackendServerUrl, resolveBackendPath } from '@/config/backendConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { authResponseSchema } from '@/schemas/authSchema';
import { tripDetailResponseSchema } from '@/schemas/tripApiSchema';
import { apiRequest, ApiClientError } from '@/services/apiClient';

type ProxyContext = { params: Promise<{ path: string[] }> };

const noStore = { 'Cache-Control': 'no-store' };

async function forward(request: Request, context: ProxyContext): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = resolveBackendPath((await context.params).path, method);
  if (!path) return Response.json({ detail: 'Route unavailable' }, { status: 404, headers: noStore });

  const browserUrl = new URL(request.url);
  if (method !== 'GET' && request.headers.get('origin') !== browserUrl.origin) {
    return Response.json({ detail: 'Origin mismatch' }, { status: 403, headers: noStore });
  }

  let backendUrl: URL;
  try {
    backendUrl = getBackendServerUrl();
  } catch {
    return Response.json({ detail: 'Backend unavailable' }, { status: 503, headers: noStore });
  }
  const target = new URL(path + browserUrl.search, backendUrl);
  const headers = new Headers({ Accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const incomingCookies = request.headers.get('cookie')?.split(';').map(part => part.trim())
    .filter(part => part.startsWith('vistra_'));
  if (incomingCookies && incomingCookies.length > 0) {
    headers.set('Cookie', incomingCookies.join('; '));
  }

  try {
    const tripId = path === API_ENDPOINTS.TRIP_COLLECTION.MINE ? null
      : path.match(/^\/api\/v1\/trips\/([^/]+)(?:\/chat)?$|^\/trips\/([^/]+)\//);
    const body = method === 'GET' ? undefined : await request.arrayBuffer();
    if (tripId) {
      // Backend detail/chat currently lack owner enforcement. Never expose another user's trip.
      const options = { headers, cache: 'no-store' as const, redirect: 'manual' as const, signal: request.signal };
      const session = authResponseSchema.parse((await apiRequest(API_ENDPOINTS.AUTH.ME, backendUrl.origin, options)).data);
      const detail = tripDetailResponseSchema.parse((await apiRequest(
        API_ENDPOINTS.TRIPS.DETAIL(tripId[1] ?? tripId[2]), backendUrl.origin, options,
      )).data);
      if (detail.id !== (tripId[1] ?? tripId[2]) || detail.owner_user_id !== session.user.id) {
        return Response.json({ detail: 'Only the owner can access this trip' }, { status: 403, headers: noStore });
      }
      if (method === 'GET' && path === API_ENDPOINTS.TRIPS.DETAIL(detail.id)) {
        return Response.json(detail, { headers: noStore });
      }
      // The existing confirm endpoint does not check base_version itself.
      if (path === API_ENDPOINTS.TRIPS.CONFIRM(detail.id)) {
        let input: unknown;
        try { input = JSON.parse(new TextDecoder().decode(body)); } catch {
          return Response.json({ detail: 'Invalid JSON' }, { status: 422, headers: noStore });
        }
        if (typeof input !== 'object' || !input || !('base_version' in input) || input.base_version !== detail.current_version) {
          return Response.json({ detail: 'Trip changed. Reload before confirming.' }, { status: 409, headers: noStore });
        }
      }
    }
    const upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: request.signal,
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      return Response.json({ detail: 'Backend redirect rejected' }, { status: 502, headers: noStore });
    }
    const responseHeaders = new Headers(noStore);
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) responseHeaders.set('Content-Type', upstreamType);
    if (path.startsWith('/api/v1/auth/')) {
      const rawSetCookies = typeof (upstream.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (upstream.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
        : upstream.headers.get('set-cookie') ? [upstream.headers.get('set-cookie')!] : [];
      for (const cookie of rawSetCookies) {
        responseHeaders.append('Set-Cookie', cookie);
      }
    }
    return new Response(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.httpStatus) {
      return Response.json({ detail: error.message }, { status: error.httpStatus >= 300 && error.httpStatus < 400 ? 502 : error.httpStatus, headers: noStore });
    }
    return Response.json({ detail: 'Backend unavailable' }, { status: 502, headers: noStore });
  }
}

export async function GET(request: Request, context: ProxyContext) { return forward(request, context); }
export async function POST(request: Request, context: ProxyContext) { return forward(request, context); }
export async function PUT(request: Request, context: ProxyContext) { return forward(request, context); }
export async function PATCH(request: Request, context: ProxyContext) { return forward(request, context); }
export async function DELETE(request: Request, context: ProxyContext) { return forward(request, context); }

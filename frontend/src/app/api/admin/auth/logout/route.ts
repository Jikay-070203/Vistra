import { getBackendServerUrl } from '@/config/backendConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { logoutResponseSchema } from '@/schemas/authSchema';

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ success: false, message: 'Origin mismatch' }, { status: 403 });
  }
  const incomingCookies = request.headers.get('cookie')?.split(';').map(part => part.trim())
    .filter(part => part.startsWith('vistra_'));
  try {
    const backend = new URL(API_ENDPOINTS.AUTH.LOGOUT, getBackendServerUrl());
    const result = await fetch(backend, {
      method: 'POST',
      headers: incomingCookies && incomingCookies.length > 0 ? { Cookie: incomingCookies.join('; '), Accept: 'application/json' } : { Accept: 'application/json' },
      cache: 'no-store', redirect: 'manual',
    });
    if (!result.ok) {
      return Response.json({ success: false, message: 'Đăng xuất chưa thành công.' }, { status: result.status });
    }
    logoutResponseSchema.parse(await result.json());
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    const setCookies = typeof (result.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (result.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : result.headers.get('set-cookie') ? [result.headers.get('set-cookie')!] : [];
    for (const cookie of setCookies) {
      headers.append('Set-Cookie', cookie);
    }
    return Response.json({ success: true, message: 'Đã đăng xuất.' }, { headers });
  } catch {
    return Response.json({ success: false, message: 'Backend chưa sẵn sàng.' }, { status: 502 });
  }
}

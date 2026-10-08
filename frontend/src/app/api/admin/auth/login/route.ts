import { getBackendServerUrl } from '@/config/backendConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { authResponseSchema } from '@/schemas/authSchema';

/** Temporary compatibility alias. Unified login should call authService.login. */
export async function POST(request: Request): Promise<Response> {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ success: false, message: 'Origin mismatch' }, { status: 403 });
  }
  let credentials: unknown;
  try { credentials = await request.json(); }
  catch { return Response.json({ success: false, message: 'Dữ liệu yêu cầu không hợp lệ.' }, { status: 400 }); }
  if (typeof credentials !== 'object' || credentials === null || Array.isArray(credentials)) {
    return Response.json({ success: false, message: 'Dữ liệu yêu cầu không hợp lệ.' }, { status: 400 });
  }
  const { email, password } = credentials as Record<string, unknown>;
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return Response.json({ success: false, message: 'Thiếu email hoặc mật khẩu.' }, { status: 400 });
  }
  try {
    const backend = new URL(API_ENDPOINTS.AUTH.LOGIN, getBackendServerUrl());
    const result = await fetch(backend, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }), cache: 'no-store', redirect: 'manual',
    });
    if (!result.ok) {
      return Response.json({ success: false, message: 'Xác thực không thành công.' }, { status: result.status });
    }
    const auth = authResponseSchema.parse(await result.json());
    if (auth.user.role !== 'admin') {
      return Response.json({ success: false, message: 'Tài khoản không có quyền quản trị.' }, { status: 403 });
    }
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    const setCookies = typeof (result.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (result.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : result.headers.get('set-cookie') ? [result.headers.get('set-cookie')!] : [];
    for (const cookie of setCookies) {
      headers.append('Set-Cookie', cookie);
    }
    return Response.json({ success: true, message: 'Đăng nhập thành công.' }, { headers });
  } catch {
    return Response.json({ success: false, message: 'Backend chưa sẵn sàng.' }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  verifyAdminCredentials,
  signSessionToken,
  getAdminAuthConfig,
  getAdminCookieOptions,
  AdminSessionPayload,
} from '@/lib/adminAuth';
import { appConfig } from '@/config/appConfig';

export async function POST(request: Request) {
  try {
    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu yêu cầu không hợp lệ.' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp đầy đủ email và mật khẩu.' },
        { status: 400 }
      );
    }

    // Verify server-side credentials
    const verification = verifyAdminCredentials(email, password);

    if (!verification.ok) {
      if (verification.errorType === 'MISSING_CONFIG') {
        // Do not leak secret details to client; server error is already logged in getAdminAuthConfig
        return NextResponse.json(
          {
            success: false,
            message: 'Cấu hình xác thực hệ thống chưa sẵn sàng. Vui lòng liên hệ quản trị viên.',
          },
          { status: 500 }
        );
      }

      // Invalid credentials
      return NextResponse.json(
        {
          success: false,
          message: 'Email hoặc mật khẩu quản trị viên không chính xác.',
        },
        { status: 401 }
      );
    }

    // Retrieve verified server config
    const config = getAdminAuthConfig();
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lỗi xác thực hệ thống.',
        },
        { status: 500 }
      );
    }

    // Generate signed session token
    const now = Date.now();
    const durationSeconds = appConfig.adminAuth.sessionDurationSeconds;
    const expiresAt = now + durationSeconds * 1000;

    const payload: AdminSessionPayload = {
      role: 'admin',
      email: email.trim().toLowerCase(),
      iat: now,
      exp: expiresAt,
    };

    const sessionToken = await signSessionToken(payload, config.secret);

    // Set secure HttpOnly cookie on /admin path
    const cookieStore = await cookies();
    const cookieOptions = getAdminCookieOptions(durationSeconds);

    cookieStore.set(cookieOptions.name, sessionToken, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    // Success response: NEVER include credentials, secret or token in the body
    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công.',
    });
  } catch (error) {
    console.error('[Admin Auth API Error] Login handler unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi trong quá trình xử lý đăng nhập.' },
      { status: 500 }
    );
  }
}

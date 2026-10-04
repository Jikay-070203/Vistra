import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminCookieOptions } from '@/lib/adminAuth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const cookieOptions = getAdminCookieOptions(0);

    // Expire the cookie immediately
    cookieStore.set(cookieOptions.name, '', {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Đã đăng xuất thành công.',
    });
  } catch (error) {
    console.error('[Admin Auth API Error] Logout handler error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi xử lý đăng xuất.' },
      { status: 500 }
    );
  }
}

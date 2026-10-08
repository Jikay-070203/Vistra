import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSafeAdminRedirect } from '@/lib/adminAuth';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Propagate the current pathname to Server Components via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-current-path', pathname);

  // Only handle /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Allow internal admin API routes without redirecting to login page HTML
  if (pathname.startsWith('/admin/api')) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Any attempt to visit /admin/login redirects to unified /login
  const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login');
  if (isLoginPage) {
    const nextParam = request.nextUrl.searchParams.get('next') || '/admin';
    const safeRedirect = getSafeAdminRedirect(nextParam);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', safeRedirect);
    return NextResponse.redirect(loginUrl);
  }

  // All protected /admin routes require the backend session cookie
  const sessionToken = request.cookies.get('vistra_session')?.value;
  if (!sessionToken) {
    const fullRequestedPath = pathname + (search || '');
    const safeNext = getSafeAdminRedirect(fullRequestedPath);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', safeNext);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie is present, pass to Server Component (AdminLayout verifies admin role)
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};

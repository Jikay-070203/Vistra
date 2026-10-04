import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, getSafeAdminRedirect } from '@/lib/adminAuth';
import { appConfig } from '@/config/appConfig';

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

  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = request.cookies.get(appConfig.adminAuth.cookieName)?.value;

  let hasValidSession = false;
  if (secret && token) {
    const session = await verifySessionToken(token, secret);
    hasValidSession = !!session;
  }

  const isLoginPage = pathname === '/admin/login';

  // Handling for /admin/login route
  if (isLoginPage) {
    if (hasValidSession) {
      // If already logged in, redirect to safe next or /admin
      const nextParam = request.nextUrl.searchParams.get('next');
      const safeRedirect = getSafeAdminRedirect(nextParam);
      return NextResponse.redirect(new URL(safeRedirect, request.url));
    }
    // Allow unauthenticated visitor to see login page
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // All other /admin routes (/admin, /admin/users, /admin/revenue, /admin/feedback, /admin/system, etc.)
  if (!hasValidSession) {
    const fullRequestedPath = pathname + (search || '');
    const safeNext = getSafeAdminRedirect(fullRequestedPath);
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', safeNext);

    return NextResponse.redirect(loginUrl);
  }

  // Valid session present, proceed with custom header
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};

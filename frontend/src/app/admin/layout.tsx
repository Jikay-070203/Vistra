import React from 'react';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { verifySessionToken, getAdminAuthConfig, getSafeAdminRedirect } from '@/lib/adminAuth';
import { appConfig } from '@/config/appConfig';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const currentPath = headersList.get('x-current-path') || '';
  const isLoginPage = currentPath === '/admin/login' || currentPath.startsWith('/admin/login');

  // If rendering the /admin/login page, do not render AdminNavigation
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#EBF1F0] flex flex-col">
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    );
  }

  // Defense-in-depth server check for protected admin routes
  const cookieStore = await cookies();
  const token = cookieStore.get(appConfig.adminAuth.cookieName)?.value;
  const config = getAdminAuthConfig();

  let hasValidSession = false;
  if (config && token) {
    const session = await verifySessionToken(token, config.secret);
    hasValidSession = !!session;
  }

  if (!hasValidSession) {
    const safeNext = getSafeAdminRedirect(currentPath || '/admin');
    redirect(`/admin/login?next=${encodeURIComponent(safeNext)}`);
  }

  return (
    <div className="min-h-screen bg-[#EBF1F0] flex flex-col md:flex-row">
      <AdminNavigation />
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}

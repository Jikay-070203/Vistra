import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { readBackendSession } from '@/lib/backendSession';
import { getSafeAdminRedirect } from '@/lib/adminAuth';

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
      <div className="min-h-screen bg-warm-paper flex flex-col">
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    );
  }

  // Server-side verification using backendSession
  let adminSession = null;
  try {
    const session = await readBackendSession();
    if (session?.user.role !== 'admin') {
      redirect(session ? '/' : `/login?next=${encodeURIComponent(getSafeAdminRedirect(currentPath || '/admin'))}`);
    }
    adminSession = session;
  } catch (error) {
    console.error('[Admin Layout] Failed to verify backend admin session:', error);
  }

  if (!adminSession) {
    const safeNext = getSafeAdminRedirect(currentPath || '/admin');
    redirect(`/login?next=${encodeURIComponent(safeNext)}`);
  }

  return (
    <div className="min-h-screen bg-warm-paper flex flex-col md:flex-row">
      <AdminNavigation />
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}

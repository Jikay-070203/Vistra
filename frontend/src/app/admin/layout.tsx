import React from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#EBF1F0] flex flex-col">
      <AdminNavigation />
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}

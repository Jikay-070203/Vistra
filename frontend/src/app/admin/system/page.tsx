import { Suspense } from 'react';
import AdminSystemScreen from '@/components/admin/AdminSystemScreen';

export const metadata = {
  title: 'Hạ tầng hệ thống | VISTRA Operator',
  description: 'Theo dõi sức khỏe và cấu hình AI của hệ thống VISTRA.',
};

export default function AdminSystemPage() {
  return <Suspense fallback={<div className="p-8 text-center text-sm text-[#4B5875]">Đang tải hạ tầng hệ thống…</div>}><AdminSystemScreen /></Suspense>;
}

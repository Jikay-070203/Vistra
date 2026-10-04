import React, { Suspense } from 'react';
import AdminLoginScreen from '@/components/admin/auth/AdminLoginScreen';

export const metadata = {
  title: 'Đăng nhập Quản trị viên | VISTRA Operator',
  description: 'Cổng xác thực quản trị viên cho Bảng điều khiển Vận hành VISTRA.',
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EBF1F0] flex items-center justify-center">
          <div className="text-sm font-semibold text-[#4B5875]">Đang tải...</div>
        </div>
      }
    >
      <AdminLoginScreen />
    </Suspense>
  );
}

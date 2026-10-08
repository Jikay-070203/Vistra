import React, { Suspense } from 'react';
import LoginScreen from '@/components/auth/LoginScreen';

export const metadata = {
  title: 'Đăng nhập | VISTRA',
  description: 'Đăng nhập vào hệ thống VISTRA để quản lý hành trình và sở thích du lịch cá nhân hóa.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EBF1F0] flex items-center justify-center">
          <div className="text-sm font-semibold text-[#4B5875]">Đang tải...</div>
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}

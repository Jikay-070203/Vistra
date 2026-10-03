import React, { Suspense } from 'react';
import ProfileScreen from '@/components/profile/ProfileScreen';

export const metadata = {
  title: 'Hồ sơ du khách | VISTRA',
  description: 'Quản lý thông tin cá nhân, hồ sơ Travel DNA và lịch sử hành trình trên VISTRA.',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto p-12 text-center text-[#4B5875]">Đang tải hồ sơ du khách...</div>}>
      <ProfileScreen />
    </Suspense>
  );
}

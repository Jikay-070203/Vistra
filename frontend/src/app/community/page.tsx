import React, { Suspense } from 'react';
import CommunityScreen from '@/components/community/CommunityScreen';

export const metadata = {
  title: 'Cộng đồng Du khách | VISTRA',
  description: 'Khám phá và tái sử dụng các hành trình du lịch được chia sẻ từ cộng đồng du khách VISTRA.',
};

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EBF1F0] flex items-center justify-center">
          <div className="text-sm font-semibold text-[#4B5875]">Đang tải cộng đồng...</div>
        </div>
      }
    >
      <CommunityScreen />
    </Suspense>
  );
}

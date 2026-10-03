import { Suspense } from 'react';
import CreateTripScreen from '@/components/create-trip/CreateTripScreen';

export default function CreateTripPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-16 text-center text-[#4B5875] font-label-md text-sm">
          Đang chuẩn bị không gian lập chuyến đi...
        </div>
      }
    >
      <CreateTripScreen />
    </Suspense>
  );
}

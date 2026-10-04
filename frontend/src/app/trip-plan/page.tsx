import { Suspense } from 'react';
import TripPlanScreen from '@/components/trip-plan/TripPlanScreen';

export default function TripPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-20 text-center">
          <div className="inline-block size-8 border-3 border-[#205BD6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <TripPlanScreen />
    </Suspense>
  );
}

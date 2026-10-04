import { Suspense } from 'react';
import PlannerScreen from '@/components/planner/PlannerScreen';

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-24 text-center">
          <div className="inline-block size-8 border-3 border-[#205BD6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PlannerScreen />
    </Suspense>
  );
}

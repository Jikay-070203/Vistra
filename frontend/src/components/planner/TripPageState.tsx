'use client';
import Link from 'next/link';
import type { useTripWorkspace } from './useTripWorkspace';
import { tripButtonClass, tripPanelClass } from '@/components/trip-plan/ItineraryView';

export default function TripPageState({ workspace, title }: { workspace: ReturnType<typeof useTripWorkspace>; title: string }) {
  const { id, isAuthLoaded, isLoggedIn, loading, error, retry } = workspace;
  return <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6"><div className={tripPanelClass}>
    <h1 className="mb-4 text-3xl font-bold">{title}</h1>
    {!isAuthLoaded || (isLoggedIn && id && loading) ? <p role="status">Đang tải hành trình...</p>
      : !isLoggedIn ? <><p className="mb-4 text-[#4B5875]">Đăng nhập để mở chuyến đi của bạn.</p><Link className={tripButtonClass} href="/login">Đăng nhập</Link></>
        : !id ? <p className="text-[#4B5875]">Chọn một chuyến đi để xem lịch trình.</p>
          : <><p role="alert" className="text-rose-700 mb-4">{error ?? 'Không thể mở hành trình này.'}</p><button type="button" className={tripButtonClass} onClick={retry}>Thử lại</button></>}
    <Link className={`${tripButtonClass} mt-4 ml-2`} href="/my-trips">Chuyến đi của tôi</Link>
  </div></section>;
}

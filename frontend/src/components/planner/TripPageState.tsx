'use client';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import type { useTripWorkspace } from './useTripWorkspace';
import { tripButtonClass, tripPanelClass } from '@/components/trip-plan/ItineraryView';

export default function TripPageState({ workspace, title }: { workspace: ReturnType<typeof useTripWorkspace>; title: string }) {
  const { id, isAuthLoaded, isLoggedIn, loading, error, retry } = workspace;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <div className={`${tripPanelClass} text-center flex flex-col items-center justify-center p-8 sm:p-12 shadow-sm`}>
        {!isAuthLoaded || (isLoggedIn && id && loading) ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#205BD6]/10 text-[#205BD6] flex items-center justify-center mb-4">
              <div className="size-6 border-3 border-[#205BD6]/30 border-t-[#205BD6] rounded-full animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-[#0E1D4F] mb-2">{title}</h1>
            <p className="text-sm text-[#4B5875]" role="status">
              Đang kết nối dữ liệu và mở bàn làm việc...
            </p>
          </>
        ) : !isLoggedIn ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#08B3C6]/15 text-[#08B3C6] flex items-center justify-center mb-4">
              <Icon name="lock" className="size-6" />
            </div>
            <h1 className="text-xl font-bold text-[#0E1D4F] mb-2">Đăng nhập tài khoản</h1>
            <p className="text-sm text-[#4B5875] mb-6 max-w-sm">
              Bạn cần đăng nhập để mở bàn làm việc và xem lịch trình chuyến đi của bạn.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link className={`${tripButtonClass} bg-[#205BD6] text-white px-6`} href="/login?next=/planner">
                Đăng nhập ngay
              </Link>
              <Link className={tripButtonClass} href="/my-trips">
                Chuyến đi của tôi
              </Link>
            </div>
          </>
        ) : !id ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#EBF1F0] text-[#4B5875] flex items-center justify-center mb-4">
              <Icon name="search_off" className="size-6 text-[#205BD6]" />
            </div>
            <h1 className="text-xl font-bold text-[#0E1D4F] mb-2">Chưa chọn chuyến đi</h1>
            <p className="text-sm text-[#4B5875] mb-6 max-w-sm">
              Vui lòng chọn một chuyến đi từ danh sách hoặc tạo hành trình mới để bắt đầu đồng sáng tạo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link className={`${tripButtonClass} bg-[#205BD6] text-white px-6`} href="/create-trip">
                Tạo chuyến đi mới
              </Link>
              <Link className={tripButtonClass} href="/my-trips">
                Chuyến đi của tôi
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
              <Icon name="error" className="size-6" />
            </div>
            <h1 className="text-xl font-bold text-[#0E1D4F] mb-2">Không thể tải hành trình</h1>
            <p role="alert" className="text-sm text-rose-700 mb-6 max-w-md">
              {error ?? 'Không thể mở dữ liệu hành trình này. Vui lòng kiểm tra lại kết nối mạng hoặc phiên đăng nhập.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" className={`${tripButtonClass} bg-[#205BD6] text-white px-6`} onClick={retry}>
                Thử lại
              </button>
              <Link className={tripButtonClass} href="/my-trips">
                Chuyến đi của tôi
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

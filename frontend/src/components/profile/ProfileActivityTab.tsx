'use client';

import React from 'react';
import Link from 'next/link';
import type { TripCardView } from '@/types/tripCollectionApi';

interface ProfileActivityTabProps {
  isLoggedIn: boolean;
  serverTrips: TripCardView[];
  isLoadingServerTrips: boolean;
  serverTripsError: string | null;
  serverTotal: number | null;
  serverTotalPages: number | null;
  currentPage: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

export default function ProfileActivityTab({
  isLoggedIn,
  serverTrips,
  isLoadingServerTrips,
  serverTripsError,
  serverTotal,
  serverTotalPages,
  currentPage,
  pageSize = 5,
  onPageChange,
  onRetry,
}: ProfileActivityTabProps) {
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, serverTotal ?? 0);

  return (
    <section className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 sm:p-8" aria-labelledby="activity-title">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#0E1D4F]/10">
        <div>
          <h2 id="activity-title" className="font-headline-sm text-xl text-[#0E1D4F] font-bold">
            Lịch sử hoạt động gần đây
          </h2>
          <p className="text-xs text-[#4B5875]">
            {isLoggedIn
              ? 'Danh sách hành trình được đồng bộ trực tiếp từ máy chủ theo tài khoản của bạn.'
              : 'Đăng nhập để xem hành trình của bạn.'}
          </p>
        </div>
        <Link
          href="/my-trips"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0E1D4F] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#205BD6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] text-center shrink-0"
        >
          Xem tất cả tại Chuyến đi của tôi →
        </Link>
      </div>

      {isLoggedIn ? (
        <div className="space-y-4">
          {/* 1. Loading state */}
          {isLoadingServerTrips && (
            <div
              className="p-8 rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/35 text-center text-xs text-[#4B5875] flex items-center justify-center gap-3"
              role="status"
            >
              <span className="w-4 h-4 border-2 border-[#205BD6] border-t-transparent rounded-full animate-spin shrink-0"></span>
              <span>Đang tải nhật ký hành trình từ máy chủ...</span>
            </div>
          )}

          {/* 2. Error state */}
          {!isLoadingServerTrips && serverTripsError && (
            <div
              className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  !
                </span>
                <span>{serverTripsError}</span>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="min-h-11 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] cursor-pointer shrink-0"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* 3. Empty state */}
          {!isLoadingServerTrips && !serverTripsError && serverTrips.length === 0 && (
            <div className="p-8 rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/35 text-center text-xs text-[#4B5875]">
              Chưa có hành trình nào được ghi nhận trên tài khoản của bạn.
            </div>
          )}

          {/* 4. Loaded list mapping only existing card fields with disabled detail links */}
          {!isLoadingServerTrips && !serverTripsError && serverTrips.length > 0 && (
            <>
              <div className="space-y-4">
                {serverTrips.map((trip) => {
                  const dateText = trip.startDate && trip.endDate
                    ? `${trip.startDate} – ${trip.endDate}`
                    : 'Thời gian linh hoạt';
                  const isConfirmed = trip.status === 'confirmed';

                  return (
                    <div
                      key={trip.id}
                      className="p-4 rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isConfirmed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isConfirmed ? '✓ Đã chốt chính thức' : '✎ Bản nháp chưa chốt'}
                          </span>
                          {trip.updatedAt && (
                            <span className="text-xs text-[#4B5875]">
                              • Cập nhật: {new Date(trip.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-[#0E1D4F]">{trip.title}</h4>
                        <p className="text-xs text-[#4B5875] mt-0.5">
                          📍 {trip.destination} | {trip.durationDays} ngày | {dateText}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link href={`/${isConfirmed ? 'trip-plan' : 'planner'}?id=${encodeURIComponent(trip.id)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#205BD6] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">{isConfirmed ? 'Xem lịch trình' : 'Mở bàn làm việc'}</Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Authoritative pagination controls with returned pageSize range */}
              {serverTotalPages !== null && serverTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#0E1D4F]/10 text-xs">
                  <span className="text-[#4B5875]">
                    Trang {currentPage} / {serverTotalPages}
                    {serverTotal !== null && serverTotal > 0
                      ? ` (Hiển thị ${rangeStart}–${rangeEnd} trên ${serverTotal} chuyến đi)`
                      : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || isLoadingServerTrips}
                      className="min-h-11 rounded-lg border border-[#0E1D4F]/15 px-3 text-[#0E1D4F] transition-colors hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      ← Trang trước
                    </button>
                    <button
                      type="button"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage >= serverTotalPages || isLoadingServerTrips}
                      className="min-h-11 rounded-lg border border-[#0E1D4F]/15 px-3 text-[#0E1D4F] transition-colors hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      Trang sau →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/35 text-center text-sm text-[#4B5875]">
          <p>Đăng nhập để xem nhật ký hành trình của bạn.</p>
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center px-3 mt-3 text-[#205BD6] font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">Đăng nhập</Link>
        </div>
      )}
    </section>
  );
}

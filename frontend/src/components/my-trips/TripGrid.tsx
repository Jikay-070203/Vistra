'use client';

import React, { useRef } from 'react';
import Icon from '@/components/ui/Icon';

import TripCard, { UnifiedTripCard } from './TripCard';

interface TripGridProps {
  plans: UnifiedTripCard[];
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

export default function TripGrid({
  plans,
  totalFilteredCount,
  currentPage,
  totalPages,
  onPageChange,
  onClearFilters,
}: TripGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const changePage = (page: number) => {
    onPageChange(page);
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ block: 'start' }));
  };

  if (plans.length === 0) {
    return (
      <div className="bg-warm-surface rounded-2xl border border-[#0E1D4F]/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center my-6">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF1F0] flex items-center justify-center text-[#4B5875] mb-3">
          <Icon name="search_off" className="size-6" />
        </div>
        <h3 className="font-headline-sm text-base font-bold text-[#0E1D4F]">
          Không tìm thấy hành trình phù hợp
        </h3>
        <p className="text-xs text-[#4B5875] mt-1 max-w-sm">
          Không có chuyến đi nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại của bạn.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 min-h-11 px-4 py-2 bg-[#205BD6] text-white text-xs font-semibold rounded-xl hover:bg-[#1847a8] transition-colors cursor-pointer"
        >
          Xóa bộ lọc tìm kiếm
        </button>
      </div>
    );
  }

  return (
    <>
      {/* TRIP-01: Standard left-aligned responsive CSS grid so incomplete final rows never center */}
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-6 scroll-mt-24 items-stretch">
        {plans.map((plan) => (
          <div key={plan.id} className="w-full">
            <TripCard plan={plan} />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#0E1D4F]/10 my-8">
          <span className="text-xs text-[#4B5875]">
            Hiển thị <strong>{plans.length}</strong> trên tổng số <strong>{totalFilteredCount}</strong> hành trình
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => changePage(Math.max(1, currentPage - 1))}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-warm-surface border border-[#0E1D4F]/10 text-[#0E1D4F] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-warm-paper transition-colors cursor-pointer"
              aria-label="Trang trước"
            >
              <Icon name="chevron_left" className="size-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSelected = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => changePage(pageNum)}
                  aria-current={isSelected ? 'page' : undefined}
                  aria-label={`Trang ${pageNum}`}
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#205BD6] text-white shadow-xs'
                      : 'bg-warm-surface border border-[#0E1D4F]/10 text-[#0E1D4F] hover:bg-warm-paper'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-warm-surface border border-[#0E1D4F]/10 text-[#0E1D4F] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-warm-paper transition-colors cursor-pointer"
              aria-label="Trang sau"
            >
              <Icon name="chevron_right" className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

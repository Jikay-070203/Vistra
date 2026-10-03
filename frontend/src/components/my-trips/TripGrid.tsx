'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';
import TripCard from './TripCard';

interface TripGridProps {
  plans: DemoPlan[];
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenPlan: (plan: DemoPlan) => void;
  onClearFilters: () => void;
}

export default function TripGrid({
  plans,
  totalFilteredCount,
  currentPage,
  totalPages,
  onPageChange,
  onOpenPlan,
  onClearFilters,
}: TripGridProps) {
  if (plans.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-12 text-center flex flex-col items-center justify-center my-6">
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
          className="mt-4 px-4 py-2 bg-[#205BD6] text-white text-xs font-semibold rounded-xl hover:bg-[#1847a8] transition-colors cursor-pointer"
        >
          Xóa bộ lọc tìm kiếm
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 4 Columns x 4 Rows Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-6">
        {plans.map((plan) => (
          <TripCard key={plan.id} plan={plan} onOpenPlan={onOpenPlan} />
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
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="p-2 rounded-xl bg-white border border-[#0E1D4F]/10 text-[#0E1D4F] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#EBF1F0] transition-colors"
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
                  onClick={() => onPageChange(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#205BD6] text-white shadow-xs'
                      : 'bg-white border border-[#0E1D4F]/10 text-[#0E1D4F] hover:bg-[#EBF1F0]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="p-2 rounded-xl bg-white border border-[#0E1D4F]/10 text-[#0E1D4F] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#EBF1F0] transition-colors"
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

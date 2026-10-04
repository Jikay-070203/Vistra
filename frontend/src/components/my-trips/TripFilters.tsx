'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { TripFilterType } from './useMyTripsController';

interface TripFiltersProps {
  activeFilter: TripFilterType;
  counts: { all: number; draft: number; confirmed: number };
  searchQuery: string;
  durationMin: number | '';
  durationMax: number | '';
  budgetMin: number | '';
  budgetMax: number | '';
  durationValidationWarning: string | null;
  budgetValidationWarning: string | null;
  excludedMissingCount: number;
  isAnyRangeFilterActive: boolean;
  onFilterChange: (filter: TripFilterType) => void;
  onSearchChange: (query: string) => void;
  onDurationChange: (min: number | '', max: number | '') => void;
  onBudgetChange: (min: number | '', max: number | '') => void;
  onClearAll: () => void;
}

export default function TripFilters({
  activeFilter,
  counts,
  searchQuery,
  durationMin,
  durationMax,
  budgetMin,
  budgetMax,
  durationValidationWarning,
  budgetValidationWarning,
  excludedMissingCount,
  isAnyRangeFilterActive,
  onFilterChange,
  onSearchChange,
  onDurationChange,
  onBudgetChange,
  onClearAll,
}: TripFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-3 my-8">
      {/* Primary Bar: Tabs & Search */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-[#0E1D4F]/10 shadow-xs">
        {/* Segmented Filter Buttons: Clean on 360px & 390px */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-gray-300"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'all'}
            onClick={() => onFilterChange('all')}
            className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#205BD6] text-white shadow-xs'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]'
            }`}
          >
            Tất cả <span className="ml-1 opacity-80 font-normal">({counts.all})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'draft'}
            onClick={() => onFilterChange('draft')}
            className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'draft'
                ? 'bg-[#205BD6] text-white shadow-xs'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]'
            }`}
          >
            Bản nháp <span className="ml-1 opacity-80 font-normal">({counts.draft})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'confirmed'}
            onClick={() => onFilterChange('confirmed')}
            className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'confirmed'
                ? 'bg-[#205BD6] text-white shadow-xs'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]'
            }`}
          >
            Đã xác nhận <span className="ml-1 opacity-80 font-normal">({counts.confirmed})</span>
          </button>
        </div>

        {/* Live Search & Filter Toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#4B5875]/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo tên chuyến, điểm đến..."
              className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-[#EBF1F0] text-xs sm:text-sm text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 placeholder:text-[#4B5875]/50 focus:outline-none focus:border-[#205BD6] transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showAdvanced || isAnyRangeFilterActive
                ? 'bg-[#205BD6]/10 border-[#205BD6]/30 text-[#205BD6]'
                : 'bg-white border-[#0E1D4F]/10 text-[#4B5875] hover:bg-[#EBF1F0]'
            }`}
            title="Bộ lọc nâng cao theo thời lượng và ngân sách"
          >
            <Icon name="tune" className="size-4" />
            <span className="hidden sm:inline">Lọc chi tiết</span>
            {isAnyRangeFilterActive && (
              <span className="size-2 rounded-full bg-[#205BD6]"></span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Range Filters (UX-MY-01) */}
      {showAdvanced && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#0E1D4F]/10 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Duration Range (Days) */}
            <div>
              <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                Thời lượng (số ngày)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={durationMin}
                  onChange={(e) => onDurationChange(e.target.value === '' ? '' : Number(e.target.value), durationMax)}
                  placeholder="Từ ngày"
                  className="w-full px-3 py-1.5 bg-[#EBF1F0] text-xs text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6]"
                />
                <span className="text-xs text-[#4B5875]">–</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={durationMax}
                  onChange={(e) => onDurationChange(durationMin, e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Đến ngày"
                  className="w-full px-3 py-1.5 bg-[#EBF1F0] text-xs text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6]"
                />
              </div>
              {durationValidationWarning && (
                <p className="text-[11px] text-amber-600 mt-1 font-medium flex items-center gap-1">
                  <Icon name="warning" className="size-3" />
                  <span>{durationValidationWarning}</span>
                </p>
              )}
            </div>

            {/* Budget Range (VND) */}
            <div>
              <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                Ngân sách ước tính (VND)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={budgetMin}
                  onChange={(e) => onBudgetChange(e.target.value === '' ? '' : Number(e.target.value), budgetMax)}
                  placeholder="Từ VND"
                  className="w-full px-3 py-1.5 bg-[#EBF1F0] text-xs text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6]"
                />
                <span className="text-xs text-[#4B5875]">–</span>
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={budgetMax}
                  onChange={(e) => onBudgetChange(budgetMin, e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Đến VND"
                  className="w-full px-3 py-1.5 bg-[#EBF1F0] text-xs text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6]"
                />
              </div>
              {budgetValidationWarning && (
                <p className="text-[11px] text-amber-600 mt-1 font-medium flex items-center gap-1">
                  <Icon name="warning" className="size-3" />
                  <span>{budgetValidationWarning}</span>
                </p>
              )}
            </div>

            {/* Clear All & Info */}
            <div className="flex items-end justify-between sm:justify-start gap-3 sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={onClearAll}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F] text-xs font-semibold hover:bg-[#EBF1F0] transition-colors cursor-pointer"
              >
                Đặt lại toàn bộ
              </button>

              {excludedMissingCount > 0 && (
                <span className="text-[11px] text-[#4B5875] italic">
                  Đã loại {excludedMissingCount} chuyến chưa có đủ dữ liệu khoảng lọc.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

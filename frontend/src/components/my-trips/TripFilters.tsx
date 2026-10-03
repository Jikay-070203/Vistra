'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { TripFilterType } from './useMyTripsController';

interface TripFiltersProps {
  activeFilter: TripFilterType;
  counts: { all: number; draft: number; confirmed: number };
  searchQuery: string;
  onFilterChange: (filter: TripFilterType) => void;
  onSearchChange: (query: string) => void;
}

export default function TripFilters({
  activeFilter,
  counts,
  searchQuery,
  onFilterChange,
  onSearchChange,
}: TripFiltersProps) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 my-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#0E1D4F]/10 shadow-xs">
      {/* Segmented Filter Buttons */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'all'}
          onClick={() => onFilterChange('all')}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
          className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeFilter === 'draft'
              ? 'bg-[#205BD6] text-white shadow-xs'
              : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]'
          }`}
        >
          Bản nháp đang làm <span className="ml-1 opacity-80 font-normal">({counts.draft})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'confirmed'}
          onClick={() => onFilterChange('confirmed')}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeFilter === 'confirmed'
              ? 'bg-[#205BD6] text-white shadow-xs'
              : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]'
          }`}
        >
          Đã xác nhận <span className="ml-1 opacity-80 font-normal">({counts.confirmed})</span>
        </button>
      </div>

      {/* Live Search Input */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-80">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#4B5875]/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên chuyến, điểm đến, ngày..."
            className="w-full pl-10 pr-4 py-2 bg-[#EBF1F0] text-xs sm:text-sm text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 placeholder:text-[#4B5875]/50 focus:outline-none focus:border-[#205BD6] transition-all"
          />
        </div>
      </div>
    </div>
  );
}

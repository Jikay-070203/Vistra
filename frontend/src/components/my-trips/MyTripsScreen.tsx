'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useMyTripsController } from './useMyTripsController';
import TripFilters from './TripFilters';
import TripGrid from './TripGrid';

export default function MyTripsScreen() {
  const {
    activeFilter,
    searchQuery,
    currentPage,
    setCurrentPage,
    filteredPlans,
    paginatedPlans,
    counts,
    totalPages,
    durationMin,
    durationMax,
    budgetMin,
    budgetMax,
    durationValidationWarning,
    budgetValidationWarning,
    excludedMissingCount,
    isAnyRangeFilterActive,
    handleFilterChange,
    handleSearchChange,
    handleDurationChange,
    handleBudgetChange,
    clearAllFilters,
  } = useMyTripsController();

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      {/* Top Editorial Header & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#0E1D4F]/10">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#205BD6]"></span>
            <span className="font-label-caps text-xs text-[#205BD6] uppercase tracking-widest font-bold">
              KHO LƯU TRỮ HÀNH TRÌNH CÁ NHÂN
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl text-[#0E1D4F] tracking-tight font-bold">
            Chuyến đi của tôi
          </h1>
          <p className="font-body-md text-sm sm:text-base text-[#4B5875] mt-2 leading-relaxed">
            Thư viện quản lý các bản nháp đang thảo luận cùng Vistra và các hồ sơ hành trình đã được bạn chốt phương án chính thức.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/create-trip"
            className="inline-flex items-center gap-2 bg-[#205BD6] hover:bg-[#1847a8] text-white font-label-lg text-sm px-5 py-2.5 rounded-xl transition-all active:scale-[0.99] shadow-[0_4px_14px_rgba(32,91,214,0.22)] font-semibold"
          >
            <Icon name="add" className="size-[18px]" />
            <span>Lên kế hoạch mới</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <TripFilters
        activeFilter={activeFilter}
        counts={counts}
        searchQuery={searchQuery}
        durationMin={durationMin}
        durationMax={durationMax}
        budgetMin={budgetMin}
        budgetMax={budgetMax}
        durationValidationWarning={durationValidationWarning}
        budgetValidationWarning={budgetValidationWarning}
        excludedMissingCount={excludedMissingCount}
        isAnyRangeFilterActive={isAnyRangeFilterActive}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onDurationChange={handleDurationChange}
        onBudgetChange={handleBudgetChange}
        onClearAll={clearAllFilters}
      />

      {/* 4x3 Grid with Pagination */}
      <TripGrid
        plans={paginatedPlans}
        totalFilteredCount={filteredPlans.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onClearFilters={clearAllFilters}
      />

      {/* Educational Footer Note */}
      <div className="mt-8 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-[#0E1D4F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4B5875]">
        <div className="flex items-center gap-2">
          <Icon name="info" className="size-4 text-[#205BD6] shrink-0" />
          <span>Hệ thống hỗ trợ lưu trữ không giới hạn các bản nháp đa phương thức và hồ sơ đã xác nhận.</span>
        </div>
        <Link href="/community" className="text-[#205BD6] font-semibold hover:underline shrink-0">
          Khám phá thêm lịch trình cộng đồng →
        </Link>
      </div>
    </div>
  );
}

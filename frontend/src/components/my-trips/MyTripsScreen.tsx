'use client';

import React, { useCallback } from 'react';
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
    paginatedPlans,
    counts,
    totalPages,
    totalCount,
    hasTrips,
    isLoadingServerTrips,
    serverTripsError,
    retryLoadServerTrips,
    isLoggedIn,
    isAuthLoaded,
    sidebarOpen,
    setSidebarOpen,
    startDate,
    endDate,
    budgetMin,
    budgetMax,
    isBudgetTouched,
    isAnyFilterActive,
    dateValidationWarning,
    budgetValidationWarning,
    excludedMissingCount,
    handleFilterChange,
    handleSearchChange,
    handleDateChange,
    handleBudgetChange,
    clearAllFilters,
  } = useMyTripsController();

  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), [setSidebarOpen]);

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
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
            Thư viện quản lý bản nháp đang trao đổi cùng Vistra và những hành trình đã xác nhận.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/create-trip"
            className="inline-flex items-center gap-2 bg-[#205BD6] hover:bg-[#1847a8] text-white font-label-lg text-sm px-5 py-2.5 rounded-xl transition-all active:scale-[0.99] shadow-[0_4px_14px_rgba(32,91,214,0.22)] font-semibold"
          >
            <Icon name="add" className="size-[18px]" />
            <span>Tạo kế hoạch cá nhân</span>
          </Link>
        </div>
      </div>

      <TripFilters
        activeFilter={activeFilter}
        counts={counts}
        searchQuery={searchQuery}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        startDate={startDate}
        endDate={endDate}
        budgetMin={budgetMin}
        budgetMax={budgetMax}
        isBudgetTouched={isBudgetTouched}
        isAnyFilterActive={isAnyFilterActive}
        dateValidationWarning={dateValidationWarning}
        budgetValidationWarning={budgetValidationWarning}
        excludedMissingCount={excludedMissingCount}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onDateChange={handleDateChange}
        onBudgetChange={handleBudgetChange}
        onClearAll={clearAllFilters}
      />

      {!isAuthLoaded || (isLoggedIn && isLoadingServerTrips) ? (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-16 text-center flex flex-col items-center justify-center my-6">
          <div className="w-10 h-10 border-4 border-[#205BD6]/30 border-t-[#205BD6] rounded-full animate-spin mb-3" />
          <h3 className="font-headline-sm text-base font-bold text-[#0E1D4F]">
            Đang tải dữ liệu chuyến đi...
          </h3>
          <p className="text-xs text-[#4B5875] mt-1">Vui lòng chờ trong giây lát.</p>
        </div>
      ) : !isLoggedIn ? (
        <div className="rounded-2xl bg-white border p-8 my-6 text-center"><h2 className="font-bold text-[#0E1D4F]">Đăng nhập để xem chuyến đi của bạn</h2><Link href="/login?next=/my-trips" className="inline-block mt-4 p-3 rounded-xl bg-[#205BD6] text-white">Đăng nhập</Link></div>
      ) : serverTripsError ? (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-center flex flex-col items-center justify-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <Icon name="error" className="size-6" />
          </div>
          <h3 className="font-headline-sm text-base font-bold text-rose-900">
            Không thể tải danh sách chuyến đi
          </h3>
          <p className="text-xs text-rose-700 mt-1 max-w-md">
            {serverTripsError}
          </p>
          <button
            type="button"
            onClick={retryLoadServerTrips}
            className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : isLoggedIn && paginatedPlans.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-16 text-center flex flex-col items-center justify-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF1F0] flex items-center justify-center text-[#4B5875] mb-3">
            <Icon name="flight_takeoff" className="size-6 text-[#205BD6]" />
          </div>
          <h3 className="font-headline-sm text-base font-bold text-[#0E1D4F]">
            {hasTrips ? 'Không tìm thấy chuyến đi phù hợp' : 'Bạn chưa có chuyến đi nào'}
          </h3>
          <p className="text-xs text-[#4B5875] mt-1 max-w-sm">
            {hasTrips
              ? 'Thử đổi từ khóa hoặc điều chỉnh bộ lọc để xem thêm kết quả.'
              : 'Bắt đầu tạo kế hoạch mới hoặc khám phá các hành trình từ cộng đồng Vistra.'}
          </p>
          {hasTrips ? (
            <button type="button" onClick={clearAllFilters} className="mt-4 px-5 py-2.5 bg-[#205BD6] text-white text-xs font-semibold rounded-xl hover:bg-[#1847a8] transition-colors">
              Xóa bộ lọc
            </button>
          ) : (
            <Link
              href="/create-trip"
              className="mt-4 px-5 py-2.5 bg-[#205BD6] text-white text-xs font-semibold rounded-xl hover:bg-[#1847a8] transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="add" className="size-4" />
              <span>Tạo kế hoạch cá nhân</span>
            </Link>
          )}
        </div>
      ) : (
        <TripGrid
          plans={paginatedPlans}
          totalFilteredCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onClearFilters={clearAllFilters}
        />
      )}

      <div className="mt-8 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-[#0E1D4F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4B5875]">
        <div className="flex items-center gap-2">
          <Icon name="info" className="size-4 text-[#205BD6] shrink-0" />
          <span>Chuyến đi được lưu trên tài khoản của bạn.</span>
        </div>
        <Link href="/community" className="text-[#205BD6] font-semibold hover:underline shrink-0">
          Khám phá thêm lịch trình cộng đồng →
        </Link>
      </div>
    </div>
  );
}

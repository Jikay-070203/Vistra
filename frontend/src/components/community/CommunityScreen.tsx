'use client';

import React from 'react';
import { useCommunityController } from './useCommunityController';
import CommunityFilters from './CommunityFilters';
import CommunityGrid from './CommunityGrid';

export default function CommunityScreen() {
  const {
    searchQuery,
    setSearchQuery,
    selectedDuration,
    setSelectedDuration,
    selectedTag,
    setSelectedTag,
    currentPage,
    setCurrentPage,
    likedPlans,
    filteredPlans,
    totalPages,
    paginatedPlans,
    handleOpenDetail,
    handleReusePlan,
    handleToggleLike,
    handleResetFilters,
  } = useCommunityController();

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      {/* Top Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#0E1D4F]/10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#08B3C6]"></span>
            <span className="font-label-caps text-xs text-[#08B3C6] uppercase tracking-widest font-bold">
              KHÁM PHÁ CỘNG ĐỒNG DU KHÁCH VISTRA
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl text-[#0E1D4F] tracking-tight font-bold">
            Hành trình chia sẻ từ cộng đồng
          </h1>
          <p className="font-body-md text-sm sm:text-base text-[#4B5875] mt-2 leading-relaxed">
            Các cung đường hoàn chỉnh đã được kiểm chứng thực tế và chia sẻ bởi các du khách đồng điệu. Bạn có thể tham khảo, xem toàn văn hoặc tái sử dụng ngay cho chuyến đi của mình.
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-[#4B5875] block">Tuyển tập cộng đồng:</span>
          <span className="font-label-caps text-xs font-bold text-[#205BD6]">
            24 HÀNH TRÌNH CHỌN LỌC / TRANG
          </span>
        </div>
      </div>

      {/* 2-Column Layout: Left Filters + Right 4x6 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
        <CommunityFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDuration={selectedDuration}
          onSelectDuration={setSelectedDuration}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          totalFilteredCount={filteredPlans.length}
          totalPages={totalPages}
          onResetFilters={handleResetFilters}
        />

        <CommunityGrid
          paginatedPlans={paginatedPlans}
          likedPlans={likedPlans}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onOpenDetail={handleOpenDetail}
          onReusePlan={handleReusePlan}
          onToggleLike={handleToggleLike}
          onClearFilters={handleResetFilters}
        />
      </div>
    </div>
  );
}

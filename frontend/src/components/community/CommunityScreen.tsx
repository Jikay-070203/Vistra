'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useCommunityController } from './useCommunityController';
import CommunityFilters from './CommunityFilters';
import CommunityGrid from './CommunityGrid';

export default function CommunityScreen() {
  const {
    searchQuery,
    onSearchChange,
    selectedDuration,
    onSelectDuration,
    durationOptions,
    selectedTag,
    onSelectTag,
    selectedProvince,
    onSelectProvince,
    allProvinces,
    isLoadingProvinces,
    provincesError,
    retryLoadProvinces,
    urlProvinceNotice,
    showOnlyFavorites,
    onToggleShowOnlyFavorites,
    budgetMin,
    budgetMax,
    onBudgetChange,
    isBudgetTouched,
    budgetValidationWarning,
    excludedBudgetMissingCount,
    currentPage,
    setCurrentPage,
    likesState,
    totalPages,
    paginatedPlans,
    isLoadingServerCommunity,
    serverCommunityError,
    retryLoadCommunity,
    totalCount,
    handleToggleLike,
    handleResetFilters,
    actionError, pendingLikes, pendingClone, handleClone,
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
        </div>

        <div className="flex items-center">
          {/* Single CTA button leading to /create-trip */}
          <Link
            href="/create-trip"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Icon name="add" className="size-4" />
            <span>Tạo kế hoạch cá nhân</span>
          </Link>
        </div>
      </div>

      {actionError && <p role="alert" className="mt-6 p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl">{actionError}</p>}
      {urlProvinceNotice && (
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Icon name="info" className="size-4 text-amber-700 shrink-0" />
          <span>{urlProvinceNotice}</span>
        </div>
      )}

      {/* 2-Column Layout: Left Filters + Right 3x3 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
        <CommunityFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedDuration={selectedDuration}
          onSelectDuration={onSelectDuration}
          durationOptions={durationOptions}
          selectedTag={selectedTag}
          onSelectTag={onSelectTag}
          selectedProvince={selectedProvince}
          onSelectProvince={onSelectProvince}
          allProvinces={allProvinces}
          isLoadingProvinces={isLoadingProvinces}
          provincesError={provincesError}
          onRetryProvinces={retryLoadProvinces}
          showOnlyFavorites={showOnlyFavorites}
          onToggleShowOnlyFavorites={onToggleShowOnlyFavorites}
          budgetMin={budgetMin}
          budgetMax={budgetMax}
          onBudgetChange={onBudgetChange}
          isBudgetTouched={isBudgetTouched}
          budgetValidationWarning={budgetValidationWarning}
          excludedBudgetMissingCount={excludedBudgetMissingCount}
          totalFilteredCount={totalCount}
          totalPages={totalPages}
          onResetFilters={handleResetFilters}
        />

        {isLoadingServerCommunity ? (
          <main className="lg:col-span-9 flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-8 text-center">
            <div className="w-10 h-10 border-4 border-[#205BD6]/30 border-t-[#205BD6] rounded-full animate-spin mb-3" />
            <h3 className="font-headline-sm text-base font-bold text-[#0E1D4F]">
              Đang tải hành trình từ cộng đồng máy chủ...
            </h3>
            <p className="text-xs text-[#4B5875] mt-1">Vui lòng chờ trong giây lát.</p>
          </main>
        ) : serverCommunityError ? (
          <main className="lg:col-span-9 flex flex-col items-center justify-center py-16 bg-rose-50 rounded-2xl border border-rose-200 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Icon name="error" className="size-6" />
            </div>
            <h3 className="font-headline-sm text-base font-bold text-rose-900">
              Không thể kết nối máy chủ cộng đồng
            </h3>
            <p className="text-xs text-rose-700 mt-1 max-w-md">
              {serverCommunityError}
            </p>
            <button
              type="button"
              onClick={retryLoadCommunity}
              className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </main>
        ) : (
          <CommunityGrid
            paginatedPlans={paginatedPlans}
            likesState={likesState}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onToggleLike={handleToggleLike}
            onClearFilters={handleResetFilters}
            pendingLikes={pendingLikes}
            pendingClone={pendingClone}
            onClone={handleClone}
            isFiltered={Boolean(
              searchQuery.trim() ||
              selectedDuration !== 'all' ||
              selectedTag !== 'all' ||
              selectedProvince !== 'all' ||
              showOnlyFavorites ||
              isBudgetTouched
            )}
          />
        )}
      </div>
    </div>
  );
}

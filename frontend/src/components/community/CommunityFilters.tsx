'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import VistraSelect from '@/components/shared/VistraSelect';
import { BUDGET_MIN_DEFAULT, BUDGET_MAX_DEFAULT, BUDGET_STEP } from './useCommunityController';

interface CommunityFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDuration: string;
  onSelectDuration: (duration: string) => void;
  durationOptions: string[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  selectedProvince: string;
  onSelectProvince: (prov: string) => void;
  allProvinces: { value: string; label: string }[];
  showOnlyFavorites: boolean;
  onToggleShowOnlyFavorites: () => void;
  budgetMin: number;
  budgetMax: number;
  onBudgetChange: (min: number, max: number) => void;
  isBudgetTouched: boolean;
  budgetValidationWarning: string | null;
  excludedBudgetMissingCount: number;
  totalFilteredCount: number;
  totalPages: number;
  onResetFilters: () => void;
  isLoadingProvinces?: boolean;
  provincesError?: string | null;
  onRetryProvinces?: () => void;
}

export default function CommunityFilters({
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
  onRetryProvinces,
  showOnlyFavorites,
  onToggleShowOnlyFavorites,
  budgetMin,
  budgetMax,
  onBudgetChange,
  isBudgetTouched,
  budgetValidationWarning,
  excludedBudgetMissingCount,
  totalFilteredCount,
  totalPages,
  onResetFilters,
}: CommunityFiltersProps) {
  const isFiltered = Boolean(
    searchQuery ||
    selectedDuration !== 'all' ||
    selectedTag !== 'all' ||
    selectedProvince !== 'all' ||
    showOnlyFavorites ||
    isBudgetTouched
  );

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  return (
    <aside className="lg:col-span-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-5 space-y-6 shadow-xs lg:sticky lg:top-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10">
        <h2 className="font-headline-sm text-sm font-bold text-[#0E1D4F] flex items-center gap-2">
          <Icon name="tune" className="size-4 text-[#205BD6]" />
          <span>Bộ lọc tìm kiếm</span>
        </h2>
        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] text-[#205BD6] hover:underline cursor-pointer"
          >
            Đặt lại tất cả
          </button>
        )}
      </div>

      {/* 1. Search Box */}
      <div className="space-y-1.5">
        <label htmlFor="comm-search" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
          TỪ KHÓA / ĐIỂM ĐẾN
        </label>
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#4B5875]" />
          <input
            id="comm-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nhập tên điểm đến, xuất phát..."
            className="w-full bg-[#EBF1F0] text-[#0E1D4F] placeholder:text-[#4B5875]/60 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6] transition-all"
          />
        </div>
      </div>

      {/* 2. Search & Filter Summary */}
      <div className="p-3 bg-[#EBF1F0] rounded-xl text-xs text-[#4B5875] space-y-1">
        <div className="flex justify-between items-center">
          <span>Kết quả khớp:</span>
          <strong className="text-[#0E1D4F] font-bold">{totalFilteredCount} hành trình</strong>
        </div>
        <div className="flex justify-between items-center">
          <span>Tổng số trang:</span>
          <strong className="text-[#0E1D4F]">{totalPages || 1} trang</strong>
        </div>
      </div>

      {/* 3 & 4. Favorite Toggle & Province Filter Row (COM-01: 1/3 and 2/3 on desktop, stacked on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
        {/* 1/3: Đã thích */}
        <div className="sm:col-span-1 space-y-1.5">
          <label className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F] truncate">
            YÊU THÍCH
          </label>
          <button
            type="button"
            onClick={onToggleShowOnlyFavorites}
            className={`w-full h-[38px] flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${showOnlyFavorites
              ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-2xs'
              : 'bg-[#EBF1F0] hover:bg-[#E4ECEB] border-[#0E1D4F]/10 text-[#0E1D4F]'
              } focus-visible:outline-2 focus-visible:outline-[#205BD6]`}
            aria-pressed={showOnlyFavorites}
            title={showOnlyFavorites ? 'Đang bật lọc mục đã thích' : 'Lọc chỉ xem mục đã thích'}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Icon
                name={showOnlyFavorites ? 'favorite' : 'favorite_border'}
                className={`size-4 shrink-0 ${showOnlyFavorites ? 'text-rose-500' : 'text-[#4B5875]'}`}
              />
              <span className="truncate">Đã thích</span>
            </span>
            {showOnlyFavorites && (
              <span className="text-[10px] bg-rose-500 text-white font-medium px-1.5 py-0.2 rounded-full shrink-0">
                Bật
              </span>
            )}
          </button>
        </div>

        {/* 2/3: Tỉnh / Thành phố */}
        <div className="sm:col-span-2 space-y-1">
          <VistraSelect
            id="comm-province"
            label="TỈNH / THÀNH PHỐ"
            value={selectedProvince}
            disabled={isLoadingProvinces || !!provincesError}
            placeholder={
              isLoadingProvinces
                ? 'Đang tải danh mục tỉnh...'
                : allProvinces.length === 0
                  ? 'Danh mục tỉnh đang trống'
                  : 'Tất cả tỉnh / thành'
            }
            onChange={(val) => onSelectProvince(val)}
            options={[
              { value: 'all', label: 'Tất cả tỉnh / thành' },
              ...allProvinces,
            ]}
          />
          {provincesError && onRetryProvinces && (
            <div className="flex items-center justify-between text-[11px] text-rose-700 bg-rose-50 rounded-lg px-2.5 py-1 border border-rose-200 mt-1">
              <span className="truncate">Lỗi tải tỉnh: {provincesError}</span>
              <button
                type="button"
                onClick={onRetryProvinces}
                className="text-[11px] font-semibold text-[#205BD6] hover:underline cursor-pointer shrink-0 ml-2"
                aria-label="Thử lại tải danh mục tỉnh thành"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Double Slider Budget Range */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
            KHOẢNG NGÂN SÁCH
          </label>
          {isBudgetTouched && (
            <button
              type="button"
              onClick={() => onBudgetChange(BUDGET_MIN_DEFAULT, BUDGET_MAX_DEFAULT)}
              className="text-[10px] text-[#205BD6] hover:underline cursor-pointer"
            >
              Mặc định
            </button>
          )}
        </div>

        {/* Editable Input Fields Synchronized with Double Slider */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="budget-min-input" className="block text-[10px] font-label-caps uppercase text-[#4B5875] font-semibold">
              Tối thiểu (VNĐ)
            </label>
            <input
              id="budget-min-input"
              type="number"
              min={BUDGET_MIN_DEFAULT}
              max={budgetMax}
              step={BUDGET_STEP}
              value={budgetMin}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val)) {
                  onBudgetChange(Math.max(BUDGET_MIN_DEFAULT, Math.min(val, budgetMax)), budgetMax);
                }
              }}
              className="w-full bg-[#EBF1F0] text-[#0E1D4F] font-semibold text-xs px-2.5 py-1.5 rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="budget-max-input" className="block text-[10px] font-label-caps uppercase text-[#4B5875] font-semibold">
              Tối đa (VNĐ)
            </label>
            <input
              id="budget-max-input"
              type="number"
              min={budgetMin}
              max={BUDGET_MAX_DEFAULT}
              step={BUDGET_STEP}
              value={budgetMax}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val)) {
                  onBudgetChange(budgetMin, Math.min(BUDGET_MAX_DEFAULT, Math.max(val, budgetMin)));
                }
              }}
              className="w-full bg-[#EBF1F0] text-[#0E1D4F] font-semibold text-xs px-2.5 py-1.5 rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6]"
            />
          </div>
        </div>

        {/* Display Current Formatted Range */}
        {/* <div className="flex items-center justify-between text-[11px] font-semibold text-[#0E1D4F] bg-[#EBF1F0]/60 px-2.5 py-1.5 rounded-lg border border-[#0E1D4F]/5">
          <span>{formatVnd(budgetMin)}</span>
          <span className="text-[#4B5875] text-[10px] font-normal">đến</span>
          <span>{formatVnd(budgetMax)}</span>
        </div> */}

        {/* Single Consolidated Double-Ended Slider Track */}
        <div className="pt-2 pb-1">
          <div className="relative w-full h-6 flex items-center select-none">
            {/* Base Gray Track */}
            <div className="absolute w-full h-2 rounded-full bg-[#0E1D4F]/10"></div>
            {/* Highlighted Active Range Fill */}
            <div
              className="absolute h-2 rounded-full bg-[#205BD6]"
              style={{
                left: `${Math.max(0, Math.min(100, ((budgetMin - BUDGET_MIN_DEFAULT) / (BUDGET_MAX_DEFAULT - BUDGET_MIN_DEFAULT)) * 100))}%`,
                right: `${Math.max(0, Math.min(100, 100 - ((budgetMax - BUDGET_MIN_DEFAULT) / (BUDGET_MAX_DEFAULT - BUDGET_MIN_DEFAULT)) * 100))}%`,
              }}
            ></div>
            {/* Dual Native Range Inputs overlapping */}
            <input
              type="range"
              min={BUDGET_MIN_DEFAULT}
              max={BUDGET_MAX_DEFAULT}
              step={BUDGET_STEP}
              value={budgetMin}
              aria-label="Ngân sách tối thiểu"
              onChange={(e) => {
                const val = Number(e.target.value);
                onBudgetChange(Math.min(val, budgetMax), budgetMax);
              }}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#205BD6] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#205BD6] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
            />
            <input
              type="range"
              min={BUDGET_MIN_DEFAULT}
              max={BUDGET_MAX_DEFAULT}
              step={BUDGET_STEP}
              value={budgetMax}
              aria-label="Ngân sách tối đa"
              onChange={(e) => {
                const val = Number(e.target.value);
                onBudgetChange(budgetMin, Math.max(val, budgetMin));
              }}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#205BD6] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#205BD6] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
            />
          </div>
          <div className="flex justify-between gap-2 text-[10px] text-[#4B5875] mt-1.5 font-medium">
            <span>{formatVnd(BUDGET_MIN_DEFAULT)}</span>
            <span>{formatVnd(BUDGET_MAX_DEFAULT)}</span>
          </div>
          <p className="text-[10px] text-[#4B5875] mt-1">Bước nhảy: {formatVnd(BUDGET_STEP)}</p>
        </div>

        {budgetValidationWarning && (
          <p className="text-[11px] text-[#ba1a1a] font-medium">{budgetValidationWarning}</p>
        )}
        {isBudgetTouched && excludedBudgetMissingCount > 0 && (
          <p className="text-[10px] text-[#4B5875]">
            Đã loại {excludedBudgetMissingCount} hành trình không có thông tin chi phí.
          </p>
        )}
      </div>

      {/* 6. Duration Filter */}
      <div className="space-y-2">
        <label htmlFor="comm-duration" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
          THỜI LƯỢNG HÀNH TRÌNH
        </label>
        <select
          id="comm-duration"
          value={selectedDuration}
          onChange={(event) => onSelectDuration(event.target.value)}
          className="w-full bg-[#EBF1F0] text-[#0E1D4F] text-sm px-3 py-2.5 rounded-xl border border-[#0E1D4F]/10 focus-visible:outline-2 focus-visible:outline-[#205BD6] cursor-pointer"
        >
          <option value="all">Tất cả thời lượng</option>
          {durationOptions.map((duration) => (
            <option key={duration} value={duration}>
              {duration.endsWith('ngày') ? duration : `${duration} ngày`}
            </option>
          ))}
        </select>
      </div>

      {/* 7. Category / Theme Filter (BE-TAG-01: Pending backend taxonomy catalog) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="comm-tag" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
            PHONG CÁCH &amp; CHỦ ĐỀ
          </label>
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            BE-TAG-01
          </span>
        </div>
        <select
          id="comm-tag"
          disabled
          value={selectedTag}
          onChange={(e) => onSelectTag(e.target.value)}
          className="w-full bg-[#EBF1F0]/70 text-[#4B5875] text-xs px-3 py-2.5 rounded-xl border border-[#0E1D4F]/10 cursor-not-allowed"
          title="Backend chưa cung cấp API taxonomy catalog độc lập cho danh sách tags (BE-TAG-01)"
        >
          <option value="all">Chờ API danh mục chủ đề từ Backend (BE-TAG-01)</option>
        </select>
        <p className="text-[10px] text-[#4B5875] leading-relaxed">
          Hệ thống ghi nhận API query hỗ trợ <code>tag</code>, nhưng Backend chưa có endpoint catalog taxonomy độc lập với phân trang.
        </p>
      </div>
    </aside>
  );
}

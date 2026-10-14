'use client';

import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import BudgetRangeField from '@/components/shared/BudgetRangeField';
import { BUDGET_MAX_DEFAULT } from './useMyTripsController';
import type { TripFilterType } from './useMyTripsController';

interface TripFiltersProps {
  activeFilter: TripFilterType;
  counts: { all: number | string; draft?: number | string; confirmed?: number | string };
  searchQuery: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  startDate: string;
  endDate: string;
  budgetMin: number;
  budgetMax: number;
  isBudgetTouched: boolean;
  isAnyFilterActive: boolean;
  dateValidationWarning: string | null;
  budgetValidationWarning: string | null;
  excludedMissingCount: number;
  onFilterChange: (filter: TripFilterType) => void;
  onSearchChange: (query: string) => void;
  onDateChange: (start: string, end: string) => void;
  onBudgetChange: (min: number, max: number) => void;
  onClearAll: () => void;
}

export default function TripFilters({
  activeFilter, counts, searchQuery, sidebarOpen, onToggleSidebar,
  startDate, endDate, budgetMin, budgetMax, isBudgetTouched,
  isAnyFilterActive, dateValidationWarning, budgetValidationWarning, excludedMissingCount,
  onFilterChange, onSearchChange, onDateChange, onBudgetChange, onClearAll,
}: TripFiltersProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleSidebar();
      if (event.key !== 'Tab') return;
      const focusable = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') ?? []);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
  }, [sidebarOpen, onToggleSidebar]);

  return (
    <div className="my-8">
      <div className="bg-warm-surface rounded-2xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-[#0E1D4F]/10 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto" role="group" aria-label="Trạng thái chuyến đi">
          {(['all', 'draft', 'confirmed'] as TripFilterType[]).map((filter) => {
            const labels = { all: 'Tất cả', draft: 'Bản nháp', confirmed: 'Đã xác nhận' };
            const countVal = counts[filter] ?? '—';
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={activeFilter === filter}
                onClick={() => onFilterChange(filter)}
                className={`shrink-0 min-h-11 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[#205BD6] disabled:opacity-45 disabled:cursor-not-allowed ${
                  activeFilter === filter ? 'bg-[#205BD6] text-white' : 'text-[#4B5875] hover:bg-[#EBF1F0]'
                }`}
              >
                {labels[filter]} <span className="font-normal">({countVal})</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="relative flex-1 md:w-72">
            <span className="sr-only">Tìm chuyến đi</span>
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#4B5875]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm chuyến đi, điểm đến..."
              className="w-full min-h-11 pl-9 pr-4 py-2.5 bg-warm-paper text-sm text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 focus-visible:outline-2 focus-visible:outline-[#205BD6]"
            />
          </label>
          <button
            ref={triggerRef}
            type="button"
            onClick={onToggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="trip-filter-sidebar"
            className={`min-h-11 px-3 rounded-xl text-sm font-semibold flex items-center gap-2 border cursor-pointer focus-visible:outline-2 focus-visible:outline-[#205BD6] ${
              sidebarOpen || isAnyFilterActive ? 'bg-[#205BD6]/10 border-[#205BD6]/30 text-[#205BD6]' : 'bg-warm-surface border-[#0E1D4F]/10 text-[#0E1D4F] hover:bg-warm-paper'
            }`}
          >
            <Icon name="tune" className="size-4" />
            <span>Lọc chi tiết</span>
            {isAnyFilterActive && <span className="size-2 rounded-full bg-[#205BD6]" aria-label="Có bộ lọc đang áp dụng" />}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <button type="button" tabIndex={-1} onClick={onToggleSidebar} aria-label="Đóng bộ lọc" className="absolute inset-0 w-full h-full bg-[#0E1D4F]/45 cursor-default" />
          <aside ref={sidebarRef} id="trip-filter-sidebar" role="dialog" aria-modal="true" aria-labelledby="trip-filter-title"
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-warm-surface p-5 sm:p-7 shadow-2xl space-y-7">
            <div className="flex items-center justify-between gap-4 border-b border-[#0E1D4F]/10 pb-4">
              <h2 id="trip-filter-title" className="text-lg font-bold text-[#0E1D4F]">Lọc chi tiết</h2>
              <button ref={closeRef} type="button" onClick={onToggleSidebar} aria-label="Đóng bộ lọc" className="size-11 rounded-xl flex items-center justify-center hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-[#205BD6] cursor-pointer">
                <Icon name="close" className="size-5" />
              </button>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-[#0E1D4F] mb-3">Khoảng ngày du lịch</legend>
              <label className="block space-y-1.5 text-sm text-[#4B5875]">Ngày đi từ
                <input type="date" value={startDate} onChange={(event) => onDateChange(event.target.value, endDate)} aria-invalid={Boolean(dateValidationWarning)}
                  className="block w-full min-h-11 px-3 bg-warm-paper text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 focus-visible:outline-2 focus-visible:outline-[#205BD6]" />
              </label>
              <label className="block space-y-1.5 text-sm text-[#4B5875]">Ngày về đến
                <input type="date" value={endDate} onChange={(event) => onDateChange(startDate, event.target.value)} aria-invalid={Boolean(dateValidationWarning)}
                  className="block w-full min-h-11 px-3 bg-warm-paper text-[#0E1D4F] rounded-xl border border-[#0E1D4F]/10 focus-visible:outline-2 focus-visible:outline-[#205BD6]" />
              </label>
              {dateValidationWarning && <p role="alert" className="text-sm text-[#BA1A1A]">{dateValidationWarning}</p>}
            </fieldset>

            {/* TRIP-02: Shared BudgetRangeField (no traveler count = per-person estimate hidden) */}
            <fieldset className="space-y-3">
              <BudgetRangeField
                label="Ngân sách ước tính"
                value={{ min: budgetMin, max: budgetMax }}
                minLimit={1_000_000}
                maxLimit={BUDGET_MAX_DEFAULT}
                step={500_000}
                onChange={({ min, max }) => onBudgetChange(min, max)}
              />
              {budgetValidationWarning && <p role="alert" className="text-xs text-[#BA1A1A]">{budgetValidationWarning}</p>}
              {isBudgetTouched && excludedMissingCount > 0 && <p className="text-xs text-[#4B5875]">{excludedMissingCount} chuyến chưa có đủ dữ liệu để lọc.</p>}
            </fieldset>

            <div className="flex items-center justify-between gap-3 border-t border-[#0E1D4F]/10 pt-5">
              <button type="button" onClick={onClearAll} disabled={!isAnyFilterActive} className="min-h-11 px-4 rounded-xl border border-[#0E1D4F]/15 text-sm text-[#0E1D4F] disabled:opacity-50 cursor-pointer">Đặt lại</button>
              <button type="button" onClick={onToggleSidebar} className="min-h-11 px-5 rounded-xl bg-[#205BD6] text-white text-sm font-semibold hover:bg-[#0739A8] cursor-pointer">Xem chuyến đi</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

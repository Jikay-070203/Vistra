'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';

interface PlannerCommandBarProps {
  activePlan: DemoPlan;
  showSources: boolean;
  onToggleSources: () => void;
  onOpenConfirmModal: () => void;
}

export default function PlannerCommandBar({
  activePlan,
  showSources,
  onToggleSources,
  onOpenConfirmModal,
}: PlannerCommandBarProps) {
  return (
    <section className="bg-white/90 backdrop-blur-md border-b border-[#0E1D4F]/10 py-3.5 px-4 sm:px-6 lg:px-12 relative md:sticky md:top-[76px] z-20 shadow-2xs">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href="/my-trips"
            className="p-1.5 rounded-xl text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors shrink-0"
            title="Về thư viện chuyến đi"
            aria-label="Về thư viện chuyến đi"
          >
            <Icon name="arrow_back" className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-label-caps text-[11px] text-[#205BD6] uppercase font-bold tracking-wider">
                BÀN LÀM VIỆC ĐỒNG KIẾN TẠO
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
              <span className="px-2 py-0.5 rounded text-[10px] font-label-caps font-bold bg-[#0E1D4F] text-white">
                {activePlan.status === 'draft' ? 'BẢN NHÁP (DRAFT)' : 'ĐÃ XÁC NHẬN'}
              </span>
              <span className="text-[11px] text-[#4B5875] hidden sm:inline">· Cập nhật: {activePlan.lastUpdated}</span>
            </div>
            <h1 className="font-headline-sm text-sm sm:text-base lg:text-lg text-[#0E1D4F] font-bold mt-0.5 truncate">
              {activePlan.title} ({activePlan.duration})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap sm:flex-nowrap">
          {/* Toggle Sources button */}
          <button
            type="button"
            onClick={onToggleSources}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0 ${
              showSources
                ? 'bg-white border-[#0E1D4F]/15 text-[#0E1D4F] hover:bg-[#EBF1F0]'
                : 'bg-[#205BD6]/10 border-[#205BD6]/30 text-[#205BD6]'
            }`}
            title="Ẩn hoặc hiện bảng nguồn trích dẫn"
          >
            <Icon name={showSources ? 'visibility_off' : 'menu_book'} className="size-4 text-[#205BD6]" />
            <span className="hidden xl:inline">{showSources ? 'Ẩn nguồn đối chiếu' : 'Hiện nguồn đối chiếu'}</span>
            <span className="xl:hidden">Nguồn đối chiếu</span>
          </button>

          {/* Explicit Confirm Plan Button */}
          <button
            type="button"
            onClick={onOpenConfirmModal}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-[#205BD6] hover:bg-[#1847a8] text-white font-label-lg text-xs sm:text-sm font-semibold rounded-xl shadow-[0_4px_14px_rgba(32,91,214,0.25)] transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Icon name="check_circle" className="size-4" />
            <span>Xác nhận chốt kế hoạch</span>
          </button>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { MOCK_TRAVEL_DNA } from '@/data/mockData';
import { DemoPlan } from '@/context/DemoPlanContext';

interface TravelDnaSidebarProps {
  existingPlan?: DemoPlan;
  photoCount: number;
  onStartPlanning: () => void;
}

export default function TravelDnaSidebar({
  existingPlan,
  photoCount,
  onStartPlanning,
}: TravelDnaSidebarProps) {
  return (
    <aside className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-6">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-sm p-6 flex flex-col gap-5">
        {/* Component Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#205BD6] font-label-caps text-xs uppercase font-bold mb-1">
              <Icon name="fingerprint" className="size-4" />
              <span>Vistra Travel Intelligence</span>
            </div>
            <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
              TỔNG HỢP DNA DU LỊCH
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#08B3C6]/15 text-[#08B3C6] font-label-caps text-xs font-bold border border-[#08B3C6]/20">
            ĐỘ TIN CẬY 96%
          </span>
        </div>

        <p className="font-body-sm text-xs text-[#4B5875] leading-relaxed">
          Được giải mã từ {photoCount} hình ảnh, ghi chú và các tham số thực tế bạn đã thiết lập.
        </p>

        {/* Score Metrics Visualization */}
        <div className="flex flex-col gap-3 py-2 border-y border-[#0E1D4F]/10">
          {MOCK_TRAVEL_DNA.map((metric) => (
            <div key={metric.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-label-md text-[#0E1D4F]">
                <span className="flex items-center gap-1.5">
                  <Icon name={metric.icon} className="size-3.5 text-[#205BD6]" />
                  <span>{metric.label}</span>
                </span>
                <span className="font-bold text-[#0E1D4F]">
                  {metric.score}%{' '}
                  <span className="text-[#4B5875] font-normal">· {metric.rating}</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#EBF1F0] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    metric.score >= 80 ? 'bg-[#205BD6]' : 'bg-[#08B3C6]'
                  }`}
                  style={{ width: `${metric.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Curator's Synthesis Note */}
        <div className="bg-[#EBF1F0] p-4 rounded-xl flex flex-col gap-1.5 border-l-3 border-[#205BD6]">
          <span className="font-label-caps text-xs uppercase text-[#205BD6] font-bold">
            TỔNG HỢP CỦA ATELIER
          </span>
          <p className="font-body-sm text-xs text-[#4B5875] italic leading-relaxed">
            &ldquo;Dựa trên ảnh biển mây và mong muốn không gian tĩnh lặng, hệ thống đề xuất ưu tiên các cung đường cao nguyên Tây Bắc trên 1.500m vào cuối thu.&rdquo;
          </p>
        </div>

        {/* Action CTA buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          {/* PRIMARY ACTION: DIRECTLY ENTER PLANNER CONVERSATION */}
          <button
            type="button"
            onClick={onStartPlanning}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] text-white font-label-lg text-sm font-semibold transition-all shadow-[0_4px_14px_rgba(32,91,214,0.25)] active:scale-[0.99] cursor-pointer"
          >
            <span>{existingPlan ? 'Tiếp tục hội thoại lập kế hoạch' : 'Bắt đầu hội thoại lập kế hoạch'}</span>
            <Icon name="arrow_forward" className="size-4" />
          </button>

          <Link
            href="/destinations"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-[#EBF1F0] text-[#0E1D4F] border border-[#0E1D4F]/15 font-label-md text-xs font-semibold transition-all"
          >
            <span>Đối chiếu các điểm đến phù hợp trước</span>
            <Icon name="explore" className="size-3.5 text-[#08B3C6]" />
          </Link>

          <span className="text-center text-[11px] text-[#4B5875]">
            {existingPlan
              ? 'Tiếp tục hoàn thiện bản nháp đã chọn trong không gian làm việc'
              : 'Hệ thống tự động khởi tạo bản nháp và chuyển vào không gian làm việc'}
          </span>
        </div>
      </div>
    </aside>
  );
}

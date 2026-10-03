'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { Destination } from '@/data/mockData';

interface ComparisonDialogProps {
  isOpen: boolean;
  comparedDestinations: Destination[];
  onClose: () => void;
  onSelectDestination: (destName: string) => void;
}

export default function ComparisonDialog({
  isOpen,
  comparedDestinations,
  onClose,
  onSelectDestination,
}: ComparisonDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-[#0E1D4F]/10">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-start sm:items-center justify-between gap-3">
          <div className="pr-2 min-w-0">
            <span className="font-label-caps text-[11px] sm:text-xs uppercase tracking-wider text-[#205BD6] font-bold block">
              BẢNG ĐỐI CHIẾU TIÊU CHÍ TRỰC QUAN
            </span>
            <h3 className="font-headline-md text-base sm:text-xl text-[#0E1D4F] font-bold truncate sm:whitespace-normal">
              Phân tích so sánh song song ({comparedDestinations.length} điểm đến)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] transition-colors border border-[#0E1D4F]/10 cursor-pointer shrink-0 mt-0.5 sm:mt-0"
            aria-label="Đóng bảng so sánh"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {/* Modal Table Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-auto">
          <div className="min-w-[440px] sm:min-w-0 space-y-6">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[#0E1D4F]/10">
              <div className="text-xs font-label-caps text-[#0E1D4F] font-bold">TIÊU CHÍ / ĐIỂM ĐẾN</div>
              {comparedDestinations.map((d) => (
                <div key={d.id} className="text-center">
                  <h4 className="font-headline-sm text-sm text-[#0E1D4F] font-bold">{d.name}</h4>
                  <span className="text-[11px] text-[#4B5875]">{d.duration} · {d.estimatedCost}</span>
                </div>
              ))}
            </div>

          {/* Criteria 1: Visual Match */}
          <div className="grid grid-cols-3 gap-4 items-center text-xs py-2 border-b border-[#0E1D4F]/10">
            <span className="font-medium text-[#4B5875]">Độ hợp thị giác DNA</span>
            {comparedDestinations.map((d) => (
              <div key={d.id} className="text-center font-bold text-[#0E1D4F]">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#EBF1F0] text-xs">
                  {d.visualMatch}%
                </span>
              </div>
            ))}
          </div>

          {/* Criteria 2: Budget Match */}
          <div className="grid grid-cols-3 gap-4 items-center text-xs py-2 border-b border-[#0E1D4F]/10">
            <span className="font-medium text-[#4B5875]">Hợp ngân sách đề ra</span>
            {comparedDestinations.map((d) => (
              <div key={d.id} className="text-center font-bold text-[#0E1D4F]">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#EBF1F0] text-xs">
                  {d.budgetMatch}%
                </span>
              </div>
            ))}
          </div>

          {/* Criteria 3: Transport Ease */}
          <div className="grid grid-cols-3 gap-4 items-center text-xs py-2 border-b border-[#0E1D4F]/10">
            <span className="font-medium text-[#4B5875]">Độ thuận tiện di chuyển</span>
            {comparedDestinations.map((d) => (
              <div key={d.id} className="text-center text-[#0E1D4F] font-medium">
                {d.transport.level}
              </div>
            ))}
          </div>

          {/* Criteria 4: Golden Hour */}
          <div className="grid grid-cols-3 gap-4 items-center text-xs py-2 border-b border-[#0E1D4F]/10">
            <span className="font-medium text-[#4B5875]">Thời điểm săn cảnh đẹp</span>
            {comparedDestinations.map((d) => (
              <div key={d.id} className="text-center text-[#205BD6] font-semibold">
                {d.goldenHour}
              </div>
            ))}
          </div>

          {/* Criteria 5: Action Choice */}
          <div className="grid grid-cols-3 gap-4 items-center pt-4">
            <span className="font-medium text-[#4B5875]">Chọn làm kế hoạch chính</span>
            {comparedDestinations.map((d) => (
              <div key={d.id} className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectDestination(d.name);
                  }}
                  className="inline-flex items-center justify-center gap-1 w-full py-2 px-3 bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Chọn {d.name.split(',')[0]}</span>
                  <Icon name="arrow_forward" className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

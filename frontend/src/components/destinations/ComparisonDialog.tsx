'use client';

import React, { useState, useEffect } from 'react';
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
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || comparedDestinations.length === 0) return null;

  const safeIndex = activeMobileIndex < comparedDestinations.length ? activeMobileIndex : 0;
  const activeDest = comparedDestinations[safeIndex] || comparedDestinations[0];
  const otherDest = comparedDestinations.find((_, idx) => idx !== safeIndex);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-[#0E1D4F]/10">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-start sm:items-center justify-between gap-3">
          <div className="pr-2 min-w-0">
            <span className="font-label-caps text-[11px] sm:text-xs uppercase tracking-wider text-[#205BD6] font-bold block">
              BẢNG ĐỐI CHIẾU TIÊU CHÍ TRỰC QUAN
            </span>
            <h3
              id="comparison-dialog-title"
              className="font-headline-md text-base sm:text-xl text-[#0E1D4F] font-bold leading-snug"
            >
              Phân tích so sánh song song ({comparedDestinations.length} điểm đến)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] transition-colors border border-[#0E1D4F]/10 cursor-pointer shrink-0"
            aria-label="Đóng bảng so sánh"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* MOBILE VIEW (< sm): Tabbed Destination Switcher */}
          <div className="sm:hidden space-y-4">
            {/* Tabs for switching between compared destinations */}
            <div className="flex items-center gap-2 p-1.5 bg-[#EBF1F0] rounded-xl" role="tablist">
              {comparedDestinations.map((d, index) => {
                const isSelected = activeMobileIndex === index;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveMobileIndex(index)}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#0E1D4F] shadow-xs'
                        : 'text-[#4B5875] hover:text-[#0E1D4F]'
                    }`}
                  >
                    <span className="truncate block">{d.name.split(',')[0]}</span>
                    <span className="text-[10px] font-normal block text-[#4B5875]">
                      {isSelected ? 'Đang xem' : 'Chạm để so sánh'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Destination Summary Card on Mobile */}
            <div className="p-3.5 rounded-xl bg-[#EBF1F0]/60 border border-[#0E1D4F]/10 flex items-center justify-between">
              <div>
                <h4 className="font-headline-sm text-sm text-[#0E1D4F] font-bold">
                  {activeDest.name}
                </h4>
                <span className="text-xs text-[#4B5875]">
                  {activeDest.duration} · {activeDest.estimatedCost}
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#205BD6]/10 text-[#205BD6]">
                {activeMobileIndex + 1}/{comparedDestinations.length}
              </span>
            </div>

            {/* Criteria Breakdown on Mobile */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-[#0E1D4F]/10 bg-white shadow-2xs">
                <div className="text-xs text-[#4B5875] font-medium mb-1">Độ hợp thị giác DNA</div>
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                    {activeDest.visualMatch}%
                  </span>
                  {otherDest && (
                    <span className="text-xs text-[#4B5875]">
                      So với {otherDest.name.split(',')[0]}: <strong className="text-[#0E1D4F]">{otherDest.visualMatch}%</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#0E1D4F]/10 bg-white shadow-2xs">
                <div className="text-xs text-[#4B5875] font-medium mb-1">Hợp ngân sách đề ra</div>
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                    {activeDest.budgetMatch}%
                  </span>
                  {otherDest && (
                    <span className="text-xs text-[#4B5875]">
                      So với {otherDest.name.split(',')[0]}: <strong className="text-[#0E1D4F]">{otherDest.budgetMatch}%</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#0E1D4F]/10 bg-white shadow-2xs">
                <div className="text-xs text-[#4B5875] font-medium mb-1">Độ thuận tiện di chuyển</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#0E1D4F] font-semibold">
                    {activeDest.transport.level}
                  </span>
                  {otherDest && (
                    <span className="text-xs text-[#4B5875]">
                      {otherDest.name.split(',')[0]}: <strong className="text-[#0E1D4F]">{otherDest.transport.level}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#0E1D4F]/10 bg-white shadow-2xs">
                <div className="text-xs text-[#4B5875] font-medium mb-1">Thời điểm săn cảnh đẹp</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#205BD6] font-semibold">
                    {activeDest.goldenHour}
                  </span>
                  {otherDest && (
                    <span className="text-xs text-[#4B5875]">
                      {otherDest.name.split(',')[0]}: <strong className="text-[#0E1D4F]">{otherDest.goldenHour}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectDestination(activeDest.name);
                }}
                className="w-full py-3 px-4 bg-[#205BD6] hover:bg-[#1847a8] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Chọn {activeDest.name.split(',')[0]} làm kế hoạch</span>
                <Icon name="arrow_forward" className="size-4" />
              </button>
            </div>
          </div>

          {/* DESKTOP VIEW (>= sm): 3-Column Parallel Comparison */}
          <div className="hidden sm:block space-y-5">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[#0E1D4F]/10">
              <div className="text-xs font-label-caps text-[#0E1D4F] font-bold self-end pb-1">
                TIÊU CHÍ / ĐIỂM ĐẾN
              </div>
              {comparedDestinations.map((d) => (
                <div key={d.id} className="text-center p-2 rounded-xl bg-[#EBF1F0]/50">
                  <h4 className="font-headline-sm text-sm text-[#0E1D4F] font-bold truncate">
                    {d.name}
                  </h4>
                  <span className="text-[11px] text-[#4B5875] block mt-0.5">
                    {d.duration} · {d.estimatedCost}
                  </span>
                </div>
              ))}
            </div>

            {/* Criteria 1: Visual Match */}
            <div className="grid grid-cols-3 gap-4 items-center text-xs py-2 border-b border-[#0E1D4F]/10">
              <span className="font-medium text-[#4B5875]">Độ hợp thị giác DNA</span>
              {comparedDestinations.map((d) => (
                <div key={d.id} className="text-center font-bold text-[#0E1D4F]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#EBF1F0] text-xs font-bold inline-block">
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
                  <span className="px-2.5 py-1 rounded-lg bg-[#EBF1F0] text-xs font-bold inline-block">
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
            <div className="grid grid-cols-3 gap-4 items-center pt-3">
              <span className="font-medium text-[#4B5875]">Chọn làm kế hoạch chính</span>
              {comparedDestinations.map((d) => (
                <div key={d.id} className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectDestination(d.name);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
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

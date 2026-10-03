'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { useDestinationsController } from './useDestinationsController';
import DestinationCard from './DestinationCard';
import ComparisonDialog from './ComparisonDialog';

export default function DestinationsScreen() {
  const {
    destinations,
    selectedForCompare,
    expandedDetails,
    showComparisonModal,
    setShowComparisonModal,
    comparedDestinations,
    toggleCompare,
    toggleDetails,
    handleSelectDestination,
  } = useDestinationsController();

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12 pb-28">
      {/* Top Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#0E1D4F]/10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#205BD6]"></span>
            <span className="font-label-caps text-xs text-[#205BD6] uppercase tracking-widest font-bold">
              04 / ĐỐI CHIẾU &amp; LỰA CHỌN ĐIỂM ĐẾN
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl text-[#0E1D4F] tracking-tight font-bold">
            Khám phá các điểm đến tối ưu
          </h1>
          <p className="font-body-md text-sm sm:text-base text-[#4B5875] mt-2 leading-relaxed">
            3 ứng viên được chọn lọc dựa trên bộ ảnh cảm hứng và các ràng buộc thực tế của bạn. So sánh song song để chọn phương án khởi hành phù hợp nhất.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowComparisonModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#EBF1F0] text-[#0E1D4F] font-label-lg text-xs sm:text-sm font-semibold transition-colors border border-[#0E1D4F]/15 shadow-2xs cursor-pointer"
        >
          <Icon name="compare_arrows" className="size-[18px] text-[#205BD6]" />
          <span>Bảng so sánh chi tiết ({selectedForCompare.length})</span>
        </button>
      </div>

      {/* Destination Cards Stream */}
      <div className="flex flex-col gap-10 mt-8">
        {destinations.map((dest, index) => {
          const isSelected = selectedForCompare.includes(dest.id);
          const isExpanded = expandedDetails === dest.id;

          return (
            <DestinationCard
              key={dest.id}
              dest={dest}
              index={index}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggleCompare={toggleCompare}
              onToggleDetails={toggleDetails}
              onSelectDestination={handleSelectDestination}
            />
          );
        })}
      </div>

      {/* STICKY BOTTOM COMPARISON DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#0E1D4F]/10 py-2.5 sm:py-3.5 shadow-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-label-caps text-[11px] sm:text-xs text-[#0E1D4F] uppercase font-bold">
              ĐÃ CHỌN ĐỂ SO SÁNH:
            </span>
            <div className="flex items-center gap-2">
              {comparedDestinations.map((d) => (
                <span
                  key={d.id}
                  className="px-2.5 py-1 rounded-xl bg-[#0E1D4F] text-white text-xs font-label-md font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{d.name.split(',')[0]}</span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(d.id)}
                    className="hover:text-[#08B3C6] cursor-pointer"
                    aria-label={`Bỏ chọn ${d.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowComparisonModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs sm:text-sm font-label-lg font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Icon name="balance" className="size-[18px]" />
              <span>So sánh chi tiết ngay ({selectedForCompare.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* COMPARISON MODAL */}
      <ComparisonDialog
        isOpen={showComparisonModal}
        comparedDestinations={comparedDestinations}
        onClose={() => setShowComparisonModal(false)}
        onSelectDestination={handleSelectDestination}
      />
    </div>
  );
}

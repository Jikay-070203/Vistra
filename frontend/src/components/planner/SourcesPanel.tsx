'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';

interface SourcesPanelProps {
  activePlan: DemoPlan;
  mobileTab: 'chat' | 'itinerary' | 'sources';
  onCloseSources: () => void;
}

export default function SourcesPanel({
  activePlan,
  mobileTab,
  onCloseSources,
}: SourcesPanelProps) {
  return (
    <aside className={`lg:col-span-3 ${
      mobileTab === 'sources' ? 'flex' : 'hidden lg:flex'
    } bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex-col h-[calc(100vh-210px)] min-h-[480px] max-h-[820px] overflow-hidden transition-all animate-in fade-in duration-200`}>
      {/* Panel Header */}
      <div className="p-4 border-b border-[#0E1D4F]/10 flex items-center justify-between bg-white/60">
        <div className="flex items-center gap-2">
          <Icon name="verified" className="size-4 text-[#205BD6]" />
          <h2 className="font-headline-sm text-sm font-bold text-[#0E1D4F]">
            Nguồn đối chiếu thực tế
          </h2>
        </div>
        <button
          type="button"
          onClick={onCloseSources}
          className="p-1 rounded-lg text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]"
          title="Thu gọn bảng nguồn"
          aria-label="Thu gọn bảng nguồn"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>

      {/* Sources List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        <div className="p-3 bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10 text-xs text-[#4B5875] leading-relaxed">
          Các trích dẫn này được chèn tự động khi thảo luận cùng Vistra để bảo đảm tính khả thi thực tế của hành trình.
        </div>

        {activePlan.sources.map((src) => (
          <div
            key={src.id}
            className="p-3.5 bg-white rounded-xl border border-[#0E1D4F]/10 shadow-2xs space-y-1.5 hover:border-[#205BD6]/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-label-caps font-bold bg-[#08B3C6]/15 text-[#08B3C6]">
                {src.type === 'weather_station' ? 'KHÍ HẬU' : src.type === 'local_guide' ? 'BẢN ĐỊA' : 'CỘNG ĐỒNG'}
              </span>
            </div>

            <h4 className="font-headline-sm text-xs font-bold text-[#0E1D4F] leading-snug">
              {src.title}
            </h4>

            <p className="text-[11px] text-[#4B5875] italic leading-relaxed">
              &ldquo;{src.snippet}&rdquo;
            </p>

            <div className="pt-1 text-[10px] text-[#205BD6] font-medium">
              Nguồn: {src.authorOrDomain}
            </div>
          </div>
        ))}
      </div>

      {/* Reality Agent Badge Footer */}
      <div className="p-3 border-t border-[#0E1D4F]/10 bg-[#EBF1F0] flex items-center gap-2 text-xs text-[#4B5875]">
        <Icon name="shield" className="size-4 text-[#205BD6] shrink-0" />
        <span>Reality Agent kiểm chứng liên tục trước khi xác nhận.</span>
      </div>
    </aside>
  );
}

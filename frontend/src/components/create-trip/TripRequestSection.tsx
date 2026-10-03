'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';

interface TripRequestSectionProps {
  narrative: string;
  onNarrativeChange: (value: string) => void;
}

export default function TripRequestSection({
  narrative,
  onNarrativeChange,
}: TripRequestSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-xs text-[#205BD6] font-bold uppercase tracking-wider">
            02 / MONG MUỐN BẰNG LỜI
          </span>
          <h2 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
            Mô tả chuyến đi lý tưởng của bạn
          </h2>
        </div>
        <span className="text-xs text-[#4B5875] font-medium flex items-center gap-1">
          <Icon name="mic" className="size-3.5 text-[#205BD6]" />
          <span>Nhập lời thoại tự nhiên</span>
        </span>
      </div>

      <div className="bg-white/85 backdrop-blur-md p-5 rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex flex-col gap-3">
        <textarea
          value={narrative}
          onChange={(e) => onNarrativeChange(e.target.value)}
          rows={4}
          className="w-full bg-transparent text-[#0E1D4F] font-body-md text-sm sm:text-base placeholder:text-[#4B5875]/50 focus:outline-none resize-none leading-relaxed"
          placeholder="Chia sẻ những gì bạn mong muốn bằng lời văn của riêng mình..."
        />
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#0E1D4F]/10">
          <div className="flex items-center gap-2 text-[#4B5875] text-xs font-label-md">
            <Icon name="insights" className="size-4 text-[#205BD6]" />
            <span>Đã tổng hợp 5 sở thích: Phi thương mại, Sắc thu, Cung đường đẹp, Ẩm thực bản địa</span>
          </div>
          <div className="text-[#4B5875]/80 font-label-caps text-xs font-semibold">
            {narrative.length} KÝ TỰ
          </div>
        </div>
      </div>
    </section>
  );
}

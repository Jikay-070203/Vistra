'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';

interface CommunityFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDuration: string;
  onSelectDuration: (duration: string) => void;
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  totalFilteredCount: number;
  totalPages: number;
  onResetFilters: () => void;
}

export default function CommunityFilters({
  searchQuery,
  onSearchChange,
  selectedDuration,
  onSelectDuration,
  selectedTag,
  onSelectTag,
  totalFilteredCount,
  totalPages,
  onResetFilters,
}: CommunityFiltersProps) {
  const isFiltered = Boolean(searchQuery || selectedDuration !== 'all' || selectedTag !== 'all');

  return (
    <aside className="lg:col-span-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-5 space-y-6 shadow-xs lg:sticky lg:top-24">
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
            Đặt lại
          </button>
        )}
      </div>

      {/* Search Box */}
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

      {/* Duration Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
          THỜI LƯỢNG HÀNH TRÌNH
        </label>
        <div className="flex flex-col gap-1.5">
          {[
            { id: 'all', label: 'Tất cả thời lượng' },
            { id: '2 ngày', label: '2 ngày / 1 đêm (Cuối tuần)' },
            { id: '3 ngày', label: '3 ngày / 2 đêm' },
            { id: '4 ngày', label: '4 ngày / 3 đêm' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectDuration(opt.id)}
              className={`text-left text-xs px-3 py-2 rounded-xl transition-all font-medium flex items-center justify-between cursor-pointer ${
                selectedDuration === opt.id
                  ? 'bg-[#205BD6] text-white font-semibold shadow-xs'
                  : 'bg-[#EBF1F0] text-[#0E1D4F] hover:bg-gray-200'
              }`}
            >
              <span>{opt.label}</span>
              {selectedDuration === opt.id && <Icon name="check" className="size-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Category / Theme Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
          PHONG CÁCH &amp; CHỦ ĐỀ
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'núi', label: 'Núi non / Săn mây' },
            { id: 'biển', label: 'Biển đảo' },
            { id: 'di sản', label: 'Di sản & Văn hóa' },
            { id: 'đồi thông', label: 'Đồi thông & Cà phê' },
            { id: 'nghỉ dưỡng', label: 'Nghỉ dưỡng tĩnh lặng' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectTag(cat.id)}
              className={`text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer font-medium ${
                selectedTag === cat.id
                  ? 'bg-[#08B3C6] text-white font-bold shadow-2xs'
                  : 'bg-[#EBF1F0] text-[#0E1D4F] hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active summary */}
      <div className="p-3 bg-[#EBF1F0] rounded-xl text-xs text-[#4B5875] space-y-1">
        <div className="flex justify-between">
          <span>Đang khớp:</span>
          <strong className="text-[#0E1D4F]">{totalFilteredCount} hành trình</strong>
        </div>
        <div className="flex justify-between">
          <span>Tổng số trang:</span>
          <strong className="text-[#0E1D4F]">{totalPages || 1} trang</strong>
        </div>
      </div>
    </aside>
  );
}

'use client';

import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import type { DestinationRecommendationView } from '@/types/recommendationApi';

interface DestinationCardProps {
  dest: DestinationRecommendationView;
  isSelected: boolean;
  compareDisabled: boolean;
  isExpanded: boolean;
  onToggleCompare: (id: string) => void;
  onToggleDetails: (id: string) => void;
  onSelectDestination: (slug: string) => void;
}

export default function DestinationCard({ dest, isSelected, compareDisabled, isExpanded, onToggleCompare, onToggleDetails, onSelectDestination }: DestinationCardProps) {
  return <article className={`bg-white/90 rounded-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col shadow-xs relative transition-all ${compareDisabled ? 'opacity-60 bg-slate-50 border-slate-200' : ''}`}>
    {compareDisabled && (
      <div className="absolute top-2 right-2 z-10 bg-slate-800/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs">
        Đã đạt tối đa 3
      </div>
    )}
    <div className="relative h-40 bg-[#EBF1F0]">
      {dest.imageUrl ? <Image src={dest.imageUrl} alt={dest.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
        : <div className="h-full flex flex-col items-center justify-center text-[#4B5875] gap-2"><Icon name="landscape" className="size-8" /><span className="text-xs">Chưa có ảnh</span></div>}
    </div>
    <div className="p-4 flex flex-col flex-1 gap-3">
      <h2 className="text-lg font-bold text-[#0E1D4F]">{dest.name}</h2>
      <p className="text-xs text-[#4B5875]">{[dest.region, dest.country].filter(Boolean).join(', ')}</p>
      <p className="text-sm text-[#4B5875]">{dest.rationale}</p>
      {dest.durationDays !== null && <p className="text-sm">{dest.durationDays} ngày</p>}
      {dest.estimatedCostVnd !== null && <p className="text-sm">Chi phí: {dest.estimatedCostVnd.toLocaleString('vi-VN')} đ</p>}
      <p className="text-xs text-[#4B5875]">{dest.estimatedCostVnd === null ? 'Chưa có chi phí. ' : ''}{dest.seasonMatchPct === null ? 'Chưa có đánh giá mùa vụ.' : `Phù hợp mùa vụ: ${dest.seasonMatchPct}%`}</p>
      <label className={`flex items-center gap-2 text-sm text-[#0E1D4F] mt-auto min-h-11 ${compareDisabled ? 'text-[#4B5875] cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
        <input type="checkbox" checked={isSelected} disabled={compareDisabled} onChange={() => onToggleCompare(dest.id)} className="size-4 cursor-pointer disabled:cursor-not-allowed" />
        <span>{isSelected ? 'Đang so sánh' : compareDisabled ? 'Đã chọn tối đa 3' : 'Chọn so sánh'}</span>
      </label>
      <button type="button" aria-expanded={isExpanded} onClick={() => onToggleDetails(dest.id)} className="border border-[#0E1D4F]/15 rounded-xl p-3 text-sm text-[#0E1D4F] cursor-pointer">{isExpanded ? 'Đóng chi tiết' : 'Thông tin điểm đến'}</button>
      <button type="button" onClick={() => onSelectDestination(dest.id)} className="bg-[#205BD6] text-white rounded-xl p-3 text-sm cursor-pointer">Tạo kế hoạch tại đây</button>
    </div>
  </article>;
}

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import type { TripCardView } from '@/types/tripCollectionApi';

export interface CommunityPlanCardProps {
  plan: TripCardView;
  isLiked: boolean;
  likesCount: number;
  priority?: boolean;
  likePending?: boolean;
  clonePending?: boolean;
  onClone: (planId: string) => void;
  onToggleLike: (e: React.MouseEvent, planId: string) => void;
}

export const CommunityPlanCard = React.memo(function CommunityPlanCard({
  plan,
  isLiked,
  likesCount,
  priority = false, likePending = false, clonePending = false, onClone,
  onToggleLike,
}: CommunityPlanCardProps) {
  const datesText = plan.startDate && plan.endDate
    ? `${plan.startDate} – ${plan.endDate}`
    : 'Chưa có ngày';

  const budgetText = plan.estimatedCostVnd != null
    ? `${plan.estimatedCostVnd.toLocaleString('vi-VN')} đ`
    : plan.budgetMinVnd != null
    ? `${plan.budgetMinVnd.toLocaleString('vi-VN')} đ`
    : 'Chưa cập nhật';

  return (
    <article
      className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs hover:border-[#0E1D4F]/25 transition-all flex flex-col justify-between overflow-hidden group select-none"
    >
      {/* Photo Container */}
      <div className="relative h-40 w-full overflow-hidden bg-[#EBF1F0]">
        <Link href={`/trip-plan?id=${encodeURIComponent(plan.id)}`} className="absolute inset-0" aria-label={`Xem lịch trình ${plan.title}`}>
        {plan.coverImageUrl ? (
          <Image
            src={plan.coverImageUrl}
            alt={plan.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#EBF1F0] text-[#4B5875]/60 gap-1">
            <Icon name="landscape" className="size-8" />
            <span className="text-[10px] font-medium">Chưa có ảnh bìa</span>
          </div>
        )}
        </Link>

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-label-caps font-semibold">
            {plan.durationDays} ngày
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-label-caps font-semibold shadow-xs">
            MÁY CHỦ
          </span>
        </div>

        {/* Like button (COMF-02: Pink-red color and distinguishable shape without color alone) */}
        <button
          type="button"
          onClick={(e) => onToggleLike(e, plan.id)}
          disabled={likePending}
          aria-busy={likePending}
          className={`absolute top-2.5 right-2.5 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed z-10 ${
            isLiked
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white/80 hover:bg-white text-[#4B5875]'
          }`}
          title={isLiked ? 'Bỏ thích hành trình này' : 'Thích hành trình này'}
          aria-label={isLiked ? 'Bỏ thích hành trình' : 'Thích hành trình'}
          aria-pressed={isLiked}
        >
          <Icon name={isLiked ? 'favorite' : 'favorite_border'} className="size-3.5" />
        </button>

        <div className="absolute bottom-2 left-2.5 text-white drop-shadow-md text-[11px] font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs z-10">
          {datesText}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Destination and Likes Count */}
          <div className="flex items-center justify-between text-[11px] text-[#4B5875] mb-1">
            <span className="text-[#205BD6] font-semibold truncate max-w-[130px] flex items-center gap-1">
              <Icon name="location_on" className="size-3 text-[#08B3C6] shrink-0" />
              <span className="truncate">{plan.destination}</span>
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <Icon
                name={isLiked ? 'favorite' : 'favorite_border'}
                className={`size-3 ${isLiked ? 'text-rose-500' : 'text-[#4B5875]'}`}
              />
              <span className="font-semibold text-[#0E1D4F]">{likesCount}</span>
            </span>
          </div>

          <Link href={`/trip-plan?id=${encodeURIComponent(plan.id)}`} className="font-headline-sm text-xs sm:text-sm font-bold text-[#0E1D4F] line-clamp-2 leading-snug hover:text-[#205BD6]">
            {plan.title}
          </Link>

          <div className="text-[11px] text-[#4B5875] mt-1.5 flex items-center justify-between">
            <span>Ngân sách:</span>
            <span className="font-semibold text-[#0E1D4F]">{budgetText}</span>
          </div>
        </div>

        {/* Copy uses the published server plan. */}
        <div className="pt-2 border-t border-[#0E1D4F]/10 flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#4B5875]/80 truncate">
            Chưa có thông tin tác giả
          </span>

          <button
            type="button"
            disabled={clonePending}
            onClick={() => onClone(plan.id)}
            className="min-h-11 px-3 py-2 rounded-lg bg-slate-100 text-[#4B5875] text-[10px] font-semibold border border-slate-200/80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
            title="Tạo bản sao hành trình vào chuyến đi của tôi"
            aria-busy={clonePending}
          >
            {clonePending ? 'Đang sao chép...' : 'Tạo bản sao'}
          </button>
        </div>
      </div>
    </article>
  );
});

export default CommunityPlanCard;

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
      className="group flex select-none flex-col justify-between overflow-hidden rounded-xl border border-[#0E1D4F]/12 bg-warm-surface shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Photo Container */}
      <div className="relative h-44 w-full overflow-hidden bg-[#EBF1F0]">
        <Link href={`/trip-plan?id=${encodeURIComponent(plan.id)}`} className="absolute inset-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#205BD6]" aria-label={`Xem lịch trình ${plan.title}`}>
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
          <span className="rounded bg-[#0E1D4F]/85 px-2.5 py-1 text-[11px] font-label-caps font-semibold text-white">
            {plan.durationDays} ngày
          </span>
          <span className="rounded bg-[#205BD6] px-2.5 py-1 text-[11px] font-label-caps font-semibold text-white">
            MÁY CHỦ
          </span>
        </div>

        {/* Like button (COMF-02: Pink-red color and distinguishable shape without color alone) */}
        <button
          type="button"
          onClick={(e) => onToggleLike(e, plan.id)}
          disabled={likePending}
          aria-busy={likePending}
          className={`absolute right-2.5 top-2.5 z-10 flex size-11 items-center justify-center rounded-full border border-white/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-50 ${
            isLiked
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-warm-surface text-[#4B5875] hover:bg-white'
          }`}
          title={isLiked ? 'Bỏ thích hành trình này' : 'Thích hành trình này'}
          aria-label={isLiked ? 'Bỏ thích hành trình' : 'Thích hành trình'}
          aria-pressed={isLiked}
        >
          <Icon name={isLiked ? 'favorite' : 'favorite_border'} className="size-3.5" />
        </button>

        <div className="absolute bottom-2 left-2.5 z-10 rounded bg-[#0E1D4F]/85 px-2.5 py-1 text-xs font-medium text-white">
          {datesText}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
        <div>
          {/* Destination and Likes Count */}
          <div className="flex items-center justify-between text-[11px] text-[#4B5875] mb-1">
            <span className="flex max-w-[150px] items-center gap-1 truncate font-semibold text-[#0E1D4F]">
              <Icon name="location_on" className="size-3 text-[#08B3C6] shrink-0" />
              <span className="truncate">{plan.destination}</span>
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Icon
                name={isLiked ? 'favorite' : 'favorite_border'}
                className={`size-3 ${isLiked ? 'text-rose-500' : 'text-[#4B5875]'}`}
              />
              <span className="font-semibold text-[#0E1D4F]">{likesCount}</span>
            </span>
          </div>

          <Link href={`/trip-plan?id=${encodeURIComponent(plan.id)}`} className="font-headline-sm text-sm font-bold leading-snug text-[#0E1D4F] line-clamp-2 hover:text-[#205BD6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] sm:text-base">
            {plan.title}
          </Link>

          <div className="mt-2 flex items-center justify-between border-t border-[#0E1D4F]/10 pt-2 text-xs text-[#4B5875]">
            <span>Ngân sách:</span>
            <span className="font-semibold text-[#0E1D4F]">{budgetText}</span>
          </div>
        </div>

        {/* Copy uses the published server plan. */}
        <div className="flex items-center justify-between gap-2 border-t border-[#0E1D4F]/10 pt-3">
          <span className="text-[10px] text-[#4B5875]/80 truncate">
            Chưa có thông tin tác giả
          </span>

          <button
            type="button"
            disabled={clonePending}
            onClick={() => onClone(plan.id)}
            className="min-h-11 shrink-0 rounded-lg border border-[#0E1D4F]/20 bg-[#EBF1F0] px-3 py-2 text-xs font-semibold text-[#0E1D4F] transition-colors hover:bg-[#E1E9E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-60"
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

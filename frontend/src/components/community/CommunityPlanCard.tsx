'use client';

import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';

export interface CommunityPlanCardProps {
  plan: DemoPlan;
  isLiked: boolean;
  priority?: boolean;
  onOpenDetail: (plan: DemoPlan) => void;
  onReusePlan: (e: React.MouseEvent, plan: DemoPlan) => void;
  onToggleLike: (e: React.MouseEvent, planId: string) => void;
}

export const CommunityPlanCard = React.memo(function CommunityPlanCard({
  plan,
  isLiked,
  priority = false,
  onOpenDetail,
  onReusePlan,
  onToggleLike,
}: CommunityPlanCardProps) {
  const likes = (plan.likesCount || 0) + (isLiked ? 1 : 0);

  return (
    <article
      onClick={() => onOpenDetail(plan)}
      className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs hover:shadow-md hover:border-[#205BD6]/50 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
    >
      {/* Photo Container */}
      <div className="relative h-40 w-full overflow-hidden bg-[#EBF1F0]">
        <Image
          src={plan.coverImage}
          alt={plan.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-label-caps font-semibold">
            {plan.duration}
          </span>
        </div>

        {/* Like button */}
        <button
          type="button"
          onClick={(e) => onToggleLike(e, plan.id)}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer z-10 ${
            isLiked
              ? 'bg-[#ba1a1a] text-white'
              : 'bg-white/80 hover:bg-white text-[#4B5875]'
          }`}
          title="Thích hành trình này"
          aria-label="Thích hành trình"
        >
          <Icon name="favorite" className="size-3.5" />
        </button>

        <div className="absolute bottom-2 left-2.5 text-white drop-shadow-md text-[11px] font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs z-10">
          {plan.dates}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Origin and Author */}
          <div className="flex items-center justify-between text-[11px] text-[#4B5875] mb-1">
            <span className="text-[#205BD6] font-semibold truncate max-w-[130px]">
              {plan.origin}
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <Icon name="favorite" className="size-3 text-[#ba1a1a]" />
              <span>{likes}</span>
            </span>
          </div>

          <h3 className="font-headline-sm text-xs sm:text-sm font-bold text-[#0E1D4F] line-clamp-2 leading-snug group-hover:text-[#205BD6] transition-colors">
            {plan.title}
          </h3>

          <p className="text-[11px] text-[#4B5875] mt-1 flex items-center gap-1 truncate">
            <Icon name="location_on" className="size-3 text-[#08B3C6] shrink-0" />
            <span>{plan.destination}</span>
          </p>
        </div>

        {/* Author & Reuse button */}
        <div className="pt-2 border-t border-[#0E1D4F]/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <div className="w-5 h-5 rounded-full bg-[#08B3C6]/20 text-[#08B3C6] font-bold text-[9px] flex items-center justify-center shrink-0">
              {plan.authorAvatar || 'VS'}
            </div>
            <span className="text-[10px] text-[#4B5875] truncate">
              {plan.authorName || 'Du khách Vistra'}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => onReusePlan(e, plan)}
            className="px-2 py-1 rounded-lg bg-[#205BD6]/10 hover:bg-[#205BD6] hover:text-white text-[#205BD6] text-[10px] font-semibold transition-colors shrink-0 cursor-pointer"
            title="Tạo bản nháp mới từ hành trình này"
          >
            Tái sử dụng
          </button>
        </div>
      </div>
    </article>
  );
});

export default CommunityPlanCard;

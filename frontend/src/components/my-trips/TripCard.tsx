'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';

interface TripCardProps {
  plan: DemoPlan;
}

export default function TripCard({ plan }: TripCardProps) {
  const isDraft = plan.status === 'draft';
  const targetUrl = isDraft
    ? `/planner?id=${encodeURIComponent(plan.id)}`
    : `/trip-plan?id=${encodeURIComponent(plan.id)}`;

  return (
    <Link
      href={targetUrl}
      aria-label={`Mở ${isDraft ? 'bàn làm việc' : 'hồ sơ hành trình'}: ${plan.title}`}
      className="bg-white/85 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 overflow-hidden shadow-xs hover:shadow-md hover:border-[#205BD6]/50 focus-visible:outline-2 focus-visible:outline-[#205BD6] focus-visible:outline-offset-2 transition-all flex flex-col justify-between group cursor-pointer block"
    >
      {/* Photo Header */}
      <div className="relative h-44 w-full overflow-hidden bg-[#EBF1F0]">
        <Image
          src={plan.coverImage}
          alt={plan.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          loading="lazy"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold shadow-xs ${
              isDraft
                ? 'bg-[#0E1D4F] text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isDraft ? 'BẢN NHÁP' : 'ĐÃ XÁC NHẬN'}
          </span>
          {plan.isPublished && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold bg-[#08B3C6] text-white shadow-xs">
              ĐÃ XUẤT BẢN
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium">
          {plan.duration}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#205BD6] font-semibold mb-1">
            <Icon name="location_on" className="size-3.5" />
            <span className="truncate">{plan.destination}</span>
          </div>

          <h3 className="font-headline-sm text-sm font-bold text-[#0E1D4F] line-clamp-2 leading-snug group-hover:text-[#205BD6] transition-colors">
            {plan.title}
          </h3>

          <p className="text-xs text-[#4B5875] mt-1.5 flex items-center gap-1">
            <Icon name="calendar_today" className="size-3 text-[#4B5875]" />
            <span>{plan.dates}</span>
          </p>
        </div>

        {/* Card Footer: Metadata & Action CTA */}
        <div className="pt-3 border-t border-[#0E1D4F]/10 flex items-center justify-between text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#4B5875]">Ngân sách ước tính</span>
            <span className="font-semibold text-[#0E1D4F] truncate max-w-[120px]">{plan.budget}</span>
          </div>

          <span
            className={`px-3 py-1.5 rounded-xl font-label-md text-xs font-semibold flex items-center gap-1 transition-all ${
              isDraft
                ? 'bg-[#205BD6]/10 text-[#205BD6] group-hover:bg-[#205BD6] group-hover:text-white'
                : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
            }`}
          >
            <span>{isDraft ? 'Mở bàn làm việc' : 'Xem hồ sơ'}</span>
            <Icon name="arrow_forward" className="size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

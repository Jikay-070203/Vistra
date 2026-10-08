'use client';

import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export interface UnifiedTripCard {
  id: string;
  title: string;
  destination: string;
  duration?: string;
  dates?: string;
  budget?: string;
  coverImage?: string | null;
  status: string;
  isPublished?: boolean;
}

export default function TripCard({ plan }: { plan: UnifiedTripCard }) {
  const status = plan.status === 'draft' ? 'BẢN NHÁP' : plan.status === 'confirmed' ? 'ĐÃ XÁC NHẬN' : plan.status;
  return (
    <article className="bg-white/85 rounded-2xl border border-[#0E1D4F]/10 overflow-hidden shadow-xs flex flex-col min-h-[350px] h-full w-full">
      <div className="relative h-44 bg-[#EBF1F0]">
        {plan.coverImage ? <Image src={plan.coverImage} alt={plan.title} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
          : <div className="h-full flex flex-col items-center justify-center gap-2 text-[#4B5875]"><Icon name="landscape" className="size-8" /><span className="text-xs">Chưa có ảnh bìa</span></div>}
        <div className="absolute top-3 left-3 flex gap-2 text-xs"><span className="rounded-lg bg-[#0E1D4F] text-white px-2 py-1">{status}</span>{plan.isPublished && <span className="rounded-lg bg-[#205BD6] text-white px-2 py-1">Đã xuất bản</span>}</div>
        {plan.duration && <span className="absolute bottom-3 right-3 rounded-lg bg-white px-2 py-1 text-xs text-[#0E1D4F]">{plan.duration}</span>}
      </div>
      <div className="p-4 flex-1 space-y-3">
        <p className="text-xs font-semibold text-[#205BD6]">{plan.destination}</p>
        <h3 className="font-bold text-[#0E1D4F]">{plan.title}</h3>
        <p className="text-xs text-[#4B5875]">{plan.dates}</p>
        <p className="text-xs text-[#4B5875]">Ngân sách: <strong>{plan.budget}</strong></p>
        <Link href={`/${plan.status === 'confirmed' ? 'trip-plan' : 'planner'}?id=${encodeURIComponent(plan.id)}`} className="inline-flex min-h-11 items-center rounded-xl bg-[#205BD6] text-white text-sm px-4 py-3 font-semibold">{plan.status === 'confirmed' ? 'Xem lịch trình' : 'Mở bàn làm việc'}</Link>
      </div>
    </article>
  );
}

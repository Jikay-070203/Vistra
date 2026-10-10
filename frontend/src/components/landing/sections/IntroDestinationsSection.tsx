'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import type { useLandingContent } from '../useLandingContent';

export default function IntroDestinationsSection({ data, loading, error, retry }: ReturnType<typeof useLandingContent>) {
  const destinations = data?.introDestinations.filter((item) => item.active).sort((a, b) => a.order - b.order) ?? [];

  return (
    <section
      id="ban-muon-di-dau"
      className="w-full pt-12 pb-10 sm:pt-16 sm:pb-12 bg-transparent"
      aria-label="Khám phá điểm đến: Bạn muốn đi đâu?"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08B3C6]/15 text-[#08B3C6] font-label-caps text-xs font-bold uppercase tracking-wider mb-2">
            <Icon name="explore" className="size-3.5" />
            <span>ĐIỂM ĐẾN NỔI BẬT</span>
          </div>

          <h2 className="font-headline-lg text-2xl sm:text-4xl text-[#0E1D4F] font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title="Bạn muốn đi đâu?">
            Bạn muốn đi đâu?
          </h2>

          <p className="font-body-md text-xs sm:text-base text-[#4B5875] mt-2 leading-relaxed">
            Chọn một miền đất cảm hứng để khám phá ngay các lịch trình và cung đường được tuyển chọn từ cộng đồng Vistra.
          </p>
        </div>

        {destinations.length === 0 && <div className="p-6 text-center text-sm text-[#4B5875]">
          <p role={error ? 'alert' : 'status'}>{loading ? 'Đang tải điểm đến…' : error || 'Chưa có điểm đến được mở khám phá.'}</p>
          {error && <button type="button" onClick={retry} className="px-4 py-3 mt-2 text-[#205BD6] font-semibold underline">Thử lại</button>}
        </div>}
        {/* Fanned Cards Presentation (LP-04, LP-05) */}
        {/* Desktop: Enlarged True Fanned Cards Deck with enhanced image clarity and focal presentation */}
        <div className="hidden xl:flex [@media(hover:none)]:hidden justify-center items-end pt-12 pb-10 px-4 overflow-visible">
          <div className="flex justify-center items-end -space-x-14 xl:-space-x-16 max-w-6xl w-full">
            {destinations.map((dest, idx) => {
              // 6 fanned card angles radiating outward from bottom center with natural overlap
              const fanStyles = [
                { rotate: '-rotate-[12deg]', translate: 'translate-y-8' },
                { rotate: '-rotate-[7deg]', translate: 'translate-y-3' },
                { rotate: '-rotate-[2.5deg]', translate: 'translate-y-0' },
                { rotate: 'rotate-[2.5deg]', translate: 'translate-y-0' },
                { rotate: 'rotate-[7deg]', translate: 'translate-y-3' },
                { rotate: 'rotate-[12deg]', translate: 'translate-y-8' },
              ][idx % 6];

              return (
                <Link
                  key={dest.id}
                  href={`/community?province=${encodeURIComponent(dest.label)}`}
                  className={`group relative w-64 xl:w-72 aspect-[3/4.5] rounded-3xl overflow-hidden border-2 border-white/90 shadow-2xl bg-[#0E1D4F] origin-bottom transition-all duration-300 ease-out transform ${fanStyles.rotate} ${fanStyles.translate} hover:rotate-0 hover:-translate-y-12 hover:scale-105 hover:z-30 hover:shadow-2xl hover:border-[#205BD6] focus-visible:-translate-y-12 focus-visible:rotate-0 focus-visible:z-30 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#205BD6]/50 motion-reduce:transform-none motion-reduce:transition-none flex flex-col justify-end p-5`}
                  title={`Khám phá hành trình tại ${dest.label}`}
                >
                  {/* Photo Background with crisp resolution and centered focal subject */}
                  {dest.imageUrl && <Image
                    src={dest.imageUrl}
                    alt={dest.label}
                    fill
                    sizes="(max-width: 1280px) 33vw, 360px"
                    className="object-cover object-center group-hover:scale-108 transition-transform duration-700 opacity-85 group-hover:opacity-100 motion-reduce:transition-none"
                    priority={idx < 2}
                  />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />


                  {/* Destination Card Content */}
                  <div className="relative z-10 text-white space-y-1.5">
                    

                    <h3 className="font-headline-sm text-xl font-bold leading-tight drop-shadow-xs group-hover:text-[#08B3C6] transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title={dest.label}>
                      {dest.label}
                    </h3>

                    <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                      {dest.tagline}
                    </p>

                    <div className="pt-2 flex items-center gap-1.5 text-xs text-[#08B3C6] group-hover:text-white font-semibold">
                      <span>Khám phá</span>
                      <Icon name="arrow_forward" className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile & Tablet: Accessible Responsive Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:hidden [@media(hover:none)]:grid gap-4 sm:gap-5 pt-4 pb-6">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              href={`/community?province=${encodeURIComponent(dest.label)}`}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4.2] border border-[#0E1D4F]/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-end p-4 bg-[#0E1D4F] focus:outline-none focus:ring-2 focus:ring-[#205BD6]"
              title={`Khám phá hành trình tại ${dest.label}`}
            >
              {dest.imageUrl && <Image
                src={dest.imageUrl}
                alt={dest.label}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-95"
              />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />


              <div className="relative z-10 text-white space-y-1">
                

                <h3 className="font-headline-sm text-base font-bold leading-tight group-hover:text-[#08B3C6] transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title={dest.label}>
                  {dest.label}
                </h3>

                <p className="text-[11px] text-white/85 line-clamp-2 leading-tight">
                  {dest.tagline}
                </p>

                <div className="pt-1 flex items-center gap-1 text-[11px] text-[#08B3C6] group-hover:text-white font-semibold">
                  <span>Khám phá</span>
                  <Icon name="arrow_forward" className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

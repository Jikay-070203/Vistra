'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import type { HeroContentItem } from '@/types/contentApi';

export default function HeroPlanCarousel({ plans, loading, error, onRetry }: {
  plans: HeroContentItem[]; loading: boolean; error: string | null; onRetry: () => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Responsive itemsPerView
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1200) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const totalPlans = plans.length;
  // Initialize virtualIndex at totalPlans so there are buffer cards on left and right
  const [virtualIndex, setVirtualIndex] = useState(() => plans.length);
  const [enableTransition, setEnableTransition] = useState(true);

  // LP-02: Circular active index for dots & aria (0..totalPlans - 1)
  const activeDotIndex = totalPlans > 0 ? ((virtualIndex % totalPlans) + totalPlans) % totalPlans : 0;

  // LPF-01: Autoplay 5-second cycle with pause on hover/focus/reduced-motion
  useEffect(() => {
    if (totalPlans <= 1 || isPaused || prefersReducedMotion) return;
    const timer = setInterval(() => {
      setEnableTransition(true);
      setVirtualIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalPlans, isPaused, prefersReducedMotion]);

  const handlePrev = () => {
    if (totalPlans <= 1) return;
    setEnableTransition(true);
    setVirtualIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (totalPlans <= 1) return;
    setEnableTransition(true);
    setVirtualIndex((prev) => prev + 1);
  };

  // On transition end, silently snap within [totalPlans, 2 * totalPlans - 1] without animation
  const handleTransitionEnd = () => {
    if (totalPlans <= 0) return;
    if (virtualIndex >= 2 * totalPlans) {
      setEnableTransition(false);
      setVirtualIndex(virtualIndex - totalPlans);
    } else if (virtualIndex < totalPlans) {
      setEnableTransition(false);
      setVirtualIndex(virtualIndex + totalPlans);
    }
  };

  // Re-enable transition after silent snap
  useEffect(() => {
    if (!enableTransition) {
      const frame = requestAnimationFrame(() => {
        setEnableTransition(true);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [enableTransition]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  if (plans.length === 0) {
    return (
      <div className="w-full py-8 text-center bg-white/40 rounded-2xl border border-[#0E1D4F]/10">
        <Icon name="travel_explore" className="size-8 text-[#4B5875]/50 mx-auto mb-2" />
        <p role={error ? 'alert' : 'status'} className="text-sm text-[#4B5875]">{loading ? 'Đang tải hành trình nổi bật…' : error || 'Hiện chưa có hành trình nổi bật nào được kích hoạt.'}</p>
        {error && <button type="button" onClick={onRetry} className="px-4 py-3 mt-2 text-[#205BD6] font-semibold underline">Thử lại</button>}
      </div>
    );
  }

  const canNavigate = plans.length > 1;
  // Tripled list for infinite buffer: [0..N-1] [N..2N-1] [2N..3N-1]
  const extendedPlans = [...plans, ...plans, ...plans];

  return (
    <div
      className="w-full py-2 focus:outline-none"
      role="region"
      aria-roledescription="carousel"
      aria-label="Hành trình nổi bật khuyên dùng"
      aria-live={isPaused ? 'polite' : 'off'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onTouchStart={(event) => {
        touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return;
        const dx = event.changedTouches[0].clientX - touchStart.current.x;
        const dy = event.changedTouches[0].clientY - touchStart.current.y;
        touchStart.current = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && totalPlans > 1) {
          if (dx < 0) handleNext(); else handlePrev();
        }
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-label-caps text-xs text-[#205BD6] font-bold uppercase tracking-wider block">
            HÀNH TRÌNH NỔI BẬT KHUYÊN DÙNG
          </span>
          <h3 className="font-headline-sm text-base sm:text-lg font-bold text-[#0E1D4F] whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title="Hành trình được tuyển chọn">
            Hành trình được tuyển chọn
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canNavigate}
            className="w-11 h-11 rounded-full bg-white border border-[#0E1D4F]/15 flex items-center justify-center text-[#0E1D4F] hover:bg-[#EBF1F0] disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
            aria-label="Hành trình trước"
          >
            <Icon name="chevron_left" className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNavigate}
            className="w-11 h-11 rounded-full bg-white border border-[#0E1D4F]/15 flex items-center justify-center text-[#0E1D4F] hover:bg-[#EBF1F0] disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
            aria-label="Hành trình tiếp theo"
          >
            <Icon name="chevron_right" className="size-4" />
          </button>
        </div>
      </div>

      {/* True Sliding Carousel Window */}
      <div className="overflow-hidden relative w-full rounded-2xl py-1">
        <div
          onTransitionEnd={handleTransitionEnd}
          className={`flex ${prefersReducedMotion || !enableTransition ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{
            transform: `translateX(-${virtualIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {extendedPlans.map((plan, idx) => (
            <div
              key={`${plan.id}-slot-${idx}`}
              className="shrink-0 px-2"
              style={{ width: `${100 / itemsPerView}%` }}
              role="group"
              aria-roledescription="slide"
              aria-label={`Hành trình ${(idx % totalPlans) + 1}: ${plan.title}`}
            >
              <article className="h-full bg-white/95 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="relative h-44 w-full overflow-hidden bg-[#EBF1F0]">
                  {plan.image && <Image
                    src={plan.image}
                    alt={plan.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                    {plan.duration}
                  </div>
                  <div className="absolute bottom-2 left-2.5 right-2.5 text-white bg-black/50 backdrop-blur-xs p-1.5 rounded-lg text-xs font-semibold truncate">
                    {plan.destination}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-headline-sm text-sm font-bold text-[#0E1D4F] group-hover:text-[#205BD6] transition-colors whitespace-nowrap overflow-hidden text-ellipsis block max-w-full" title={plan.title}>
                      {plan.title}
                    </h4>
                    <p className="text-xs text-[#4B5875] mt-1 line-clamp-2 leading-relaxed">
                      {plan.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#0E1D4F]/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#205BD6]">
                      {plan.budget}
                    </span>

                    <Link
                      href={plan.destination ? `/community?province=${encodeURIComponent(plan.destination.split(',').at(-1)?.trim() ?? plan.destination)}` : '/community'}
                      className="px-3 py-1 rounded-lg bg-[#205BD6]/10 hover:bg-[#205BD6] hover:text-white text-[#205BD6] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Xem cùng vùng
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Indicator Dots */}
      {totalPlans > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {Array.from({ length: totalPlans }).map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => {
                setEnableTransition(true);
                setVirtualIndex(totalPlans + dotIdx);
              }}
              className="min-w-6 min-h-6 flex items-center justify-center cursor-pointer"
              aria-label={`Chuyển đến trang ${dotIdx + 1}`}
              aria-current={activeDotIndex === dotIdx ? 'true' : undefined}
            >
              <span className={`h-1.5 rounded-full transition-all ${activeDotIndex === dotIdx ? 'w-6 bg-[#205BD6]' : 'w-1.5 bg-[#0E1D4F]/20'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

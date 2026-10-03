'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { DayItinerary, Activity } from '@/data/mockData';

interface DayAccordionProps {
  days: DayItinerary[];
  expandedDays: number[];
  onToggleDay: (dayNum: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export default function DayAccordion({
  days,
  expandedDays,
  onToggleDay,
  onExpandAll,
  onCollapseAll,
}: DayAccordionProps) {
  return (
    <div className="lg:col-span-8 flex flex-col gap-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="font-headline-sm text-xl text-[#0E1D4F] font-bold">
          Lịch trình chi tiết từng ngày
        </h2>
        <div className="flex items-center gap-1.5 text-xs font-label-md no-print shrink-0">
          <button
            type="button"
            onClick={onExpandAll}
            className="px-2.5 py-1 rounded-lg bg-[#EBF1F0] hover:bg-white text-[#205BD6] font-semibold transition-colors cursor-pointer"
          >
            Mở tất cả
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className="px-2.5 py-1 rounded-lg bg-[#EBF1F0] hover:bg-white text-[#4B5875] hover:text-[#0E1D4F] transition-colors cursor-pointer"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {days.map((day) => {
        const isExpanded = expandedDays.includes(day.dayNumber);
        let activityCount = 0;
        return (
          <section
            key={day.dayNumber}
            className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs overflow-hidden"
          >
            {/* Day Accordion Header */}
            <div
              onClick={() => onToggleDay(day.dayNumber)}
              className="p-5 bg-[#EBF1F0] hover:bg-[#E3ECEB] transition-colors flex items-center justify-between cursor-pointer select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleDay(day.dayNumber);
                }
              }}
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-4">
                <span className="w-9 h-9 rounded-xl bg-[#0E1D4F] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  0{day.dayNumber}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-xs text-[#205BD6] font-bold uppercase">
                      NGÀY 0{day.dayNumber} · {day.dayOfWeek}, {day.date}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
                    <span className="text-xs text-[#4B5875] font-semibold">{day.pace}</span>
                  </div>
                  <h3 className="font-headline-sm text-base sm:text-lg text-[#0E1D4F] font-bold mt-0.5">
                    {day.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-[#4B5875]">
                  {day.highlight}
                </span>
                <Icon
                  name="expand_more"
                  className={`size-5 text-[#0E1D4F] transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* Day Content Body */}
            {isExpanded && (
              <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-200">
                {day.activities.map((item, idx) => {
                  if ('isTransit' in item && item.isTransit) {
                    return (
                      <div
                        key={`t-${idx}`}
                        className="ml-6 py-2 px-4 bg-[#EBF1F0] rounded-xl border-l-3 border-[#205BD6] text-xs text-[#4B5875] flex items-center gap-2"
                      >
                        <Icon name="swap_driving_apps" className="size-4 text-[#205BD6]" />
                        <span>
                          <strong>Gợi ý di chuyển ({item.transit.type} · {item.transit.duration}):</strong> {item.transit.description}
                        </span>
                      </div>
                    );
                  }

                  activityCount += 1;
                  const stepNum = activityCount < 10 ? `0${activityCount}` : `${activityCount}`;
                  const act = item as Activity;
                  return (
                    <div key={act.id} className="flex gap-4 relative">
                      {/* Step number circle - continuous without skipping (F09) */}
                      <div className="flex flex-col items-center">
                        <span className="w-7 h-7 rounded-full bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F] flex items-center justify-center text-xs font-bold">
                          {stepNum}
                        </span>
                        <div className="w-0.5 flex-1 bg-[#0E1D4F]/10 my-1"></div>
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="flex items-baseline justify-between flex-wrap gap-2">
                          <span className="font-label-caps text-xs text-[#205BD6] font-bold uppercase">
                            {act.timeStart} – {act.timeEnd} · {act.category}
                          </span>
                          <span className="text-xs text-[#08B3C6] font-medium flex items-center gap-1">
                            <Icon name="location_on" className="size-[14px]" />
                            <span>{act.location}</span>
                          </span>
                        </div>

                        <h4 className="font-headline-sm text-base text-[#0E1D4F] font-bold mt-1">
                          {act.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#4B5875] mt-1.5 leading-relaxed font-body-sm">
                          {act.description}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {act.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded text-[10px] font-label-caps bg-[#EBF1F0] text-[#0E1D4F]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

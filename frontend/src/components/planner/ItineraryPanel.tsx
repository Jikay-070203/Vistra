'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';
import { DayItinerary, Activity } from '@/data/mockData';
import PlannerRouteMap from './PlannerRouteMap';

interface ItineraryPanelProps {
  activePlan: DemoPlan;
  currentDay: DayItinerary;
  selectedDayNumber: number;
  onSelectDayNumber: (dayNum: number) => void;
  isCollapsedDesktopMap?: boolean;
  mobileTab: 'chat' | 'itinerary';
}

export default function ItineraryPanel({
  activePlan,
  currentDay,
  selectedDayNumber,
  onSelectDayNumber,
  isCollapsedDesktopMap = false,
  mobileTab,
}: ItineraryPanelProps) {
  return (
    <main
      className={`${
        isCollapsedDesktopMap ? 'lg:col-span-7' : 'lg:col-span-4'
      } ${
        mobileTab === 'itinerary' ? 'flex' : 'hidden lg:flex'
      } bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex-col h-[calc(100vh-210px)] min-h-[480px] max-h-[820px] overflow-hidden transition-all`}
    >
      {/* Panel Header & Day Selector Rail */}
      <div className="p-3.5 border-b border-[#0E1D4F]/10 bg-white/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold">
              LỊCH TRÌNH BẢN NHÁP
            </span>
            <span className="text-xs text-[#4B5875]">({activePlan.days.length} ngày)</span>
          </div>
          <span className="text-xs font-semibold text-[#0E1D4F] bg-[#EBF1F0] px-2.5 py-1 rounded-lg border border-[#0E1D4F]/10">
            {currentDay.weather}
          </span>
        </div>

        {/* Day Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {activePlan.days.map((day) => {
            const isSelected = selectedDayNumber === day.dayNumber;
            return (
              <button
                key={day.dayNumber}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectDayNumber(day.dayNumber)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#205BD6] text-white shadow-xs'
                    : 'bg-[#EBF1F0] text-[#0E1D4F] hover:bg-white'
                }`}
              >
                <span>Ngày {day.dayNumber}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${isSelected ? 'bg-white/20' : 'bg-[#0E1D4F]/10'}`}>
                  {day.dayOfWeek}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Overview Banner */}
      <div className="px-4 py-2.5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-sm sm:text-base font-bold text-[#0E1D4F]">
            Ngày {currentDay.dayNumber}: {currentDay.title}
          </h3>
          <p className="text-xs text-[#4B5875] mt-0.5">{currentDay.highlight}</p>
        </div>
        <span className="text-[11px] font-semibold text-[#08B3C6] bg-white px-2.5 py-1 rounded-lg border border-[#08B3C6]/20 shrink-0">
          Nhịp độ: {currentDay.pace}
        </span>
      </div>

      {/* Contextual Weather, Health & Safety Reminders (UX-08) */}
      <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200/60 flex items-center gap-2 text-xs text-amber-900">
        <Icon name="warning" className="size-4 text-amber-600 shrink-0" />
        <div className="flex-1 truncate">
          <strong className="font-semibold">Lưu ý ngày {currentDay.dayNumber}: </strong>
          <span>Độ cao &gt; 1.500m, thời tiết se lạnh sáng sớm. Khuyến nghị mang áo ấm và giày bám đường.</span>
        </div>
      </div>

      {/* Activities Timeline Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Planner Route Map (UX-07) */}
        <PlannerRouteMap day={currentDay} destinationName={activePlan.destination} />

        {currentDay.activities.map((item, idx) => {
          if ('isTransit' in item && item.isTransit) {
            return (
              <div
                key={`trans-${idx}`}
                className="ml-6 py-2 px-3 bg-[#EBF1F0] rounded-xl border border-dashed border-[#0E1D4F]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#4B5875]"
              >
                <div className="flex items-center gap-2">
                  <Icon name="swap_driving_apps" className="size-4 text-[#205BD6] shrink-0" />
                  <span className="font-semibold text-[#0E1D4F]">
                    Gợi ý di chuyển: {item.transit.type} · {item.transit.duration} ({item.transit.distance})
                  </span>
                </div>
                <span className="text-[11px] text-[#4B5875]">{item.transit.description}</span>
              </div>
            );
          }

          const act = item as Activity;
          return (
            <div key={act.id} className="flex items-start gap-3 group">
              {/* Time indicator */}
              <div className="w-16 pt-1 shrink-0 flex flex-col items-end">
                <span className="font-label-md text-xs font-bold text-[#0E1D4F]">
                  {act.timeStart}
                </span>
                <span className="text-[10px] text-[#4B5875]/70 font-label-caps">
                  {act.timeEnd}
                </span>
              </div>

              {/* Activity Card */}
              <div className="flex-1 bg-white rounded-xl p-3.5 border border-[#0E1D4F]/10 shadow-2xs hover:shadow-xs transition-all space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF1F0] text-[#205BD6] font-label-caps">
                    {act.category}
                  </span>
                  <span className="text-[11px] text-[#4B5875] flex items-center gap-1 font-medium">
                    <Icon name="location_on" className="size-3 text-[#08B3C6]" />
                    <span>{act.location}</span>
                  </span>
                </div>

                <h4 className="font-headline-sm text-sm font-bold text-[#0E1D4F]">
                  {act.title}
                </h4>
                <p className="text-xs text-[#4B5875] leading-relaxed">
                  {act.description}
                </p>

                <div className="pt-1 flex flex-wrap gap-1">
                  {act.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px] font-label-caps bg-[#EBF1F0] text-[#4B5875]"
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
    </main>
  );
}

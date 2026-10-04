'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { DayItinerary } from '@/data/mockData';

interface PlannerRouteMapProps {
  day: DayItinerary;
  destinationName: string;
}

export default function PlannerRouteMap({ day, destinationName }: PlannerRouteMapProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStopIdx, setSelectedStopIdx] = useState<number | null>(null);

  // Extract non-transit activities as stops
  const stops = day.activities
    .filter((a): a is Extract<typeof a, { id: string }> => !('isTransit' in a))
    .map((act, index) => ({
      index: index + 1,
      id: act.id,
      title: act.title,
      location: act.location,
      time: `${act.timeStart} – ${act.timeEnd}`,
      category: act.category,
    }));

  if (stops.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-white/60 border border-[#0E1D4F]/10 text-center text-xs text-[#4B5875]">
        Chưa có điểm dừng nào được lập cho ngày này.
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 overflow-hidden shadow-2xs mb-4">
      {/* Map Header */}
      <div className="p-3 border-b border-[#0E1D4F]/10 flex items-center justify-between bg-white/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#205BD6]/10 text-[#205BD6] flex items-center justify-center">
            <Icon name="map" className="size-4" />
          </div>
          <div>
            <h3 className="font-headline-sm text-xs font-bold text-[#0E1D4F]">
              Tóm tắt tuyến điểm dừng ngày {day.dayNumber} · {destinationName}
            </h3>
            <p className="text-[10px] text-[#4B5875]">{stops.length} điểm dừng theo trình tự di chuyển</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-[#205BD6] hover:underline flex items-center gap-1 font-semibold"
        >
          <span>{isExpanded ? 'Thu gọn sơ đồ' : 'Mở sơ đồ'}</span>
          <Icon name={isExpanded ? 'expand_less' : 'expand_more'} className="size-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Visual Route Canvas / Diagram */}
          <div className="relative bg-[#EBF1F0] rounded-xl p-4 border border-[#0E1D4F]/10 overflow-hidden">
            {/* Background subtle topographic grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#205BD6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 overflow-x-auto py-2">
              {stops.map((stop, i) => {
                const isSelected = selectedStopIdx === i;
                const isLast = i === stops.length - 1;

                return (
                  <React.Fragment key={stop.id}>
                    <div
                      onClick={() => setSelectedStopIdx(isSelected ? null : i)}
                      className={`flex-1 min-w-[140px] p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#205BD6] text-white border-[#205BD6] shadow-sm scale-102'
                          : 'bg-white/90 text-[#0E1D4F] border-[#0E1D4F]/10 hover:border-[#205BD6]/40 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-white text-[#205BD6]' : 'bg-[#205BD6] text-white'
                          }`}
                        >
                          {stop.index}
                        </span>
                        <span className={`text-[10px] font-semibold ${isSelected ? 'text-white/90' : 'text-[#205BD6]'}`}>
                          {stop.time}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold truncate" title={stop.title}>
                        {stop.title}
                      </h4>
                      <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-[#4B5875]'}`}>
                        {stop.location}
                      </p>
                    </div>

                    {!isLast && (
                      <div className="flex sm:flex-col items-center justify-center text-[#205BD6] shrink-0 self-center">
                        <Icon name="arrow_forward" className="size-4 hidden sm:block" />
                        <Icon name="arrow_downward" className="size-4 sm:hidden" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Textual Route Summary (Accessibility requirement UX-07) */}
          <div className="bg-white/60 p-2.5 rounded-xl border border-[#0E1D4F]/5 text-[11px] text-[#4B5875]">
            <strong className="text-[#0E1D4F] font-semibold">Tóm tắt lộ trình ngày {day.dayNumber}: </strong>
            <span>
              {stops.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ' → '}
                  <span className="font-medium text-[#0E1D4F]">({s.index}) {s.title}</span>
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

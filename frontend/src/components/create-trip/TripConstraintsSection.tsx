'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { PaceType } from './types';

interface TripConstraintsSectionProps {
  startCity: string;
  onStartCityChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  budgetMin: string;
  onBudgetMinChange: (val: string) => void;
  budgetMax: string;
  onBudgetMaxChange: (val: string) => void;
  adultsCount: number;
  onAdultsCountChange: (val: number) => void;
  elderlyCount: number;
  onElderlyCountChange: (val: number) => void;
  childrenCount: number;
  onChildrenCountChange: (val: number) => void;
  dietaryNote: string;
  onDietaryNoteChange: (val: string) => void;
  mobilityNote: string;
  onMobilityNoteChange: (val: string) => void;
  pace: PaceType;
  onPaceChange: (val: PaceType) => void;
}

export default function TripConstraintsSection({
  startCity,
  onStartCityChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  budgetMin,
  onBudgetMinChange,
  budgetMax,
  onBudgetMaxChange,
  adultsCount,
  onAdultsCountChange,
  elderlyCount,
  onElderlyCountChange,
  childrenCount,
  onChildrenCountChange,
  dietaryNote,
  onDietaryNoteChange,
  mobilityNote,
  onMobilityNoteChange,
  pace,
  onPaceChange,
}: TripConstraintsSectionProps) {
  const paceOptions: { id: PaceType; label: string; desc: string; icon: string }[] = [
    {
      id: 'Thư thái',
      label: 'Thư thái & Nghỉ dưỡng',
      desc: 'Giãn cách các chặng, nhiều thời gian nhâm nhi cà phê & thưởng ngoạn',
      icon: 'spa',
    },
    {
      id: 'Cân bằng',
      label: 'Cân bằng trải nghiệm',
      desc: 'Hòa quyện giữa tham quan danh thắng, ẩm thực và nghỉ ngơi hợp lý',
      icon: 'balance',
    },
    {
      id: 'Khám phá / Năng động',
      label: 'Khám phá & Phiêu lưu',
      desc: 'Tối đa điểm đến, săn mây đèo cao và trekking men theo lối mòn bản địa',
      icon: 'hiking',
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="font-label-caps text-xs text-[#205BD6] font-bold uppercase tracking-wider">
          03 / KHUNG ĐIỀU KIỆN THỰC TẾ (STRUCTURED INPUTS)
        </span>
        <h2 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
          Chi tiết chuyến đi &amp; Ràng buộc an toàn
        </h2>
      </div>

      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-6 shadow-xs flex flex-col gap-6">
        {/* Core Constraints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Origin */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="origin-city" className="font-label-caps text-xs text-[#0E1D4F] uppercase font-bold">
              ĐIỂM XUẤT PHÁT (ORIGIN)
            </label>
            <div className="flex items-center gap-2 bg-[#EBF1F0] px-3.5 py-2.5 rounded-xl border border-[#0E1D4F]/10">
              <Icon name="location_on" className="size-4 text-[#205BD6]" />
              <input
                id="origin-city"
                type="text"
                value={startCity}
                onChange={(e) => onStartCityChange(e.target.value)}
                placeholder="VD: Hà Nội, TP.HCM..."
                className="bg-transparent text-xs sm:text-sm text-[#0E1D4F] font-semibold w-full focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Structured Departure & Return Date Range */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="font-label-caps text-xs text-[#0E1D4F] uppercase font-bold">
              KHOẢNG THỜI GIAN (NGÀY ĐI → NGÀY VỀ)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-[#EBF1F0] px-3 py-2 rounded-xl border border-[#0E1D4F]/10">
                <Icon name="event" className="size-4 text-[#205BD6] shrink-0" />
                <div className="flex flex-col flex-1">
                  <label htmlFor="start-date" className="text-[10px] text-[#4B5875] font-semibold">Khởi hành</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm text-[#0E1D4F] font-semibold w-full focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#EBF1F0] px-3 py-2 rounded-xl border border-[#0E1D4F]/10">
                <Icon name="event_repeat" className="size-4 text-[#08B3C6] shrink-0" />
                <div className="flex flex-col flex-1">
                  <label htmlFor="end-date" className="text-[10px] text-[#4B5875] font-semibold">Trở về</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm text-[#0E1D4F] font-semibold w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Structured Budget Range (Min - Max) */}
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <span className="font-label-caps text-xs text-[#0E1D4F] uppercase font-bold">
              NGÂN SÁCH DỰ KIẾN (TỐI THIỂU — TỐI ĐA / VNĐ)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-[#EBF1F0] px-3 py-2 rounded-xl border border-[#0E1D4F]/10">
                <Icon name="payments" className="size-4 text-[#205BD6] shrink-0" />
                <div className="flex flex-col flex-1">
                  <label htmlFor="budget-min" className="text-[10px] text-[#4B5875] font-semibold">Tối thiểu</label>
                  <input
                    id="budget-min"
                    type="text"
                    value={budgetMin}
                    onChange={(e) => onBudgetMinChange(e.target.value)}
                    placeholder="10.000.000"
                    className="bg-transparent text-xs sm:text-sm text-[#0E1D4F] font-semibold w-full focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#EBF1F0] px-3 py-2 rounded-xl border border-[#0E1D4F]/10">
                <Icon name="savings" className="size-4 text-emerald-600 shrink-0" />
                <div className="flex flex-col flex-1">
                  <label htmlFor="budget-max" className="text-[10px] text-[#4B5875] font-semibold">Tối đa</label>
                  <input
                    id="budget-max"
                    type="text"
                    value={budgetMax}
                    onChange={(e) => onBudgetMaxChange(e.target.value)}
                    placeholder="15.000.000"
                    className="bg-transparent text-xs sm:text-sm text-[#0E1D4F] font-semibold w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Separate Traveler Counters (Adults, Elderly, Children) */}
          <div className="flex flex-col gap-1.5 lg:col-span-3">
            <span className="font-label-caps text-xs text-[#0E1D4F] uppercase font-bold">
              THÀNH VIÊN ĐOÀN DU LỊCH (PHÂN TÁCH ĐỘ TUỔI &amp; THỂ LỰC)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Adults */}
              <div className="bg-[#EBF1F0] p-3 rounded-xl border border-[#0E1D4F]/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0E1D4F] block">Người lớn</span>
                  <span className="text-[10px] text-[#4B5875]">12 tuổi trở lên</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAdultsCountChange(Math.max(1, adultsCount - 1))}
                    className="w-7 h-7 rounded-lg bg-white text-[#0E1D4F] font-bold flex items-center justify-center hover:bg-[#205BD6] hover:text-white transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{adultsCount}</span>
                  <button
                    type="button"
                    onClick={() => onAdultsCountChange(adultsCount + 1)}
                    className="w-7 h-7 rounded-lg bg-white text-[#0E1D4F] font-bold flex items-center justify-center hover:bg-[#205BD6] hover:text-white transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Elderly */}
              <div className="bg-[#EBF1F0] p-3 rounded-xl border border-[#0E1D4F]/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0E1D4F] block">Người cao tuổi</span>
                  <span className="text-[10px] text-[#4B5875]">Trên 60 tuổi</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onElderlyCountChange(Math.max(0, elderlyCount - 1))}
                    className="w-7 h-7 rounded-lg bg-white text-[#0E1D4F] font-bold flex items-center justify-center hover:bg-[#205BD6] hover:text-white transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{elderlyCount}</span>
                  <button
                    type="button"
                    onClick={() => onElderlyCountChange(elderlyCount + 1)}
                    className="w-7 h-7 rounded-lg bg-white text-[#0E1D4F] font-bold flex items-center justify-center hover:bg-[#205BD6] hover:text-white transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="bg-[#EBF1F0] p-3 rounded-xl border border-[#0E1D4F]/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0E1D4F] block">Trẻ em</span>
                  <span className="text-[10px] text-[#4B5875]">Dưới 12 tuổi</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChildrenCountChange(Math.max(0, childrenCount - 1))}
                    className="w-7 h-7 rounded-lg bg-white text-[#0E1D4F] font-bold flex items-center justify-center hover:bg-[#205BD6] hover:text-white transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{childrenCount}</span>
                  <button
                    type="button"
                    onClick={() => onChildrenCountChange(childrenCount + 1)}
                    className="w-7 h-7 rounded-lg bg-white text-[#0E1D4F] font-bold flex items-center justify-center hover:bg-[#205BD6] hover:text-white transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Health, Dietary & Mobility Reminders */}
          <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
            <span className="font-label-caps text-xs text-[#0E1D4F] uppercase font-bold">
              LƯU Ý DỊ ỨNG ẨM THỰC &amp; THỂ LỰC DI CHUYỂN
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-[#EBF1F0] px-3.5 py-2.5 rounded-xl border border-[#0E1D4F]/10">
                <Icon name="restaurant" className="size-4 text-[#205BD6] shrink-0" />
                <input
                  type="text"
                  value={dietaryNote}
                  onChange={(e) => onDietaryNoteChange(e.target.value)}
                  placeholder="Ghi chú ẩm thực / dị ứng (VD: ăn chay, không cay, không hải sản...)"
                  className="bg-transparent text-xs sm:text-sm text-[#0E1D4F] font-semibold w-full focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-[#EBF1F0] px-3.5 py-2.5 rounded-xl border border-[#0E1D4F]/10">
                <Icon name="accessibility_new" className="size-4 text-[#08B3C6] shrink-0" />
                <input
                  type="text"
                  value={mobilityNote}
                  onChange={(e) => onMobilityNoteChange(e.target.value)}
                  placeholder="Ghi chú thể lực (VD: hạn chế leo dốc gắt, xe đón tận nơi...)"
                  className="bg-transparent text-xs sm:text-sm text-[#0E1D4F] font-semibold w-full focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 6. Travel Style / Pace Selection */}
        <div className="flex flex-col gap-2 pt-4 border-t border-[#0E1D4F]/10">
          <label className="font-label-caps text-xs text-[#0E1D4F] uppercase font-bold">
            PHONG CÁCH DI CHUYỂN &amp; NHỊP ĐỘ (TRAVEL PACE)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {paceOptions.map((opt) => {
              const active = pace === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onPaceChange(opt.id)}
                  className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    active
                      ? 'bg-[#205BD6] text-white border-[#205BD6] shadow-sm'
                      : 'bg-[#EBF1F0] text-[#0E1D4F] border-[#0E1D4F]/10 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm">{opt.label}</span>
                    <Icon name={opt.icon} className={`size-4 ${active ? 'text-white' : 'text-[#205BD6]'}`} />
                  </div>
                  <p className={`text-[11px] leading-relaxed ${active ? 'text-white/90' : 'text-[#4B5875]'}`}>
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

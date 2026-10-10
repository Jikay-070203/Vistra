'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import styles from '../landing.module.css';
import { type LandingTripState } from '../landingDemo';
import VistraMap from '@/components/shared/VistraMap';
import { appConfig } from '@/config/appConfig';

export interface ConfirmSectionProps {
  tripState?: LandingTripState;
  onConfirmPlan?: () => void;
  [key: string]: unknown; // Accept optional legacy props
}

interface PlanOption {
  id: 'A' | 'B';
  name: string;
  badge: string;
  vibe: string;
  schedule: Array<{ time: string; title: string; desc: string; type: string }>;
  tradeoffGains: string[];
  tradeoffSacrifices: string[];
  cautions: string[];
}

const PLAN_OPTIONS: Record<'A' | 'B', PlanOption> = {
  A: {
    id: 'A',
    name: 'Phương án A: Đồi xa & hoàng hôn',
    badge: 'Trải rộng · Đèo dốc',
    vibe: 'Đón chiều tà rực rỡ từ đỉnh đồi ngoại ô, nhịp độ năng động',
    schedule: [
      {
        time: '08:30',
        title: 'Vườn ven hồ',
        desc: 'Mặt nước sương sớm phẳng lặng, tản bộ thông reo.',
        type: 'scenic',
      },
      {
        time: '11:30',
        title: 'Quán trà & cà phê góc phố',
        desc: 'Hiên gỗ râm mát, trà nóng địa phương nghỉ trưa.',
        type: 'dining',
      },
      {
        time: '15:30',
        title: 'Điểm ngắm hoàng hôn đồi xa',
        desc: 'Vọng cảnh đón chiều tà trên đỉnh dốc, cách trung tâm 15km.',
        type: 'scenic',
      },
    ],
    tradeoffGains: [
      'Ngắm hoàng hôn toàn cảnh ngoạn mục từ đỉnh đồi ngoại ô.',
      'Trải nghiệm cung đèo uốn lượn giữa rừng thông.',
    ],
    tradeoffSacrifices: [
      'Quãng đường 15km đèo dốc, thêm ~40 phút di chuyển.',
      'Cần rời đỉnh đồi trước khi sương mù dày sau 17:30.',
    ],
    cautions: [
      'Đường dốc quanh co; sương mù thường xuống dày chiều muộn.',
      'Nên chuẩn bị áo ấm vì đỉnh đồi hạ nhiệt nhanh.',
    ],
  },
  B: {
    id: 'B',
    name: 'Phương án B: Thư thả ven hồ',
    badge: 'Khuyên dùng · Êm ả',
    vibe: 'Gom gọn nội vùng quanh hồ, nhịp độ thong thả và ấm cúng',
    schedule: [
      {
        time: '08:30',
        title: 'Vườn ven hồ',
        desc: 'Mặt nước sương sớm phẳng lặng, tản bộ thông reo.',
        type: 'scenic',
      },
      {
        time: '11:30',
        title: 'Quán trà & cà phê góc phố',
        desc: 'Hiên gỗ râm mát, trà nóng địa phương.',
        type: 'dining',
      },
      {
        time: '15:00',
        title: 'Nhà gỗ bên sườn đồi',
        desc: 'Thưởng trà chiều hiên gỗ ven hồ, ngắm thông reo.',
        type: 'stay',
      },
    ],
    tradeoffGains: [
      'Tiết kiệm gần 2 giờ di chuyển trên đường đèo dốc.',
      'Trọn buổi chiều thư thả, nhịp độ êm ái ven hồ.',
    ],
    tradeoffSacrifices: [
      'Bỏ qua điểm ngắm hoàng hôn trên đỉnh đồi xa.',
    ],
    cautions: [
      'Nên đặt trước vị trí hiên nhà gỗ ven hồ buổi chiều.',
      'Sáng sớm ven hồ khá lạnh, chuẩn bị khăn choàng mỏng.',
    ],
  },
};

export default function ConfirmSection(props: ConfirmSectionProps) {
  void props;
  const optionCycleMs = appConfig.confirm?.optionCycleMs || 10000;
  const [selectedOptionId, setSelectedOptionId] = useState<'A' | 'B'>('B');

  // Auto-loop: alternates between Option B and Option A
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedOptionId((prev) => (prev === 'B' ? 'A' : 'B'));
    }, optionCycleMs);

    return () => clearInterval(interval);
  }, [optionCycleMs]);

  const currentOption = PLAN_OPTIONS[selectedOptionId];

  return (
    <section
      id="xac-nhan"
      className={`${styles.section} ${styles.confirmSection} ${styles.sectionSpacing}`}
      aria-label="Xác nhận phương án hành trình"
    >
      <div className={styles.container}>
        {/* Section Header */}
        <div className="mb-5 text-center max-w-4xl mx-auto">
          <h2 className="font-headline-lg text-lg sm:text-2xl md:text-3xl text-[#0E1D4F] font-bold leading-normal tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title="Cân nhắc đánh đổi, chốt chuyến đi.">
            Cân nhắc đánh đổi, chốt chuyến đi.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#4B5875]">
            Mỗi phương án mang một nhịp điệu riêng. Đối chiếu lợi thế và đánh đổi để quyết định phương án phù hợp.
          </p>
        </div>


        {/* Dynamic Option Selection Cards */}
        <div className="mb-5 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(['B', 'A'] as const).map((optId) => {
              const opt = PLAN_OPTIONS[optId];
              const isSelected = selectedOptionId === optId;

              return (
                <div
                  key={optId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedOptionId(optId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedOptionId(optId);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left backdrop-blur-md ${isSelected
                    ? 'bg-white/95 shadow-md border-[#205BD6] ring-2 ring-[#205BD6]/20'
                    : 'bg-white/60 hover:bg-white/80 border-[#0E1D4F]/10'
                    }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${optId === 'B'
                        ? 'bg-[#08B3C6]/15 text-[#088D9C]'
                        : 'bg-[#E7AD2E]/20 text-[#9E6E00]'
                        }`}
                    >
                      {opt.badge}
                    </span>
                    <div
                      className={`size-4 rounded-full border flex items-center justify-center ${isSelected
                        ? 'border-[#205BD6] bg-[#205BD6] text-white'
                        : 'border-[#CBD5E1]'
                        }`}
                    >
                      {isSelected && <Icon name="check" className="size-3" />}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#0E1D4F] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title={opt.name}>
                    {opt.name}
                  </h3>
                  <p className="text-[11px] text-[#4B5875] leading-relaxed">
                    {opt.vibe}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Option Details and Map Grid (LP-11: Compact, non-repetitive layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Column (7 cols): Trade-offs, Schedule, Cautions */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            {/* Trade-off Matrix */}
            <div className="p-3.5 bg-white/85 backdrop-blur-md rounded-2xl border border-[#08B3C6]/30 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-[#08B3C6]/15">
                <Icon name="balance" className="size-4 text-[#08B3C6]" />
                <span className="text-xs font-bold text-[#0E1D4F] uppercase tracking-wider">
                  Cân bằng đánh đổi ({currentOption.id === 'A' ? 'Phương án A' : 'Phương án B'})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Gains */}
                <div className="p-2.5 bg-[#E8F8F5]/80 rounded-xl border border-[#08B3C6]/20">
                  <div className="text-[11px] font-bold text-[#088D9C] uppercase mb-1 flex items-center gap-1">
                    <Icon name="thumb_up" className="size-3" />
                    <span>Lợi thế nhận được</span>
                  </div>
                  <ul className="text-xs text-[#20312B] space-y-1 list-disc list-inside">
                    {currentOption.tradeoffGains.map((g, i) => (
                      <li key={i} className="leading-snug">{g}</li>
                    ))}
                  </ul>
                </div>

                {/* Sacrifices */}
                <div className="p-2.5 bg-[#FFF5F2]/80 rounded-xl border border-[#E7AD2E]/25">
                  <div className="text-[11px] font-bold text-[#D9534F] uppercase mb-1 flex items-center gap-1">
                    <Icon name="swap_horiz" className="size-3" />
                    <span>Đánh đổi chấp nhận</span>
                  </div>
                  <ul className="text-xs text-[#20312B] space-y-1 list-disc list-inside">
                    {currentOption.tradeoffSacrifices.map((s, i) => (
                      <li key={i} className="leading-snug">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Schedule & Cautions Compact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Timeline */}
              <div className="p-3.5 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#0E1D4F]/8">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E1D4F] flex items-center gap-1">
                    <Icon name="schedule" className="size-3.5 text-[#205BD6]" />
                    <span>Lịch trình ngày 1</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#088D9C]">3 chặng</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {currentOption.schedule.map((slot, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-1.5 rounded-lg bg-[#F8FAFC] border border-[#0E1D4F]/5 text-xs">
                      <span className="px-1.5 py-0.5 bg-white border border-[#0E1D4F]/10 text-[#0E1D4F] font-mono text-[10px] font-bold rounded shrink-0">
                        {slot.time}
                      </span>
                      <div>
                        <h5 className="font-bold text-[#0E1D4F] text-[11px]">{slot.title}</h5>
                        <p className="text-[10px] text-[#4B5875] leading-tight line-clamp-1">{slot.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cautions */}
              <div className="p-3.5 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex flex-col gap-2">
                <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#0E1D4F]/8 text-xs font-bold uppercase tracking-wider text-[#D99A4E]">
                  <Icon name="fact_check" className="size-3.5" />
                  <span>Lưu ý thực tế</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {currentOption.cautions.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#FFF9EB] border border-[#E7AD2E]/20 text-xs text-[#4B5875]">
                      <Icon name="info" className="size-3 text-[#E7AD2E] shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-snug">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Route Map */}
          <div className="lg:col-span-5 flex flex-col bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs overflow-hidden min-h-[380px]">
            <div className="p-3 bg-white/95 border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon name="map" className="size-3.5 text-[#205BD6]" />
                <h4 className="text-xs font-bold text-[#0E1D4F]">
                  Bản đồ lộ trình — {selectedOptionId === 'A' ? 'Phương án A' : 'Phương án B'}
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-[#205BD6] bg-[#205BD6]/10 px-2 py-0.5 rounded-full">
                Tự động đổi (7.5s)
              </span>
            </div>

            <div className="flex-1 w-full relative min-h-[300px]">
              <VistraMap
                markers={
                  selectedOptionId === 'A'
                    ? [
                      { id: 'ca1', title: 'Vườn ven hồ', lat: 11.9034, lng: 108.435, category: 'Cảnh quan', order: 1 },
                      { id: 'ca2', title: 'Quán trà & cà phê góc phố', lat: 11.9404, lng: 108.438, category: 'Ẩm thực', order: 2 },
                      { id: 'ca3', title: 'Hoàng hôn đồi xa (+15km)', lat: 11.985, lng: 108.48, category: 'Cảnh quan', order: 3 },
                    ]
                    : [
                      { id: 'cb1', title: 'Vườn ven hồ', lat: 11.9034, lng: 108.435, category: 'Cảnh quan', order: 1 },
                      { id: 'cb2', title: 'Quán trà & cà phê góc phố', lat: 11.9404, lng: 108.438, category: 'Ẩm thực', order: 2 },
                      { id: 'cb3', title: 'Nhà gỗ bên sườn đồi', lat: 11.915, lng: 108.442, category: 'Nghỉ dưỡng', order: 3 },
                    ]
                }
                route={
                  selectedOptionId === 'A'
                    ? [[108.435, 11.9034], [108.438, 11.9404], [108.48, 11.985]]
                    : [[108.435, 11.9034], [108.438, 11.9404], [108.442, 11.915]]
                }
                center={{ lat: 11.93, lng: 108.445 }}
                zoom={12}
                interactive={true}
                className="w-full h-full"
              />
            </div>

            <div className="p-2.5 bg-white/95 border-t border-[#0E1D4F]/10 flex items-center justify-between text-[11px] text-[#4B5875]">
              <span className="flex items-center gap-1 font-medium text-[#0E1D4F]">
                <Icon name="shield" className="size-3 text-[#205BD6]" />
                <span>Tọa độ thực tế kiểm chứng</span>
              </span>
              <span className="text-[#08B3C6] font-semibold text-[10px]">Đúng quy chuẩn an toàn</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

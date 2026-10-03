'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import styles from '../landing.module.css';
import LandingEditorialMotif from '../LandingEditorialMotif';
import { type LandingTripState } from '../landingDemo';

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
  highlights: string[];
  schedule: Array<{ time: string; title: string; desc: string; type: string }>;
  tradeoffGains: string[];
  tradeoffSacrifices: string[];
  cautions: string[];
}

const PLAN_OPTIONS: Record<'A' | 'B', PlanOption> = {
  A: {
    id: 'A',
    name: 'Phương án A: Trải rộng đồi xa & hoàng hôn',
    badge: 'Trải rộng · Đèo dốc',
    vibe: 'Đón chiều tà rực rỡ từ đỉnh đồi ngoại ô, nhịp độ năng động',
    highlights: [
      'Ngắm hoàng hôn từ điểm cao nhất ngoại ô thành phố',
      'Thưởng thức trọn vẹn cảnh rừng thông bạt ngàn chiều tà',
      'Phù hợp người thích khám phá nhiều không gian trong ngày',
    ],
    schedule: [
      {
        time: '08:30',
        title: 'Vườn ven hồ',
        desc: 'Mặt nước sương sớm phẳng lặng, tản bộ trong không gian thông reo.',
        type: 'scenic',
      },
      {
        time: '11:30',
        title: 'Quán trà & cà phê góc phố',
        desc: 'Hiên gỗ râm mát, trà nóng địa phương và nghỉ ngơi trưa.',
        type: 'dining',
      },
      {
        time: '15:30',
        title: 'Điểm ngắm hoàng hôn đồi xa',
        desc: 'Vọng cảnh đón chiều tà trên đỉnh dốc, cách xa trung tâm 15km.',
        type: 'scenic',
      },
    ],
    tradeoffGains: [
      'Ngắm hoàng hôn toàn cảnh ngoạn mục nhất từ đỉnh đồi ngoại ô.',
      'Trải nghiệm cung đường đèo uốn lượn giữa rừng thông.',
    ],
    tradeoffSacrifices: [
      'Quãng đường 15km đèo dốc, thêm ~40 phút di chuyển.',
      'Buổi chiều gấp gáp; cần rời đỉnh đồi trước khi tắt nắng.',
    ],
    cautions: [
      'Đường đồi dốc quanh co; sương mù thường xuống dày sau 17:30.',
      'Nên chuẩn bị áo ấm dày vì nhiệt độ đỉnh đồi hạ nhanh khi tắt nắng.',
    ],
  },
  B: {
    id: 'B',
    name: 'Phương án B: Thư thả ven hồ & rừng thông',
    badge: 'Khuyên dùng · Êm ả',
    vibe: 'Gom gọn nội vùng quanh hồ, nhịp độ thong thả và ấm cúng',
    highlights: [
      'Không gian lưu trú tĩnh mịch giữa rừng thông ven hồ',
      'Tiết kiệm thời gian di chuyển, dành trọn buổi chiều thư giãn',
      'Đường đi bằng phẳng, thuận tiện cho cả nhóm bạn và gia đình',
    ],
    schedule: [
      {
        time: '08:30',
        title: 'Vườn ven hồ',
        desc: 'Mặt nước sương sớm phẳng lặng, tản bộ trong không gian thông reo.',
        type: 'scenic',
      },
      {
        time: '11:30',
        title: 'Quán trà & cà phê góc phố',
        desc: 'Hiên gỗ râm mát, trà nóng địa phương và bánh mộc mạc.',
        type: 'dining',
      },
      {
        time: '15:00',
        title: 'Nhà gỗ bên sườn đồi',
        desc: 'Thưởng trà chiều hiên gỗ ven hồ, ngắm thông reo trong sương.',
        type: 'stay',
      },
    ],
    tradeoffGains: [
      'Tiết kiệm gần 2 giờ di chuyển trên đường đèo dốc.',
      'Trọn buổi chiều thư thả, nhịp độ êm ái ven hồ.',
      'Tuyến nội vùng bằng phẳng, thuận tiện và an toàn.',
    ],
    tradeoffSacrifices: [
      'Không ghé điểm ngắm hoàng hôn trên đỉnh đồi xa.',
    ],
    cautions: [
      'Nhà gỗ ven hồ nên đặt trước buổi chiều để giữ vị trí hiên đẹp.',
      'Nhiệt độ ven hồ sáng sớm mát lạnh, nên mang khăn choàng nhẹ.',
    ],
  },
};

import { appConfig } from '@/config/appConfig';

export default function ConfirmSection(props: ConfirmSectionProps) {
  void props;
  const optionCycleMs = appConfig.confirm.optionCycleMs || 7500;
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
        {/* Section Header: Metaphor & Narrative */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <LandingEditorialMotif variant="sunrise" className={styles.sectionMotif} width={96} height={58} />
          </div>

          <h2 className={styles.h2}>
            Cân nhắc đánh đổi, chốt chuyến đi của riêng bạn.
          </h2>
          <p className={styles.exploreIntroText}>
            Mỗi phương án mang một nhịp điệu riêng. Chọn lộ trình phù hợp nhất trước khi khởi hành.
          </p>
        </div>

        {/* Dynamic Option Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left backdrop-blur-md ${
                    isSelected
                      ? 'bg-white/85 shadow-lg border-[#205BD6] ring-2 ring-[#205BD6]/20'
                      : 'bg-white/55 hover:bg-white/75 border-[#0E1D4F]/10'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        optId === 'B'
                          ? 'bg-[#08B3C6]/15 text-[#088D9C]'
                          : 'bg-[#E7AD2E]/20 text-[#9E6E00]'
                      }`}
                    >
                      {opt.badge}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#205BD6] bg-[#205BD6] text-white'
                            : 'border-[#CBD5E1]'
                        }`}
                      >
                        {isSelected && <Icon name="check" className="size-3" />}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#0E1D4F] mb-1">
                    {opt.name}
                  </h3>
                  <p className="text-xs text-[#556976] leading-relaxed mb-3">
                    {opt.vibe}
                  </p>

                  <div className="flex flex-col gap-1.5 border-t border-[#0E1D4F]/8 pt-2.5 text-xs text-[#4B5875]">
                    {opt.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Icon name="check_circle" className="size-3.5 text-[#08B3C6] shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revealed Content Synchronized With Current Option */}
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* Option Synchronized Banner */}
          <div className="p-4 bg-[#E8F8F5]/75 backdrop-blur-md border border-[#08B3C6]/30 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-[#08B3C6] text-white flex items-center justify-center shrink-0">
                <Icon name="verified" className="size-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-[15px] font-bold text-[#0E1D4F]">
                  Phương án đang chọn: {currentOption.name}
                </h4>
                <p className="text-xs sm:text-[13px] text-[#4B5875]">
                  Lịch trình chi tiết, sự đánh đổi và lưu ý thực tế tương ứng.
                </p>
              </div>
            </div>
          </div>

          {/* Two-Column Grid: Left Schedule & Reminders, Right Grounded Trade-off Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (6 cols): Schedule Timeline & Pre-trip Reminders */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {/* Detailed Timeline */}
              <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#0E1D4F]/8">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E1D4F] flex items-center gap-1.5">
                    <Icon name="schedule" className="size-4 text-[#205BD6]" />
                    <span>Lịch trình chi tiết ngày 1</span>
                  </span>
                  <span className="text-xs font-semibold text-[#088D9C]">
                    3 chặng tuần tự
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {currentOption.schedule.map((slot, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F8FAFC]/90 border border-[#0E1D4F]/5">
                      <span className="px-2 py-1 bg-white border border-[#0E1D4F]/10 text-[#0E1D4F] font-mono text-xs font-bold rounded-md shrink-0">
                        {slot.time}
                      </span>
                      <div>
                        <h5 className="text-[15px] font-bold text-[#0E1D4F]">{slot.title}</h5>
                        <p className="text-[13px] text-[#4B5875] mt-0.5 leading-relaxed">{slot.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounded Reminders & Checklist */}
              <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D99A4E]">
                  <Icon name="fact_check" className="size-4" />
                  <span>Lưu ý &amp; Nhắc nhở cần kiểm tra thực tế</span>
                </div>
                <div className="flex flex-col gap-2 text-sm text-[#4B5875]">
                  {currentOption.cautions.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#FFF9EB]/90 border border-[#E7AD2E]/20">
                      <Icon name="info" className="size-3.5 text-[#E7AD2E] shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (6 cols): Grounded Trade-off Summary (Readable & discoverable at 1920x1080) */}
            <div
              id="tradeoff-summary-panel"
              className="lg:col-span-6 p-4 bg-white/85 backdrop-blur-md rounded-2xl border border-[#08B3C6]/30 shadow-xs flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#08B3C6]/20">
                  <div className="flex items-center gap-2">
                    <Icon name="balance" className="size-4 text-[#08B3C6]" />
                    <span className="text-[15px] font-bold text-[#0E1D4F]">
                      Cân bằng đánh đổi &amp; Nhịp độ
                    </span>
                  </div>
                </div>

                {/* Gains Section */}
                <div className="p-3 bg-[#E8F8F5]/80 rounded-xl border border-[#08B3C6]/25">
                  <div className="text-xs font-bold text-[#088D9C] uppercase mb-1.5 flex items-center gap-1.5">
                    <Icon name="thumb_up" className="size-3.5" />
                    <span>Lợi thế bạn nhận được:</span>
                  </div>
                  <ul className="text-sm text-[#20312B] space-y-1.5 list-disc list-inside">
                    {currentOption.tradeoffGains.map((g, i) => (
                      <li key={i} className="leading-relaxed">{g}</li>
                    ))}
                  </ul>
                </div>

                {/* Sacrifices / Accepted Trade-offs Section */}
                <div className="p-3 bg-[#FFF5F2]/80 rounded-xl border border-[#E7AD2E]/30">
                  <div className="text-xs font-bold text-[#D9534F] uppercase mb-1.5 flex items-center gap-1.5">
                    <Icon name="swap_horiz" className="size-3.5" />
                    <span>Đánh đổi bạn chấp nhận:</span>
                  </div>
                  <ul className="text-sm text-[#20312B] space-y-1.5 list-disc list-inside">
                    {currentOption.tradeoffSacrifices.map((s, i) => (
                      <li key={i} className="leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Safety & Grounded Note */}
                <div className="p-3 bg-[#F8FAFC]/80 rounded-xl border border-[#0E1D4F]/10 text-xs text-[#556976] flex items-center gap-2">
                  <Icon name="shield" className="size-4 text-[#205BD6] shrink-0" />
                  <span>
                    Thông tin đánh đổi dựa trên tọa độ địa lý thực tế và nhịp độ di chuyển tối ưu giữa các điểm dừng chân.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}

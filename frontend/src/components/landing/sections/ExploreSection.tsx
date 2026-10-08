'use client';

import React, { useState, useEffect } from 'react';
import VistraMap, { MapMarker } from '@/components/shared/VistraMap';

export interface ExploreSectionProps {
  onJumpToCoCreate?: () => void;
}

// State 1: 20 random inspiration spots across Vietnam
const STATE_1_MARKERS: MapMarker[] = [
  { id: 's1-1', name: 'Hà Nội', lng: 105.85, lat: 21.03, kind: 'culture' },
  { id: 's1-2', name: 'Ninh Bình', lng: 105.97, lat: 20.25, kind: 'scenic' },
  { id: 's1-3', name: 'Sa Pa', lng: 103.84, lat: 22.33, kind: 'scenic' },
  { id: 's1-4', name: 'Hà Giang', lng: 104.98, lat: 22.82, kind: 'scenic' },
  { id: 's1-5', name: 'Hạ Long', lng: 107.07, lat: 20.95, kind: 'scenic' },
  { id: 's1-6', name: 'Đồng Hới', lng: 106.62, lat: 17.47, kind: 'culture' },
  { id: 's1-7', name: 'Phong Nha', lng: 106.28, lat: 17.58, kind: 'scenic' },
  { id: 's1-8', name: 'Huế', lng: 107.59, lat: 16.46, kind: 'culture' },
  { id: 's1-9', name: 'Đà Nẵng', lng: 108.22, lat: 16.07, kind: 'scenic' },
  { id: 's1-10', name: 'Hội An', lng: 108.33, lat: 15.88, kind: 'culture' },
  { id: 's1-11', name: 'Quy Nhơn', lng: 109.22, lat: 13.78, kind: 'scenic' },
  { id: 's1-12', name: 'Phú Yên', lng: 109.3, lat: 13.08, kind: 'scenic' },
  { id: 's1-13', name: 'Nha Trang', lng: 109.19, lat: 12.24, kind: 'scenic' },
  { id: 's1-14', name: 'Đà Lạt', lng: 108.44, lat: 11.94, kind: 'scenic' },
  { id: 's1-15', name: 'Phan Thiết', lng: 108.1, lat: 10.93, kind: 'scenic' },
  { id: 's1-16', name: 'TP. Hồ Chí Minh', lng: 106.66, lat: 10.76, kind: 'culture' },
  { id: 's1-17', name: 'Vũng Tàu', lng: 107.08, lat: 10.35, kind: 'scenic' },
  { id: 's1-18', name: 'Cần Thơ', lng: 105.78, lat: 10.04, kind: 'culture' },
  { id: 's1-19', name: 'Phú Quốc', lng: 103.96, lat: 10.22, kind: 'scenic' },
  { id: 's1-20', name: 'Côn Đảo', lng: 106.6, lat: 8.68, kind: 'scenic' },
];

// State 2: 8 refined spots within Quang Binh province
const STATE_2_MARKERS: MapMarker[] = [
  { id: 's2-1', name: 'Động Phong Nha', lng: 106.28, lat: 17.58, kind: 'scenic' },
  { id: 's2-2', name: 'Động Thiên Đường', lng: 106.22, lat: 17.52, kind: 'scenic' },
  { id: 's2-3', name: 'Suối Nước Moọc', lng: 106.24, lat: 17.54, kind: 'scenic' },
  { id: 's2-4', name: 'Sông Chày Hang Tối', lng: 106.26, lat: 17.56, kind: 'scenic' },
  { id: 's2-5', name: 'Thung lũng Hava', lng: 106.27, lat: 17.55, kind: 'scenic' },
  { id: 's2-6', name: 'Bãi đá Nhảy', lng: 106.5, lat: 17.71, kind: 'scenic' },
  { id: 's2-7', name: 'Đồi cát Quang Phú', lng: 106.63, lat: 17.51, kind: 'scenic' },
  { id: 's2-8', name: 'Tượng đài Mẹ Suốt', lng: 106.62, lat: 17.47, kind: 'culture' },
];

// State 3: 5 connected route spots in Quang Binh
const STATE_3_MARKERS: MapMarker[] = [
  { id: 's3-1', name: 'Tượng đài Mẹ Suốt', lng: 106.62, lat: 17.47, order: 1, kind: 'culture' },
  { id: 's3-2', name: 'Đồi cát Quang Phú', lng: 106.63, lat: 17.51, order: 2, kind: 'scenic' },
  { id: 's3-3', name: 'Bãi đá Nhảy', lng: 106.5, lat: 17.71, order: 3, kind: 'scenic' },
  { id: 's3-4', name: 'Động Phong Nha', lng: 106.28, lat: 17.58, order: 4, kind: 'scenic' },
  { id: 's3-5', name: 'Động Thiên Đường', lng: 106.22, lat: 17.52, order: 5, kind: 'scenic' },
];

const STATE_3_ROUTE: [number, number][] = [
  [106.62, 17.47],
  [106.63, 17.51],
  [106.5, 17.71],
  [106.28, 17.58],
  [106.22, 17.52],
];

interface StepInfo {
  id: 1 | 2 | 3;
  stepNum: string;
  badge: string;
  title: string;
  copy: string;
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  route: [number, number][];
}

const STEPS: StepInfo[] = [
  {
    id: 1,
    stepNum: '01',
    badge: 'Bước 1: Thu thập ý tưởng',
    title: 'Ý tưởng ban đầu',
    copy: 'Gom các điểm đến tiềm năng từ nguồn cảm hứng của bạn.',
    center: [106.5, 16.2],
    zoom: 5,
    markers: STATE_1_MARKERS,
    route: [],
  },
  {
    id: 2,
    stepNum: '02',
    badge: 'Bước 2: Lọc theo vùng',
    title: 'Hội tụ về một vùng',
    copy: 'Thu hẹp khoảng cách và giữ các điểm đến thuận tiện nhất.',
    center: [106.4, 17.58],
    zoom: 9,
    markers: STATE_2_MARKERS,
    route: [],
  },
  {
    id: 3,
    stepNum: '03',
    badge: 'Bước 3: Tuyến đường hoàn chỉnh',
    title: 'Lộ trình thông suốt',
    copy: 'Kết nối các chặng dừng thành lịch trình thông suốt từng ngày.',
    center: [106.4, 17.58],
    zoom: 9,
    markers: STATE_3_MARKERS,
    route: STATE_3_ROUTE,
  },
];

export default function ExploreSection({}: ExploreSectionProps = {}) {
  // Autoplay step (cycles 1 -> 2 -> 3 -> 1)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Autoplay timer runs continuously
  useEffect(() => {
    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
      setSelectedMarkerId(null);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const currentConfig = STEPS[activeStep - 1];

  // Step click switches to that step preview without stopping autoplay
  const handleStepClick = (stepId: 1 | 2 | 3) => {
    setActiveStep(stepId);
    setSelectedMarkerId(null);
  };

  return (
    <section
      id="kham-pha"
      className="w-full pt-10 pb-4 relative scroll-mt-24"
      aria-label="Khám phá: Gom cụm điểm đến và định hình cung đường trên bản đồ thực địa"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08B3C6]/15 text-[#08B3C6] font-label-caps text-xs font-bold uppercase tracking-wider mb-2">
            <span>ĐỊNH HÌNH TUYẾN ĐIỂM</span>
          </div>
          <h2 className="font-headline-lg text-xl sm:text-3xl lg:text-4xl text-[#0E1D4F] font-bold leading-normal tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title="Khám phá & Gom cụm điểm đến">
            Khám phá &amp; Gom cụm điểm đến
          </h2>
          <p className="mt-2 text-xs sm:text-base text-[#4B5875] leading-relaxed">
            Từ các ý tưởng rời rạc khắp các vùng miền, VISTRA giúp bạn khoanh vùng và định hình các chặng di chuyển liền mạch.
          </p>
        </div>

        {/* Step Tabs Controls (accessible, keyboard-friendly, touch-ready) */}
        <div
          role="tablist"
          aria-label="Các giai đoạn kiến tạo hành trình"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5"
        >
          {STEPS.map((step) => {
            const isSelected = activeStep === step.id;
            return (
              <button
                key={step.id}
                role="tab"
                id={`explore-tab-${step.id}`}
                aria-selected={isSelected}
                aria-controls={`explore-panel-${step.id}`}
                onClick={() => handleStepClick(step.id)}
                className={`relative min-h-14 text-left px-4 py-3 rounded-xl border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#08B3C6] ${
                  isSelected
                    ? 'bg-white border-[#08B3C6] shadow-sm'
                    : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <span className="block text-sm font-semibold text-[#0E1D4F] leading-snug whitespace-nowrap overflow-hidden text-ellipsis" title={step.title}>{step.title}</span>
                <span className="block text-xs text-[#4B5875] mt-0.5 line-clamp-1">{step.copy}</span>
              </button>
            );
          })}
        </div>

        {/* Map Container (LP-08: Increased desktop height to balance adjacent sections) */}
        <div
          id={`explore-panel-${currentConfig.id}`}
          role="tabpanel"
          aria-labelledby={`explore-tab-${currentConfig.id}`}
          className="relative"
        >
          <div className="h-[440px] sm:h-[520px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-100">
            <VistraMap
              markers={currentConfig.markers}
              route={currentConfig.route}
              center={currentConfig.center}
              zoom={currentConfig.zoom}
              selectedMarkerId={selectedMarkerId}
              onMarkerSelect={(marker) => setSelectedMarkerId(marker ? marker.id : null)}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

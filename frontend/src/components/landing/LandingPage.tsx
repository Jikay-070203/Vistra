'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import styles from './landing.module.css';
import { createInitialLandingState, applyPreference, type LandingTripState } from './landingDemo';
import LandingHero from './hero/LandingHero';
import IntroDestinationsSection from './sections/IntroDestinationsSection';
import OverviewSection from './overview/OverviewSection';
import ExploreSection from './sections/ExploreSection';
import CoCreateSection from './sections/CoCreateSection';
import ConfirmSection from './sections/ConfirmSection';
import FinalValueSection from './sections/FinalValueSection';
import { useLandingContent } from './useLandingContent';

export default function LandingPage() {
  const landingContent = useLandingContent();
  const [tripState, setTripState] = React.useState<LandingTripState>(() => createInitialLandingState());
  const finalTripState = React.useMemo(() => createInitialLandingState(), []);
  const handleTogglePreference = React.useCallback((preference: 'default' | 'less_travel') => {
    setTripState((previous) => applyPreference(previous, preference));
  }, []);

  return (
    <div className={`w-full ${styles.landingRoot}`}>
      {/* SECTION 1: HERO (#y-tuong) with integrated suggested-plan carousel (LPF-01) */}
      <LandingHero {...landingContent} />

      {/* LPUI-02–04: BẠN MUỐN ĐI ĐÂU? (6 fanned destination cards - LPF-02) */}
      <IntroDestinationsSection {...landingContent} />

      {/* SECTION 1.5: TỔNG QUAN (#tong-quan) (V4-003A & V4-003B) */}
      <OverviewSection />

      {/* SECTION 2: KHÁM PHÁ & BẢN NHÁP (#kham-pha) (V4-004A, V4-005A, V4-005B) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 text-center text-sm text-[#4B5875]">
        Các hình minh họa dưới đây mô tả cách lên kế hoạch. Bắt đầu chuyến đi để sử dụng dữ liệu thực tế.
      </div>
      <ExploreSection />

      {/* SECTION 3: CÙNG XÂY (#cung-xay) */}
      <CoCreateSection tripState={tripState} onTogglePreference={handleTogglePreference} />

      {/* SECTION 4: Editorial comparison illustration */}
      <ConfirmSection />

      {/* SECTION 5: FINAL VALUE (#trai-nghiem) - Isolated from CoCreate loop (LPF-07) */}
      <FinalValueSection tripState={finalTripState} />

      {/* INDEPENDENT CALL-TO-ACTION SECTION (#bat-dau) */}
      <section
        id="bat-dau"
        className="w-full py-20 bg-transparent border-t border-[#0E1D4F]/10 relative overflow-hidden"
        aria-label="Khởi tạo ý tưởng chuyến đi"
      >
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08B3C6]/15 border border-[#08B3C6]/30 text-xs font-bold text-[#088D9C] uppercase tracking-wider">
            <Icon name="sparkles" className="size-3.5" />
            <span>Hành trình trong tầm tay</span>
          </div>

          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0E1D4F] tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
            title="Sẵn sàng biến ý tưởng thành hành trình thực tế?"
          >
            Sẵn sàng biến ý tưởng thành hành trình thực tế?
          </h2>

          <p className="text-base text-[#4B5875] max-w-2xl leading-relaxed">
            Chỉ cần vài bức ảnh cảm hứng hoặc những dòng ghi chú nhỏ, VISTRA sẽ giúp bạn gom cụm, tinh chỉnh và phác thảo lộ trình riêng biệt.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/create-trip"
              className="px-8 py-4 bg-[#205BD6] hover:bg-[#0739A8] text-white text-base font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2.5"
            >
              <span>Bắt đầu ý tưởng chuyến đi</span>
              <Icon name="arrow_forward" className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

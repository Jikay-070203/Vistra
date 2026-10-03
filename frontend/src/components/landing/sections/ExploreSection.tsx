'use client';

import React, { useState, useEffect, useRef } from 'react';
import LandingEditorialMotif from '../LandingEditorialMotif';
import StarSkyCanvas from '../explore/StarSkyCanvas';
import { appConfig } from '@/config/appConfig';
import styles from '../landing.module.css';

export interface ExploreSectionProps {
  onJumpToCoCreate?: () => void;
}

export default function ExploreSection({}: ExploreSectionProps = {}) {
  const { chaoticToPruneProgress, pruneToDraftProgress } = appConfig.draftGraph;

  // Active phase: 1 (Scattered Stars), 2 (Connecting Stars), 3 (Constellation Route)
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const manualPhaseRef = useRef<1 | 2 | 3 | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);

  // Scroll listener for pinned deterministic scroll-progress thresholds (V4-005B)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking && sectionRef.current) {
        window.requestAnimationFrame(() => {
          const rect = sectionRef.current!.getBoundingClientRect();
          const stickyTop = 88; // Floating header offset

          // Compute progress strictly within the pinned scrollable track
          const maxScrollDistance = rect.height - window.innerHeight;
          const currentScrolled = stickyTop - rect.top;

          // When top of section is at or below stickyTop, progress starts from 0.0
          const progress = Math.max(0, Math.min(1, currentScrolled / Math.max(1, maxScrollDistance)));

          // If scrolled completely out of range, clear manual mode
          if (progress <= 0 || progress >= 1) {
            manualPhaseRef.current = null;
          }

          // Update phase deterministically if not explicitly in manual mode
          if (manualPhaseRef.current) {
            setPhase(manualPhaseRef.current);
          } else if (progress < chaoticToPruneProgress) {
            setPhase(1);
          } else if (progress < pruneToDraftProgress) {
            setPhase(2);
          } else {
            setPhase(3);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chaoticToPruneProgress, pruneToDraftProgress]);

  return (
    <section
      id="kham-pha"
      ref={sectionRef}
      className={`${styles.section} ${styles.exploreSection} ${styles.sectionSpacing}`}
      aria-label="Khám phá: Từ những vì sao rời rạc đến chòm sao dẫn đường"
    >
      <div className={styles.container}>
        {/* Pinned Sticky Stage Container */}
        <div className={styles.exploreStickyContainer}>
          {/* Section Header */}
          <div className={styles.exploreSectionHeader}>
            <div className="flex items-center gap-3 mb-2">
              <LandingEditorialMotif variant="route" className={styles.sectionMotif} width={96} height={58} />
            </div>

            <h2 className={styles.h2}>
              Từ những vì sao rời rạc đến chòm sao dẫn đường.
            </h2>

            <p className={styles.exploreIntroText}>
              Từng điểm đến rời rạc dần tìm thấy nhịp điệu để kết nối thành cung đường hài hòa.
            </p>
          </div>

          {/* Two-Column Layout: Left Narrative Storytelling, Right Star Sky Canvas */}
          <div className={`${styles.grid12} ${styles.exploreGrid}`}>
            {/* Left Column (5 cols): Pure Narrative Storytelling */}
            <div className="col-span-12 lg:col-span-5 flex flex-col justify-center gap-4 h-full">
              <div className="p-5 bg-white/75 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex flex-col gap-3">
                <p className="text-base font-semibold text-[#0E1D4F] leading-relaxed">
                  Ý tưởng và ảnh cảm hứng ban đầu tựa như những vì sao phân tán trên bầu trời thông tin.
                </p>
                <p className="text-sm text-[#4B5875] leading-relaxed">
                  VISTRA nhận diện nhịp điệu tương đồng, lược bớt điểm quá xa để kết nối thành chặng đường liền mạch.
                </p>
              </div>

              <div className="p-4 bg-white/55 backdrop-blur-sm rounded-2xl border border-[#0E1D4F]/8">
                <p className="text-sm text-[#4B5875] leading-relaxed">
                  Cuộn trang để theo dõi chuyển biến: từ các điểm rời rạc kết nối thành chòm sao lộ trình hoàn chỉnh.
                </p>
              </div>
            </div>

            {/* Right Column (7 cols): The Celestial Star Sky Canvas */}
            <div className="col-span-12 lg:col-span-7 h-full flex flex-col justify-center">
              <StarSkyCanvas phase={phase} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

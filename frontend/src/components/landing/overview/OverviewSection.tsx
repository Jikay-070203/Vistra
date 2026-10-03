'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { appConfig } from '@/config/appConfig';
import styles from './OverviewSection.module.css';

interface OverviewCardData {
  id: string;
  title: string;
  keyword: string;
  evidence: string;
  targetAnchor: string;
}

const OVERVIEW_CARDS: OverviewCardData[] = [
  {
    id: 'step-discover',
    title: 'Khám phá',
    keyword: 'Tín hiệu rời rạc thành điểm đến khả thi',
    evidence: 'Gom lọc ảnh cảm hứng và ghi chú phân tán thành điểm đến cụ thể.',
    targetAnchor: '#kham-pha',
  },
  {
    id: 'step-build',
    title: 'Cùng xây',
    keyword: 'Điểm đến định hình thành cung đường',
    evidence: 'Đối thoại cùng AI để sắp xếp thứ tự và hoàn thiện lộ trình.',
    targetAnchor: '#cung-xay',
  },
  {
    id: 'step-decide',
    title: 'Quyết định',
    keyword: 'Cân nhắc đánh đổi, chốt chuyến đi của riêng bạn',
    evidence: 'Minh bạch các điểm lưu ý và nhịp độ; bạn toàn quyền quyết định.',
    targetAnchor: '#xac-nhan',
  },
];

export default function OverviewSection() {
  const { cardDurationMs } = appConfig.overview;

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Card click handler (jumps directly to card)
  const handleSelectCard = useCallback((index: number) => {
    setActiveIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  // Continuous auto-cycle loop — runs without pause on hover/focus
  useEffect(() => {
    startTimeRef.current = Date.now();

    const intervalTimer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % OVERVIEW_CARDS.length);
      startTimeRef.current = Date.now();
      setProgress(0);
    }, cardDurationMs);

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min((elapsed / cardDurationMs) * 100, 100);
      setProgress(currentProgress);

      if (elapsed < cardDurationMs) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      clearInterval(intervalTimer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeIndex, cardDurationMs]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <section
      id="tong-quan"
      className={styles.overviewSection}
      aria-label="Tổng quan: Hành trình giữa ý định và chuyến đi thực tế"
    >
      {/* Background Metaphor: Two Hands Approaching + Connecting Strands */}
      <div className={styles.metaphorBackground} aria-hidden="true">
        <svg
          className={styles.metaphorSvg}
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="userHandGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#08B3C6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#08B3C6" stopOpacity="0.45" />
            </linearGradient>

            <linearGradient id="planHandGrad" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#205BD6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#205BD6" stopOpacity="0.45" />
            </linearGradient>

            <linearGradient id="strandGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#08B3C6" />
              <stop offset="50%" stopColor="#F4DB38" />
              <stop offset="100%" stopColor="#205BD6" />
            </linearGradient>
          </defs>

          {/* Left Hand: User Intent (Approaching from left toward center) */}
          <g transform="translate(180, 220)">
            {/* Palm & Wrist */}
            <path
              d="M -120 180 C -60 140, 40 120, 160 110 C 220 105, 290 80, 340 70 C 360 65, 380 75, 390 90 C 370 120, 310 160, 240 180 C 160 200, 20 230, -120 220 Z"
              fill="url(#userHandGrad)"
              stroke="#08B3C6"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Fingers reaching */}
            <path
              d="M 340 70 C 380 60, 430 55, 470 65 C 480 68, 480 78, 470 82 C 430 90, 380 95, 340 90"
              stroke="#08B3C6"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 330 95 C 380 88, 440 90, 480 102 C 490 106, 490 116, 480 120 C 430 125, 370 125, 320 120"
              stroke="#08B3C6"
              strokeWidth="2"
              fill="none"
            />
            <text x="180" y="210" fill="#08B3C6" fontSize="12" fontWeight="700" letterSpacing="0.08em">
              Ý ĐỊNH NGƯỜI DÙNG
            </text>
          </g>

          {/* Right Hand: Structured Plan (Approaching from right toward center) */}
          <g transform="translate(760, 220)">
            {/* Palm & Wrist */}
            <path
              d="M 620 180 C 560 140, 460 120, 340 110 C 280 105, 210 80, 160 70 C 140 65, 120 75, 110 90 C 130 120, 190 160, 260 180 C 340 200, 480 230, 620 220 Z"
              fill="url(#planHandGrad)"
              stroke="#205BD6"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Fingers reaching */}
            <path
              d="M 160 70 C 120 60, 70 55, 30 65 C 20 68, 20 78, 30 82 C 70 90, 120 95, 160 90"
              stroke="#205BD6"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 170 95 C 120 88, 60 90, 20 102 C 10 106, 10 116, 20 120 C 70 125, 130 125, 180 120"
              stroke="#205BD6"
              strokeWidth="2"
              fill="none"
            />
            <text x="320" y="210" fill="#205BD6" fontSize="12" fontWeight="700" letterSpacing="0.08em">
              KẾ HOẠCH VÀO NẾP
            </text>
          </g>

          {/* The Connecting Strands in the Space Between Hands (The System) */}
          <g opacity={activeIndex === 0 ? 0.6 : activeIndex === 1 ? 0.95 : 0.75}>
            {/* Strand 1 */}
            <path
              d="M 640 285 C 680 250, 730 260, 780 290"
              stroke="url(#strandGlow)"
              strokeWidth="3"
              strokeDasharray="4 6"
              fill="none"
            />
            {/* Strand 2 */}
            <path
              d="M 630 310 C 690 340, 720 330, 790 305"
              stroke="url(#strandGlow)"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Strand 3 */}
            <path
              d="M 650 335 C 700 370, 740 360, 785 330"
              stroke="#08B3C6"
              strokeWidth="1.5"
              strokeDasharray="2 4"
              fill="none"
            />
            {/* Central Synthesis Beacon */}
            <circle cx="710" cy="305" r="8" fill="#F4DB38" fillOpacity="0.8" />
            <circle cx="710" cy="305" r="16" stroke="#F4DB38" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          </g>
        </svg>
      </div>

      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Khi mong muốn gặp gỡ cung đường.
          </h2>
          <p className={styles.sectionSubtitle}>
            Ba bước giúp ý tưởng du lịch của bạn rõ nét, vào nếp và sẵn sàng khởi hành.
          </p>
        </div>

        {/* Exactly 3 Adjacent State Cards */}
        <div className={styles.cardsGrid} role="tablist" aria-label="Các điểm chạm trong hành trình">
          {OVERVIEW_CARDS.map((card, idx) => {
            const isActive = activeIndex === idx;
            const cardProgress = isActive ? progress : 0;

            return (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                tabIndex={0}
                className={`${styles.cardItem} ${isActive ? styles.cardItemActive : ''}`}
                onClick={() => handleSelectCard(idx)}
              >
                <div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <p className={styles.cardKeyword}>{card.keyword}</p>
                    <p className={styles.cardEvidence}>{card.evidence}</p>
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.progressBarTrack} aria-hidden="true">
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${cardProgress}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

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
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} title="Mong muốn gặp gỡ cung đường.">
            Mong muốn gặp gỡ cung đường.
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
                <div className="relative z-10">
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle} title={card.title}>{card.title}</h3>
                    <p className={styles.cardKeyword}>{card.keyword}</p>
                    <p className={styles.cardEvidence}>{card.evidence}</p>
                  </div>
                </div>

                {/* LPF-03: Progressive perimeter border stroke (no percentage number) */}
                {isActive && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl z-20"
                    style={{ overflow: 'visible' }}
                  >
                    <rect
                      x="1.5"
                      y="1.5"
                      width="calc(100% - 3px)"
                      height="calc(100% - 3px)"
                      rx="16"
                      ry="16"
                      fill="none"
                      stroke="#205BD6"
                      strokeWidth="3"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={`${Math.max(0, 100 - cardProgress)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

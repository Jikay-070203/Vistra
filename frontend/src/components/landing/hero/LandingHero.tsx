'use client';

import React from 'react';
import type { useLandingContent } from '../useLandingContent';
import HeroPlanCarousel from '../sections/HeroPlanCarousel';
import styles from './landing-hero.module.css';

/**
 * LandingHero (LPF-01)
 *
 * Suggested-plan carousel prominently placed in the right column
 * replacing old competing Geo graphic.
 */
export default function LandingHero({ data, loading, error, retry }: ReturnType<typeof useLandingContent>) {

  return (
    <section
      id="y-tuong"
      className={styles.heroSection}
      aria-label="Ý tưởng chuyến đi và thế giới du lịch bắt đầu vào nếp"
    >
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          {/* Narrative & CTAs Column (5 cols on desktop) */}
          <div className={styles.narrativeCol}>
            {/* Eyebrow */}
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              <span>Lên kế hoạch du lịch cùng AI</span>
            </div>

            {/* Preserved Slogan H1 */}
            <h1 className={styles.heroH1} title="Chuyến đi đáng để mong chờ.">
              Chuyến đi đáng để mong chờ.
            </h1>

            {/* Metaphor Kicker */}
            <div className={styles.metaphorKicker}>
              Tín hiệu · Cung đường · Lựa chọn
            </div>

            {/* Supporting Copy */}
            <div className={styles.copyGroup}>
              <p className={styles.heroSupporting}>
                Thế giới du lịch bắt đầu vào nếp từ những mong muốn đầu tiên của bạn.
              </p>
            </div>

            {/* Centralized Metrics Evidence Cluster */}
            <div className={styles.evidenceCluster} role="region" aria-label="Số liệu hành trình">
              <div className={styles.evidenceCard}>
                <div className={styles.evidenceValueGroup}>
                  <span className={styles.evidenceValue}>{loading ? '…' : data?.stats.destinations ?? '—'}</span>
                  <span className={styles.evidenceLabel}>Điểm đến</span>
                </div>
                <span className={styles.evidenceSub}>{loading ? 'Đang tải số liệu' : error ? 'Chưa tải được số liệu' : data?.stats.destinations == null ? 'Chưa có số liệu' : 'Đang được mở khám phá'}</span>
              </div>

              <div className={styles.evidenceCard}>
                <div className={styles.evidenceValueGroup}>
                  <span className={styles.evidenceValue}>{loading ? '…' : data?.stats.places ?? '—'}</span>
                  <span className={styles.evidenceLabel}>Địa điểm</span>
                </div>
                <span className={styles.evidenceSub}>{loading ? 'Đang tải số liệu' : error ? 'Chưa tải được số liệu' : data?.stats.places == null ? 'Chưa có số liệu' : 'Trong danh mục khám phá'}</span>
              </div>
            </div>
          </div>

          {/* Carousel Column (7 cols on desktop - LPF-01) */}
          <div className={styles.boardCol}>
            <HeroPlanCarousel plans={data?.heroPlans.filter((item) => item.active).sort((a, b) => a.order - b.order) ?? []} loading={loading} error={error} onRetry={retry} />
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import type { useLandingContent } from '../useLandingContent';
import HeroPlanCarousel from '../sections/HeroPlanCarousel';
import styles from './landing-hero.module.css';

export default function LandingHero({ data, loading, error }: ReturnType<typeof useLandingContent>) {
  return (
    <section
      id="y-tuong"
      className={styles.heroSection}
      aria-label="Ý tưởng chuyến đi và thế giới du lịch bắt đầu vào nếp"
    >
      <HeroPlanCarousel>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              <span>Lên kế hoạch du lịch cùng AI</span>
            </div>

            <h1 className={styles.heroH1}>
              Chuyến đi đáng để mong chờ.
            </h1>

            <div className={styles.metaphorKicker}>
              Tín hiệu · Cung đường · Lựa chọn
            </div>

            <p className={styles.heroSupporting}>
              Thế giới du lịch bắt đầu vào nếp từ những mong muốn đầu tiên của bạn.
            </p>

            <div className={styles.evidenceCluster} role="group" aria-label="Số liệu hành trình">
              <div className={styles.evidenceCard}>
                <div className={styles.evidenceValueGroup}>
                  <span className={styles.evidenceValue}>
                    {loading ? '…' : data?.stats.destinations ?? '—'}
                  </span>
                  <span className={styles.evidenceLabel}>Điểm đến</span>
                </div>
                <span className={styles.evidenceSub}>
                  {loading ? 'Đang tải số liệu' : error ? 'Chưa tải được số liệu' : data?.stats.destinations == null ? 'Chưa có số liệu' : 'Đang được mở khám phá'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </HeroPlanCarousel>
    </section>
  );
}

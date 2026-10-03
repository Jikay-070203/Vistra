'use client';

import React from 'react';
import { appConfig } from '@/config/appConfig';
import HeroGeoScene from './HeroGeoScene';
import styles from './landing-hero.module.css';

/**
 * LandingHero (V4-002A)
 *
 * Geography-led travel hero scene, concise metaphor-driven copy,
 * and centralized demo metrics marked as mock/demo evidence.
 */
export default function LandingHero() {
  const { planningTimeOptimization, planAcceptanceRate } = appConfig.hero;

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
            <h1 className={styles.heroH1}>
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
                  <span className={styles.evidenceValue}>{planningTimeOptimization.value}</span>
                  <span className={styles.evidenceLabel}>{planningTimeOptimization.label}</span>
                </div>
                <span className={styles.evidenceSub}>{planningTimeOptimization.subtext}</span>
              </div>

              <div className={styles.evidenceCard}>
                <div className={styles.evidenceValueGroup}>
                  <span className={styles.evidenceValue}>{planAcceptanceRate.value}</span>
                  <span className={styles.evidenceLabel}>{planAcceptanceRate.label}</span>
                </div>
                <span className={styles.evidenceSub}>{planAcceptanceRate.subtext}</span>
              </div>
            </div>
          </div>

          {/* Geography 3D Visual Column (7 cols on desktop) */}
          <div className={styles.boardCol}>
            <HeroGeoScene />
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import styles from '../landing.module.css';
import LandingEditorialMotif from '../LandingEditorialMotif';
import {
  HERO_MULTIMODAL_INPUT,
  LANDING_ASSETS,
  LANDING_PINS,
} from '../landingDemo';

export default function HeroSection() {
  const lakePin = LANDING_PINS.find((p) => p.id === 'pin-lake-garden');

  return (
    <section
      id="y-tuong"
      className={`${styles.section} ${styles.heroSection}`}
      aria-label="Ý tưởng chuyến đi và nút thắt đầu tiên"
    >
      <div className={styles.container}>
        <div className={`${styles.grid12} items-center`}>
          {/* Left Column: Narrative Copy & CTAs (5 cols) */}
          <div className={`col-span-12 lg:col-span-5 space-y-6 ${styles.heroContentEnter}`}>
            <div className={styles.eyebrow}>
              <span className="w-2 h-2 rounded-full bg-[#08B3C6]" />
              <span>{HERO_MULTIMODAL_INPUT.eyebrow}</span>
            </div>

            <h1 className={styles.heroH1}>
              {HERO_MULTIMODAL_INPUT.heading}
            </h1>

            <div className="space-y-2">
              <p className={styles.heroSupporting}>
                {HERO_MULTIMODAL_INPUT.supporting}
              </p>
              <p className={styles.heroSubSupporting}>
                {HERO_MULTIMODAL_INPUT.multimodalSub}
              </p>
            </div>

            {/* CTAs according to plan */}
            <div className={`flex flex-wrap items-center gap-4 pt-2 ${styles.heroCtaGroup}`}>
              <a href="#kham-pha" className={styles.btnPrimary}>
                <span>Khám phá hành trình</span>
                <Icon name="arrow_forward" className="size-4" />
              </a>
              <a href="#cung-xay" className={styles.btnSecondary}>
                <Icon name="handshake" className="size-4 text-[#0E1D4F]" />
                <span>Xem cách hoạt động</span>
              </a>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#67736D]">
              <Icon name="verified_user" className="size-4 text-[#E7AD2E]" />
              <span>AI chuẩn bị · Bạn toàn quyền quyết định</span>
            </div>

            {/* Scroll Cue connecting down to Section 2 (Desktop in left column) */}
            <div className="pt-4 hidden lg:block">
              <a href="#kham-pha" className={styles.scrollCue}>
                <Icon name="keyboard_arrow_down" className={`size-4 ${styles.scrollCueIcon}`} />
                <span>{HERO_MULTIMODAL_INPUT.scrollCue}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Editorial Planning Board (7 cols) */}
          <div className={`col-span-12 lg:col-span-7 ${styles.heroVisualEnter}`}>
            <div className={styles.planningBoard} role="region" aria-label="Bàn kế hoạch">
              <LandingEditorialMotif variant="sunrise" className={styles.heroMotif} width={120} height={72} />
              {/* Board Top Bar */}
              <div className={styles.boardHeader}>
                <div className={styles.boardHeaderTitle}>
                  <Icon name="description" className="size-4 text-[#205BD6]" />
                  <span>Bàn lập kế hoạch · Bản nháp ban đầu</span>
                </div>
                <span className={styles.boardHeaderBadge}>
                  2 đầu vào: Text + Image
                </span>
              </div>

              {/* Board Main Composition: Photo + Note + Fragments */}
              <div className={styles.boardCanvas}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {/* Multimodal Item 1: Inspiration Photo Card (Polaroid Style) */}
                  <div className={styles.photoCard}>
                    <div className={styles.photoFrame}>
                      <Image
                        src={LANDING_ASSETS.heroInspiration.path}
                        alt={LANDING_ASSETS.heroInspiration.alt}
                        width={1280}
                        height={960}
                        fetchPriority="high"
                        loading="eager"
                        className={styles.photoImage}
                      />
                    </div>
                    <div className={styles.photoCaption}>
                      <span className={styles.photoBadge}>Ảnh cảm hứng</span>
                      <span className={styles.photoLabel}>Thung lũng Vàng · Sương sớm</span>
                    </div>
                  </div>

                  {/* Multimodal Item 2: User Wish Note (Text Input) */}
                  <div className="space-y-3">
                    <div className={styles.wishNoteCard}>
                      <div className={styles.wishNoteHeader}>
                        <span className={styles.wishNoteBadge}>Ghi chú mong muốn</span>
                        <span className={styles.wishNoteTag}>Mô tả văn bản</span>
                      </div>
                      <p className={styles.wishNoteText}>
                        &ldquo;{HERO_MULTIMODAL_INPUT.inspirationNote.promptText}&rdquo;
                      </p>
                    </div>

                    {/* Item 3: Initial Pin Fragment */}
                    <div className={styles.pinFragment}>
                      <Icon name="location_on" className={`size-4 ${styles.pinIcon}`} />
                      <div>
                        <div className="font-semibold text-xs text-[#20312B]">
                          {lakePin?.name ?? 'Vườn ven hồ'}
                        </div>
                        <div className="text-[11px] text-[#67736D]">
                          Không gian tĩnh lặng, đồi thông soi bóng nước
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SVG Connecting Path: subtle representation of AI synthesis */}
                <div className="relative py-2">
                  <svg
                    aria-hidden="true"
                    className="w-full h-8 overflow-visible"
                    viewBox="0 0 400 32"
                    fill="none"
                  >
                    <path
                      d="M 50 4 C 150 4 200 28 350 28"
                      stroke="#DEDCD2"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <circle cx="50" cy="4" r="3" fill="#3D684F" />
                    <circle cx="350" cy="28" r="3" fill="#D99A4E" />
                  </svg>
                </div>

                {/* Item 4: Open Questions Chips */}
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[#67736D]">
                    Những câu hỏi mở cần giải đáp:
                  </div>
                  <div className={styles.questionChipsRow}>
                    {HERO_MULTIMODAL_INPUT.openQuestions.map((q) => (
                      <div key={q.id} className={styles.questionChip}>
                        <Icon name="info" className={`size-3.5 ${styles.questionChipIcon}`} />
                        <span>{q.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Board Footer Bar: Illustrative AI Capability Indicator */}
              <div className="pt-3 border-t border-[#DEDCD2] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className={styles.aiPill}>
                  <Icon name="auto_fix_high" className="size-3.5 text-[#3D684F]" />
                  <span>{HERO_MULTIMODAL_INPUT.illustrativePill}</span>
                </div>
                <span className="text-[#67736D] text-[11px]">
                  Khởi tạo ban đầu
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Scroll Cue: rendered after the Planning Board */}
          <div className="col-span-12 flex justify-center pt-6 lg:hidden">
            <a href="#kham-pha" className={styles.scrollCue}>
              <Icon name="keyboard_arrow_down" className={`size-4 ${styles.scrollCueIcon}`} />
              <span>{HERO_MULTIMODAL_INPUT.scrollCue}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

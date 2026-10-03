'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import styles from './StarSkyCanvas.module.css';
import { LANDING_PINS, LandingPin } from '../landingDemo';

export interface StarSkyCanvasProps {
  phase?: 1 | 2 | 3;
  mode?: 'discovery' | 'chaotic' | 'pruned' | 'draft';
  selectedStarId?: string | null;
  onSelectStar?: (starId: string | null) => void;
}

// Background ambient twinkling stars (expanded to depict unstructured cosmic inspiration)
const AMBIENT_STARS = [
  { cx: 80, cy: 90, r: 1.2, delayClass: styles.twinkle },
  { cx: 140, cy: 160, r: 1.0, delayClass: styles.twinkleDelay1 },
  { cx: 200, cy: 60, r: 1.5, delayClass: styles.twinkleDelay2 },
  { cx: 270, cy: 130, r: 1.1, delayClass: styles.twinkleDelay3 },
  { cx: 320, cy: 80, r: 1.3, delayClass: styles.twinkle },
  { cx: 370, cy: 110, r: 1.2, delayClass: styles.twinkle },
  { cx: 440, cy: 50, r: 1.0, delayClass: styles.twinkleDelay2 },
  { cx: 480, cy: 75, r: 1.8, delayClass: styles.twinkleDelay3 },
  { cx: 530, cy: 160, r: 1.2, delayClass: styles.twinkleDelay1 },
  { cx: 590, cy: 100, r: 1.4, delayClass: styles.twinkleDelay2 },
  { cx: 650, cy: 140, r: 1.1, delayClass: styles.twinkle },
  { cx: 720, cy: 80, r: 1.5, delayClass: styles.twinkleDelay2 },
  { cx: 760, cy: 190, r: 1.0, delayClass: styles.twinkle },
  { cx: 90, cy: 260, r: 1.3, delayClass: styles.twinkleDelay1 },
  { cx: 120, cy: 380, r: 1.4, delayClass: styles.twinkleDelay3 },
  { cx: 180, cy: 450, r: 1.1, delayClass: styles.twinkleDelay1 },
  { cx: 240, cy: 320, r: 1.5, delayClass: styles.twinkleDelay2 },
  { cx: 290, cy: 470, r: 1.2, delayClass: styles.twinkle },
  { cx: 360, cy: 430, r: 1.6, delayClass: styles.twinkleDelay2 },
  { cx: 430, cy: 360, r: 1.3, delayClass: styles.twinkleDelay3 },
  { cx: 500, cy: 460, r: 1.3, delayClass: styles.twinkle },
  { cx: 560, cy: 390, r: 1.1, delayClass: styles.twinkleDelay1 },
  { cx: 620, cy: 470, r: 1.4, delayClass: styles.twinkleDelay2 },
  { cx: 680, cy: 430, r: 1.2, delayClass: styles.twinkleDelay1 },
  { cx: 740, cy: 340, r: 1.5, delayClass: styles.twinkleDelay3 },
  { cx: 770, cy: 440, r: 1.0, delayClass: styles.twinkle },
  { cx: 420, cy: 220, r: 1.1, delayClass: styles.twinkleDelay2 },
  { cx: 230, cy: 190, r: 1.4, delayClass: styles.twinkleDelay3 },
  { cx: 610, cy: 230, r: 1.2, delayClass: styles.twinkle },
  { cx: 150, cy: 80, r: 1.0, delayClass: styles.twinkleDelay1 },
  { cx: 350, cy: 280, r: 1.3, delayClass: styles.twinkleDelay2 },
  { cx: 490, cy: 290, r: 1.2, delayClass: styles.twinkleDelay3 },
];

// Scattered raw inspiration data nodes (visible as fragmented signals in scene 1)
const RAW_INSPIRATION_STARS = [
  { id: 'raw-1', x: 130, y: 120, label: 'Ảnh hoàng hôn' },
  { id: 'raw-2', x: 260, y: 110, label: 'Quán cà phê mộc' },
  { id: 'raw-3', x: 410, y: 80, label: 'Đồi thông reo' },
  { id: 'raw-4', x: 570, y: 70, label: 'Ghi chú homestay' },
  { id: 'raw-5', x: 670, y: 120, label: 'Bến thuyền cũ' },
  { id: 'raw-6', x: 730, y: 220, label: 'Đỉnh dốc xa' },
  { id: 'raw-7', x: 100, y: 310, label: 'Suối mát râm' },
  { id: 'raw-8', x: 250, y: 400, label: 'Vườn trà chiều' },
  { id: 'raw-9', x: 390, y: 460, label: 'Lối mòn đất đỏ' },
  { id: 'raw-10', x: 540, y: 420, label: 'Xưởng gốm nhỏ' },
  { id: 'raw-11', x: 690, y: 390, label: 'Hiên gỗ ven hồ' },
  { id: 'raw-12', x: 320, y: 200, label: 'Điểm săn mây' },
];

const DRAFT_SEQUENCE_IDS = [
  'pin-lake-garden',
  'pin-corner-tea',
  'pin-hillside-lodge',
  'pin-creek-village',
  'pin-craft-workshop',
  'pin-pine-ridge',
];

export default function StarSkyCanvas({
  phase: explicitPhase,
  mode,
  selectedStarId,
  onSelectStar,
}: StarSkyCanvasProps) {
  // Determine effective phase (1, 2, or 3)
  const currentPhase: 1 | 2 | 3 = React.useMemo(() => {
    if (explicitPhase) return explicitPhase;
    if (mode === 'discovery' || mode === 'chaotic') return 1;
    if (mode === 'pruned') return 2;
    if (mode === 'draft') return 3;
    return 1;
  }, [explicitPhase, mode]);

  const [activePin, setActivePin] = useState<LandingPin | null>(null);

  // Map 0-100 coords to 800x520 SVG coordinate space
  const starCoords = React.useMemo(() => {
    return LANDING_PINS.reduce<Record<string, { x: number; y: number }>>((acc, pin) => {
      acc[pin.id] = {
        x: Math.round(50 + (pin.coords.x / 100) * 700),
        y: Math.round(50 + (pin.coords.y / 100) * 420),
      };
      return acc;
    }, {});
  }, []);

  const handleStarClick = (pin: LandingPin) => {
    setActivePin((prev) => (prev?.id === pin.id ? null : pin));
    if (onSelectStar) {
      onSelectStar(pin.id);
    }
  };

  const draftRoutePathD = React.useMemo(() => {
    const points = DRAFT_SEQUENCE_IDS.map((id) => starCoords[id]);
    if (points.length < 2) return '';
    return points.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      return `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [starCoords]);

  return (
    <div
      className={styles.canvasWrapper}
      role="region"
      aria-label="Bầu trời sao: Từng vì sao rời rạc kết nối thành chòm sao lịch trình"
    >
      {/* Background Nebulae */}
      <div className={`${styles.nebulaGlow} ${styles.nebula1}`} />
      <div className={`${styles.nebulaGlow} ${styles.nebula2}`} />
      <div className={`${styles.nebulaGlow} ${styles.nebula3}`} />

      {/* Main Celestial Sky SVG */}
      <svg
        className={styles.skySvg}
        viewBox="0 0 800 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Constellation Ribbon Gradient */}
          <linearGradient id="constellationGlow" x1="10%" y1="20%" x2="90%" y2="80%">
            <stop offset="0%" stopColor="#F4DB38" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#08B3C6" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#205BD6" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#08B3C6" stopOpacity="0.95" />
          </linearGradient>

          {/* Golden Star Core Gradient */}
          <radialGradient id="goldStarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF8D6" />
            <stop offset="60%" stopColor="#F4DB38" />
            <stop offset="100%" stopColor="#E7AD2E" />
          </radialGradient>

          {/* Cyan Star Core Gradient */}
          <radialGradient id="cyanStarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0FAFC" />
            <stop offset="60%" stopColor="#08B3C6" />
            <stop offset="100%" stopColor="#057F8D" />
          </radialGradient>

          {/* Soft Starlight Thread Stroke Gradient */}
          <linearGradient id="threadFade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#08B3C6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#205BD6" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* 1. Ambient Background Stars */}
        <g id="ambient-stars" opacity={0.75}>
          {AMBIENT_STARS.map((star, i) => (
            <circle
              key={`ambient-${i}`}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              fill="#FFFFFF"
              className={star.delayClass}
            />
          ))}
        </g>

        {/* 1.5. Scattered Raw Inspiration Stars (Scene 1: data chưa sắp xếp) */}
        <g id="raw-inspiration-stars">
          {RAW_INSPIRATION_STARS.map((raw) => (
            <g
              key={raw.id}
              transform={`translate(${raw.x}, ${raw.y})`}
              opacity={currentPhase === 1 ? 0.95 : currentPhase === 2 ? 0.65 : 0.2}
              className="transition-opacity duration-700"
            >
              <circle cx="0" cy="0" r="3" fill="#9DD8E2" />
              <circle cx="0" cy="0" r="7" stroke="#08B3C6" strokeWidth="0.8" strokeDasharray="2 2" fill="none" opacity="0.6" />
              {currentPhase === 1 && (
                <text x="8" y="3" fill="#9DD8E2" fontSize="9" fontWeight="500" opacity="0.75" pointerEvents="none">
                  {raw.label}
                </text>
              )}
            </g>
          ))}
        </g>

        {/* 2. PHASE 2: Chaotic & Exploratory Connecting Lines (Một số sao nối hỗn loạn) */}
        {currentPhase === 2 && (
          <g id="phase2-faint-connections" opacity={0.85}>
            {/* Primary candidates */}
            <line
              x1={starCoords['pin-lake-garden']?.x}
              y1={starCoords['pin-lake-garden']?.y}
              x2={starCoords['pin-corner-tea']?.x}
              y2={starCoords['pin-corner-tea']?.y}
              stroke="url(#threadFade)"
              strokeWidth="2"
              strokeDasharray="4 6"
              className={styles.constellationLine}
            />
            <line
              x1={starCoords['pin-corner-tea']?.x}
              y1={starCoords['pin-corner-tea']?.y}
              x2={starCoords['pin-hillside-lodge']?.x}
              y2={starCoords['pin-hillside-lodge']?.y}
              stroke="url(#threadFade)"
              strokeWidth="2"
              strokeDasharray="4 6"
              className={styles.constellationLine}
            />
            <line
              x1={starCoords['pin-creek-village']?.x}
              y1={starCoords['pin-creek-village']?.y}
              x2={starCoords['pin-craft-workshop']?.x}
              y2={starCoords['pin-craft-workshop']?.y}
              stroke="url(#threadFade)"
              strokeWidth="2"
              strokeDasharray="4 6"
              className={styles.constellationLine}
            />
            <line
              x1={starCoords['pin-craft-workshop']?.x}
              y1={starCoords['pin-craft-workshop']?.y}
              x2={starCoords['pin-pine-ridge']?.x}
              y2={starCoords['pin-pine-ridge']?.y}
              stroke="url(#threadFade)"
              strokeWidth="2"
              strokeDasharray="4 6"
              className={styles.constellationLine}
            />

            {/* Chaotic / exploratory experimental links being tested */}
            <line
              x1={130}
              y1={120}
              x2={starCoords['pin-corner-tea']?.x}
              y2={starCoords['pin-corner-tea']?.y}
              stroke="#08B3C6"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              opacity={0.5}
            />
            <line
              x1={320}
              y1={200}
              x2={starCoords['pin-hillside-lodge']?.x}
              y2={starCoords['pin-hillside-lodge']?.y}
              stroke="#E7AD2E"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity={0.55}
            />
            <line
              x1={starCoords['pin-lake-garden']?.x}
              y1={starCoords['pin-lake-garden']?.y}
              x2={250}
              y2={400}
              stroke="#08B3C6"
              strokeWidth="1"
              strokeDasharray="2 4"
              opacity={0.45}
            />
            <line
              x1={540}
              y1={420}
              x2={starCoords['pin-craft-workshop']?.x}
              y2={starCoords['pin-craft-workshop']?.y}
              stroke="#205BD6"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              opacity={0.45}
            />
            <line
              x1={starCoords['pin-corner-tea']?.x}
              y1={starCoords['pin-corner-tea']?.y}
              x2={starCoords['pin-sunset-hill']?.x}
              y2={starCoords['pin-sunset-hill']?.y}
              stroke="#E7AD2E"
              strokeWidth="1.5"
              strokeDasharray="3 7"
              opacity={0.4}
              className={styles.constellationLine}
            />
          </g>
        )}

        {/* 3. PHASE 3: Complete Constellation Ribbon (Lộ trình nháp) */}
        {currentPhase === 3 && (
          <g id="phase3-constellation-route">
            {/* Ambient Halo Behind Ribbon */}
            <path
              d={draftRoutePathD}
              stroke="#08B3C6"
              strokeWidth="10"
              fill="none"
              className={styles.constellationHalo}
            />
            {/* Primary Glowing Constellation Line */}
            <path
              d={draftRoutePathD}
              stroke="url(#constellationGlow)"
              strokeWidth="3.5"
              fill="none"
              className={styles.constellationLine}
            />
          </g>
        )}

        {/* 4. Core Destination Stars */}
        <g id="destination-stars">
          {LANDING_PINS.map((pin) => {
            const pt = starCoords[pin.id];
            if (!pt) return null;

            const isStart = currentPhase === 3 && pin.id === 'pin-lake-garden';
            const isEnd = currentPhase === 3 && pin.id === 'pin-pine-ridge';
            const isOutlier = pin.id === 'pin-sunset-hill';
            const isDimmed = currentPhase === 3 && isOutlier;
            const isSelected = selectedStarId === pin.id || activePin?.id === pin.id;

            return (
              <g
                key={pin.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className={styles.starNode}
                tabIndex={0}
                role="button"
                aria-label={`Điểm đến: ${pin.name} (${pin.category})`}
                onClick={() => handleStarClick(pin)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStarClick(pin);
                  }
                }}
                opacity={isDimmed ? 0.45 : 1}
              >
                {/* Outer Starlight Aura */}
                <circle
                  cx={0}
                  cy={0}
                  r={isSelected ? 24 : isStart || isEnd ? 20 : 16}
                  fill={isStart ? '#F4DB38' : '#08B3C6'}
                  fillOpacity={isSelected ? 0.35 : 0.18}
                />

                {/* 4-Pointed Star Ray Sparkle */}
                <path
                  d="M 0 -13 Q 1 -2 13 0 Q 1 2 0 13 Q -1 2 -13 0 Q -1 -2 0 -13 Z"
                  fill={isStart ? 'url(#goldStarGrad)' : isOutlier ? '#F4DB38' : '#08B3C6'}
                  fillOpacity={isDimmed ? 0.3 : 0.85}
                  transform={isSelected ? 'scale(1.25)' : 'scale(1)'}
                  style={{ transition: 'transform 0.3s ease' }}
                />

                {/* Central Star Core */}
                <circle
                  cx={0}
                  cy={0}
                  r={isSelected ? 7 : isStart || isEnd ? 6 : 5}
                  fill={isStart ? 'url(#goldStarGrad)' : 'url(#cyanStarGrad)'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className={styles.starCore}
                />

                {/* Start Star Crown/Badge in Phase 3 */}
                {isStart && (
                  <g transform="translate(0, -22)">
                    <rect
                      x={-28}
                      y={-10}
                      width={56}
                      height={18}
                      rx={9}
                      fill="#F4DB38"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <text
                      x={0}
                      y={3}
                      fill="#0E1D4F"
                      fontSize="9.5"
                      fontWeight="800"
                      textAnchor="middle"
                    >
                      Khởi đầu
                    </text>
                  </g>
                )}

                {/* End Star Badge in Phase 3 */}
                {isEnd && (
                  <g transform="translate(0, -22)">
                    <rect
                      x={-28}
                      y={-10}
                      width={56}
                      height={18}
                      rx={9}
                      fill="#08B3C6"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <text
                      x={0}
                      y={3}
                      fill="#FFFFFF"
                      fontSize="9.5"
                      fontWeight="800"
                      textAnchor="middle"
                    >
                      Điểm đến
                    </text>
                  </g>
                )}

                {/* Star Destination Label */}
                <g transform="translate(0, 18)">
                  <rect
                    x={-(pin.name.length * 3.3 + 12)}
                    y={-1}
                    width={pin.name.length * 6.6 + 24}
                    height={18}
                    rx={9}
                    fill="rgba(10, 18, 46, 0.75)"
                    stroke="rgba(8, 179, 198, 0.35)"
                    strokeWidth="0.8"
                  />
                  <text
                    x={0}
                    y={12}
                    textAnchor="middle"
                    className={styles.starLabelPill}
                  >
                    {pin.name}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Star Details Card */}
      {activePin && (
        <div className={styles.starDetailPopover} role="status">
          <div className={styles.popoverContent}>
            <div className={styles.popoverTitle}>
              <Icon name="star" className="size-4 text-[#F4DB38]" />
              <span>{activePin.name}</span>
              <span className={styles.popoverCategory}>{activePin.shortLabel}</span>
            </div>
            <p className={styles.popoverDesc}>{activePin.description}</p>
          </div>
          <button
            type="button"
            className={styles.popoverCloseBtn}
            onClick={() => setActivePin(null)}
            aria-label="Đóng thông tin điểm đến"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

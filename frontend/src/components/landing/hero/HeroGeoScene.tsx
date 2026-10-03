'use client';

import React from 'react';
import styles from './hero-geo-scene.module.css';

export default function HeroGeoScene() {
  return (
    <div
      className={styles.geoSceneContainer}
      role="region"
      aria-label="Khung cảnh địa hình và cung đường du lịch bắt đầu vào nếp"
    >
      {/* Top Header Overlay */}
      <div className={styles.sceneOverlayHeader}>
        <div className={styles.sceneTag}>
          <span className={styles.tagDot} aria-hidden="true" />
          <span>Thế giới du lịch vào nếp</span>
        </div>
        <div className={styles.sceneCoords}>
          11°56′N · 108°26′E · Cao nguyên
        </div>
      </div>

      {/* Main Vector Geography Canvas */}
      <svg
        className={styles.svgCanvas}
        viewBox="0 0 880 580"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E0F7F2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C8F0E6" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="terrainTier1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8FE3D4" />
            <stop offset="100%" stopColor="#67D3C1" />
          </linearGradient>

          <linearGradient id="terrainTier2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#48C3B1" />
            <stop offset="100%" stopColor="#25AFA0" />
          </linearGradient>

          <linearGradient id="terrainTier3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1C9E92" />
            <stop offset="100%" stopColor="#147E76" />
          </linearGradient>

          <linearGradient id="lakeGrad" x1="0" y1="0" x2="1" y2="0.8">
            <stop offset="0%" stopColor="#10E4D0" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0E9DE0" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#205BD6" />
            <stop offset="50%" stopColor="#08B3C6" />
            <stop offset="100%" stopColor="#205BD6" />
          </linearGradient>

          <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0E1D4F" floodOpacity="0.12" />
          </filter>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Hatch Pattern */}
          <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#0E1D4F" strokeWidth="1" strokeOpacity="0.06" />
          </pattern>
        </defs>

        {/* Atmospheric Sky Background */}
        <rect width="880" height="580" fill="url(#skyGrad)" />

        {/* Topographic Contour Lines (Background Terrain) */}
        <g opacity="0.45" stroke="#08B3C6" strokeWidth="1.2" strokeDasharray="3 3">
          <path d="M 0 180 Q 220 130 440 170 T 880 140" />
          <path d="M 0 240 Q 200 190 460 220 T 880 200" />
          <path d="M 0 310 Q 240 270 480 300 T 880 270" />
          <path d="M 0 390 Q 260 340 520 380 T 880 340" />
          <path d="M 0 470 Q 280 420 560 460 T 880 430" />
        </g>

        {/* Distant Mountain Ridges (Layer 3 - High Elevation) */}
        <path
          d="M 380 320 L 520 140 L 630 220 L 750 110 L 880 260 L 880 580 L 380 580 Z"
          fill="url(#terrainTier3)"
          opacity="0.88"
          filter="url(#shadowFilter)"
        />
        <path
          d="M 520 140 L 630 220 L 580 340 L 470 320 Z"
          fill="url(#diagonalHatch)"
          opacity="0.4"
        />

        {/* Mid-ground Hills (Layer 2 - Rolling Plateau) */}
        <path
          d="M 120 420 L 260 230 L 400 310 L 540 200 L 720 380 L 720 580 L 120 580 Z"
          fill="url(#terrainTier2)"
          opacity="0.9"
          filter="url(#shadowFilter)"
        />
        <path
          d="M 260 230 L 400 310 L 340 430 L 200 400 Z"
          fill="url(#diagonalHatch)"
          opacity="0.35"
        />

        {/* Foreground Valley & Lake Terrace (Layer 1) */}
        <path
          d="M 0 460 L 160 320 L 320 390 L 480 310 L 640 450 L 880 430 L 880 580 L 0 580 Z"
          fill="url(#terrainTier1)"
          filter="url(#shadowFilter)"
        />

        {/* Serene Lake Mirror Basin */}
        <path
          d="M 60 490 C 140 470, 240 480, 290 510 C 260 540, 150 550, 80 530 Z"
          fill="url(#lakeGrad)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Elevation Contour Badges on Canvas */}
        <g opacity="0.8" transform="translate(730, 95)">
          <rect width="64" height="20" rx="4" fill="#0E1D4F" opacity="0.85" />
          <text x="32" y="14" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="monospace">
            1,650m
          </text>
        </g>
        <g opacity="0.8" transform="translate(190, 215)">
          <rect width="64" height="20" rx="4" fill="#0E1D4F" opacity="0.85" />
          <text x="32" y="14" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="monospace">
            1,200m
          </text>
        </g>

        {/* ================================================================= */}
        {/* THE ALIGNED TRAVEL ROUTE (Golden Ribbon across terrain) */}
        {/* ================================================================= */}
        {/* Outer Glow Halo */}
        <path
          d="M 170 500 C 220 440, 270 330, 340 310 C 410 290, 460 370, 520 340 C 600 300, 660 210, 750 140"
          stroke="#08B3C6"
          strokeWidth="10"
          strokeOpacity="0.25"
          fill="none"
          strokeLinecap="round"
        />
        {/* Main Solid Route Line */}
        <path
          d="M 170 500 C 220 440, 270 330, 340 310 C 410 290, 460 370, 520 340 C 600 300, 660 210, 750 140"
          stroke="url(#routeGrad)"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Moving Dash Line */}
        <path
          d="M 170 500 C 220 440, 270 330, 340 310 C 410 290, 460 370, 520 340 C 600 300, 660 210, 750 140"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeDasharray="6 8"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* WAYPOINTS & PINS */}
        {/* Waypoint 1: Vườn ven hồ */}
        <g transform="translate(170, 500)">
          <circle r="14" fill="#08B3C6" fillOpacity="0.2" />
          <circle r="7" fill="#08B3C6" stroke="#FFFFFF" strokeWidth="2.5" />
          {/* Label Card */}
          <g transform="translate(16, -12)">
            <rect width="96" height="26" rx="6" fill="#FFFFFF" stroke="#0E1D4F" strokeWidth="1" strokeOpacity="0.12" filter="url(#shadowFilter)" />
            <text x="10" y="17" fill="#0E1D4F" fontSize="11" fontWeight="700">Vườn ven hồ</text>
          </g>
        </g>

        {/* Waypoint 2: Quán trà góc phố */}
        <g transform="translate(340, 310)">
          <circle r="14" fill="#205BD6" fillOpacity="0.2" />
          <circle r="7" fill="#205BD6" stroke="#FFFFFF" strokeWidth="2.5" />
          <g transform="translate(16, -12)">
            <rect width="78" height="26" rx="6" fill="#FFFFFF" stroke="#0E1D4F" strokeWidth="1" strokeOpacity="0.12" filter="url(#shadowFilter)" />
            <text x="10" y="17" fill="#0E1D4F" fontSize="11" fontWeight="700">Quán trà</text>
          </g>
        </g>

        {/* Waypoint 3: Nhà gỗ sườn đồi */}
        <g transform="translate(520, 340)">
          <circle r="14" fill="#205BD6" fillOpacity="0.2" />
          <circle r="7" fill="#205BD6" stroke="#FFFFFF" strokeWidth="2.5" />
          <g transform="translate(16, -12)">
            <rect width="118" height="26" rx="6" fill="#FFFFFF" stroke="#0E1D4F" strokeWidth="1" strokeOpacity="0.12" filter="url(#shadowFilter)" />
            <text x="10" y="17" fill="#0E1D4F" fontSize="11" fontWeight="700">Nhà gỗ sườn đồi</text>
          </g>
        </g>

        {/* Waypoint 4: Điểm ngắm đồi xa (Highlight Destination) */}
        <g transform="translate(750, 140)">
          <circle r="18" fill="#E7AD2E" fillOpacity="0.3" />
          <circle r="9" fill="#E7AD2E" stroke="#FFFFFF" strokeWidth="3" />
          <g transform="translate(-110, -14)">
            <rect width="102" height="28" rx="6" fill="#0E1D4F" />
            <text x="10" y="18" fill="#FFFFFF" fontSize="11" fontWeight="700">Đồi xa hoàng hôn</text>
          </g>
        </g>

        {/* Decorative Grid Axes & Compass Rose (Top Right) */}
        <g transform="translate(80, 80)" opacity="0.6">
          <circle r="22" stroke="#0E1D4F" strokeWidth="1" strokeDasharray="2 3" fill="none" />
          <path d="M 0 -20 L 4 -4 L 20 0 L 4 4 L 0 20 L -4 4 L -20 0 L -4 -4 Z" fill="#08B3C6" />
          <text x="0" y="-24" fill="#0E1D4F" fontSize="9" fontWeight="800" textAnchor="middle">N</text>
        </g>
      </svg>

      {/* Bottom Scene Legend */}
      <div className={styles.sceneFooterLegend}>
        <div className={styles.legendPill}>
          <div className={styles.legendItem}>
            <span className={styles.legendLineRoute} />
            <span>Cung đường kết nối</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendLineContour} />
            <span>Đường đồng mức địa hình</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendMarker} />
            <span>Điểm đến</span>
          </div>
        </div>
        <div className={styles.elevationBadge}>
          Mô hình địa hình số hóa · Đà Lạt Plateau
        </div>
      </div>
    </div>
  );
}

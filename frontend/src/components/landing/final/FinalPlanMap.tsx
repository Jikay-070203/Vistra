'use client';

import React from 'react';
import styles from './final-plan-map.module.css';
import { LandingPin, LandingRouteSegment } from '../landingDemo';
import Icon from '@/components/ui/Icon';

export interface FinalPlanMapProps {
  places: LandingPin[];
  edges: LandingRouteSegment[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string | null) => void;
  onHoverPlace?: (id: string | null) => void;
  keptPlaceIds?: string[];
  isConfirmed?: boolean;
  currentStepIndex?: number;
  orderedPlaces?: LandingPin[];
  isPaused?: boolean;
}

export default function FinalPlanMap({
  places,
  edges,
  selectedPlaceId,
  onSelectPlace,
  onHoverPlace,
  currentStepIndex = 0,
  orderedPlaces = [],
  isPaused = false,
}: FinalPlanMapProps) {
  const currentPin = orderedPlaces[currentStepIndex] || null;
  const currentDay = currentPin?.day ?? 1;

  return (
    <div
      className={styles.mapContainer}
      role="region"
      aria-label="Bản đồ hành trình đang diễn ra"
      onMouseLeave={() => onHoverPlace?.(null)}
      style={{
        background: 'linear-gradient(135deg, #0A1435 0%, #0F1E4A 60%, #152759 100%)',
      }}
    >
      {/* Topographic Plateau Background Layer (Synchronized with HeroGeoScene) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M -20 280 Q 80 180, 200 220 T 420 180"
          stroke="#08B3C6"
          strokeWidth="1.2"
          fill="none"
          strokeDasharray="4 4"
        />
        <path
          d="M -10 220 Q 120 120, 260 160 T 430 110"
          stroke="#205BD6"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 20 160 Q 160 80, 300 110 T 440 60"
          stroke="#08B3C6"
          strokeWidth="1"
          fill="none"
          strokeDasharray="3 5"
        />
        <ellipse cx="140" cy="180" rx="90" ry="45" stroke="#F4DB38" strokeWidth="0.8" fill="none" opacity="0.4" />
      </svg>

      {/* SVG Layer for Edges */}
      <svg
        className={styles.edgeCanvas}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="finalEdgeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#08B3C6" floodOpacity="0.6" />
          </filter>
        </defs>
        {edges.map((edge) => {
          const isEdgeCompleted = edge.dayNumber < currentDay;
          const isEdgeActive = edge.dayNumber === currentDay;
          const isEdgePending = edge.dayNumber > currentDay;

          let strokeColor = '#08B3C6';
          let strokeWidth = '1.8';
          let strokeDash = 'none';

          if (isEdgeActive) {
            strokeColor = '#F4DB38';
            strokeWidth = '2.4';
          } else if (isEdgeCompleted) {
            strokeColor = '#08B3C6';
            strokeWidth = '1.8';
          } else if (isEdgePending) {
            strokeColor = 'rgba(255, 255, 255, 0.4)';
            strokeWidth = '1.2';
            strokeDash = '3 3';
          }

          return (
            <path
              key={edge.id}
              d={edge.svgPath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              fill="none"
              strokeLinecap="round"
              filter="url(#finalEdgeGlow)"
              style={{ transition: 'all 0.4s ease' }}
            />
          );
        })}
      </svg>

      {/* Nodes Layer for Places (Clean, no text note clutter on map) */}
      {places.map((place) => {
        const isSelected = selectedPlaceId === place.id;
        const placeIndex = orderedPlaces.findIndex((p) => p.id === place.id);
        const isJourneyActive = orderedPlaces.length > 0;
        const isCurrent = isJourneyActive && placeIndex === currentStepIndex;

        return (
          <button
            key={place.id}
            data-pin-id={place.id}
            className={`${styles.pinButton} ${isSelected ? styles.pinSelected : ''}`}
            style={{ left: `${place.coords.x}%`, top: `${place.coords.y}%` }}
            onClick={() => onSelectPlace(place.id)}
            onMouseEnter={() => onHoverPlace?.(place.id)}
            onFocus={() => onHoverPlace?.(place.id)}
            aria-pressed={isSelected}
            aria-label={`${isCurrent ? 'Đang dừng chân: ' : 'Điểm đến: '}${place.name}`}
          >
            <div
              className={styles.pinIconWrapper}
              style={{
                backgroundColor: isCurrent ? '#F4DB38' : isSelected ? '#08B3C6' : '#0A1435',
                borderColor: isCurrent ? '#FFFFFF' : '#08B3C6',
                color: isCurrent ? '#0E1D4F' : '#FFFFFF',
              }}
            >
              <Icon
                name={
                  place.category === 'scenic'
                    ? 'landscape'
                    : place.category === 'dining'
                    ? 'restaurant'
                    : place.category === 'stay'
                    ? 'hotel'
                    : 'account_balance'
                }
                className={styles.pinIcon}
              />
            </div>
            <div
              className={styles.pinLabel}
              style={{
                backgroundColor: 'rgba(10, 20, 53, 0.85)',
                color: '#FFFFFF',
                borderColor: 'rgba(8, 179, 198, 0.3)',
              }}
            >
              {place.shortLabel}
            </div>
          </button>
        );
      })}

      {/* Bottom Status Overlay: Copy uses "đang" (ongoing) */}
      {orderedPlaces.length > 0 && currentPin && (
        <div
          className={styles.journeyStatusBar}
          style={{
            backgroundColor: 'rgba(10, 20, 53, 0.85)',
            borderTop: '1px solid rgba(8, 179, 198, 0.25)',
            color: '#FFFFFF',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-2 rounded-full bg-[#08B3C6] animate-pulse" />
            <span className="font-semibold text-white">
              Đang kết nối chặng {currentStepIndex + 1}/{orderedPlaces.length}: {currentPin.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#A5B4FC]">
            <Icon name={isPaused ? 'pause_circle' : 'motion_photos_on'} className="size-3.5 text-[#08B3C6]" />
            <span>{isPaused ? 'Đang tạm dừng' : 'Đang tự động chuyển tiếp'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

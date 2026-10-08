'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import styles from '../landing.module.css';
import {
  LANDING_ASSETS,
  LANDING_PINS,
  LANDING_ROUTES,
  buildRouteSegmentForDay,
  LandingPin,
  LandingRouteSegment,
  LandingTripState,
} from '../landingDemo';
import FinalPlanMap from '../final/FinalPlanMap';
import FinalPlaceDetail from '../final/FinalPlaceDetail';
import appConfig from '@/config/appConfig';

export interface FinalValueSectionProps {
  tripState?: LandingTripState;
  places?: LandingPin[];
  edges?: LandingRouteSegment[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (id: string | null) => void;
}

export default function FinalValueSection({
  tripState,
  places: propPlaces,
  edges: propEdges,
  onSelectPlace: propOnSelectPlace,
}: FinalValueSectionProps = {}) {
  // Derive active activities and pins from tripState
  const activeActivities = useMemo(() => {
    if (!tripState) return [];
    return tripState.days.flatMap((d) => d.activities).filter((a) => a.decisionStatus !== 'skipped');
  }, [tripState]);

  const selectedActivities = useMemo(() => {
    return activeActivities.filter((a) => a.decisionStatus === 'selected');
  }, [activeActivities]);

  const keptPlaceIds = useMemo(() => {
    return selectedActivities.map((a) => a.pinId);
  }, [selectedActivities]);

  const confirmedPins = useMemo(() => {
    if (propPlaces) return propPlaces;
    if (!tripState) return LANDING_PINS;
    const activePinIds = new Set(activeActivities.map((a) => a.pinId));
    if (activePinIds.size > 0) {
      return (tripState.pins ?? LANDING_PINS).filter((p) => activePinIds.has(p.id));
    }
    return tripState.pins ?? LANDING_PINS;
  }, [propPlaces, tripState, activeActivities]);

  const confirmedRoutes = useMemo(() => {
    if (propEdges) return propEdges;
    if (!tripState) return LANDING_ROUTES;
    const derived: LandingRouteSegment[] = [];
    for (const day of tripState.days) {
      const seg = buildRouteSegmentForDay(day.dayNumber as 1 | 2 | 3, day.activities, confirmedPins);
      if (seg) {
        derived.push(seg);
      }
    }
    return derived.length > 0 ? derived : LANDING_ROUTES;
  }, [propEdges, tripState, confirmedPins]);

  // Ordered destination sequence for journey progression
  const orderedPlaces = useMemo(() => {
    return [...confirmedPins].sort((a, b) => a.day - b.day);
  }, [confirmedPins]);

  // V4-008A Journey progression state
  const [journeyStepIndex, setJourneyStepIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [inspectedPlaceId, setInspectedPlaceId] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-progression effect reading directly from appConfig.journey.stepDurationMs
  useEffect(() => {
    if (isPaused || orderedPlaces.length === 0) return;

    const interval = setInterval(() => {
      setJourneyStepIndex((prev) => (prev + 1) % orderedPlaces.length);
    }, appConfig.journey.stepDurationMs);

    return () => clearInterval(interval);
  }, [isPaused, orderedPlaces.length]);

  // Pause on direct user interaction and resume after appConfig.journey.inactivityResumeDelayMs
  const triggerInteractionPause = () => {
    setIsPaused(true);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      setInspectedPlaceId(null);
    }, appConfig.journey.inactivityResumeDelayMs);
  };

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const handleHoverPlace = (id: string | null) => {
    if (id) {
      setInspectedPlaceId(id);
      triggerInteractionPause();
    } else {
      setInspectedPlaceId(null);
    }
  };

  const handleSelectPlace = (id: string | null) => {
    triggerInteractionPause();
    if (id) {
      setInspectedPlaceId(id);
      const placeIdx = orderedPlaces.findIndex((p) => p.id === id);
      if (placeIdx !== -1) {
        setJourneyStepIndex(placeIdx);
      }
    } else {
      setInspectedPlaceId(null);
    }
    propOnSelectPlace?.(id);
  };

  const handleStepJump = (idx: number) => {
    setJourneyStepIndex(idx);
    setInspectedPlaceId(orderedPlaces[idx]?.id ?? null);
    triggerInteractionPause();
  };

  const handleTogglePlayPause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    } else {
      triggerInteractionPause();
    }
  };

  // V4-008B Active place to inspect
  const currentJourneyPin = orderedPlaces[journeyStepIndex] || null;
  const activeDisplayPlace = useMemo(() => {
    if (inspectedPlaceId) {
      return confirmedPins.find((p) => p.id === inspectedPlaceId) || null;
    }
    return currentJourneyPin;
  }, [inspectedPlaceId, confirmedPins, currentJourneyPin]);

  const activeDisplayActivity = useMemo(() => {
    if (!activeDisplayPlace) return null;
    return activeActivities.find((a) => a.pinId === activeDisplayPlace.id) || null;
  }, [activeActivities, activeDisplayPlace]);

  const displayJourneyStatus = useMemo<'completed' | 'current' | 'pending'>(() => {
    if (!activeDisplayPlace) return 'pending';
    const placeIdx = orderedPlaces.findIndex((p) => p.id === activeDisplayPlace.id);
    if (placeIdx === journeyStepIndex) return 'current';
    if (placeIdx !== -1 && placeIdx < journeyStepIndex) return 'completed';
    return 'pending';
  }, [activeDisplayPlace, orderedPlaces, journeyStepIndex]);

  const displayStepNumber = useMemo(() => {
    if (!activeDisplayPlace) return 1;
    const idx = orderedPlaces.findIndex((p) => p.id === activeDisplayPlace.id);
    return idx !== -1 ? idx + 1 : journeyStepIndex + 1;
  }, [activeDisplayPlace, orderedPlaces, journeyStepIndex]);

  const isConfirmed = Boolean(tripState?.isConfirmed);

  const activeAsset = activeDisplayPlace?.id === 'pin-lake-garden' ? LANDING_ASSETS.heroInspiration : LANDING_ASSETS.finalJourney;

  return (
    <section
      id="trai-nghiem"
      className={`${styles.section} ${styles.finalSection} ${styles.sectionSpacing}`}
      aria-label="Final Value: Từ kế hoạch đến chuyến đi thật"
    >
      <div className={styles.container}>
        <div className={`${styles.grid12} items-center`}>
          {/* Left Column: Final Visual Frame (7 cols) */}
          <div className="col-span-12 lg:col-span-7">
            <div className={styles.finalSceneContainer}>
              {/* Header */}
              <div className={styles.finalSceneHeader}>
                <div className="flex items-center gap-2">
                  <span className={styles.finalSceneBadge}>
                    <Icon name={isConfirmed ? 'check_circle' : 'alt_route'} className="size-3.5" />
                    <span>
                      {isConfirmed
                        ? 'Hành trình 3 ngày đã xác nhận'
                        : tripState?.preference === 'less_travel'
                        ? 'Bản nháp 3 ngày · Ít di chuyển'
                        : 'Bản nháp 3 ngày'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePlayPause}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/80 hover:bg-white text-[#0E1D4F] border border-[#0E1D4F]/10 transition-colors"
                    aria-label={isPaused ? 'Tiếp tục hành trình tự động' : 'Tạm dừng hành trình tự động'}
                  >
                    <Icon name={isPaused ? 'play_arrow' : 'pause'} className="size-3.5 text-[#08B3C6]" />
                    <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                  </button>
                  <span className={styles.finalSceneMeta}>
                    Bản đồ kế hoạch → Con đường thực tế
                  </span>
                </div>
              </div>

              {/* Journey Steps Selector Bar */}
              <div className="px-4 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between gap-2 overflow-x-auto text-xs">
                <div className="flex items-center gap-1.5 shrink-0 text-[#475569] font-medium">
                  <Icon name="route" className="size-3.5 text-[#08B3C6]" />
                  <span>Điểm đến:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {orderedPlaces.map((p, idx) => {
                    const isCur = idx === journeyStepIndex;
                    const isDone = idx < journeyStepIndex;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleStepJump(idx)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          isCur
                            ? 'bg-[#08B3C6] text-white shadow-sm ring-2 ring-[#08B3C6]/30'
                            : isDone
                            ? 'bg-[#E2E8F0] text-[#059669] hover:bg-[#CBD5E1]'
                            : 'bg-white text-[#64748B] hover:bg-white/80 border border-[#E2E8F0]'
                        }`}
                        title={`Chuyển tới ${p.name}`}
                      >
                        {p.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Visual Stage */}
              <div className={`${styles.finalVisualStage} flex flex-col md:flex-row gap-4 p-4 !bg-[#F8F9FA] !h-auto min-h-[360px]`}>
                <div className="flex-1 min-w-0 min-h-[260px] md:min-h-[320px]">
                  <FinalPlanMap
                    places={confirmedPins}
                    edges={confirmedRoutes}
                    selectedPlaceId={activeDisplayPlace?.id ?? null}
                    onSelectPlace={handleSelectPlace}
                    onHoverPlace={handleHoverPlace}
                    keptPlaceIds={keptPlaceIds}
                    isConfirmed={isConfirmed}
                    currentStepIndex={journeyStepIndex}
                    orderedPlaces={orderedPlaces}
                    isPaused={isPaused}
                  />
                </div>
                <div className="w-full md:w-[280px] shrink-0">
                  <FinalPlaceDetail
                    place={activeDisplayPlace}
                    activity={activeDisplayActivity}
                    journeyStatus={displayJourneyStatus}
                    stepNumber={displayStepNumber}
                    totalSteps={orderedPlaces.length}
                    onClose={() => setInspectedPlaceId(null)}
                  />
                </div>
              </div>

              {/* Footer Attribution */}
              <div className={styles.finalSceneFooter}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong>Chuyển giao trực quan:</strong> {tripState?.changeNote ?? 'Nét vẽ tuyến đường trên bản đồ dẫn thẳng vào không gian chuyến đi thật.'}
                  </div>
                  {activeDisplayPlace && (
                    <div className="text-[11px] text-[#67736D] shrink-0">
                      Ảnh tư liệu: {activeAsset.attribution}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Value Summary (5 cols) */}
          <div className={`col-span-12 lg:col-span-5 ${styles.finalCopyCol}`}>
            <h2 className={styles.h2} title="Mọi mảnh ghép đang sẵn sàng.">
              Mọi mảnh ghép đang sẵn sàng.
            </h2>
            <p className={styles.body}>
              Lộ trình liền mạch, nhịp độ cân bằng và bạn luôn làm chủ chuyến đi.
            </p>

            <ul className={styles.finalPointList}>
              <li className={styles.finalPointItem}>
                <Icon name="check_circle" className={`size-5 ${styles.finalPointIcon}`} />
                <div>
                  <div className={styles.finalPointHeading}>
                    Hành trình đang mở ra
                  </div>
                  <div className={styles.finalPointDesc}>
                    Kết nối tuần tự theo nhịp độ bạn đã chọn.
                  </div>
                </div>
              </li>

              <li className={styles.finalPointItem}>
                <Icon name="forest" className={`size-5 ${styles.finalPointIcon}`} />
                <div>
                  <div className={styles.finalPointHeading}>
                    Cung đường đang vào nếp
                  </div>
                  <div className={styles.finalPointDesc}>
                    Khoảng nghỉ và nơi lưu trú hòa cùng một nhịp thở.
                  </div>
                </div>
              </li>

              <li className={styles.finalPointItem}>
                <Icon name="verified" className={`size-5 ${styles.finalPointIcon}`} />
                <div>
                  <div className={styles.finalPointHeading}>
                    Sẵn sàng cho ngày lên đường
                  </div>
                  <div className={styles.finalPointDesc}>
                    Thông tin thực địa và lưu ý thời tiết đồng bộ chuẩn xác.
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

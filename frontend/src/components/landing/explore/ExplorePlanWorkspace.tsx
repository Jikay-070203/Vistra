'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import LandingEditorialMotif from '@/components/landing/LandingEditorialMotif';
import styles from './explore-plan-workspace.module.css';
import {
  LANDING_PINS,
  LANDING_CLUSTERS,
  LANDING_ROUTES,
  type LandingPin,
} from '@/components/landing/landingDemo';

export interface ExplorePlanWorkspaceProps {
  activeBeat: 'A' | 'B' | 'C' | 'D';
  onBeatChange?: (beat: 'A' | 'B' | 'C' | 'D') => void;
  isLessTravel?: boolean;
  onToggleLessTravel?: () => void;
  previewDay?: 1 | 2 | 3;
  onSelectPreviewDay?: (day: 1 | 2 | 3) => void;
}

function getPinCategoryMeta(cat: 'scenic' | 'dining' | 'stay' | 'culture') {
  switch (cat) {
    case 'scenic':
      return { bg: '#08B3C6', text: '#FFFFFF', icon: 'landscape' as const };
    case 'dining':
      return { bg: '#E7AD2E', text: '#0E1D4F', icon: 'nightlife' as const };
    case 'stay':
      return { bg: '#205BD6', text: '#FFFFFF', icon: 'forest' as const };
    case 'culture':
      return { bg: '#0E1D4F', text: '#FFFFFF', icon: 'landscape' as const };
  }
}

export default function ExplorePlanWorkspace({
  activeBeat,
  onBeatChange,
  isLessTravel = false,
  onToggleLessTravel,
  previewDay = 1,
  onSelectPreviewDay,
}: ExplorePlanWorkspaceProps) {
  // Pinned/active interactive edge/marker detail cards (supports click/focus/tap, not hover-only)
  const [activeDetailState, setActiveDetailState] = React.useState<{
    beat: 'A' | 'B' | 'C' | 'D';
    type: 'conflict' | 'solution' | 'pin' | null;
    pin: LandingPin | null;
  }>({
    beat: activeBeat,
    type: null,
    pin: null,
  });

  const activeDetailType = activeDetailState.beat === activeBeat ? activeDetailState.type : null;
  const selectedPin = activeDetailState.beat === activeBeat ? activeDetailState.pin : null;

  const handleOpenConflict = React.useCallback(() => {
    setActiveDetailState({ beat: activeBeat, type: 'conflict', pin: null });
  }, [activeBeat]);

  const handleOpenSolution = React.useCallback(() => {
    setActiveDetailState({ beat: activeBeat, type: 'solution', pin: null });
  }, [activeBeat]);

  const handleSelectPin = React.useCallback((pin: LandingPin) => {
    setActiveDetailState({ beat: activeBeat, type: 'pin', pin });
  }, [activeBeat]);

  const handleCloseDetail = React.useCallback(() => {
    setActiveDetailState({ beat: activeBeat, type: null, pin: null });
  }, [activeBeat]);

  React.useEffect(() => {
    if (!activeDetailType) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseDetail();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDetailType, handleCloseDetail]);

  // Filter visible pins based on active beat
  const visiblePins = React.useMemo(() => {
    if (activeBeat === 'A') {
      return LANDING_PINS.filter((p) => p.day === 1);
    }
    if (activeBeat === 'B') {
      return LANDING_PINS.filter((p) => p.id === 'pin-lake-garden' || p.id === 'pin-corner-tea' || p.id === 'pin-sunset-hill');
    }
    if (activeBeat === 'C') {
      if (isLessTravel) {
        return LANDING_PINS.filter((p) => p.id === 'pin-lake-garden' || p.id === 'pin-corner-tea' || p.id === 'pin-hillside-lodge');
      }
      return LANDING_PINS.filter((p) => p.id === 'pin-lake-garden' || p.id === 'pin-corner-tea' || p.id === 'pin-sunset-hill');
    }
    // Beat D: show all pins
    return LANDING_PINS;
  }, [activeBeat, isLessTravel]);

  return (
    <div
      className={styles.workspaceContainer}
      role="region"
      aria-label="Bàn làm việc không gian và đồ thị hành trình"
    >
      {/* 1. Workspace Header Bar */}
      <header className={styles.workspaceHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconWrap} aria-hidden="true">
            <Icon name="explore" className="size-4" />
          </div>
          <div>
            <h3 className={styles.headerTitle}>
              Bàn làm việc ·{' '}
              {activeBeat === 'A'
                ? 'Gom nhặt thông tin'
                : activeBeat === 'B'
                ? 'Phát hiện xung đột'
                : activeBeat === 'C'
                ? 'Sắp xếp theo cụm'
                : 'Bản nháp 3 ngày'}
            </h3>
            <span className={styles.headerSub}>
              {activeBeat === 'A' && '5 mảnh thông tin rời rạc · Ma trận liên kết tiềm năng'}
              {activeBeat === 'B' && '1 xung đột cung đường: Quãng di chuyển quá xa'}
              {activeBeat === 'C' && (isLessTravel ? 'Đã áp dụng ưu tiên: Gom cụm ven hồ' : 'Lộ trình gốc trải rộng')}
              {activeBeat === 'D' && 'Bản nháp 3 ngày · Nhãn AI đề xuất'}
            </span>
          </div>
        </div>

        {/* Quick Beat Selector Tabs & Day Picker */}
        <div className="flex items-center gap-2">
          {activeBeat === 'C' && onToggleLessTravel && (
            <button
              type="button"
              onClick={onToggleLessTravel}
              className={`${styles.mapQuickToggle} ${isLessTravel ? styles.mapQuickToggleActive : ''}`}
              aria-pressed={isLessTravel}
              title={isLessTravel ? 'Bỏ chọn Ít di chuyển' : 'Bật ưu tiên Ít di chuyển'}
            >
              <Icon name="swap_horiz" className="size-3.5" />
              <span>{isLessTravel ? 'Ít di chuyển: Bật' : 'Tối ưu gom cụm'}</span>
            </button>
          )}

          {activeBeat === 'D' && onSelectPreviewDay && (
            <div className={styles.quickDayGroup} role="group" aria-label="Xem cung đường theo ngày">
              {([1, 2, 3] as const).map((d) => (
                <button
                  key={`quick-day-${d}`}
                  type="button"
                  onClick={() => onSelectPreviewDay(d)}
                  className={`${styles.quickDayBtn} ${previewDay === d ? styles.quickDayBtnActive : ''}`}
                  aria-pressed={previewDay === d}
                  title={`Xem cung đường Ngày ${d}`}
                >
                  N{d}
                </button>
              ))}
            </div>
          )}

          {onBeatChange && (
            <div className={styles.quickBeatTabs} role="group" aria-label="Phím tắt chuyển Beat">
              {(['A', 'B', 'C', 'D'] as const).map((beat) => (
                <button
                  key={`quick-beat-${beat}`}
                  type="button"
                  aria-pressed={activeBeat === beat}
                  onClick={() => onBeatChange(beat)}
                  className={`${styles.quickBeatBtn} ${activeBeat === beat ? styles.quickBeatBtnActive : ''}`}
                  title={`Chuyển sang Beat ${beat}`}
                >
                  {beat}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 2. Interactive Map Stage (SVG Vector Layer + HTML Nodes) */}
      <div className={styles.mapStage}>
        {/* Background Grid Pattern & Editorial Watermark */}
        <div className={styles.mapBackgroundPattern} aria-hidden="true" />
        <div className={styles.watermarkMotif} aria-hidden="true">
          <LandingEditorialMotif variant="terrain" width={140} height={80} />
        </div>

        {/* ==================================================================
            SVG VECTOR ROUTES & TOPOLOGICAL EDGES
            ================================================================== */}
        <svg
          aria-hidden="true"
          className={styles.svgLayer}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* BEAT A: Potential Matrix Edges (Dotted unorganized network) */}
          {activeBeat === 'A' && (
            <g className={styles.matrixNetworkGroup}>
              {/* Subtle potential relationship matrix */}
              <line x1="26" y1="34" x2="38" y2="42" stroke="#9DD8E2" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="38" y1="42" x2="78" y2="18" stroke="#9DD8E2" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />
              <line x1="26" y1="34" x2="32" y2="54" stroke="#9DD8E2" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="38" y1="42" x2="32" y2="54" stroke="#9DD8E2" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="32" y1="54" x2="78" y2="18" stroke="#9DD8E2" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.4" />
            </g>
          )}

          {/* BEAT B: Connected draft route with highlighted Conflict Tension Edge */}
          {activeBeat === 'B' && (
            <g className={styles.beatBRouteGroup}>
              {/* Safe segment: Lake to Tea */}
              <path
                d="M 26 34 Q 32 38 38 42"
                fill="none"
                stroke="#205BD6"
                strokeWidth="2.5"
              />
              {/* Conflict segment: Tea to Sunset Hill (Amber/Terracotta warning dashed) */}
              <path
                d="M 38 42 T 78 18"
                fill="none"
                stroke="#B96E52"
                strokeWidth="3.2"
                strokeDasharray="4 3"
                className={styles.conflictPathStroke}
              />
            </g>
          )}

          {/* BEAT C: Optimized Route based on isLessTravel */}
          {activeBeat === 'C' && (
            <g className={styles.beatCRouteGroup}>
              {isLessTravel ? (
                <>
                  {/* Abandoned ghost route (faint dashed gray) */}
                  <path
                    d={LANDING_ROUTES[0].svgPath}
                    fill="none"
                    stroke="#DEDCD2"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  {/* Active compact route: Lake -> Tea -> Lodge (Turquoise / Mint solid) */}
                  <path
                    d={LANDING_ROUTES[1].svgPath}
                    fill="none"
                    stroke="#08B3C6"
                    strokeWidth="3.2"
                    className={styles.optimizedPathStroke}
                  />
                  {/* Day 2 and Day 3 faint routes */}
                  <path
                    d={LANDING_ROUTES[2].svgPath}
                    fill="none"
                    stroke="#9DD8E2"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.7"
                  />
                  <path
                    d={LANDING_ROUTES[3].svgPath}
                    fill="none"
                    stroke="#9DD8E2"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.7"
                  />
                </>
              ) : (
                <>
                  {/* Wide initial draft with tension */}
                  <path
                    d={LANDING_ROUTES[0].svgPath}
                    fill="none"
                    stroke="#B96E52"
                    strokeWidth="2.8"
                    strokeDasharray="4 3"
                  />
                </>
              )}
            </g>
          )}

          {/* BEAT D: Full 3-Day Connected Plan Itinerary */}
          {activeBeat === 'D' && (
            <g className={styles.beatDRouteGroup}>
              {/* Day 1: Matching current preference */}
              <path
                d={isLessTravel ? LANDING_ROUTES[1].svgPath : LANDING_ROUTES[0].svgPath}
                fill="none"
                stroke="#205BD6"
                strokeWidth={previewDay === 1 ? '3.5' : '2'}
                strokeOpacity={previewDay === 1 ? '1' : '0.45'}
                strokeLinecap="round"
              />
              {/* Day 2: Lodge -> Village -> Workshop (Warm Amber) */}
              <path
                d={LANDING_ROUTES[2].svgPath}
                fill="none"
                stroke="#E7AD2E"
                strokeWidth={previewDay === 2 ? '3.5' : '2'}
                strokeOpacity={previewDay === 2 ? '1' : '0.45'}
                strokeLinecap="round"
              />
              {/* Day 3: Lodge -> Pine Ridge -> Horizon (Emerald Sage) */}
              <path
                d={LANDING_ROUTES[3].svgPath}
                fill="none"
                stroke="#3D684F"
                strokeWidth={previewDay === 3 ? '3.5' : '2'}
                strokeOpacity={previewDay === 3 ? '1' : '0.45'}
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
              {/* Horizon Arrow head */}
              <polygon points="96,38 100,40 96,42" fill="#3D684F" opacity={previewDay === 3 ? '1' : '0.45'} />
            </g>
          )}
        </svg>

        {/* ==================================================================
            HTML PINS & INTERACTIVE NODES (Positioned by % coordinates)
            ================================================================== */}
        <div className={styles.nodesOverlay}>
          {/* BEAT A: Dispersed Fragment Cards */}
          {activeBeat === 'A' && (
            <>
              {LANDING_CLUSTERS.map((cluster) => (
                <div
                  key={cluster.id}
                  className={`${styles.clusterCard} ${cluster.status === 'conflicted' ? styles.clusterConflicted : ''}`}
                  style={{ left: `${cluster.position.x}%`, top: `${cluster.position.y}%` }}
                >
                  <div className={styles.clusterBadge}>{cluster.badge}</div>
                  <div className={styles.clusterTitle}>{cluster.title}</div>
                  <div className={styles.clusterSnippet}>{cluster.snippet}</div>
                </div>
              ))}
            </>
          )}

          {/* BEATS B, C, D: Geographic Pins */}
          {activeBeat !== 'A' &&
            visiblePins.map((pin) => {
              const meta = getPinCategoryMeta(pin.category);
              const isSunset = pin.id === 'pin-sunset-hill';
              const isSelected = selectedPin?.id === pin.id;
              const isDayActive = activeBeat === 'D' ? pin.day === previewDay : true;

              return (
                <div
                  key={pin.id}
                  className={`${styles.pinNode} ${isSunset && activeBeat === 'B' ? styles.pinNodeWarning : ''} ${isSelected ? styles.pinNodeSelected : ''}`}
                  style={{
                    left: `${pin.coords.x}%`,
                    top: `${pin.coords.y}%`,
                    opacity: isDayActive ? 1 : 0.45,
                    transition: 'opacity 0.2s, transform 0.2s',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectPin(pin)}
                    className={styles.pinButton}
                    aria-label={`Điểm dừng: ${pin.name} (${pin.category})`}
                    style={{ backgroundColor: isSunset && activeBeat === 'B' ? '#B96E52' : meta.bg }}
                  >
                    <Icon name={meta.icon} className="size-3.5 text-white" />
                  </button>

                  <div className={styles.pinLabelWrap}>
                    <span className={styles.pinShortLabel}>{pin.shortLabel}</span>
                    <span className={styles.pinFullName}>{pin.name}</span>
                  </div>
                </div>
              );
            })}

          {/* BEAT B: Interactive Conflict Trigger Edge Button on the map */}
          {activeBeat === 'B' && (
            <button
              type="button"
              id="trigger-conflict-detail"
              onClick={handleOpenConflict}
              onMouseEnter={handleOpenConflict}
              onFocus={handleOpenConflict}
              className={styles.conflictEdgeTrigger}
              style={{ left: '58%', top: '30%' }}
              aria-label="Xem cảnh báo xung đột chặng Quán trà đến Đồi xa"
              aria-expanded={activeDetailType === 'conflict'}
              aria-controls="explore-edge-detail"
            >
              <Icon name="info" className="size-3.5 text-[#B96E52]" />
              <span>Chặng xa: Đường đèo tách biệt</span>
            </button>
          )}

          {/* BEAT C: Interactive Solution Trigger Edge Button on the map */}
          {activeBeat === 'C' && (
            <button
              type="button"
              id="trigger-solution-detail"
              onClick={handleOpenSolution}
              onMouseEnter={handleOpenSolution}
              onFocus={handleOpenSolution}
              className={styles.solutionEdgeTrigger}
              style={{ left: '34%', top: '48%' }}
              aria-label="Xem giải pháp tối ưu tuyến đường gom cụm"
              aria-expanded={activeDetailType === 'solution'}
              aria-controls="explore-edge-detail"
            >
              <Icon name="check_circle" className="size-3.5 text-[#08B3C6]" />
              <span>Cụm tối ưu: Thu gọn bán kính</span>
            </button>
          )}
        </div>

        {/* ==================================================================
            INTERACTIVE OVERLAY CARDS (Supports Click / Focus / Tap & Dismiss)
            ================================================================== */}
        {activeDetailType === 'conflict' && (
          <aside id="explore-edge-detail" className={styles.detailPopupCard} role="dialog" aria-label="Chi tiết xung đột lộ trình">
            <div className={styles.popupHeader}>
              <div className="flex items-center gap-2">
                <div className={styles.popupIconWarning}>
                  <Icon name="info" className="size-4 text-[#B96E52]" />
                </div>
                <h4 className={styles.popupTitle}>Xung đột di chuyển: Đồi xa</h4>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className={styles.popupCloseBtn}
                aria-label="Đóng chi tiết xung đột"
              >
                ×
              </button>
            </div>
            <p className={styles.popupBody}>
              Điểm ngắm hoàng hôn đồi xa nằm tách biệt khu trung tâm và đòi hỏi cung đường đèo dốc quanh co. Ghé điểm này sau bữa trưa sẽ khiến buổi chiều bị dồn toa, phát sinh chặng quay đầu và mất thời gian thư thả nghỉ ngơi.
            </p>
            <div className={styles.popupFooter}>
              <span className={styles.popupTag}>Gợi ý: Gom cụm gần hồ ở Beat C</span>
            </div>
          </aside>
        )}

        {activeDetailType === 'solution' && (
          <aside id="explore-edge-detail" className={styles.detailPopupCard} role="dialog" aria-label="Chi tiết giải pháp tối ưu">
            <div className={styles.popupHeader}>
              <div className="flex items-center gap-2">
                <div className={styles.popupIconSuccess}>
                  <Icon name="check_circle" className="size-4 text-[#08B3C6]" />
                </div>
                <h4 className={styles.popupTitle}>Giải pháp tối ưu cụm không gian</h4>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className={styles.popupCloseBtn}
                aria-label="Đóng chi tiết giải pháp"
              >
                ×
              </button>
            </div>
            <p className={styles.popupBody}>
              VISTRA đề xuất gom Vườn ven hồ và Quán trà vào cùng buổi sáng trong cụm ven hồ, chuyển buổi chiều về nhận phòng thư thái tại Nhà gỗ sườn đồi thay vì di chuyển chặng xa.
            </p>
            <div className={styles.popupFooter}>
              <span className={styles.popupTagSuccess}>Thu gọn cung đường di chuyển · Thêm thời gian nghỉ ngơi</span>
            </div>
          </aside>
        )}

        {activeDetailType === 'pin' && selectedPin && (
          <aside id="explore-edge-detail" className={styles.detailPopupCard} role="dialog" aria-label={`Chi tiết điểm: ${selectedPin.name}`}>
            <div className={styles.popupHeader}>
              <div className="flex items-center gap-2">
                <div
                  className={styles.popupIconCategory}
                  style={{ backgroundColor: getPinCategoryMeta(selectedPin.category).bg }}
                >
                  <Icon name={getPinCategoryMeta(selectedPin.category).icon} className="size-3.5 text-white" />
                </div>
                <div>
                  <h4 className={styles.popupTitle}>{selectedPin.name}</h4>
                  <span className={styles.popupSub}>Ngày {selectedPin.day} · {selectedPin.category}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className={styles.popupCloseBtn}
                aria-label="Đóng chi tiết điểm dừng"
              >
                ×
              </button>
            </div>
            <p className={styles.popupBody}>{selectedPin.description}</p>
          </aside>
        )}

        {/* 3. Canvas Footer Legend */}
        <div className={styles.mapLegendBar}>
          <div className={styles.legendItems}>
            <div className={styles.legendItem}>
              <span className={styles.legendDotScenic} />
              <span>Cảnh quan</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDotDining} />
              <span>Ẩm thực</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDotStay} />
              <span>Lưu trú</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDotCulture} />
              <span>Văn hóa</span>
            </div>
          </div>
          <span className={styles.legendNote}>
            Hỗ trợ xây dựng kế hoạch thông minh
          </span>
        </div>
      </div>
    </div>
  );
}

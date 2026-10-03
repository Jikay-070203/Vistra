'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import styles from './explore-analysis-rail.module.css';
import {
  LANDING_PINS,
  LANDING_CLUSTERS,
  buildDays,
  type LandingDay,
} from '@/components/landing/landingDemo';

export interface ExploreAnalysisRailProps {
  activeBeat: 'A' | 'B' | 'C' | 'D';
  onBeatChange: (beat: 'A' | 'B' | 'C' | 'D') => void;
  isLessTravel?: boolean;
  onToggleLessTravel?: () => void;
  previewDay?: 1 | 2 | 3;
  onSelectPreviewDay?: (day: 1 | 2 | 3) => void;
  previewDays?: LandingDay[];
  onKeyDownTab?: (e: React.KeyboardEvent, currentBeat: 'A' | 'B' | 'C' | 'D') => void;
}

export default function ExploreAnalysisRail({
  activeBeat,
  onBeatChange,
  isLessTravel = false,
  onToggleLessTravel,
  previewDay = 1,
  onSelectPreviewDay,
  previewDays,
  onKeyDownTab,
}: ExploreAnalysisRailProps) {
  const [showClusterDetail, setShowClusterDetail] = React.useState<boolean>(false);
  const sunsetPin = LANDING_PINS.find((p) => p.id === 'pin-sunset-hill');

  const daysData = React.useMemo(() => {
    return previewDays ?? buildDays(isLessTravel ? 'less_travel' : 'default');
  }, [previewDays, isLessTravel]);

  const currentPreviewDay = React.useMemo(() => {
    return daysData.find((d) => d.dayNumber === previewDay) ?? daysData[0];
  }, [daysData, previewDay]);

  const beatsList: Array<'A' | 'B' | 'C' | 'D'> = React.useMemo(() => ['A', 'B', 'C', 'D'], []);

  const handleKeyDownTab = React.useCallback(
    (e: React.KeyboardEvent, currentBeat: 'A' | 'B' | 'C' | 'D') => {
      if (onKeyDownTab) {
        onKeyDownTab(e, currentBeat);
        return;
      }
      const idx = beatsList.indexOf(currentBeat);
      let nextIdx = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIdx = (idx + 1) % beatsList.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIdx = (idx - 1 + beatsList.length) % beatsList.length;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = beatsList.length - 1;
      }
      if (nextIdx !== -1) {
        e.preventDefault();
        const targetBeat = beatsList[nextIdx];
        onBeatChange(targetBeat);
        const targetBtn = document.getElementById(`tab-beat-${targetBeat.toLowerCase()}`);
        targetBtn?.focus();
      }
    },
    [beatsList, onBeatChange, onKeyDownTab]
  );

  return (
    <div
      className={styles.railContainer}
      role="region"
      aria-label="Khung phân tích và điều hướng 4 Beat"
    >
      {/* 1. Beat Tabs Bar */}
      <div className={styles.beatNav} role="tablist" aria-label="Các bước kết nối thông tin (4 Beat)">
        <button
          type="button"
          id="tab-beat-a"
          role="tab"
          aria-selected={activeBeat === 'A'}
          aria-controls="beat-panel-content"
          tabIndex={activeBeat === 'A' ? 0 : -1}
          onClick={() => onBeatChange('A')}
          onKeyDown={(e) => handleKeyDownTab(e, 'A')}
          className={`${styles.beatTab} ${activeBeat === 'A' ? styles.beatTabActive : ''}`}
        >
          <span className={styles.tabNumber}>01</span>
          <span className={styles.tabTitle}>Tìm</span>
        </button>

        <button
          type="button"
          id="tab-beat-b"
          role="tab"
          aria-selected={activeBeat === 'B'}
          aria-controls="beat-panel-content"
          tabIndex={activeBeat === 'B' ? 0 : -1}
          onClick={() => onBeatChange('B')}
          onKeyDown={(e) => handleKeyDownTab(e, 'B')}
          className={`${styles.beatTab} ${activeBeat === 'B' ? styles.beatTabActive : ''}`}
        >
          <span className={styles.tabNumber}>02</span>
          <span className={styles.tabTitle}>Cân đối</span>
        </button>

        <button
          type="button"
          id="tab-beat-c"
          role="tab"
          aria-selected={activeBeat === 'C'}
          aria-controls="beat-panel-content"
          tabIndex={activeBeat === 'C' ? 0 : -1}
          onClick={() => onBeatChange('C')}
          onKeyDown={(e) => handleKeyDownTab(e, 'C')}
          className={`${styles.beatTab} ${activeBeat === 'C' ? styles.beatTabActive : ''}`}
        >
          <span className={styles.tabNumber}>03</span>
          <span className={styles.tabTitle}>Sắp xếp</span>
        </button>

        <button
          type="button"
          id="tab-beat-d"
          role="tab"
          aria-selected={activeBeat === 'D'}
          aria-controls="beat-panel-content"
          tabIndex={activeBeat === 'D' ? 0 : -1}
          onClick={() => onBeatChange('D')}
          onKeyDown={(e) => handleKeyDownTab(e, 'D')}
          className={`${styles.beatTab} ${activeBeat === 'D' ? styles.beatTabActive : ''}`}
        >
          <span className={styles.tabNumber}>04</span>
          <span className={styles.tabTitle}>Bản nháp</span>
        </button>
      </div>

      {/* 2. Beat Body Panel */}
      <div
        id="beat-panel-content"
        role="tabpanel"
        aria-labelledby={`tab-beat-${activeBeat.toLowerCase()}`}
        className={styles.railBody}
      >
        {/* ====================================================================
            BEAT A: TÌM KIẾM THÔNG TIN RỜI RẠC
            ==================================================================== */}
        {activeBeat === 'A' && (
          <div className={styles.beatCard}>
            <div className={styles.beatHeader}>
              <span className={`${styles.badge} ${styles.badgeA}`}>
                <Icon name="search" className="size-3.5" />
                <span>Beat A · Tìm kiếm</span>
              </span>
              <span className={styles.stepIndicator}>Bước 1/4</span>
            </div>

            <h3 className={styles.beatTitle}>
              Nhiều ý tưởng, chưa thành lộ trình.
            </h3>

            <p className={styles.beatDescription}>
              Ảnh cảm hứng, nơi ăn chốn ở và điểm ngắm cảnh còn phân tán rời rạc.
            </p>

            {/* Structured Fragments Matrix List */}
            <div className={styles.fragmentListGroup}>
              <div className={styles.fragmentListHeader}>
                <span className={styles.groupLabel}>5 mảnh thông tin đầu vào:</span>
                <button
                  type="button"
                  onClick={() => setShowClusterDetail((prev) => !prev)}
                  className={styles.disclosureBtn}
                  aria-expanded={showClusterDetail}
                >
                  <Icon name={showClusterDetail ? 'expand_less' : 'expand_more'} className="size-3.5" />
                  <span>{showClusterDetail ? 'Thu gọn' : 'Xem chi tiết'}</span>
                </button>
              </div>

              <div className={styles.fragmentChips}>
                {LANDING_CLUSTERS.map((cl) => (
                  <div key={cl.id} className={styles.fragmentChip}>
                    <Icon name="location_on" className="size-3 text-[#08B3C6]" />
                    <span className="font-medium">{cl.title}</span>
                    <span className={styles.chipSub}>({cl.badge})</span>
                  </div>
                ))}
              </div>

              {/* Collapsible details for full inspection */}
              {showClusterDetail && (
                <div className={styles.clusterDetailsAccordion}>
                  {LANDING_CLUSTERS.map((cl) => (
                    <div key={`detail-${cl.id}`} className={styles.clusterDetailItem}>
                      <span className={styles.clusterDetailTitle}>{cl.title}:</span>
                      <span className={styles.clusterDetailText}>{cl.snippet}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className={styles.railFooter}>
              <span className={styles.footerNote}>5 tín hiệu đang chờ kết nối</span>
              <button
                type="button"
                onClick={() => onBeatChange('B')}
                className={styles.btnNext}
                aria-label="Chuyển sang Beat B: Xem xung đột phát hiện"
              >
                <span>Xem xung đột phát hiện</span>
                <Icon name="arrow_forward" className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            BEAT B: SO SÁNH VÀ CÂN ĐỐI (XUNG ĐỘT)
            ==================================================================== */}
        {activeBeat === 'B' && (
          <div className={styles.beatCard}>
            <div className={styles.beatHeader}>
              <span className={`${styles.badge} ${styles.badgeB}`}>
                <Icon name="compare_arrows" className="size-3.5" />
                <span>Beat B · So sánh &amp; Cân đối</span>
              </span>
              <span className={styles.stepIndicator}>Bước 2/4</span>
            </div>

            <h3 className={styles.beatTitle}>
              Nhận diện xung đột thời gian.
            </h3>

            <p className={styles.beatDescription}>
              Điểm ngắm hoàng hôn ({sunsetPin?.name}) ở xa cụm ven hồ, dễ gây gấp gáp vào buổi chiều.
            </p>

            {/* Conflict Alert Box with clear visual prominence */}
            <div className={styles.conflictCard} role="alert">
              <div className={styles.conflictCardHeader}>
                <div className={styles.conflictIconWrap}>
                  <Icon name="info" className="size-4 text-[#B96E52]" />
                </div>
                <div>
                  <h4 className={styles.conflictCardTitle}>
                    Xung đột phát hiện: Di chuyển xa · Thiếu khoảng nghỉ
                  </h4>
                  <span className={styles.conflictCardMeta}>
                    Chặng Quán trà → Đồi xa: Đường đèo dốc sau bữa trưa
                  </span>
                </div>
              </div>
              <p className={styles.conflictCardBody}>
                Nếu giữ cả 3 điểm trong ngày đầu, bạn sẽ tốn nhiều thời gian di chuyển giữa các điểm, phá vỡ mong muốn “thư thả, không chạy show” ban đầu.
              </p>
            </div>

            {/* Edge detail hint */}
            <div className={styles.interactiveHint}>
              <Icon name="touch_app" className="size-3.5 text-[#205BD6]" />
              <span>Bấm vào nét đứt màu cam trên bản đồ để xem chi tiết xung đột</span>
            </div>

            {/* Footer Navigation */}
            <div className={styles.railFooter}>
              <button
                type="button"
                onClick={() => onBeatChange('A')}
                className={styles.btnBack}
                aria-label="Quay lại Beat A: Tìm"
              >
                <Icon name="arrow_back" className="size-4" />
                <span>Tìm</span>
              </button>
              <button
                type="button"
                onClick={() => onBeatChange('C')}
                className={styles.btnNext}
                aria-label="Chuyển sang Beat C: Tối ưu lộ trình"
              >
                <span>Tối ưu lộ trình</span>
                <Icon name="arrow_forward" className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            BEAT C: SẮP XẾP VÀ TÍNH LẠI (TỐI ƯU CỤM)
            ==================================================================== */}
        {activeBeat === 'C' && (
          <div className={styles.beatCard}>
            <div className={styles.beatHeader}>
              <span className={`${styles.badge} ${styles.badgeC}`}>
                <Icon name="tune" className="size-3.5" />
                <span>Beat C · Sắp xếp &amp; Tính lại</span>
              </span>
              <span className={styles.stepIndicator}>Bước 3/4</span>
            </div>

            <h3 className={styles.beatTitle}>
              Gom cụm và cân bằng lộ trình.
            </h3>

            <p className={styles.beatDescription}>
              Gom các điểm gần nhau theo ngày, chừa khoảng nghỉ để nhịp đi thư thái.
            </p>

            {/* Problem & Solution Comparison Box */}
            <div className={styles.solutionCard}>
              <div className={styles.solutionRow}>
                <span className={styles.solutionLabelProblem}>Vấn đề ban đầu:</span>
                <span className={styles.solutionText}>3 điểm phân tán rộng, chặng đồi xa gây áp lực thời gian.</span>
              </div>
              <div className={styles.solutionRow}>
                <span className={styles.solutionLabelSuccess}>Giải pháp tối ưu:</span>
                <span className={styles.solutionText}>
                  Gom 2 điểm gần hồ vào buổi sáng, chiều nhận phòng thư thả tại Nhà gỗ sườn đồi.
                </span>
              </div>
            </div>

            {/* Interactive Preference Toggle Button */}
            {onToggleLessTravel && (
              <div className={styles.preferenceToggleContainer}>
                <div className={styles.preferenceToggleHeader}>
                  <span className="text-xs font-bold text-[#0E1D4F]">Tùy chọn ưu tiên:</span>
                  <span className={styles.preferenceStatusTag}>
                    {isLessTravel ? 'Đang bật tối ưu' : 'Bản nháp gốc'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleLessTravel}
                  className={`${styles.preferenceButton} ${
                    isLessTravel ? styles.preferenceButtonActive : styles.preferenceButtonInactive
                  }`}
                  aria-pressed={isLessTravel}
                >
                  <Icon name={isLessTravel ? 'check_circle' : 'add_circle'} className="size-4" />
                  <span>Ưu tiên &ldquo;Ít di chuyển&rdquo; {isLessTravel ? '(Đã áp dụng)' : '(Bấm để áp dụng)'}</span>
                </button>
                <p className={styles.preferenceHint}>
                  {isLessTravel
                    ? 'Bản đồ bên phải đã vẽ lại tuyến đường êm dịu: gom 2 điểm gần hồ, chiều nhận phòng thư thả.'
                    : 'Bấm để gom cụm điểm gần và loại bỏ chặng di chuyển dài sang đồi xa.'}
                </p>
              </div>
            )}

            {/* Footer Navigation */}
            <div className={styles.railFooter}>
              <button
                type="button"
                onClick={() => onBeatChange('B')}
                className={styles.btnBack}
                aria-label="Quay lại Beat B: Cân đối"
              >
                <Icon name="arrow_back" className="size-4" />
                <span>Cân đối</span>
              </button>
              <button
                type="button"
                onClick={() => onBeatChange('D')}
                className={styles.btnNext}
                aria-label="Chuyển sang Beat D: Xem bản nháp 3 ngày"
              >
                <span>Xem bản nháp 3 ngày</span>
                <Icon name="arrow_forward" className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            BEAT D: BẢN NHÁP HOÀN THIỆN 3 NGÀY
            ==================================================================== */}
        {activeBeat === 'D' && (
          <div className={styles.beatCard}>
            <div className={styles.beatHeader}>
              <span className={`${styles.badge} ${styles.badgeD}`}>
                <Icon name="auto_fix_high" className="size-3.5" />
                <span>Beat D · Bản nháp 3 ngày</span>
              </span>
              <span className={styles.stepIndicator}>Bước 4/4</span>
            </div>

            <h3 className={styles.beatTitle}>
              Một bản nháp liền mạch.
            </h3>

            <p className={styles.beatDescription}>
              3 ngày đã nối tuyến rõ ràng, sẵn sàng để bạn tinh chỉnh từng chặng.
            </p>

            {/* Day Selector Pills for Beat D */}
            <div className={styles.daySelectorGroup} role="group" aria-label="Xem hoạt động theo từng ngày">
              {daysData.map((d) => (
                <button
                  key={d.dayNumber}
                  type="button"
                  onClick={() => onSelectPreviewDay?.(d.dayNumber as 1 | 2 | 3)}
                  className={`${styles.dayPill} ${
                    previewDay === d.dayNumber ? styles.dayPillActive : ''
                  }`}
                  aria-pressed={previewDay === d.dayNumber}
                >
                  <span className={styles.dayPillNum}>Ngày {d.dayNumber}</span>
                  <span className={styles.dayPillPace}>{d.pace.split('·')[0]}</span>
                </button>
              ))}
            </div>

            {/* Active Day Activities List Summary */}
            <div className={styles.dayPreviewCard}>
              <div className={styles.dayPreviewHeader}>
                <span className={styles.dayPreviewTitle}>{currentPreviewDay.dayTitle}</span>
                <span className={styles.dayPreviewHighlight}>{currentPreviewDay.highlight}</span>
              </div>
              <div className={styles.activityTimelineList}>
                {currentPreviewDay.activities.map((act) => (
                  <div key={act.id} className={styles.timelineItem}>
                    <div className={styles.timelineBullet} />
                    <div className={styles.timelineInfo}>
                      <div className="flex items-center justify-between gap-1">
                        <span className={styles.actTitle}>{act.title}</span>
                        <span className={styles.actTime}>{act.timeLabel}</span>
                      </div>
                      <span className={styles.actLocation}>{act.locationName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Authority Reassurance Notice */}
            <div className={styles.reassuranceNote}>
              <Icon name="verified_user" className="size-4 text-[#E7AD2E]" />
              <span>AI chuẩn bị điểm bắt đầu. Bạn quyết định điều gì đáng giữ lại.</span>
            </div>

            {/* Footer Navigation */}
            <div className={styles.railFooter}>
              <button
                type="button"
                onClick={() => onBeatChange('C')}
                className={styles.btnBack}
                aria-label="Quay lại Beat C: Sắp xếp"
              >
                <Icon name="arrow_back" className="size-4" />
                <span>Sắp xếp</span>
              </button>
              <a
                href="#cung-xay"
                className={styles.btnProceed}
                aria-label="Chuyển sang Chặng 02: Cùng xây lịch trình"
              >
                <span>Cùng chỉnh kế hoạch</span>
                <Icon name="arrow_forward" className="size-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import styles from './confirm-day-review.module.css';
import type { LandingActivity, LandingDay } from '@/components/landing/landingDemo';

export interface ConfirmDayReviewProps {
  days: LandingDay[];
  currentDayNumber: 1 | 2 | 3;
  onSelectDay: (day: 1 | 2 | 3) => void;
  view: 'cautions' | 'all';
  onViewChange?: (view: 'cautions' | 'all') => void;
  activeReasonPickerId: string | null;
  onStartEditing: (act: LandingActivity) => void;
  onToggleReasonPicker: (actId: string) => void;
  onCloseReasonPicker: () => void;
  onRequestAlternativeWithReason: (
    actId: string,
    reason: 'too_dense' | 'high_cost' | 'not_preferred'
  ) => void;
  onViewTradeoffs?: () => void;
  className?: string;
}

/**
 * Helper to determine if an activity has a caution flag or trade-off applied.
 */
export function isCautionOrTradeoff(act: LandingActivity): boolean {
  if (act.decisionStatus === 'skipped') return false;
  return (
    act.reviewFlag === 'needs_review' ||
    act.decisionStatus === 'swapped' ||
    Boolean(act.isAlternative)
  );
}

/**
 * ConfirmDayReview Component (Task LP-14B)
 * Controlled workspace for reviewing itinerary details by day, highlighting caution reasons,
 * chosen trade-offs, and providing single-click jump back to Cùng xây for partial edits.
 * 
 * Acceptance Criteria & Constraints:
 * - Stable desktop height, maximum ONE internal scroll container.
 * - Selecting days via keyboard tabs / accordion or mobile dropdown.
 * - Does not claim or imply caution view has reviewed or approved the whole plan.
 * - Clear empty state when no caution exists for the chosen day.
 * - Status conveyed by labels, icons, and text (never color alone).
 */
export default function ConfirmDayReview({
  days,
  currentDayNumber,
  onSelectDay,
  view,
  onViewChange,
  activeReasonPickerId,
  onStartEditing,
  onToggleReasonPicker,
  onCloseReasonPicker,
  onRequestAlternativeWithReason,
  onViewTradeoffs,
  className,
}: ConfirmDayReviewProps) {
  const currentDay = React.useMemo(() => {
    return days.find((d) => d.dayNumber === currentDayNumber) ?? days[0];
  }, [days, currentDayNumber]);

  // Filter activities based on active view mode
  const displayedActivities = React.useMemo(() => {
    if (!currentDay) return [];
    if (view === 'cautions') {
      return currentDay.activities.filter(isCautionOrTradeoff);
    }
    return currentDay.activities;
  }, [currentDay, view]);

  // Calculate counts per day for badge display
  const dayCounts = React.useMemo(() => {
    return days.reduce((acc, d) => {
      const cautions = d.activities.filter(isCautionOrTradeoff).length;
      const all = d.activities.length;
      acc[d.dayNumber] = { cautions, all };
      return acc;
    }, {} as Record<number, { cautions: number; all: number }>);
  }, [days]);

  // Tab keyboard navigation
  const dayTabRefs = React.useRef<Record<number, HTMLButtonElement | null>>({});

  const handleKeyDownDayTabs = (e: React.KeyboardEvent, currentDayNum: 1 | 2 | 3) => {
    const dayNums: Array<1 | 2 | 3> = [1, 2, 3];
    const currentIndex = dayNums.indexOf(currentDayNum);
    let nextIndex = -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % dayNums.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + dayNums.length) % dayNums.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = dayNums.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const targetDay = dayNums[nextIndex];
      onSelectDay(targetDay);
      dayTabRefs.current[targetDay]?.focus();
    }
  };

  const isCautionsView = view === 'cautions';

  return (
    <div
      id="panel-confirm-day-review"
      className={`${styles.dayReviewWorkspace} ${className || ''}`}
      role="region"
      aria-label="Khu vực rà soát chi tiết theo ngày"
    >
      {/* ------------------------------------------------------------------
         Day Selector Bar: Accessible Tabs / Dropdown
         ------------------------------------------------------------------ */}
      <div className={styles.daySelectorHeader}>
        <div className={styles.daySelectorRow}>
          <div className={styles.daySelectorLabel}>
            <Icon name="calendar_month" className="size-3.5 text-[#205BD6]" />
            <span>Chọn ngày rà soát:</span>
          </div>

          {/* Desktop Segmented Buttons */}
          <div
            className={styles.dayTabs}
            role="tablist"
            aria-label="Chọn ngày trong hành trình"
          >
            {days.map((d) => {
              const isActive = d.dayNumber === currentDayNumber;
              const count = isCautionsView
                ? dayCounts[d.dayNumber]?.cautions ?? 0
                : dayCounts[d.dayNumber]?.all ?? 0;
              const hasCautions = (dayCounts[d.dayNumber]?.cautions ?? 0) > 0;

              return (
                <button
                  key={d.dayNumber}
                  ref={(el) => {
                    dayTabRefs.current[d.dayNumber] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`confirm-day-tab-${d.dayNumber}`}
                  aria-selected={isActive}
                  aria-controls={`confirm-day-panel-${d.dayNumber}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onSelectDay(d.dayNumber)}
                  onKeyDown={(e) => handleKeyDownDayTabs(e, d.dayNumber)}
                  className={`${styles.dayTabBtn} ${isActive ? styles.dayTabBtnActive : ''}`}
                >
                  <span>Ngày {d.dayNumber}</span>
                  <span
                    className={`${styles.dayTabBadge} ${
                      isActive
                        ? styles.dayTabBadgeActive
                        : isCautionsView && hasCautions
                        ? styles.dayTabBadgeCautionAlert
                        : ''
                    }`}
                  >
                    {isCautionsView ? `${count} lưu ý` : `${count} mục`}
                  </span>
                  {isActive && <span className="sr-only">(Đang mở)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown (shown on <= 640px) */}
        <div className={styles.mobileDaySelectWrapper}>
          <label htmlFor="confirm-mobile-day-select" className="sr-only">
            Chọn ngày rà soát
          </label>
          <select
            id="confirm-mobile-day-select"
            value={currentDayNumber}
            onChange={(e) => onSelectDay(Number(e.target.value) as 1 | 2 | 3)}
            className={styles.mobileDaySelect}
          >
            {days.map((d) => {
              const count = isCautionsView
                ? dayCounts[d.dayNumber]?.cautions ?? 0
                : dayCounts[d.dayNumber]?.all ?? 0;
              return (
                <option key={d.dayNumber} value={d.dayNumber}>
                  Ngày {d.dayNumber} — {d.dayTitle.split('—')[1]?.trim() || d.dayTitle} ({count}{' '}
                  {isCautionsView ? 'lưu ý' : 'hoạt động'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------
         Day Meta Banner: Route & Pace summary
         ------------------------------------------------------------------ */}
      {currentDay && (
        <div className={styles.dayMetaBanner}>
          <div className={styles.dayMetaTitleRow}>
            <div className="flex items-center gap-2">
              <span className={styles.dayMetaTitle}>{currentDay.dayTitle}</span>
            </div>
            <span className={styles.dayPaceBadge}>
              <Icon name="schedule" className="size-3" />
              <span>{currentDay.pace}</span>
            </span>
          </div>
          <div className={styles.dayMetaSubtext}>
            <strong>Điểm nhấn:</strong> {currentDay.highlight} · <em>{currentDay.routeSummary}</em>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
         Activity Scroll Area (THE ONLY INTERNAL SCROLL CONTAINER)
         ------------------------------------------------------------------ */}
      <div
        id={`confirm-day-panel-${currentDayNumber}`}
        role="tabpanel"
        aria-labelledby={`confirm-day-tab-${currentDayNumber}`}
        className={styles.activityScrollArea}
        tabIndex={0}
      >
        {displayedActivities.length === 0 ? (
          /* Empty State when no items in active view */
          <div className={styles.emptyStateDay} role="status">
            <Icon
              name="check_circle"
              className="size-8 text-[#08B3C6]"
            />
            <div className={styles.emptyStateTitle}>
              {isCautionsView
                ? `Ngày ${currentDayNumber} không có điểm cần lưu ý hoặc trade-off`
                : `Ngày ${currentDayNumber} chưa có hoạt động nào`}
            </div>
            <p className={styles.emptyStateText}>
              {isCautionsView
                ? 'Các hoạt động trong ngày này đều ở trạng thái thuận lợi và linh hoạt theo đề xuất.'
                : 'Lịch trình ngày này hiện đang trống.'}
            </p>
            {isCautionsView && onViewChange && (
              <button
                type="button"
                onClick={() => onViewChange('all')}
                className={styles.btnSwitchAll}
                aria-label={`Xem toàn bộ hoạt động của Ngày ${currentDayNumber}`}
              >
                <Icon name="visibility" className="size-3.5" />
                <span>Xem toàn bộ hoạt động Ngày {currentDayNumber}</span>
              </button>
            )}
          </div>
        ) : (
          /* List of Activity Cards */
          displayedActivities.map((act) => {
            const isSelected = act.decisionStatus === 'selected';
            const isSwapped = act.decisionStatus === 'swapped' || Boolean(act.isAlternative);
            const isSkipped = act.decisionStatus === 'skipped';
            const isNeedsReview = act.reviewFlag === 'needs_review' && !isSkipped;
            const isPickerActive = activeReasonPickerId === act.id;

            return (
              <div
                key={act.id}
                id={`confirm-activity-${act.id}`}
                className={`${styles.activityCard} ${
                  isSelected ? styles.activityCardSelected : ''
                } ${isNeedsReview ? styles.activityCardCaution : ''} ${
                  isSwapped ? styles.activityCardSwapped : ''
                } ${isSkipped ? styles.activityCardSkipped : ''}`}
              >
                {/* Top Row: Time, Location, and Status Badges */}
                <div className={styles.activityTopRow}>
                  <div className={styles.activityTimeLocation}>
                    <span className={styles.timeSlotPill}>{act.timeLabel}</span>
                    <span className={styles.locationText}>{act.locationName}</span>
                  </div>

                  <div className={styles.badgesGroup}>
                    {/* Caution Badge */}
                    {isNeedsReview && (
                      <span className={styles.badgeCaution}>
                        <Icon name="info" className="size-3" />
                        <span>Cần kiểm tra</span>
                      </span>
                    )}

                    {/* Trade-off / Swapped Badge */}
                    {isSwapped && (
                      <span className={styles.badgeSwapped}>
                        <Icon name="replay" className="size-3" />
                        <span>Trade-off AI đổi</span>
                      </span>
                    )}

                    {/* Decision Status Badges */}
                    {isSelected && (
                      <span className={styles.badgeSelected}>
                        <Icon name="check_circle" className="size-3" />
                        <span>Đã chọn</span>
                      </span>
                    )}
                    {isSkipped && (
                      <span className={styles.badgeSkipped}>
                        <Icon name="close" className="size-3" />
                        <span>Đã bỏ qua</span>
                      </span>
                    )}
                    {!isSelected && !isSwapped && !isSkipped && (
                      <span className={styles.badgeProposed}>
                        <Icon name="schedule" className="size-3" />
                        <span>Còn linh hoạt</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content: Title & Description */}
                <div className={styles.activityTitle}>{act.title}</div>
                <div className={styles.activityDescription}>{act.description}</div>

                {/* Dedicated Caution / Trade-off Callout */}
                {(isNeedsReview || isSwapped || act.impactTag) && (
                  <div className={styles.cautionDetailBox}>
                    <div className={styles.cautionDetailHeader}>
                      <Icon
                        name={isNeedsReview ? 'info' : 'compare_arrows'}
                        className="size-3.5"
                      />
                      <span>
                        {isNeedsReview
                          ? `Lý do lưu ý: ${act.reviewNote || 'Cần kiểm tra cung đường / thời tiết'}`
                          : `Đặc điểm phương án: ${act.reviewNote || 'Gợi ý từ AI'}`}
                      </span>
                    </div>

                    {act.impactTag && (
                      <div className={styles.cautionTradeoffText}>
                        • <strong>Tác động lịch trình:</strong> {act.impactTag}
                      </div>
                    )}

                    {onViewTradeoffs && (
                      <div className="mt-1 pt-1.5 border-t border-[#0E1D4F]/8">
                        <button
                          type="button"
                          onClick={onViewTradeoffs}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#205BD6] hover:text-[#0739A8] transition-colors"
                        >
                          <Icon name="balance" className="size-3.5 text-[#205BD6]" />
                          <span>Xem đối chiếu Trade-off &amp; Nhịp độ tương ứng →</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons: Partial edit & Alternative request */}
                <div className={styles.activityActionsRow}>
                  <button
                    type="button"
                    onClick={() => onStartEditing(act)}
                    className={styles.btnPartialEdit}
                    aria-label={`Chỉnh một phần: "${act.title}" tại phần Cùng xây`}
                  >
                    <Icon name="tune" className="size-3.5" />
                    <span>Chỉnh một phần tại Cùng xây</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleReasonPicker(act.id)}
                    className={styles.btnRequestAlt}
                    aria-expanded={isPickerActive}
                    aria-label={`Yêu cầu phương án khác cho "${act.title}"`}
                  >
                    <Icon name="compare_arrows" className="size-3.5" />
                    <span>Yêu cầu phương án khác</span>
                    <Icon name="expand_more" className="size-3" />
                  </button>
                </div>

                {/* Reason Picker Popover / Drawer */}
                {isPickerActive && (
                  <div
                    className={styles.reasonPickerBox}
                    role="region"
                    aria-label="Chọn lý do yêu cầu đổi phương án"
                  >
                    <div className={styles.reasonPickerHeader}>
                      <span>Chọn lý do bạn muốn đổi:</span>
                      <button
                        type="button"
                        onClick={onCloseReasonPicker}
                        className={styles.btnClosePicker}
                        aria-label="Đóng chọn lý do"
                      >
                        Đóng
                      </button>
                    </div>

                    <div className={styles.reasonChipsRow}>
                      <button
                        type="button"
                        onClick={() =>
                          onRequestAlternativeWithReason(act.id, 'too_dense')
                        }
                        className={styles.reasonChip}
                      >
                        Lịch quá dày
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRequestAlternativeWithReason(act.id, 'high_cost')
                        }
                        className={styles.reasonChip}
                      >
                        Chi phí cao
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRequestAlternativeWithReason(act.id, 'not_preferred')
                        }
                        className={styles.reasonChip}
                      >
                        Không muốn địa điểm này
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------------
         Footer Safety Reminder
         ------------------------------------------------------------------ */}
      <div className={styles.dayReviewFooter} role="note">
        <Icon name="verified_user" className="size-3.5 shrink-0 text-[#205BD6]" />
        <span>
          Chỉnh sửa từng chặng bất cứ lúc nào trước khi xác nhận lộ trình.
        </span>
      </div>
    </div>
  );
}

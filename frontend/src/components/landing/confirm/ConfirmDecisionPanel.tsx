'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import styles from './confirm-decision-panel.module.css';
import type { LandingActivity, LandingTripState } from '@/components/landing/landingDemo';

export interface ConfirmDecisionPanelProps {
  tripState: LandingTripState;
  selectedActivities: LandingActivity[];
  selectedCount: number;
  flexibleCount: number;
  needsReviewCount: number;
  confirmFeedback: { success: boolean; message: string } | null;
  onConfirmPlan: () => void;
  onKeepActivity?: (activityId: string) => void;
  onStartEditing?: (act: LandingActivity) => void;
  className?: string;
}

/**
 * ConfirmDecisionPanel Component (Task LP-14)
 * The main Decision & Confirmation Panel located in the right column of Section 4.
 * Enforces the contract:
 * - Requires at least 1 selected activity to confirm.
 * - Provides immediate feedback and inline success notice.
 * - Offers quick-retain suggestions when plan is in initial empty state so the user is never stuck.
 * - Highlights active counts and provides mandatory disclaimer (confirm != booking).
 */
export default function ConfirmDecisionPanel({
  tripState,
  selectedActivities,
  selectedCount,
  flexibleCount,
  needsReviewCount,
  confirmFeedback,
  onConfirmPlan,
  onKeepActivity,
  onStartEditing,
  className,
}: ConfirmDecisionPanelProps) {
  // Candidate signature experiences to recommend when 0 items are retained
  const recommendedActivities = React.useMemo(() => {
    const list: LandingActivity[] = [];
    tripState.days.forEach((day) => {
      const firstAct = day.activities.find((a) => a.decisionStatus !== 'skipped');
      if (firstAct) list.push(firstAct);
    });
    return list.slice(0, 3);
  }, [tripState.days]);

  return (
    <div
      className={`${styles.decisionPanel} ${className || ''}`}
      role="region"
      aria-label="Bảng rà soát quyết định và xác nhận kế hoạch"
    >
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleRow}>
          <h3 className={styles.panelTitle}>
            <Icon name="check_circle" className="size-4 text-[#205BD6]" />
            <span>Bảng rà soát quyết định</span>
          </h3>
          <span className="text-[11px] font-semibold text-[#67736D] bg-[#F0F4F8] px-2 py-0.5 rounded-full">
            Bước 03 / Quyết định
          </span>
        </div>
        <p className={styles.panelSubtitle}>
          Tóm tắt các lựa chọn đã chốt, các điểm còn mở và điều kiện sẵn sàng.
        </p>
      </div>

      {/* CASE 1: EMPTY STATE (No activities retained yet) */}
      {!tripState.hasSelectedAny ? (
        <div className="space-y-3">
          <div className={styles.emptyStateBox} role="status">
            <Icon name="pending_actions" className="size-8 text-[#67736D]" />
            <div className={styles.emptyStateTitle}>Chưa có trải nghiệm nào được giữ lại</div>
            <p className={styles.emptyStateDesc}>
              Bản nháp hiện tại chưa có mục nào được đánh dấu &ldquo;Đã chọn&rdquo;. Hãy chọn ít nhất một trải nghiệm để xác nhận hướng đi của chuyến đi.
            </p>

            {/* Quick-retain suggestions */}
            <div className={styles.quickRetainContainer}>
              <div className={styles.quickRetainHeading}>
                <Icon name="auto_fix_high" className="size-3 text-[#205BD6]" />
                <span>Gợi ý chọn nhanh trải nghiệm nổi bật:</span>
              </div>
              <div className={styles.quickRetainList}>
                {recommendedActivities.map((act) => (
                  <div key={act.id} className={styles.quickRetainItem}>
                    <div className={styles.quickRetainMeta}>
                      <span className={styles.dayBadge}>Ngày {act.dayNumber}</span>
                      <span>{act.title}</span>
                    </div>
                    {onKeepActivity ? (
                      <button
                        type="button"
                        onClick={() => onKeepActivity(act.id)}
                        className={styles.btnQuickRetainAction}
                        aria-label={`Giữ lại "${act.title}"`}
                      >
                        <Icon name="add" className="size-3" />
                        <span>Giữ lại</span>
                      </button>
                    ) : onStartEditing ? (
                      <button
                        type="button"
                        onClick={() => onStartEditing(act)}
                        className={styles.btnQuickRetainAction}
                        aria-label={`Chỉnh "${act.title}"`}
                      >
                        <Icon name="tune" className="size-3" />
                        <span>Xem & Giữ</span>
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <a href="#cung-xay" className={styles.btnBackToCoCreate}>
              <Icon name="arrow_back" className="size-3.5" />
              <span>Quay lại Cùng xây để chọn</span>
            </a>
          </div>

          {confirmFeedback && !confirmFeedback.success && (
            <div className={styles.feedbackAlert} role="alert">
              <Icon name="error_outline" className="size-4 shrink-0 mt-0.5" />
              <span>{confirmFeedback.message}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onConfirmPlan}
            className={styles.btnConfirmPlan}
            disabled={!tripState.hasSelectedAny}
            aria-label="Xác nhận kế hoạch"
          >
            <Icon name="check_circle" className="size-4" />
            <span>Xác nhận kế hoạch</span>
          </button>
        </div>
      ) : tripState.isConfirmed ? (
        /* CASE 2: CONFIRMED STATE (Inline success panel) */
        <div className="space-y-3">
          <div className={styles.confirmSuccessBox} role="status" aria-live="polite">
            <div className={styles.confirmSuccessBadge}>
              <Icon name="check_circle" className="size-5 text-[#3D684F]" />
              <span>✓ Kế hoạch đã được xác nhận</span>
            </div>
            <p className={styles.confirmSuccessNote}>
              Bạn đã hoàn tất việc rà soát và chốt định hướng cho lịch trình 3 ngày với <strong>{selectedCount}</strong> trải nghiệm đã chọn.
            </p>
            <div className={styles.confirmSuccessHint}>
              Kế hoạch vẫn có thể linh hoạt điều chỉnh thêm tại bất kỳ thời điểm nào.
            </div>
            <a href="#cung-xay" className={styles.btnContinueEdit}>
              <Icon name="tune" className="size-3.5" />
              <span>Tiếp tục chỉnh sửa</span>
            </a>
          </div>
        </div>
      ) : (
        /* CASE 3: RETAINED ACTIVITIES PRESENT, AWAITING CONFIRMATION */
        <div className="space-y-3">
          <div>
            <div className={styles.retainedHeader}>
              <span>Trải nghiệm bạn đã giữ lại:</span>
              <span className={styles.retainedCountPill}>{selectedCount} mục</span>
            </div>

            <div className={styles.selectedSummaryList}>
              {selectedActivities.map((act) => (
                <div key={act.id} className={styles.selectedSummaryItem}>
                  <div>
                    <div className={styles.selectedSummaryItemTitle}>{act.title}</div>
                    <div className={styles.selectedSummaryItemMeta}>
                      Ngày {act.dayNumber} · {act.timeLabel} · {act.locationName}
                    </div>
                  </div>
                  <span className={styles.badgeSelected}>
                    <Icon name="check_circle" className="size-3" />
                    <span>Đã chọn</span>
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.retainedNotesGroup}>
              <div>• <strong>{flexibleCount}</strong> hoạt động còn linh hoạt theo đề xuất AI.</div>
              {needsReviewCount > 0 && (
                <div className="text-[#A0641E] font-medium">
                  • <strong>{needsReviewCount}</strong> điểm cần kiểm tra đường đi hoặc thời tiết.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onConfirmPlan}
            className={styles.btnConfirmPlan}
            aria-label="Xác nhận kế hoạch"
          >
            <Icon name="check_circle" className="size-4" />
            <span>Xác nhận kế hoạch</span>
          </button>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className={styles.disclaimer}>
        Xác nhận kế hoạch không đồng nghĩa với việc đã đặt vé hoặc chỗ ở.
      </div>
    </div>
  );
}

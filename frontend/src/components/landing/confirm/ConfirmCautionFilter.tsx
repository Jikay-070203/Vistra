'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import styles from './confirm-caution-filter.module.css';

export interface ConfirmCautionFilterProps {
  view: 'cautions' | 'all';
  cautionCount: number;
  allCount: number;
  onViewChange: (view: 'cautions' | 'all') => void;
  className?: string;
}

/**
 * ConfirmCautionFilter Component (Task LP-14A)
 * Controlled filter switching between cautions/trade-offs view (default) and full plan view.
 * Complies with LP-14 acceptance criteria:
 * - Controlled by view, cautionCount, allCount, onViewChange.
 * - Does not mutate itinerary state.
 * - State conveyed by icon, label, badge, text, and aria-selected (never color alone).
 * - Full keyboard navigation (ArrowLeft, ArrowRight, Home, End).
 */
export default function ConfirmCautionFilter({
  view,
  cautionCount,
  allCount,
  onViewChange,
  className,
}: ConfirmCautionFilterProps) {
  const cautionTabRef = React.useRef<HTMLButtonElement>(null);
  const allTabRef = React.useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (view === 'cautions') {
        onViewChange('all');
        allTabRef.current?.focus();
      } else {
        onViewChange('cautions');
        cautionTabRef.current?.focus();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (view === 'all') {
        onViewChange('cautions');
        cautionTabRef.current?.focus();
      } else {
        onViewChange('all');
        allTabRef.current?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      onViewChange('cautions');
      cautionTabRef.current?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      onViewChange('all');
      allTabRef.current?.focus();
    }
  };

  const isCautionsActive = view === 'cautions';
  const isAllActive = view === 'all';

  return (
    <div className={`${styles.filterContainer} ${className || ''}`} role="region" aria-label="Bộ lọc góc nhìn rà soát">
      <div className={styles.filterHeader}>
        <div className={styles.filterHeading}>
          <Icon name="tune" className="size-4 text-[#205BD6]" />
          <span>Chế độ rà soát kế hoạch</span>
        </div>
        <span className={styles.filterHelpText}>
          {isCautionsActive ? 'Ưu tiên kiểm tra các điểm mở' : 'Xem toàn bộ 3 ngày'}
        </span>
      </div>

      <div
        className={styles.tablist}
        role="tablist"
        aria-label="Tùy chọn chế độ xem lịch trình"
        onKeyDown={handleKeyDown}
      >
        {/* Tab 1: Cần kiểm tra / trade-off (Default focus) */}
        <button
          ref={cautionTabRef}
          type="button"
          role="tab"
          id="tab-confirm-cautions"
          aria-selected={isCautionsActive}
          aria-controls="panel-confirm-day-review"
          tabIndex={isCautionsActive ? 0 : -1}
          onClick={() => onViewChange('cautions')}
          className={`${styles.tabButton} ${isCautionsActive ? styles.tabButtonActiveCaution : ''}`}
        >
          <span className={styles.tabIcon}>
            <Icon name="info" className={`size-4 ${isCautionsActive ? 'text-[#D99A4E]' : 'text-[#67736D]'}`} />
          </span>
          <span className={styles.tabLabel}>Cần kiểm tra / trade-off</span>
          <span className={`${styles.badge} ${isCautionsActive ? styles.badgeActiveCaution : ''}`}>
            {cautionCount}
          </span>
          {isCautionsActive && (
            <span className="sr-only">(Đang chọn)</span>
          )}
        </button>

        {/* Tab 2: Toàn bộ kế hoạch */}
        <button
          ref={allTabRef}
          type="button"
          role="tab"
          id="tab-confirm-all"
          aria-selected={isAllActive}
          aria-controls="panel-confirm-day-review"
          tabIndex={isAllActive ? 0 : -1}
          onClick={() => onViewChange('all')}
          className={`${styles.tabButton} ${isAllActive ? styles.tabButtonActiveAll : ''}`}
        >
          <span className={styles.tabIcon}>
            <Icon name="calendar_month" className={`size-4 ${isAllActive ? 'text-[#205BD6]' : 'text-[#67736D]'}`} />
          </span>
          <span className={styles.tabLabel}>Toàn bộ kế hoạch</span>
          <span className={`${styles.badge} ${isAllActive ? styles.badgeActiveAll : ''}`}>
            {allCount}
          </span>
          {isAllActive && (
            <span className="sr-only">(Đang chọn)</span>
          )}
        </button>
      </div>

      {/* Explanatory notice reflecting active filter */}
      <div
        className={`${styles.filterNoticeBox} ${isCautionsActive ? styles.filterNoticeCaution : styles.filterNoticeAll}`}
        role="status"
        aria-live="polite"
      >
        <Icon
          name={isCautionsActive ? 'info' : 'visibility'}
          className={`size-4 ${styles.filterNoticeIcon}`}
        />
        <div>
          {isCautionsActive ? (
            <span>
              Kiểm tra các điểm có lưu ý địa hình, thời tiết hoặc thay đổi lộ trình.
            </span>
          ) : (
            <span>
              Hiển thị đầy đủ {allCount} hoạt động trên hành trình 3 ngày.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

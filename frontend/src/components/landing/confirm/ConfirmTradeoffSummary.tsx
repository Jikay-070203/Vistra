'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import styles from './confirm-tradeoff-summary.module.css';

export interface ConfirmTradeoffSummaryProps {
  preference: 'default' | 'less_travel';
  className?: string;
}

/**
 * ConfirmTradeoffSummary Component (Task LP-14)
 * Explicitly surfaces the qualitative trade-offs and rhythm balance of the current plan.
 * Ensures the right side has high informational density directly tied to user decisions.
 */
export default function ConfirmTradeoffSummary({
  preference,
  className,
}: ConfirmTradeoffSummaryProps) {
  const isLessTravel = preference === 'less_travel';

  return (
    <div
      className={`${styles.tradeoffCard} ${className || ''}`}
      role="region"
      aria-label="Đối chiếu Trade-off và Nhịp độ chuyến đi"
    >
      <div className={styles.tradeoffHeader}>
        <div className={styles.tradeoffTitle}>
          <Icon name="balance" className="size-4 text-[#205BD6]" />
          <span>Cân bằng Trade-off & Nhịp độ</span>
        </div>
        <span className={styles.preferenceBadge}>
          {isLessTravel ? 'Ưu tiên: Ít di chuyển' : 'Ưu tiên: Mặc định'}
        </span>
      </div>

      <div className={styles.tradeoffComparisonGrid}>
        {/* Gain Row */}
        <div className={`${styles.tradeoffRow} ${styles.tradeoffRowGain}`}>
          <div className={styles.tradeoffIconWrapper}>
            <Icon name="check_circle" className="size-3.5 text-[#2E7D32]" />
          </div>
          <div className={styles.tradeoffText}>
            <strong>Điểm tối ưu:</strong>{' '}
            {isLessTravel
              ? 'Gom cụm ven hồ Ngày 1 trong bán kính ngắn, dành trọn buổi chiều thư thả bên hiên gỗ thay vì ngồi xe.'
              : 'Tầm nhìn hoàng hôn góc rộng từ đỉnh đồi cao nguyên; trọn vẹn 3 điểm tham quan trong ngày đầu.'}
          </div>
        </div>

        {/* Trade-off / Concession Row */}
        <div className={`${styles.tradeoffRow} ${styles.tradeoffRowLoss}`}>
          <div className={styles.tradeoffIconWrapper}>
            <Icon name="compare_arrows" className="size-3.5 text-[#C66900]" />
          </div>
          <div className={styles.tradeoffText}>
            <strong>Đánh đổi cần lưu ý:</strong>{' '}
            {isLessTravel
              ? 'Bỏ lỡ điểm ngắm hoàng hôn đồi xa để đổi lấy thời gian nghỉ ngơi thư giãn tại chỗ.'
              : 'Chặng di chuyển chiều dài hơn, cung đường đèo dốc và lịch trình cần bám sát thời gian.'}
          </div>
        </div>
      </div>

      {/* 3-Day Rhythm Breakdown */}
      <div className={styles.rhythmSection}>
        <div className={styles.rhythmLabel}>
          <Icon name="timeline" className="size-3 text-[#205BD6]" />
          <span>Nhịp độ 3 ngày liên hoàn</span>
        </div>
        <div className={styles.rhythmPills}>
          <div className={styles.rhythmPill}>
            <div className={styles.rhythmPillDay}>Ngày 1</div>
            <div className={styles.rhythmPillTheme} title="Khởi đầu êm dịu ven hồ">
              {isLessTravel ? 'Êm dịu ven hồ' : 'Vừa phải · Đồi xa'}
            </div>
          </div>
          <div className={styles.rhythmPill}>
            <div className={styles.rhythmPillDay}>Ngày 2</div>
            <div className={styles.rhythmPillTheme} title="Làng cổ & xưởng thủ công">
              Văn hóa bản địa
            </div>
          </div>
          <div className={styles.rhythmPill}>
            <div className={styles.rhythmPillDay}>Ngày 3</div>
            <div className={styles.rhythmPillTheme} title="Đồi thông & chào tạm biệt">
              Khoáng đạt · Về
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

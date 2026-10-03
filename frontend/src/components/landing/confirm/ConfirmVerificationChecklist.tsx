'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import styles from './confirm-verification-checklist.module.css';

export interface ConfirmVerificationChecklistProps {
  needsReviewCount: number;
  className?: string;
}

/**
 * ConfirmVerificationChecklist Component (Task LP-14)
 * Provides practical guidance for verifying caution conditions before traveling,
 * ensuring no misunderstanding that AI has already verified everything on-site.
 */
export default function ConfirmVerificationChecklist({
  needsReviewCount,
  className,
}: ConfirmVerificationChecklistProps) {
  return (
    <div
      className={`${styles.checklistCard} ${className || ''}`}
      role="region"
      aria-label="Danh mục rà soát thực địa trước chuyến đi"
    >
      <div className={styles.checklistHeader}>
        <div className={styles.checklistTitle}>
          <Icon name="verified_user" className="size-4 text-[#205BD6]" />
          <span>Rà soát thực địa & Điều kiện thực tế</span>
        </div>
        <span className={styles.cautionCountPill}>
          {needsReviewCount > 0 ? `${needsReviewCount} điểm lưu ý` : 'Đã rà soát'}
        </span>
      </div>

      <div className={styles.checklistItems}>
        {/* Item 1: Weather */}
        <div className={styles.checklistItem}>
          <Icon name="cloud_queue" className={`size-3.5 text-[#205BD6] ${styles.itemIcon}`} />
          <div>
            <strong>Thời tiết & Sương sớm:</strong> Kiểm tra dự báo độ ẩm sáng sớm tại hồ và nguy cơ sương mù đèo dốc chiều.
          </div>
        </div>

        {/* Item 2: Opening hours */}
        <div className={styles.checklistItem}>
          <Icon name="schedule" className={`size-3.5 text-[#D99A4E] ${styles.itemIcon}`} />
          <div>
            <strong>Giờ mở cửa theo mùa:</strong> Xưởng thủ công bản địa và một số quán trà địa phương có thể thay đổi giờ đóng cửa.
          </div>
        </div>

        {/* Item 3: Road & vehicle */}
        <div className={styles.checklistItem}>
          <Icon name="directions_car" className={`size-3.5 text-[#08B3C6] ${styles.itemIcon}`} />
          <div>
            <strong>Phương tiện di chuyển:</strong> Các chặng lên đồi ngắm cảnh dốc cao, nên ưu tiên xe máy khỏe hoặc taxi bản địa quen đường.
          </div>
        </div>
      </div>

      <div className={styles.checklistFooterNote}>
        <Icon name="info" className="size-3 text-[#67736D] shrink-0" />
        <span>
          Gợi ý AI mang tính định hướng ban đầu — không thay thế việc kiểm tra điều kiện thực tế trước khi lên đường.
        </span>
      </div>
    </div>
  );
}

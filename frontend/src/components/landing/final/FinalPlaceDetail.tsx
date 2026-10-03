import React from 'react';
import Image from 'next/image';
import styles from './final-place-detail.module.css';
import { LANDING_ASSETS, LandingActivity, LandingPin } from '../landingDemo';
import Icon from '@/components/ui/Icon';

export interface FinalPlaceDetailProps {
  place: LandingPin | null;
  activity?: LandingActivity | null;
  journeyStatus?: 'completed' | 'current' | 'pending';
  stepNumber?: number;
  totalSteps?: number;
  onClose: () => void;
}

export default function FinalPlaceDetail({
  place,
  activity,
  journeyStatus,
  stepNumber,
  totalSteps,
  onClose,
}: FinalPlaceDetailProps) {
  if (!place) {
    return (
      <div className={styles.emptyState} role="region" aria-label="Chi tiết địa điểm trống">
        <div className={styles.emptyIconWrapper}>
          <Icon name="touch_app" className={styles.emptyIcon} />
        </div>
        <p className={styles.emptyText}>Chọn hoặc rê chuột vào một địa điểm trên bản đồ để xem chi tiết</p>
      </div>
    );
  }

  const isLake = place.id === 'pin-lake-garden';
  const asset = isLake ? LANDING_ASSETS.heroInspiration : LANDING_ASSETS.finalJourney;

  const phaseClass =
    journeyStatus === 'current'
      ? styles.phaseCurrent
      : journeyStatus === 'completed'
      ? styles.phaseCompleted
      : styles.phasePending;

  const phaseLabel =
    journeyStatus === 'current'
      ? `NOW · Đang ghé thăm ${stepNumber ? `(Chặng ${stepNumber}/${totalSteps})` : ''}`
      : journeyStatus === 'completed'
      ? 'READY · Đã hoàn tất'
      : `NEXT · Chặng tiếp theo ${stepNumber ? `(Chặng ${stepNumber}/${totalSteps})` : ''}`;

  return (
    <div className={styles.detailCard} role="region" aria-label={`Chi tiết về ${place.name}`}>
      {/* Journey Phase Badge */}
      {journeyStatus && (
        <div className={`${styles.journeyPhaseBadge} ${phaseClass}`}>
          <Icon
            name={
              journeyStatus === 'current'
                ? 'navigation'
                : journeyStatus === 'completed'
                ? 'check_circle'
                : 'schedule'
            }
            className="size-3.5"
          />
          <span>{phaseLabel}</span>
        </div>
      )}

      <div className={styles.cardHeader}>
        <div className={styles.categoryBadge}>
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
            className="size-3.5" 
          />
          <span className="capitalize">{place.category === 'scenic' ? 'Cảnh quan' : place.category === 'dining' ? 'Ẩm thực' : place.category === 'stay' ? 'Lưu trú' : 'Văn hóa'}</span>
          <span className={styles.dot}>•</span>
          <span>Ngày {place.day}</span>
        </div>
        <button 
          className={styles.closeBtn} 
          onClick={onClose} 
          aria-label="Đóng chi tiết địa điểm"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>

      <h3 className={styles.placeName}>{place.name}</h3>

      {/* Timing slot if activity exists */}
      {activity?.timeLabel && (
        <div className={styles.timingRow}>
          <Icon name="schedule" className="size-3.5 text-[#08B3C6]" />
          <span>{activity.timeLabel}</span>
        </div>
      )}

      <p className={styles.placeDesc}>{place.description}</p>

      {/* Grounded Caution (WATCH FOR) if exists */}
      {activity?.reviewNote && (
        <div className={styles.cautionBox}>
          <Icon name="warning" className="size-4 shrink-0 text-[#D97706]" />
          <div>
            <strong>LƯU Ý (WATCH FOR):</strong> {activity.reviewNote}
          </div>
        </div>
      )}

      {/* Grounded Trade-off / Orientation (KEEP IN MIND) if exists */}
      {activity?.impactTag && (
        <div className={styles.tradeoffBox}>
          <Icon name="lightbulb" className="size-4 shrink-0 text-[#2563EB]" />
          <div>
            <strong>CÂN NHẮC (KEEP IN MIND):</strong> Định hướng {activity.impactTag.toLowerCase()} được bảo toàn.
          </div>
        </div>
      )}
      
      {/* Visual illustration slot showing documentary photo */}
      <div className={styles.visualSlot}>
        <Image
          src={asset.path}
          alt={asset.alt}
          width={320}
          height={160}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="mt-2 flex flex-col text-[10.5px] text-[#67736D] leading-tight">
        <span className="font-medium text-[#4B5875]">Ảnh tư liệu thực địa</span>
        <span className="truncate" title={asset.attribution}>{asset.attribution}</span>
      </div>
    </div>
  );
}


'use client';

import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import styles from './co-create-chat-panel.module.css';

export interface CoCreateChatPanelProps {
  preference: 'default' | 'less_travel';
  loopStep?: 0 | 1 | 2;
  onTogglePreference: (pref: 'default' | 'less_travel') => void;
  recentChangeNotice?: string | null;
}

export default function CoCreateChatPanel({
  preference,
  loopStep,
  onTogglePreference,
}: CoCreateChatPanelProps) {
  const isAfter = preference === 'less_travel';

  return (
    <div
      className={styles.panelContainer}
      role="region"
      aria-label="Trao đổi định hình hành trình"
    >
      {/* 1. Panel Header (Transparent & Crisp) */}
      <header className={styles.chatHeader}>
        <div className={styles.chatHeaderTitle}>
          <Icon name="chat" className="size-4 text-[#205BD6]" />
          <span>Trao đổi định hình</span>
        </div>

        {/* Action-Affect State Indicator / Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-white/50 backdrop-blur-sm rounded-lg border border-[#0E1D4F]/10">
          <button
            type="button"
            onClick={() => onTogglePreference('default')}
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
              !isAfter
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:bg-white/60'
            }`}
            aria-pressed={!isAfter}
          >
            Trước: Đồi xa
          </button>
          <button
            type="button"
            onClick={() => onTogglePreference('less_travel')}
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
              isAfter
                ? 'bg-[#08B3C6] text-white shadow-sm'
                : 'text-[#4B5875] hover:bg-white/60'
            }`}
            aria-pressed={isAfter}
          >
            Sau: Gom ven hồ
          </button>
        </div>
      </header>

      {/* 2. Read-Only Messages Stream with ~30% Alpha & Subtle Border */}
      <div className={styles.messagesList} role="log" aria-label="Lịch sử trao đổi">
        {/* Message 1: Khách shares inspiration */}
        <div className={styles.messageUser}>
          <div className={styles.messageSenderRow}>
            <span className={styles.badgeUser}>
              <Icon name="person" className="size-3 text-[#205BD6]" />
              <span>Khách</span>
            </span>
            <span className={styles.messageTag}>Gợi ý cảm hứng</span>
          </div>
          <div className="flex items-center gap-2.5 my-1.5 p-2 bg-white/40 rounded-lg border border-[#205BD6]/20">
            <div className="w-12 h-10 rounded overflow-hidden relative shrink-0 border border-white/60">
              <Image
                src="/landing/hero-inspiration.jpg"
                alt="Ảnh cảm hứng người đi tải lên"
                fill
                sizes="48px"
                loading="lazy"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#205BD6] uppercase">Ảnh hồ & sương sớm</span>
              <span className="text-xs text-[#0E1D4F] font-medium leading-tight">
                Tìm giúp không gian tĩnh lặng ven đồi sương sớm giống ảnh này nhé
              </span>
            </div>
          </div>
        </div>

        {/* Message 2: Vistra responds and drafts day 1 */}
        <div className={styles.messageAi}>
          <div className={styles.messageSenderRow}>
            <span className={styles.badgeAi}>
              <Icon name="auto_fix_high" className="size-3 text-[#08B3C6]" />
              <span>Vistra</span>
            </span>
            <span className={styles.messageTag}>Nhận diện</span>
          </div>
          <p className={styles.messageText}>
            Gợi ý <strong>Nhà gỗ bên sườn đồi</strong> phù hợp ảnh cảm hứng, kết nối cùng Vườn ven hồ và Đồi xa trong ngày 1.
          </p>
        </div>

        {/* Message 3: Khách action (wants relaxed afternoon around lake) */}
        {(loopStep === undefined || loopStep >= 1) && (
          <div className={`${styles.messageUser} animate-fadeIn`}>
            <div className={styles.messageSenderRow}>
              <span className={styles.badgeUser}>
                <Icon name="person" className="size-3 text-[#205BD6]" />
                <span>Khách</span>
              </span>
              <span className="text-[9.5px] font-semibold text-[#E7AD2E] bg-[#E7AD2E]/10 px-2 py-0.5 rounded border border-[#E7AD2E]/20">
                Muốn đổi nhịp độ
              </span>
            </div>
            <p className={styles.messageText}>
              Buổi chiều lên đồi xa hơi dốc. Mình muốn thong thả quanh hồ để kịp nghỉ ngơi.
            </p>
          </div>
        )}

        {/* Message 4: Vistra affect (synchronously updates plan) */}
        {(loopStep === undefined ? isAfter : loopStep >= 2) && (
          <div
            className={`${styles.messageAi} animate-fadeIn ${
              isAfter ? 'ring-2 ring-[#08B3C6]/60 shadow-md' : 'opacity-85'
            }`}
          >
            <div className={styles.messageSenderRow}>
              <span className={styles.badgeAi}>
                <Icon name="auto_fix_high" className="size-3 text-[#08B3C6]" />
                <span>Vistra</span>
              </span>
              <span className="text-[9.5px] font-semibold text-[#088D9C] bg-[#08B3C6]/15 px-2 py-0.5 rounded border border-[#08B3C6]/30">
                Kế hoạch đã cập nhật
              </span>
            </div>
            <p className={styles.messageText}>
              Đã thay đồi xa bằng chiều trà thư thả ven hồ. Lịch trình ngày 1 gom gọn, giảm thời gian di chuyển.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/60 rounded-md border border-[#08B3C6]/30 text-[10.5px] font-bold text-[#088D9C]">
              <Icon name="check_circle" className="size-3" />
              <span>Lịch trình bên phải đã đồng bộ theo phương án mới</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

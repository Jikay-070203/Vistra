'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import styles from './co-create-plan-editor.module.css';

export interface CoCreatePlanEditorProps {
  dayNumber?: 1 | 2 | 3;
  preference: 'default' | 'less_travel';
  onTogglePreference?: (pref: 'default' | 'less_travel') => void;
}

export default function CoCreatePlanEditor({
  preference,
  onTogglePreference,
}: CoCreatePlanEditorProps) {
  const isAfter = preference === 'less_travel';

  return (
    <div
      className={styles.editorContainer}
      role="region"
      aria-label="So sánh lịch trình Trước và Sau khi định hình"
    >
      {/* 1. Header with Comparison State Indicator */}
      <header className={styles.editorHeader}>
        <div className={styles.headerTitleRow}>
          <span>Biến chuyển lịch trình Ngày 1</span>
        </div>

        {/* State Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0E1D4F]/5 rounded-xl">
          <button
            type="button"
            onClick={() => onTogglePreference?.('default')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              !isAfter
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:bg-black/5'
            }`}
            aria-pressed={!isAfter}
          >
            Trước điều chỉnh
          </button>
          <button
            type="button"
            onClick={() => onTogglePreference?.('less_travel')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isAfter
                ? 'bg-[#08B3C6] text-white shadow-sm'
                : 'text-[#4B5875] hover:bg-black/5'
            }`}
            aria-pressed={isAfter}
          >
            Sau điều chỉnh
          </button>
        </div>
      </header>

      {/* 2. Visual Schedule & Mini Map Container */}
      <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
        {/* Banner indicating the cause-and-effect relationship */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
            isAfter
              ? 'bg-[#E8F8F5] border-[#08B3C6]/30 text-[#0E1D4F]'
              : 'bg-[#FFF9EB] border-[#E7AD2E]/30 text-[#0E1D4F]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={isAfter ? 'check_circle' : 'swap_horiz'}
              className={`size-4 ${isAfter ? 'text-[#088D9C]' : 'text-[#E7AD2E]'}`}
            />
            <span className="font-semibold text-xs sm:text-[13px]">
              {isAfter
                ? 'Phương án sau điều chỉnh: Gom gọn ven hồ, nhịp độ êm ả'
                : 'Phương án ban đầu: Lộ trình trải rộng, leo dốc đồi xa'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#67736D]">
            {isAfter ? 'Đã tối ưu' : 'Bản nháp gốc'}
          </span>
        </div>

        {/* 3 Activities Sequence (Before / After) */}
        <div className="flex flex-col gap-2.5">
          {/* Act 1: Morning */}
          <div className="p-3 bg-white/90 rounded-xl border border-[#0E1D4F]/10 flex items-start justify-between shadow-xs">
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 bg-[#08B3C6]/10 text-[#088D9C] font-mono text-[11px] font-bold rounded-md shrink-0">
                08:30
              </span>
              <div>
                <h4 className="text-[15px] font-bold text-[#0E1D4F] leading-snug">Vườn ven hồ</h4>
                <p className="text-sm text-[#4B5875] mt-0.5 leading-relaxed">
                  Mặt hồ tĩnh mịch sương sớm soi bóng đồi thông.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#088D9C] bg-[#08B3C6]/15 px-2 py-0.5 rounded-full shrink-0">
              Giữ nguyên
            </span>
          </div>

          {/* Act 2: Noon */}
          <div className="p-3 bg-white/90 rounded-xl border border-[#0E1D4F]/10 flex items-start justify-between shadow-xs">
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 bg-[#E7AD2E]/15 text-[#9E6E00] font-mono text-[11px] font-bold rounded-md shrink-0">
                11:30
              </span>
              <div>
                <h4 className="text-[15px] font-bold text-[#0E1D4F] leading-snug">
                  Quán trà &amp; cà phê góc phố
                </h4>
                <p className="text-sm text-[#4B5875] mt-0.5 leading-relaxed">
                  Hiên gỗ râm mát, thưởng trà nóng và nghỉ giữa ngày.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#088D9C] bg-[#08B3C6]/15 px-2 py-0.5 rounded-full shrink-0">
              Giữ nguyên
            </span>
          </div>

          {/* Act 3: Afternoon (The Replaced / Transformed Activity) */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isAfter
                ? 'bg-gradient-to-r from-[#E8F8F5] to-white border-[#08B3C6] shadow-sm'
                : 'bg-gradient-to-r from-[#FFF5F2] to-white border-[#E7AD2E] shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span
                  className={`px-2 py-1 font-mono text-[11px] font-bold rounded-md shrink-0 ${
                    isAfter
                      ? 'bg-[#08B3C6] text-white'
                      : 'bg-[#E7AD2E] text-[#0E1D4F]'
                  }`}
                >
                  {isAfter ? '15:00' : '15:30'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-bold text-[#0E1D4F] leading-snug">
                      {isAfter
                        ? 'Nhà gỗ bên sườn đồi'
                        : 'Điểm ngắm hoàng hôn đồi xa'}
                    </h4>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isAfter
                          ? 'bg-[#08B3C6]/20 text-[#088D9C]'
                          : 'bg-[#E7AD2E]/20 text-[#9E6E00]'
                      }`}
                    >
                      {isAfter ? 'Đã đổi: Ven hồ' : 'Chặng cũ: Đồi dốc'}
                    </span>
                  </div>
                  <p className="text-sm text-[#4B5875] mt-1 leading-relaxed">
                    {isAfter
                      ? 'Lưu trú tĩnh mịch giữa rừng thông ven hồ, nghỉ ngơi thư thái.'
                      : 'Vọng cảnh đón chiều tà trên đỉnh dốc, đường đèo xa trung tâm 15km.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Note on trade-off */}
            <div className="mt-2.5 pt-2 border-t border-[#0E1D4F]/10 flex items-center justify-between text-xs">
              <span className="text-[#67736D] font-medium">Khoảng cách di chuyển:</span>
              <span className={`font-bold ${isAfter ? 'text-[#088D9C]' : 'text-[#D9534F]'}`}>
                {isAfter ? 'Cung đường ngắn nội vùng (~3 km)' : 'Cung đường xa ngoại ô (~15 km)'}
              </span>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}

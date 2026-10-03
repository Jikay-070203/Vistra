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
          <Icon name="route" className={`size-4 ${styles.headerIcon}`} />
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

        {/* 4. Mini Vector Map showing Route Comparison */}
        <div className="p-3 bg-white/70 rounded-xl border border-[#0E1D4F]/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#0E1D4F] font-bold">
            <span className="flex items-center gap-1.5">
              <Icon name="map" className="size-3.5 text-[#205BD6]" />
              <span>Sơ đồ cung đường ngày 1</span>
            </span>
            <span className="text-[11px] text-[#67736D] font-normal">
              {isAfter ? 'Tuyến ngắn gom cụm' : 'Tuyến trải dài qua đồi'}
            </span>
          </div>

          <div className="h-28 w-full bg-[#0A122E] rounded-lg overflow-hidden relative border border-[#08B3C6]/20">
            <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {/* Soft terrain contour */}
              <path
                d="M 0 100 Q 100 40, 200 80 T 400 60"
                stroke="#205BD6"
                strokeWidth="1"
                fill="none"
                opacity="0.3"
              />

              {/* Point 1: Vườn ven hồ */}
              <circle cx="60" cy="65" r="5" fill="#08B3C6" />
              <text x="60" y="85" fill="#FFFFFF" fontSize="9" textAnchor="middle" fontWeight="600">
                Hồ
              </text>

              {/* Point 2: Quán trà */}
              <circle cx="160" cy="50" r="5" fill="#F4DB38" />
              <text x="160" y="40" fill="#FFFFFF" fontSize="9" textAnchor="middle" fontWeight="600">
                Trà
              </text>

              {/* Line 1: Lake to Tea */}
              <line x1="60" y1="65" x2="160" y2="50" stroke="#08B3C6" strokeWidth="2.5" />

              {/* Point 3 / Line 2 depending on isAfter */}
              {isAfter ? (
                <>
                  {/* Replaced Point: Nhà gỗ ven đồi (Clustered nearby) */}
                  <line
                    x1="160"
                    y1="50"
                    x2="240"
                    y2="75"
                    stroke="#08B3C6"
                    strokeWidth="2.5"
                  />
                  <circle cx="240" cy="75" r="6" fill="#08B3C6" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="240" y="95" fill="#E0FAFC" fontSize="9.5" textAnchor="middle" fontWeight="700">
                    Nhà gỗ ven hồ
                  </text>
                  {/* Dimmed distant sunset hill */}
                  <circle cx="340" cy="25" r="3.5" fill="#67736D" opacity="0.4" />
                  <text x="340" y="20" fill="#67736D" fontSize="8" textAnchor="middle" opacity="0.5">
                    Đồi xa (đã bỏ)
                  </text>
                </>
              ) : (
                <>
                  {/* Original Point: Hoàng hôn đồi xa (Distant, steep) */}
                  <line
                    x1="160"
                    y1="50"
                    x2="340"
                    y2="25"
                    stroke="#E7AD2E"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle cx="340" cy="25" r="6" fill="#E7AD2E" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="340" y="20" fill="#F4DB38" fontSize="9" textAnchor="middle" fontWeight="700">
                    Hoàng hôn đồi xa
                  </text>
                  {/* Dimmed lodge */}
                  <circle cx="240" cy="75" r="3.5" fill="#67736D" opacity="0.4" />
                </>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';

interface SourcesModalProps {
  isOpen: boolean;
  activePlan: DemoPlan;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function SourcesModal({
  isOpen,
  activePlan,
  onClose,
  triggerRef,
}: SourcesModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const triggerEl = triggerRef?.current;

    // Focus close button on mount
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerEl?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      triggerEl?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sources-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#0E1D4F]/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#0E1D4F]/10 flex items-center justify-between bg-white/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#205BD6]/10 flex items-center justify-center text-[#205BD6]">
              <Icon name="menu_book" className="size-5" />
            </div>
            <div>
              <h2 id="sources-modal-title" className="font-headline-sm text-base font-bold text-[#0E1D4F]">
                Nguồn đối chiếu thực tế ({activePlan.sources.length})
              </h2>
              <p className="text-xs text-[#4B5875]">Tài liệu kiểm chứng vi khí hậu & văn hóa bản địa</p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại nguồn đối chiếu"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 bg-[#EBF1F0] rounded-2xl border border-[#0E1D4F]/10 text-xs text-[#4B5875] leading-relaxed flex items-start gap-2">
            <Icon name="shield" className="size-4 text-[#205BD6] shrink-0 mt-0.5" />
            <span>
              Các trích dẫn này được Reality Agent đối chiếu tự động khi bạn thảo luận cùng Vistra để bảo đảm tính khả thi thực tế và tránh rủi ro thời tiết, quá tải.
            </span>
          </div>

          <div className="space-y-3">
            {activePlan.sources.map((src) => (
              <div
                key={src.id}
                className="p-4 bg-white rounded-2xl border border-[#0E1D4F]/10 shadow-xs space-y-2 hover:border-[#205BD6]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold bg-[#08B3C6]/15 text-[#08B3C6]">
                    {src.type === 'weather_station' ? 'TRẠM KHÍ TƯỢNG' : src.type === 'local_guide' ? 'NGHỆ NHÂN BẢN ĐỊA' : src.type === 'dossier' ? 'HỒ SƠ DI SẢN' : 'CỘNG ĐỒNG'}
                  </span>
                  <span className="text-[11px] text-[#4B5875] font-mono">{src.id}</span>
                </div>

                <h3 className="font-headline-sm text-sm font-bold text-[#0E1D4F] leading-snug">
                  {src.title}
                </h3>

                <p className="text-xs text-[#4B5875] italic leading-relaxed bg-[#EBF1F0]/50 p-2.5 rounded-xl border border-[#0E1D4F]/5">
                  &ldquo;{src.snippet}&rdquo;
                </p>

                <div className="pt-1 flex items-center justify-between text-xs text-[#205BD6]">
                  <span className="font-medium">Nguồn: {src.authorOrDomain}</span>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Xem gốc</span>
                      <Icon name="open_in_new" className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#0E1D4F]/10 bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#205BD6] text-white text-xs font-semibold hover:bg-[#1847a8] transition-colors cursor-pointer"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

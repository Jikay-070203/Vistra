'use client';

import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  targetName?: string;
  subjectInfo?: string;
  consequence?: string;
  consequenceWarning?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | HTMLElement | null>;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  targetName,
  subjectInfo,
  consequence,
  consequenceWarning,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  confirmVariant = 'danger',
  isDestructive,
  onConfirm,
  onCancel,
  triggerRef,
}: ConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const target = targetName || subjectInfo;
  const warning = consequence || consequenceWarning;
  const confirmBtnText = confirmLabel || confirmText || 'Xác nhận';
  const cancelBtnText = cancelLabel || cancelText || 'Hủy bỏ';
  const isDanger = isDestructive !== undefined ? isDestructive : confirmVariant === 'danger';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    const triggerEl = triggerRef?.current;
    window.addEventListener('keydown', handleKeyDown);
    // Focus cancel button for safe keyboard navigation
    cancelBtnRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      triggerEl?.focus();
    };
  }, [isOpen, onCancel, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-[#0E1D4F]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDanger
                  ? 'bg-red-50 text-red-600'
                  : 'bg-[#205BD6]/10 text-[#205BD6]'
              }`}
            >
              <Icon
                name={isDanger ? 'warning' : 'help_outline'}
                className="size-5"
              />
            </div>
            <h3 id="confirm-modal-title" className="font-headline-sm text-base text-[#0E1D4F] font-bold">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng hộp thoại"
            className="w-8 h-8 rounded-full hover:bg-[#EBF1F0] flex items-center justify-center text-[#4B5875] cursor-pointer"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-3 text-xs text-[#4B5875]">
          <p className="leading-relaxed">{message}</p>

          {target && (
            <div className="p-3 bg-[#EBF1F0]/50 rounded-xl border border-[#0E1D4F]/10">
              <span className="text-[#4B5875] block text-[11px]">Đối tượng áp dụng:</span>
              <strong className="text-[#0E1D4F] text-sm font-semibold">{target}</strong>
            </div>
          )}

          {warning && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 flex items-start gap-2">
              <Icon name="info" className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">{warning}</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#EBF1F0]/30 border-t border-[#0E1D4F]/10 flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 border border-[#0E1D4F]/15 font-semibold text-xs text-[#0E1D4F] cursor-pointer transition-colors"
          >
            {cancelBtnText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-semibold text-xs text-white cursor-pointer transition-colors shadow-xs ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#205BD6] hover:bg-[#1847a8]'
            }`}
          >
            {confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
}

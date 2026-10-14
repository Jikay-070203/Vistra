'use client';

import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function ComingSoonModal({ isOpen, onClose, title = 'Tính năng đang phát triển' }: ComingSoonModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1D4F]/55 p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-6 text-center shadow-xl transform animate-in zoom-in-95 duration-200"
      >
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full border border-[#08B3C6]/30 bg-[#EBF1F0] text-[#0E1D4F]">
          <Icon name="schedule" className="size-6" />
        </div>

        <div className="space-y-1">
          <h3 id="coming-soon-title" className="font-headline-sm text-lg font-bold text-[#0E1D4F]">
            {title}
          </h3>
          <p className="text-sm font-semibold text-[#205BD6]">
            Sắp ra mắt
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            ref={closeButtonRef}
            className="min-h-11 w-full rounded-lg bg-[#205BD6] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

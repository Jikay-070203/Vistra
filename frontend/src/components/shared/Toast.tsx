'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  variant?: 'success' | 'error';
}

export default function Toast({ message, onClose, variant = 'success' }: ToastProps) {
  if (!message) return null;
  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-50 flex max-w-lg items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 ${
        isError ? 'bg-[#FFF4F2] border border-[#B42318]/25 text-[#7A271A]' : 'bg-warm-surface border border-[#08B3C6]/30 text-[#0E1D4F]'
      }`}
    >
      <Icon
        name={isError ? 'warning' : 'check_circle'}
        className={`size-5 shrink-0 ${isError ? 'text-[#B42318]' : 'text-[#08B3C6]'}`}
      />
      <span className="min-w-0 break-words font-label-lg text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className={`ml-auto min-w-11 min-h-11 flex items-center justify-center rounded-lg transition-colors ${isError ? 'text-[#7A271A] hover:bg-[#B42318]/10' : 'text-[#4B5875] hover:bg-[#0E1D4F]/5'}`}
        aria-label="Đóng thông báo"
      >
        <Icon name="close" className="size-4" />
      </button>
    </div>
  );
}

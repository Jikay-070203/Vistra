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
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 text-white px-5 py-3.5 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
        isError ? 'bg-rose-950 border border-rose-300/20' : 'bg-[#0b3b3c] border border-[#beebeb]/20'
      }`}
    >
      <Icon
        name={isError ? 'warning' : 'check_circle'}
        className={`size-5 ${isError ? 'text-rose-200' : 'text-[#beebeb]'}`}
      />
      <span className="font-label-lg text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/70 hover:text-white p-1 rounded-md transition-colors"
        aria-label="Đóng thông báo"
      >
        <Icon name="close" className="size-4" />
      </button>
    </div>
  );
}

'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0b3b3c] text-white px-5 py-3.5 rounded-xl shadow-xl border border-[#beebeb]/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Icon name="check_circle" className="size-5 text-[#beebeb]" />
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

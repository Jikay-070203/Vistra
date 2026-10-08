'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';

interface MockBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export default function MockBadge({ className = '', size = 'md' }: MockBadgeProps) {
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-800 shrink-0 ${
        isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      title="DỮ LIỆU MINH HỌA — Phục vụ kiểm thử giao diện & xem trước chức năng"
    >
      <Icon name="science" className={isSm ? 'size-3 text-amber-700' : 'size-3.5 text-amber-700'} />
      <span>DỮ LIỆU MINH HỌA</span>
    </span>
  );
}

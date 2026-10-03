'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';

interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
}

export default function AdminNavigation() {
  const pathname = usePathname();
  const { tickets } = useFeedback();

  const unassignedCount = tickets.filter((t) => t.status === 'unassigned').length;

  const navItems: AdminNavItem[] = [
    {
      id: 'overview',
      label: 'Tổng quan Vận hành',
      href: '/admin',
      icon: 'dashboard',
    },
    {
      id: 'users',
      label: 'Quản lý Người dùng',
      href: '/admin/users',
      icon: 'group',
    },
    {
      id: 'revenue',
      label: 'Theo dõi Doanh thu',
      href: '/admin/revenue',
      icon: 'payments',
    },
    {
      id: 'feedback',
      label: 'Hòm thư Phản hồi',
      href: '/admin/feedback',
      icon: 'feedback',
      badge: unassignedCount > 0 ? unassignedCount : undefined,
    },
    {
      id: 'system',
      label: 'Hạ tầng & Kiểm thử AI',
      href: '/admin/system',
      icon: 'dns',
    },
  ];

  const isActive = (itemHref: string) => {
    if (itemHref === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(itemHref);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border-b border-[#0E1D4F]/10 sticky top-[76px] z-30 shadow-2xs">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-12 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title and Scope Banner */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0E1D4F] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Icon name="monitoring" className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] text-[#205BD6] uppercase font-bold tracking-wider">
                VISTRA OPERATOR WORKBENCH
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#0E1D4F]/10 text-[#0E1D4F] font-semibold">
                DEMO SANDBOX · MỞ CHO KHÁCH THĂM
              </span>
            </div>
            <h1 className="font-headline-sm text-base sm:text-lg text-[#0E1D4F] font-bold">
              Bảng điều khiển &amp; Vận hành Hệ thống
            </h1>
          </div>
        </div>

        {/* Secondary Navigation Tabs */}
        <nav
          className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none"
          aria-label="Điều hướng Quản trị"
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 border ${
                  active
                    ? 'bg-[#205BD6] text-white border-[#205BD6] shadow-xs'
                    : 'bg-white/60 hover:bg-white text-[#4B5875] hover:text-[#0E1D4F] border-[#0E1D4F]/10'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={item.icon} className="size-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white text-[#205BD6]' : 'bg-[#E7AD2E] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

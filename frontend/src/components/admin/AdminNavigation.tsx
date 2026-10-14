'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { logout as apiLogout } from '@/services/authService';
import { setAuthState } from '@/lib/userAuth';
import { useFeedback } from '@/context/FeedbackContext';

interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export default function AdminNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { counts, countsLoading, countsError } = useFeedback();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Authoritative unassigned count only: if null/error/loading, omit numeric badge, never fall back to loaded tickets subset/zero
  const unassignedBadge: number | undefined =
    countsLoading || countsError || !counts || counts.unassigned <= 0
      ? undefined
      : counts.unassigned;

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
      badge: unassignedBadge,
    },
    {
      id: 'content',
      label: 'Quản lý Nội dung',
      href: '/admin/content',
      icon: 'auto_stories',
    },
    {
      id: 'system',
      label: 'Hạ tầng hệ thống',
      href: '/admin/system',
      icon: 'dns',
    },
    {
      id: 'system-data',
      label: 'Quản trị dữ liệu',
      href: '/admin/system/data',
      icon: 'storage',
    },
  ];

  const isActive = (itemHref: string) => {
    if (itemHref === '/admin' || itemHref === '/admin/system') {
      return pathname === itemHref;
    }
    return pathname.startsWith(itemHref);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const result = await apiLogout();
      if (result.data?.success) {
        setAuthState(null);
        router.push('/login?next=/admin');
        router.refresh();
      } else {
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Close mobile drawer on route change (render adjustment pattern)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileOpen(false);
  }

  // Handle Escape key and body scroll lock for mobile drawer
  useEffect(() => {
    if (!isMobileOpen) return;

    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
        toggleBtnRef.current?.focus();
      } else if (e.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a, button:not([disabled])'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileOpen]);

  const renderNavList = () => (
    <nav className="flex flex-col gap-1.5 flex-1" aria-label="Điều hướng Quản trị">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex min-h-11 items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              active
                ? 'bg-[#205BD6] text-white shadow-xs'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-paper'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <div className="flex items-center gap-3">
              <Icon name={item.icon} className="size-4 shrink-0" />
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                active ? 'bg-warm-surface text-[#205BD6]' : 'bg-[#E7AD2E] text-[#0E1D4F]'
                }`}
                title={`${item.badge} phản hồi chưa phân loại`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Top Header (print:hidden) */}
      <header className="md:hidden sticky top-0 z-30 h-16 bg-warm-paper border-b border-[#0E1D4F]/10 px-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0E1D4F] text-white flex items-center justify-center shrink-0">
            <Icon name="admin_panel_settings" className="size-4" />
          </div>
          <div>
            <span className="font-label-caps text-[10px] text-[#205BD6] uppercase font-bold tracking-wider">
              VISTRA OPERATOR
            </span>
            <div className="font-headline-sm text-sm text-[#0E1D4F] font-bold">
              Quản trị hệ thống
            </div>
          </div>
        </div>

        <button
          ref={toggleBtnRef}
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="min-w-11 min-h-11 grid place-items-center rounded-lg text-[#0E1D4F] hover:bg-warm-surface transition-colors cursor-pointer"
          aria-label="Mở menu quản trị"
          aria-expanded={isMobileOpen}
          aria-controls="admin-navigation-mobile"
        >
          <Icon name="menu" className="size-5" />
        </button>
      </header>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {isMobileOpen && (
      <div
        ref={drawerRef}
        id="admin-navigation-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu quản trị"
        className="md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-warm-surface flex flex-col shadow-xl"
      >
        <div className="min-h-16 p-4 border-b border-[#0E1D4F]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0E1D4F] text-white flex items-center justify-center shrink-0">
              <Icon name="admin_panel_settings" className="size-4" />
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-[#205BD6] uppercase font-bold tracking-wider">
                VISTRA OPERATOR
              </span>
              <div className="font-headline-sm text-sm text-[#0E1D4F] font-bold">
                Quản trị hệ thống
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMobileOpen(false);
              toggleBtnRef.current?.focus();
            }}
            className="min-w-11 min-h-11 grid place-items-center rounded-lg text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-paper cursor-pointer"
            aria-label="Đóng menu quản trị"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {renderNavList()}
        </div>

        <div className="p-4 border-t border-[#0E1D4F]/10 space-y-2">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-paper transition-colors"
          >
            <Icon name="arrow_back" className="size-4" />
            <span>Về trang du khách</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full min-h-11 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#ba1a1a] hover:bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Icon name="sync" className="size-4 animate-spin" />
            ) : (
              <Icon name="logout" className="size-4" />
            )}
            <span>{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
          </button>
        </div>
      </div>
      )}

      {/* Desktop Sidebar (print:hidden) */}
      <aside
        className="hidden md:flex md:w-64 lg:w-72 shrink-0 bg-warm-surface border-r border-[#0E1D4F]/10 flex-col sticky top-0 h-dvh z-20 print:hidden"
        aria-label="Thanh bên Quản trị"
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#0E1D4F]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E1D4F] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Icon name="admin_panel_settings" className="size-5" />
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-[#205BD6] uppercase font-bold tracking-wider block">
                VISTRA OPERATOR
              </span>
              <h2 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                Quản trị hệ thống
              </h2>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-4 flex-1 overflow-y-auto">
          {renderNavList()}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#0E1D4F]/10 space-y-2">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-paper transition-colors"
            title="Quay lại giao diện dành cho du khách"
          >
            <Icon name="arrow_back" className="size-4" />
            <span>Về trang du khách</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full min-h-11 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#ba1a1a] hover:bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 transition-colors cursor-pointer disabled:opacity-50"
            title="Đăng xuất khỏi phiên Quản trị viên"
            aria-label="Đăng xuất"
          >
            {isLoggingOut ? (
              <Icon name="sync" className="size-4 animate-spin" />
            ) : (
              <Icon name="logout" className="size-4" />
            )}
            <span>{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

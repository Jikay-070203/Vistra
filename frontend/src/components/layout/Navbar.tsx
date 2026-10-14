'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useUserAuth } from '@/lib/userAuth';

interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { isLoggedIn, user, logout } = useUserAuth();

  const navLinks: NavLink[] = [
    { label: 'Cộng đồng', href: '/community' },
    { label: 'Điểm đến', href: '/destinations' },
    { label: 'Chuyến đi của tôi', href: '/my-trips' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#0E1D4F]/10 bg-warm-paper shadow-[0_2px_12px_rgba(14,29,79,0.04)]">
      <div className="h-[76px] max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="VISTRA — Trang chủ">
            <div className="w-9 h-9 rounded-lg bg-[#08B3C6]/12 border border-[#08B3C6]/30 flex items-center justify-center text-[#08B3C6] group-hover:bg-[#08B3C6] group-hover:text-white transition-colors">
              <Icon name="explore" className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-lg tracking-tight text-[#0E1D4F] font-bold leading-tight">
                VISTRA
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#205BD6] font-semibold -mt-0.5 font-label-caps hidden xs:inline-block sm:inline-block">
                Travel Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`min-h-11 text-xs sm:text-sm px-3.5 py-2 rounded-lg transition-colors font-medium flex items-center gap-1 ${
                    active
                      ? 'text-[#0E1D4F] bg-warm-surface font-semibold'
                      : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-surface'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Controls & Utilities */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Login link (when not logged in) */}
          {!isLoggedIn ? (
            <Link
              href="/login"
              className={`hidden sm:inline-flex min-h-11 items-center gap-2 px-3 rounded-lg text-xs font-label-md transition-colors ${
                pathname === '/login' || pathname === '/register'
                  ? 'text-[#0E1D4F] bg-warm-surface font-semibold'
                  : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-surface'
              }`}
              aria-current={pathname === '/login' ? 'page' : undefined}
            >
              <Icon name="login" className="size-3.5" />
              <span>Đăng nhập</span>
            </Link>
          ) : (
            <>
              {/* Profile Avatar Button */}
              <Link
                href="/profile"
                className={`min-w-11 min-h-11 rounded-full border flex items-center justify-center font-bold text-xs transition-colors ${
                  pathname.startsWith('/profile')
                    ? 'bg-[#205BD6] text-white border-[#205BD6] shadow-xs'
                    : 'bg-white/90 text-[#0E1D4F] border-[#0E1D4F]/15 hover:border-[#205BD6] hover:shadow-xs'
                }`}
                title={user?.fullName ? `Hồ sơ: ${user.fullName}` : 'Hồ sơ du khách'}
                aria-label="Hồ sơ cá nhân"
              >
                <span>{user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'VS'}</span>
              </Link>
              {/* Logout button */}
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="hidden sm:inline-flex min-h-11 min-w-11 items-center justify-center gap-1 px-2.5 rounded-lg text-xs font-label-md text-[#4B5875] hover:text-[#ba1a1a] hover:bg-red-50/50 transition-colors cursor-pointer"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <Icon name="logout" className="size-3.5" />
              </button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            ref={menuButtonRef}
            className="md:hidden min-w-11 min-h-11 grid place-items-center rounded-lg text-[#0E1D4F] hover:bg-warm-surface transition-colors"
            aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation-mobile"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="primary-navigation-mobile" className="md:hidden max-h-[calc(100dvh-76px)] overflow-y-auto bg-warm-surface border-t border-[#0E1D4F]/10 px-4 py-3">
          <nav className="flex flex-col gap-1" aria-label="Điều hướng chính">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`min-h-11 text-sm px-3 py-2.5 rounded-lg transition-colors font-medium ${
                    active
                      ? 'text-[#0E1D4F] bg-warm-paper font-semibold'
                      : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-paper'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-2 mt-1 border-t border-[#0E1D4F]/10 flex flex-col gap-1">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-11 text-sm px-3 py-2 rounded-lg text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-paper flex items-center gap-2"
                  >
                    <Icon name="person" className="size-4 text-[#205BD6]" />
                    <span>Hồ sơ du khách ({user?.fullName || 'VISTRA'})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                    }}
                    className="min-h-11 text-sm px-3 py-2 rounded-lg text-[#ba1a1a] hover:bg-red-50 flex items-center gap-2 text-left w-full cursor-pointer"
                  >
                    <Icon name="logout" className="size-4 text-[#ba1a1a]" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-11 text-sm px-3 py-2 rounded-lg text-[#4B5875] hover:text-[#0E1D4F] hover:bg-warm-paper flex items-center gap-2"
                >
                  <Icon name="login" className="size-4 text-[#205BD6]" />
                  <span>Đăng nhập / Đăng ký</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

'use client';

import React, { useState } from 'react';
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#EBF1F0]/92 backdrop-blur-md border-b border-[#0E1D4F]/10 shadow-[0_2px_12px_rgba(14,29,79,0.04)] transition-all">
      <div className="h-[76px] max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="VISTRA — Trang chủ">
            <div className="w-9 h-9 rounded-xl bg-[#08B3C6]/15 border border-[#08B3C6]/30 flex items-center justify-center text-[#08B3C6] shadow-2xs group-hover:bg-[#08B3C6] group-hover:text-white transition-all">
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
                  className={`text-xs sm:text-sm px-3.5 py-2 rounded-lg transition-all font-medium flex items-center gap-1 ${
                    active
                      ? 'text-[#205BD6] bg-[#205BD6]/10 font-semibold shadow-2xs'
                      : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-white/60'
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
              className={`hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-label-md transition-all ${
                pathname === '/login' || pathname === '/register'
                  ? 'text-[#205BD6] bg-[#205BD6]/10 font-semibold'
                  : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-white/60'
              }`}
            >
              <Icon name="login" className="size-3.5" />
              <span>Đăng nhập</span>
            </Link>
          ) : (
            <>
              {/* Profile Avatar Button */}
              <Link
                href="/profile"
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all ${
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
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-label-md text-[#4B5875] hover:text-[#ba1a1a] hover:bg-red-50/50 transition-all cursor-pointer"
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
            className="md:hidden p-2 rounded-lg text-[#0E1D4F] hover:bg-white/60 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#0E1D4F]/10 px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1" aria-label="Điều hướng di động">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm px-3 py-2.5 rounded-lg transition-all font-medium ${
                    active
                      ? 'text-[#205BD6] bg-[#205BD6]/10 font-semibold'
                      : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]'
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
                    className="text-sm px-3 py-2 rounded-lg text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0] flex items-center gap-2"
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
                    className="text-sm px-3 py-2 rounded-lg text-[#ba1a1a] hover:bg-red-50 flex items-center gap-2 text-left w-full cursor-pointer"
                  >
                    <Icon name="logout" className="size-4 text-[#ba1a1a]" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm px-3 py-2 rounded-lg text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0] flex items-center gap-2"
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

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { appConfig } from '@/config/appConfig';
import styles from './landing.module.css';

interface NavItem {
  id: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'tong-quan', label: 'Tổng quan', href: '#tong-quan' },
  { id: 'kham-pha', label: 'Khám phá', href: '#kham-pha' },
  { id: 'cung-xay', label: 'Cùng xây', href: '#cung-xay' },
  { id: 'xac-nhan', label: 'Xác nhận', href: '#xac-nhan' },
  { id: 'trai-nghiem', label: 'Khởi hành', href: '#trai-nghiem' },
];

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isNavClickingRef = useRef(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setActiveSection(targetId);
    isNavClickingRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isNavClickingRef.current = false;
    }, 900);

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      const headerOffset = 76;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      history.replaceState(null, '', `#${targetId}`);
    }
  };

  // Handle Escape key and body scroll lock for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    drawerRef.current?.querySelector<HTMLElement>('button')?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        toggleBtnRef.current?.focus();
      } else if (e.key === 'Tab') {
        const items = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
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
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const scrollThreshold = appConfig.header.morphScrollThresholdPx || 80;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > scrollThreshold;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));

          if (!isNavClickingRef.current) {
            const headerOffset = 110;
            const scrollPos = window.scrollY + headerOffset;

            const heroEl = document.getElementById('y-tuong');
            if (heroEl && scrollPos < heroEl.offsetTop + heroEl.offsetHeight * 0.7) {
              setActiveSection('');
            } else {
              const sectionIds = ['tong-quan', 'kham-pha', 'cung-xay', 'xac-nhan', 'trai-nghiem'];
              let matchedId = '';
              for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (el) {
                  if (scrollPos >= el.offsetTop - 30) {
                    matchedId = id;
                  }
                }
              }
              setActiveSection(matchedId);
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  return (
    <header
      id="landing-header"
      className={`${styles.headerWrapper} ${isScrolled ? styles.headerScrolled : styles.headerTransparent}`}
      role="banner"
    >
      <div className={styles.headerInner}>
        {/* Brand Logo */}
        <Link href="/" className={styles.logo} aria-label="VISTRA — Trang chủ">
          <div className={styles.logoIcon}>
            <Icon name="explore" className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className={styles.logoText}>VISTRA</span>
            <span className={styles.logoSub}>Travel Intelligence</span>
          </div>
        </Link>

        {/* Center Navigation (Desktop Grid with Equal-width Cells) */}
        <nav className={styles.nav} aria-label="Điều hướng các chặng trải nghiệm">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                aria-current={isActive ? 'location' : undefined}
              >
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right CTA with tuned surface alpha */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/community"
            className={`${styles.btnPrimary} ${styles.headerCta}`}
            aria-label="Khám phá hành trình cộng đồng"
          >
            <span>Khám phá</span>
            <Icon name="arrow_forward" className="size-3.5 sm:size-4 shrink-0" />
          </Link>

          {/* Mobile menu button */}
          <button
            ref={toggleBtnRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#20312B] hover:bg-[#DCE7D8] transition-colors shrink-0 cursor-pointer"
            aria-label={mobileMenuOpen ? 'Đóng danh mục điều hướng' : 'Mở danh mục điều hướng'}
            aria-expanded={mobileMenuOpen}
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="size-6" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setMobileMenuOpen(false);
            toggleBtnRef.current?.focus();
          }}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Danh mục điều hướng di động"
          className="md:hidden fixed top-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto bg-white border-b border-[#0E1D4F]/10 px-5 py-4 shadow-2xl animate-in slide-in-from-top duration-200"
        >
          {/* Drawer Header with Close Button */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#0E1D4F]/10">
            <span className="font-headline-sm text-sm text-[#0E1D4F] font-bold">
              Menu điều hướng
            </span>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                toggleBtnRef.current?.focus();
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#4B5875] hover:bg-[#EBF1F0] transition-colors cursor-pointer"
              aria-label="Đóng danh mục điều hướng"
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>

          {/* Primary Product Routes (NAV-02: Cộng đồng → Điểm đến → Chuyến đi của tôi, bỏ Lên kế hoạch) */}
          <div className="mb-3 pb-3 border-b border-[#0E1D4F]/10">
            <span className="text-[11px] font-label-caps uppercase font-bold tracking-wider text-[#205BD6] block mb-2 px-1">
              Khám phá sản phẩm
            </span>
            <nav className="flex flex-col gap-1" aria-label="Lối vào sản phẩm chính">
              <Link
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors"
              >
                <Icon name="groups" className="size-4 text-[#E7AD2E]" />
                <span>Cộng đồng</span>
              </Link>
              <Link
                href="/destinations"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors"
              >
                <Icon name="explore" className="size-4 text-[#08B3C6]" />
                <span>Điểm đến</span>
              </Link>
              <Link
                href="/my-trips"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors"
              >
                <Icon name="luggage" className="size-4 text-[#205BD6]" />
                <span>Chuyến đi của tôi</span>
              </Link>
            </nav>
          </div>

          {/* In-page Landing Metaphor Sections */}
          <div>
            <span className="text-[11px] font-label-caps uppercase font-bold tracking-wider text-[#4B5875] block mb-1.5 px-1">
              Chặng hành trình Landing
            </span>
            <nav className="flex flex-col gap-0.5" aria-label="Điều hướng chặng landing">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleNavClick(e, item.id);
                    }}
                    className={`min-h-[44px] flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-[#205BD6] bg-[#205BD6]/10 font-bold'
                        : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]/60'
                    }`}
                    aria-current={isActive ? 'location' : undefined}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

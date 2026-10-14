'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import styles from './landing-redesign.module.css';

const NAV_ITEMS = [
  { id: 'ban-muon-di-dau', label: 'Điểm đến' },
  { id: 'tong-quan', label: 'Tổng quan' },
  { id: 'kham-pha', label: 'Khám phá' },
  { id: 'cung-xay', label: 'Cùng xây' },
  { id: 'xac-nhan', label: 'Xác nhận' },
  { id: 'trai-nghiem', label: 'Khởi hành' },
];

export default function LandingHeader() {
  const [activeSection, setActiveSection] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const hero = document.getElementById('y-tuong');
    const header = headerRef.current;
    if (!hero || !header) return;

    const updatePinnedState = () => {
      const next = hero.getBoundingClientRect().bottom <= 0;
      setIsPinned(next);
    };

    updatePinnedState();
    window.addEventListener('scroll', updatePinnedState, { passive: true });
    window.addEventListener('resize', updatePinnedState);
    return () => {
      window.removeEventListener('scroll', updatePinnedState);
      window.removeEventListener('resize', updatePinnedState);
    };
  }, []);

  React.useEffect(() => {
    const sections = ['y-tuong', ...NAV_ITEMS.map((item) => item.id)]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActiveSection(visible[visible.length - 1].target.id);
      },
      { rootMargin: '-24% 0px -66% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const renderLinks = () =>
    NAV_ITEMS.map((item) => (
      <a
        key={item.id}
        href={'#' + item.id}
        className={styles.navLink + (activeSection === item.id ? ' ' + styles.navLinkActive : '')}
        aria-current={activeSection === item.id ? 'location' : undefined}
        onClick={closeMenu}
      >
        {item.label}
      </a>
    ));

  return (
    <header
      ref={headerRef}
      className={styles.header + (isPinned ? ' ' + styles.headerPinned : '')}
    >
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="VISTRA, trang chủ">
          <span className={styles.brandMark} aria-hidden="true">
            <Icon name="explore" className="size-6" />
          </span>
          <span className={styles.brandName}>VISTRA</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Điều hướng trên trang chủ">
          {renderLinks()}
        </nav>

        <Link href="/create-trip" className={styles.navAction + ' ' + styles.navActionDesktop}>
          Bắt đầu ý tưởng
          <Icon name="arrow_forward" className="size-4" />
        </Link>

        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-label={menuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} className="size-6" />
        </button>
      </div>

      <nav
        id="landing-mobile-menu"
        className={styles.mobileMenu}
        aria-label="Điều hướng di động"
        hidden={!menuOpen}
      >
        <Link href="/create-trip" className={styles.navAction} onClick={closeMenu}>
          Bắt đầu ý tưởng chuyến đi
          <Icon name="arrow_forward" className="size-4" />
        </Link>
        {renderLinks()}
      </nav>
    </header>
  );
}

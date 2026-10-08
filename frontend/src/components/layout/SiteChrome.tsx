'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import styles from '@/components/landing/landing.module.css';
import { FeedbackProvider } from '@/context/FeedbackContext';
import FeedbackLauncher from '@/components/feedback/FeedbackLauncher';

/**
 * Danh sách các route endpoint ẩn Global Header (Navbar).
 * Dễ dàng cấu hình hoặc bổ sung endpoint trong tương lai.
 * Hỗ trợ so khớp chính xác (vd: '/planner') hoặc route con (vd: '/planner/...').
 */
const HIDE_GLOBAL_HEADER_ROUTES: readonly string[] = [
  '/planner',
];

function isRouteMatch(currentPath: string, routes: readonly string[]): boolean {
  return routes.some((route) => currentPath === route || currentPath.startsWith(`${route}/`));
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const hideHeader = pathname ? isRouteMatch(pathname, HIDE_GLOBAL_HEADER_ROUTES) : false;

  if (isLanding) {
    return (
        <FeedbackProvider>
          <div className={styles.landingRoot}>
            {/* Skip to Main Content for Accessibility */}
            <a href="#main-content" className={styles.skipLink}>
              Bỏ qua đến nội dung chính
            </a>

            {/* Landing 76px Header */}
            <LandingHeader />

            {/* Main Content Area for Landing */}
            <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
              {children}
            </main>

            {/* Dedicated Landing Footer */}
            <LandingFooter />
          </div>
        </FeedbackProvider>
    );
  }

  if (pathname.startsWith('/admin')) {
    return (
        <FeedbackProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0E1D4F] focus:text-white focus:rounded-lg focus:shadow-md"
          >
            Bỏ qua đến nội dung chính
          </a>
          <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
            {children}
          </main>
        </FeedbackProvider>
    );
  }

  // Functional Routes Shell with shared paper canvas, functional navbar & footer
  return (
      <FeedbackProvider>
        {!hideHeader && <Navbar />}
        <main className={`flex-1 ${hideHeader ? '' : 'pt-[76px]'}`}>
          {children}
        </main>
        <Footer />
        <FeedbackLauncher />
      </FeedbackProvider>
  );
}


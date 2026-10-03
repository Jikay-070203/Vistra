'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import styles from '@/components/landing/landing.module.css';
import { DemoPlanProvider } from '@/context/DemoPlanContext';
import { FeedbackProvider } from '@/context/FeedbackContext';
import FeedbackLauncher from '@/components/feedback/FeedbackLauncher';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return (
      <DemoPlanProvider>
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
      </DemoPlanProvider>
    );
  }

  // Functional Routes Shell with shared paper canvas, functional navbar & footer
  return (
    <DemoPlanProvider>
      <FeedbackProvider>
        <Navbar />
        <main className="flex-1 pt-[76px]">
          {children}
        </main>
        <Footer />
        <FeedbackLauncher />
      </FeedbackProvider>
    </DemoPlanProvider>
  );
}

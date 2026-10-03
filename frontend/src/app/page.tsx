import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'VISTRA — Chuyến đi đáng để mong chờ',
  description: 'Visual Intelligence System for Travel Recommendation & Agents. Lên kế hoạch du lịch cùng AI từ văn bản và hình ảnh; bạn toàn quyền quyết định.',
};

export default function HomePage() {
  return (
    <div className={styles.landingTheme}>
      <LandingPage />
    </div>
  );
}

import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'VISTRA | Lên ý tưởng chuyến đi của bạn',
  description: 'Khám phá điểm đến, tạo lịch trình từ ảnh hoặc ghi chú, rồi chọn từng chặng cho chuyến đi của bạn.',
};

export default function HomePage() {
  return (
    <div className={styles.landingTheme}>
      <LandingPage />
    </div>
  );
}

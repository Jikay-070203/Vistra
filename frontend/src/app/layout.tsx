import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import SiteChrome from '@/components/layout/SiteChrome';

const plusJakartaSans = localFont({
  src: '../../public/fonts/plus-jakarta-sans/PlusJakartaSans-variable.ttf',
  variable: '--font-body',
  weight: '400 800',
  display: 'swap',
});

const inter = localFont({
  src: '../../public/fonts/inter/Inter-variable.ttf',
  variable: '--font-label',
  weight: '400 900',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VISTRA — Biến cảm hứng du lịch thành chuyến đi bạn thực sự có thể trải nghiệm',
  description: 'Nền tảng đồng kiến tạo hành trình du lịch kết hợp AI đa tác nhân và sự kiểm soát của con người theo triết lý Serene Editorial Voyage.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-warm-paper text-[#0E1D4F]">
        <SiteChrome>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}

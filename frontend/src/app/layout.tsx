import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import SiteChrome from '@/components/layout/SiteChrome';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-label',
  subsets: ['latin', 'vietnamese'],
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
      <body className="min-h-full flex flex-col bg-[#EBF1F0] text-[#0E1D4F]">
        <SiteChrome>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}

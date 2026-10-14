import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";

const plusJakartaSans = localFont({
  src: "../../public/fonts/plus-jakarta-sans/PlusJakartaSans-variable.ttf",
  variable: "--font-body",
  weight: "400 800",
  display: "swap",
});

const inter = localFont({
  src: "../../public/fonts/inter/Inter-variable.ttf",
  variable: "--font-label",
  weight: "400 900",
  display: "swap",
});

export const metadata: Metadata = {
  // Thay đổi domain chính thức của web khi deploy
  metadataBase: new URL("https://c4-app-103.vercel.app"),
  title:
    "VISTRA — Biến cảm hứng du lịch thành chuyến đi bạn thực sự có thể trải nghiệm",
  description:
    "Nền tảng đồng kiến tạo hành trình du lịch kết hợp AI đa tác nhân.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title:
      "VISTRA — Biến cảm hứng du lịch thành chuyến đi bạn thực sự có thể trải nghiệm",
    description:
      "Khám phá điểm đến, tạo lịch trình từ ảnh hoặc ghi chú, rồi chọn từng chặng cho chuyến đi của bạn.",
    url: "https://c4-app-103.vercel.app",
    siteName: "VISTRA",
    images: [
      {
        url: "/opengraph-image.jpg", // Đường dẫn file nằm trong thư mục public/
        width: 1200,
        height: 630,
        alt: "VISTRA Travel Intelligence",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VISTRA — Biến cảm hứng du lịch",
    description: "Nền tảng đồng kiến tạo hành trình du lịch...",
    images: ["/opengraph-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-warm-paper text-[#0E1D4F]">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

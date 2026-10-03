import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function Footer() {
  return (
    <footer className="w-full bg-[#DFE8E7]/90 border-t border-[#0E1D4F]/10 text-[#4B5875] pt-14 pb-12 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-[#08B3C6]/15 border border-[#08B3C6]/30 flex items-center justify-center text-[#08B3C6] shadow-2xs group-hover:bg-[#08B3C6] group-hover:text-white transition-all">
                <Icon name="explore" className="size-5" />
              </div>
              <span className="font-headline-sm text-xl tracking-tight text-[#0E1D4F] font-bold">VISTRA</span>
            </Link>
            <p className="font-body-sm text-xs sm:text-sm text-[#4B5875] max-w-md leading-relaxed">
              Biến cảm hứng du lịch thành chuyến đi bạn thực sự có thể trải nghiệm. Hệ thống AI đa tác nhân giải mã sở thích, đối chiếu thực tế và đồng hành cùng bạn thiết kế hành trình hoàn hảo.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#0E1D4F]/10 text-xs font-label-caps text-[#0E1D4F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E7AD2E] animate-pulse"></span>
              <span>SERENE EDITORIAL VOYAGE · DESIGN SYSTEM</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-xs text-[#0E1D4F] font-bold uppercase tracking-wider">
              Khám phá hệ thống
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-label-md">
              <li>
                <Link href="/" className="hover:text-[#205BD6] transition-colors">Trang chủ &amp; Giới thiệu</Link>
              </li>
              <li>
                <Link href="/create-trip" className="hover:text-[#205BD6] transition-colors">Tạo chuyến đi &amp; DNA du lịch</Link>
              </li>
              <li>
                <Link href="/destinations" className="hover:text-[#205BD6] transition-colors">Khám phá điểm đến</Link>
              </li>
              <li>
                <Link href="/my-trips" className="hover:text-[#205BD6] transition-colors">Chuyến đi của tôi</Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#205BD6] transition-colors">Khám phá cộng đồng</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture & Workspace */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-xs text-[#0E1D4F] font-bold uppercase tracking-wider">
              Tài khoản &amp; Điều hành
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-label-md">
              <li>
                <Link href="/profile" className="hover:text-[#205BD6] transition-colors">Hồ sơ du khách &amp; Tùy chọn</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#205BD6] transition-colors">Bảng điều khiển Quản trị (Admin)</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#205BD6] transition-colors">Cổng Đăng nhập / Đăng ký</Link>
              </li>
            </ul>

            <div className="pt-2">
              <h5 className="font-label-caps text-[11px] text-[#0E1D4F]/80 font-bold uppercase tracking-wider mb-1.5">
                Kiến trúc Đa Tác Nhân
              </h5>
              <div className="flex flex-col gap-1 text-[11px] text-[#4B5875]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
                  Visual Agent · DNA du lịch đa phương thức
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#205BD6]"></span>
                  Planning Agent · Tối ưu tuyến đường &amp; nhịp độ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E7AD2E]"></span>
                  Reality Agent · Khí hậu &amp; đối chiếu thực tế
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#0E1D4F]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-label-md text-[#4B5875]/80">
          <p>© 2026 VISTRA Inc. Tất cả quyền được bảo lưu. Bản quyền thuộc về Vistra Travel Atelier.</p>
          <div className="flex items-center gap-4">
            <span>Bảo mật dữ liệu</span>
            <span>·</span>
            <span>Điều khoản dịch vụ</span>
            <span>·</span>
            <span>Nguyên tắc biên tập</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

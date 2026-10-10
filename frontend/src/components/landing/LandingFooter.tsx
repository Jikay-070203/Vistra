import React from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import styles from "./landing.module.css";

export default function LandingFooter() {
  return (
    <footer
      className={`${styles.footer} py-8 sm:py-10 border-t border-[#0E1D4F]/12 bg-[#EBF1F0]`}
      role="contentinfo"
    >
      <div className={styles.container}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-2 border-b border-[#0E1D4F]/10 items-start">
          {/* Col 1: Brand & Tagline (4 cols) */}
          <div className="md:col-span-4 space-y-2.5">
            <Link
              href="/"
              className={styles.logo}
              aria-label="VISTRA — Trang chủ"
            >
              <div className={styles.logoIcon}>
                <Icon name="explore" className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className={styles.logoText}>VISTRA</span>
                <span className={styles.logoSub}>Travel Intelligence</span>
              </div>
            </Link>
            <p className="text-xs sm:text-[13px] leading-relaxed text-[#4B5875] max-w-sm">
              Lên kế hoạch du lịch từ hình ảnh và mong muốn cá nhân; bạn toàn
              quyền làm chủ hành trình.
            </p>
          </div>

          {/* Col 2: On this page (5 cols, 2-column compact layout for 6 items) */}
          <div className="md:col-span-5 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0739A8]">
              Trên trang này (Landing Page)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
              <a
                href="#y-tuong"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#08B3C6] transition-colors"
              >
                <Icon
                  name="arrow_forward"
                  className="size-3 text-[#08B3C6] shrink-0"
                />
                <span>Ý tưởng &amp; Điểm nhìn</span>
              </a>
              <a
                href="#cung-xay"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#08B3C6] transition-colors"
              >
                <Icon
                  name="arrow_forward"
                  className="size-3 text-[#08B3C6] shrink-0"
                />
                <span>Cùng xây lịch trình</span>
              </a>
              <a
                href="#tong-quan"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#08B3C6] transition-colors"
              >
                <Icon
                  name="arrow_forward"
                  className="size-3 text-[#08B3C6] shrink-0"
                />
                <span>Tổng quan 3 bước</span>
              </a>
              <a
                href="#xac-nhan"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#08B3C6] transition-colors"
              >
                <Icon
                  name="arrow_forward"
                  className="size-3 text-[#08B3C6] shrink-0"
                />
                <span>Rà soát &amp; Đánh đổi</span>
              </a>
              <a
                href="#kham-pha"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#08B3C6] transition-colors"
              >
                <Icon
                  name="arrow_forward"
                  className="size-3 text-[#08B3C6] shrink-0"
                />
                <span>Bản đồ khám phá</span>
              </a>
              <a
                href="#trai-nghiem"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#08B3C6] transition-colors"
              >
                <Icon
                  name="arrow_forward"
                  className="size-3 text-[#08B3C6] shrink-0"
                />
                <span>Khởi hành thực tế</span>
              </a>
            </div>
          </div>

          {/* Col 3: Product / System (3 cols) */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0739A8]">
              Hệ thống sản phẩm
            </h4>
            <div className="flex flex-col gap-1">
              <Link
                href="/create-trip"
                className="inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-[#0739A8] hover:text-[#205BD6] transition-colors"
              >
                <Icon
                  name="add_circle"
                  className="size-3.5 text-[#205BD6] shrink-0"
                />
                <span>Tạo chuyến đi mới</span>
              </Link>
              <Link
                href="/my-trips"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#205BD6] transition-colors"
              >
                <Icon
                  name="history"
                  className="size-3.5 text-[#4B5875] shrink-0"
                />
                <span>Chuyến đi của tôi</span>
              </Link>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#205BD6] transition-colors"
              >
                <Icon
                  name="place"
                  className="size-3.5 text-[#4B5875] shrink-0"
                />
                <span>Khám phá điểm đến</span>
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-1.5 py-1 text-xs text-[#0E1D4F] hover:text-[#205BD6] transition-colors"
              >
                <Icon
                  name="group"
                  className="size-3.5 text-[#4B5875] shrink-0"
                />
                <span>Khám phá cộng đồng</span>
              </Link>
            </div>
          </div>
        </div>
        <div>
          © 2026 VISTRA Project. Hệ thống hỗ trợ xây dựng kế hoạch du lịch thông
          minh.
        </div>
      </div>
    </footer>
  );
}

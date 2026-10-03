import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import styles from './landing.module.css';

export default function LandingFooter() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#0E1D4F]/10">
          {/* Col 1: Brand & Tagline (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className={styles.logo} aria-label="VISTRA — Trang chủ">
              <div className={styles.logoIcon}>
                <Icon name="explore" className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className={styles.logoText}>VISTRA</span>
                <span className={styles.logoSub}>Travel Intelligence</span>
              </div>
            </Link>
            <p className="text-[15px] leading-relaxed text-[#4B5875] max-w-md">
              Lên kế hoạch du lịch từ hình ảnh và mong muốn cá nhân; bạn toàn quyền làm chủ hành trình.
            </p>
          </div>

          {/* Col 2: On this page (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className={styles.footerGroupTitle}>
              Trên trang này (Landing Page)
            </h4>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#y-tuong" className={styles.footerLink}>
                  <Icon name="arrow_forward" className="size-3 text-[#08B3C6]" />
                  <span>Ý tưởng &amp; Điểm nhìn</span>
                </a>
              </li>
              <li>
                <a href="#tong-quan" className={styles.footerLink}>
                  <Icon name="arrow_forward" className="size-3 text-[#08B3C6]" />
                  <span>Tổng quan 3 trạng thái</span>
                </a>
              </li>
              <li>
                <a href="#kham-pha" className={styles.footerLink}>
                  <Icon name="arrow_forward" className="size-3 text-[#08B3C6]" />
                  <span>Tín hiệu &amp; Bản nháp</span>
                </a>
              </li>
              <li>
                <a href="#cung-xay" className={styles.footerLink}>
                  <Icon name="arrow_forward" className="size-3 text-[#08B3C6]" />
                  <span>Cùng xây lịch trình</span>
                </a>
              </li>
              <li>
                <a href="#xac-nhan" className={styles.footerLink}>
                  <Icon name="arrow_forward" className="size-3 text-[#08B3C6]" />
                  <span>Rà soát &amp; Đánh đổi</span>
                </a>
              </li>
              <li>
                <a href="#trai-nghiem" className={styles.footerLink}>
                  <Icon name="arrow_forward" className="size-3 text-[#08B3C6]" />
                  <span>Khởi hành &amp; Hành trình thật</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Product / System (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className={styles.footerGroupTitle}>
              Hệ thống sản phẩm
            </h4>
            <ul className={styles.footerLinks}>
              <li>
                <Link href="/create-trip" className={`${styles.footerLink} font-semibold text-[#0739A8]`}>
                  <Icon name="add_circle" className="size-3.5 text-[#205BD6]" />
                  <span>Tạo chuyến đi mới</span>
                </Link>
              </li>
              <li>
                <Link href="/my-trips" className={styles.footerLink}>
                  <Icon name="history" className="size-3.5 text-[#4B5875]" />
                  <span>Chuyến đi của tôi</span>
                </Link>
              </li>
              <li>
                <Link href="/destinations" className={styles.footerLink}>
                  <Icon name="place" className="size-3.5 text-[#4B5875]" />
                  <span>Khám phá điểm đến</span>
                </Link>
              </li>
              <li>
                <Link href="/community" className={styles.footerLink}>
                  <Icon name="group" className="size-3.5 text-[#4B5875]" />
                  <span>Khám phá cộng đồng</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#5A6B64]">
          <div>
            © 2026 VISTRA Project. Hệ thống hỗ trợ xây dựng kế hoạch du lịch thông minh.
          </div>
          <div className="text-xs text-[#5A6B64] space-y-1 sm:text-right">
            <div>
              Ảnh tư liệu: Nguyễn Tấn Phát &amp; nhà khoa học (Wikimedia Commons, CC BY-SA 3.0).
            </div>
            <div>
              Bản quyền tác phẩm thuộc về các tác giả theo giấy phép Creative Commons.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


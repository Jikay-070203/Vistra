import Link from "next/link";
import Icon from "@/components/ui/Icon";
import styles from "./landing-redesign.module.css";

const FOOTER_PHOTOS = [
  {
    src: "/landing/destinations/destination-photo-01.jpg",
    alt: "Thuyền du lịch giữa những đảo đá vôi ở vịnh Hạ Long",
    position: "50% 55%",
  },
  {
    src: "/landing/destinations/destination-photo-02.jpg",
    alt: "Cầu Vàng uốn quanh đôi bàn tay đá ở Bà Nà Hills",
    position: "50% 46%",
  },
  {
    src: "/landing/destinations/destination-photo-03.jpg",
    alt: "Thuyền nan trên dòng nước xanh ở Tam Cốc, Ninh Bình",
    position: "34% 58%",
  },
  {
    src: "/landing/place_sample/ryan-le-EKFPwbPkDec-unsplash.jpg",
    alt: "Đoàn tàu chạy giữa phố đường ray ở Hà Nội",
    position: "50% 50%",
  },
] as const;

const FOOTER_LINKS = [
  { label: "Điểm đến", href: "/destinations" },
  { label: "Cộng đồng", href: "/community" },
  { label: "Chuyến đi của tôi", href: "/my-trips" },
  { label: "Tạo chuyến đi", href: "/create-trip" },
];

export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerPanel}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <p className={styles.footerDescription}>
              VISTRA <br />
              LÊN KẾ HOẠCH THEO CÁCH CỦA BẠN
            </p>
            <p className={styles.footerTagline}>
              Lên ý tưởng chuyến đi từ ảnh và ghi chú, rồi tự chọn lộ trình phù
              hợp.
            </p>
          </div>
          <nav className={styles.footerLinks} aria-label="Tiếp tục với VISTRA">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={styles.footerLink}
              >
                <Icon
                  name="arrow_forward"
                  className="size-4"
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.footerSignature}>
          <hr className={styles.footerRule} />
          <p className={styles.footerCopyright}>
            © VISTRA · Điểm đến, lịch trình và lựa chọn theo cách của bạn.
          </p>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import LandingEditorialMotif from '@/components/landing/LandingEditorialMotif';
import styles from './hero-draft-board.module.css';
import {
  HERO_MULTIMODAL_INPUT,
  LANDING_ASSETS,
  LANDING_PINS,
} from '@/components/landing/landingDemo';

/**
 * HeroDraftBoard component (Task LP-11A)
 *
 * Static responsive visual planning board demonstrating multimodal input
 * (inspiration image + text wish) synthesized into a draft plan with at least
 * 5 meaningful notes and 4 distinguishable semantic edges:
 *  - Edge 1: Input Synthesis (Turquoise dotted) -> Photo & Wish to Anchor
 *  - Edge 2: Planned Route (Royal Blue solid) -> Morning to Lunch Waypoint
 *  - Edge 3: Preference & Stay Alignment (Mint dashed) -> Dining to Stay
 *  - Edge 4: Review Tension (Amber dashed warning) -> Cluster to Distant Hill Caution
 *
 * Export default HeroDraftBoard() with no props per shared execution contract.
 */
export default function HeroDraftBoard() {
  const lakePin = LANDING_PINS.find((p) => p.id === 'pin-lake-garden');
  const teaPin = LANDING_PINS.find((p) => p.id === 'pin-corner-tea');
  const lodgePin = LANDING_PINS.find((p) => p.id === 'pin-hillside-lodge');
  const sunsetPin = LANDING_PINS.find((p) => p.id === 'pin-sunset-hill');

  return (
    <div
      className={styles.draftBoardContainer}
      role="region"
      aria-label="Bàn kế hoạch với các ghi chú và liên kết ngữ nghĩa"
    >
      {/* Editorial Decorative Watermark Motif */}
      <div className={styles.headerMotifWrap} aria-hidden="true">
        <LandingEditorialMotif variant="sunrise" width={110} height={60} />
      </div>

      {/* ====================================================================
          1. Board Top Bar: Title and Meta
          ==================================================================== */}
      <header className={styles.boardHeader}>
        <div className={styles.boardHeaderTitleGroup}>
          <div className={styles.boardHeaderIconWrap} aria-hidden="true">
            <Icon name="description" className="size-5" />
          </div>
          <div>
            <h2 className={styles.boardHeaderTitle} title="Bàn lập kế hoạch · Bản nháp ban đầu">
              Bàn lập kế hoạch · Bản nháp ban đầu
            </h2>
            <p className={styles.boardHeaderSub}>
              VISTRA tổ chức dữ liệu đa phương thức thành hành trình có cấu trúc
            </p>
          </div>
        </div>

        <div className={styles.boardHeaderBadges}>
          <span className={styles.badgeInputs}>
            <Icon name="add_photo_alternate" className="size-3.5" />
            <span>2 đầu vào: Text + Image</span>
          </span>
          <span className={styles.badgeDemo}>
            <Icon name="verified_user" className="size-3.5" />
            <span>Bản nháp khởi tạo</span>
          </span>
        </div>
      </header>

      {/* ====================================================================
          2. Board Body: Multimodal Inputs, Notes & Semantic Edges
          ==================================================================== */}
      <div className={styles.boardBody}>
        {/* ------------------------------------------------------------------
            LAYER 1: MULTIMODAL INPUTS
            Note 1: Inspiration Photo Card (Verified Asset)
            Note 2: User Text Wish & Extracted Constraints
            ------------------------------------------------------------------ */}
        <section
          aria-label="Đầu vào đa phương thức của người dùng"
          className={styles.inputsRow}
        >
          {/* NOTE 1: Image Input Card (Polaroid Style) */}
          <article className={styles.photoCard}>
            <figure className={styles.photoFrame}>
              <Image
                src={LANDING_ASSETS.heroInspiration.path}
                alt={LANDING_ASSETS.heroInspiration.alt}
                width={1280}
                height={960}
                loading="eager"
                fetchPriority="high"
                className={styles.photoImage}
              />
            </figure>
            <div className={styles.photoMeta}>
              <div className={styles.photoMetaHeader}>
                <span className={styles.photoBadge}>
                  <Icon name="photo_camera" className="size-3" />
                  <span>Đầu vào hình ảnh</span>
                </span>
                <span className={styles.photoSceneTag}>Ảnh cảm hứng</span>
              </div>
              <h3 className={styles.photoTitle}>
                Thung lũng Vàng · Sương sớm
              </h3>
              <p className={styles.photoCaption}>
                Mặt nước tĩnh mịch soi bóng đồi thông — gợi ý không gian yên ả cho buổi sáng ngày đầu.
              </p>
            </div>
          </article>

          {/* NOTE 2: Text Wish Note & Extracted Constraints */}
          <article className={styles.textWishCard}>
            <div className={styles.wishCardHeader}>
              <span className={styles.wishCardBadge}>
                <Icon name="description" className="size-3" />
                <span>Đầu vào văn bản</span>
              </span>
              <span className={styles.wishCardTag}>Ghi chú mong muốn</span>
            </div>

            <blockquote className={styles.wishCardQuote}>
              &ldquo;{HERO_MULTIMODAL_INPUT.inspirationNote.promptText}&rdquo;
            </blockquote>

            <div className="space-y-1.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#4B5875]">
                Ý định &amp; giới hạn được nhận diện:
              </div>
              <div className={styles.wishConstraintsList}>
                <span className={styles.constraintPill}>
                  <Icon name="balance" className="size-3 text-[#E7AD2E]" />
                  <span>Ưu tiên: Nhịp thư thả</span>
                </span>
                <span className={styles.constraintPill}>
                  <Icon name="volume_off" className="size-3 text-[#08B3C6]" />
                  <span>Giới hạn: Tránh đổi điểm liên tục</span>
                </span>
                <span className={styles.constraintPill}>
                  <Icon name="schedule" className="size-3 text-[#205BD6]" />
                  <span>Thời lượng: 3 ngày 2 đêm</span>
                </span>
              </div>
            </div>
          </article>
        </section>

        {/* ------------------------------------------------------------------
            SEMANTIC EDGE 1: INPUT SYNTHESIS (Turquoise Dotted)
            Nối từ Đầu vào (Ảnh + Ghi chú) sang Điểm neo ban đầu
            ------------------------------------------------------------------ */}
        <div
          className={`${styles.edgeConnector} ${styles.edgeInputSynthesis}`}
          role="note"
          aria-label="Khớp ý tưởng sang điểm mở đầu"
        >
          <span className={styles.edgeConnectorPill}>
            <Icon name="auto_fix_high" className="size-3.5" />
            <span>Khớp ý tưởng → Điểm mở đầu</span>
          </span>
          <span className={styles.edgeConnectorDetail}>
            Hồ sương sớm mở màn ngày 1 theo đúng mong muốn tĩnh lặng
          </span>
        </div>

        {/* ------------------------------------------------------------------
            LAYER 2: STRUCTURED PLAN WAYPOINTS & STAYS
            Note 3: Morning Anchor Waypoint (Vườn ven hồ)
            Note 4: Midday Rest & Dining (Quán trà & cà phê góc phố)
            ------------------------------------------------------------------ */}
        <section
          aria-label="Các địa điểm và hoạt động trong bản nháp"
          className={styles.placesGrid}
        >
          {/* NOTE 3: Waypoint 1 (Day 1 Morning) */}
          <article className={styles.placeCard}>
            <div className={styles.placeCardHeader}>
              <span className={styles.placeTimeSlot}>
                <Icon name="schedule" className="size-3" />
                <span>Chặng 01 · 08:30 – 10:30</span>
              </span>
              <span className={styles.placeStatusBadge}>Đề xuất ban đầu</span>
            </div>

            <div>
              <h3 className={styles.placeName}>
                {lakePin?.name ?? 'Vườn ven hồ'}
              </h3>
              <p className={styles.placeDesc}>
                {lakePin?.description ?? 'Không gian tĩnh lặng, mặt nước sớm mai phản chiếu đồi thông.'}
              </p>
            </div>

            <div className={styles.placeCardFooter}>
              <span className={styles.placeTag}>
                <Icon name="terrain" className="size-3 text-[#08B3C6]" />
                <span>Khớp từ ảnh cảm hứng</span>
              </span>
              <span className="text-[11px] text-[#4B5875]">Thời điểm sương đẹp nhất</span>
            </div>
          </article>

          {/* NOTE 4: Waypoint 2 (Day 1 Midday / Dining) */}
          <article className={styles.placeCard}>
            <div className={styles.placeCardHeader}>
              <span className={styles.placeTimeSlot}>
                <Icon name="schedule" className="size-3" />
                <span>Chặng 02 · 11:00 – 13:00</span>
              </span>
              <span className={styles.placeStatusBadge}>Đề xuất ban đầu</span>
            </div>

            <div>
              <h3 className={styles.placeName}>
                {teaPin?.name ?? 'Quán trà & cà phê góc phố'}
              </h3>
              <p className={styles.placeDesc}>
                {teaPin?.description ?? 'Quán nhỏ hiên gỗ, trà nóng và bánh mộc mạc địa phương.'}
              </p>
            </div>

            <div className={styles.placeCardFooter}>
              <span className={styles.placeTag}>
                <Icon name="directions_walk" className="size-3 text-[#205BD6]" />
                <span>Đoạn tản bộ ngắn từ Vườn ven hồ</span>
              </span>
              <span className="text-[11px] text-[#4B5875]">Cùng khu vực</span>
            </div>
          </article>
        </section>

        {/* ------------------------------------------------------------------
            SEMANTIC EDGE 2: ACTIVE PLANNED ROUTE (Royal Blue Solid)
            Tuyến di chuyển liên hoàn Chặng 1 -> Chặng 2
            ------------------------------------------------------------------ */}
        <div
          className={`${styles.edgeConnector} ${styles.edgePlannedRoute}`}
          role="note"
          aria-label="Tuyến kết nối Chặng 1 và Chặng 2"
        >
          <span className={styles.edgeConnectorPill}>
            <Icon name="alt_route" className="size-3.5" />
            <span>Tuyến di chuyển liên hoàn</span>
          </span>
          <span className={styles.edgeConnectorDetail}>
            Cùng khu vực ven hồ, đi bộ nhẹ nhàng dưới 10 phút
          </span>
        </div>

        {/* ------------------------------------------------------------------
            LAYER 3: BASE STAY & RELATIONSHIP REQUIRING REVIEW
            Note 5: Lodging / Base Stay (Nhà gỗ bên sườn đồi)
            Note 6: Afternoon Caution Waypoint (Điểm ngắm hoàng hôn đồi xa)
            ------------------------------------------------------------------ */}
        <section
          aria-label="Cơ sở lưu trú và điểm cần rà soát"
          className={styles.placesGrid}
        >
          {/* NOTE 5: Stay / Lodging (Preference & Constraint Alignment) */}
          <article className={`${styles.placeCard} ${styles.stayCard}`}>
            <div className={styles.placeCardHeader}>
              <span className={styles.placeTimeSlot}>
                <Icon name="location_on" className="size-3" />
                <span>Lưu trú đề xuất · Đêm 1 &amp; 2</span>
              </span>
              <span className={styles.placeStatusBadge}>Khớp sở thích</span>
            </div>

            <div>
              <h3 className={styles.placeName}>
                {lodgePin?.name ?? 'Nhà gỗ bên sườn đồi'}
              </h3>
              <p className={styles.placeDesc}>
                {lodgePin?.description ?? 'Nơi lưu trú tĩnh mịch giữa vườn cây, tiện nghỉ ngơi giữa các buổi.'}
              </p>
            </div>

            <div className={styles.placeCardFooter}>
              <span className={styles.placeTag}>
                <Icon name="forest" className="size-3 text-[#15A6B4]" />
                <span>Gần cụm hoạt động Ngày 1</span>
              </span>
              <span className="text-[11px] font-semibold text-[#0F766E]">
                Đúng nhịp thư thả
              </span>
            </div>
          </article>

          {/* NOTE 6: Relationship Requiring Review (Caution / Conflict) */}
          <article className={`${styles.placeCard} ${styles.cautionCard}`}>
            <div className={styles.placeCardHeader}>
              <span className={styles.placeTimeSlot}>
                <Icon name="schedule" className="size-3" />
                <span>Chặng 03 · 14:30 – 17:30</span>
              </span>
              <span className="text-[10px] font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded">
                Cần rà soát
              </span>
            </div>

            <div>
              <h3 className={styles.placeName}>
                {sunsetPin?.name ?? 'Điểm ngắm hoàng hôn đồi xa'}
              </h3>
              <p className={styles.placeDesc}>
                {sunsetPin?.description ?? 'Vọng cảnh đón chiều tà trên đỉnh dốc, quãng di chuyển xa hơn trung tâm.'}
              </p>
            </div>

            <div className={styles.cautionAlertBox}>
              <div className={styles.cautionAlertHeader}>
                <Icon name="info" className="size-3.5" />
                <span>Cảnh báo cự ly &amp; nhịp độ:</span>
              </div>
              <p className={styles.cautionAlertText}>
                Đường dốc và cách xa cụm sáng; có nguy cơ cập rập nếu giữ cả 3 điểm trong ngày đầu.
              </p>
              <p className={styles.cautionSuggestionText}>
                AI gợi ý: Cân nhắc dời sang Ngày 2 hoặc dành buổi chiều nghỉ ngơi tại chỗ lưu trú.
              </p>
            </div>
          </article>
        </section>

        {/* ------------------------------------------------------------------
            SEMANTIC EDGE 3: STAY & CONSTRAINT ALIGNMENT (Mint Dashed)
            Nối từ Hoạt động trưa sang Nơi lưu trú
            ------------------------------------------------------------------ */}
        <div
          className={`${styles.edgeConnector} ${styles.edgeStayAlignment}`}
          role="note"
          aria-label="Đối chiếu ưu tiên và lưu trú"
        >
          <span className={styles.edgeConnectorPill}>
            <Icon name="check_circle" className="size-3.5" />
            <span>Khớp lưu trú</span>
          </span>
          <span className={styles.edgeConnectorDetail}>
            Gần quán trà, đảm bảo không gian nghỉ trưa yên tĩnh
          </span>
        </div>

        {/* ------------------------------------------------------------------
            SEMANTIC EDGE 4: REVIEW TENSION / CONFLICT (Amber Dashed Warning)
            Xung đột cự ly giữa Cụm Ngày 1 và Đồi xa
            ------------------------------------------------------------------ */}
        <div
          className={`${styles.edgeConnector} ${styles.edgeReviewTension}`}
          role="note"
          aria-label="Điểm cần rà soát"
        >
          <span className={styles.edgeConnectorPill}>
            <Icon name="compare_arrows" className="size-3.5" />
            <span>Điểm cần rà soát</span>
          </span>
          <span className={styles.edgeConnectorDetail}>
            Chặng dốc chiều xa trung tâm — bạn chọn giữ hoặc đổi
          </span>
        </div>
      </div>

      {/* ====================================================================
          3. Board Footer: Semantic Legend & Transparent Demo Notice
          ==================================================================== */}
      <footer className={styles.boardFooter}>
        <div className={styles.boardDisclaimerBar}>
          <div className={styles.disclaimerNotice}>
            <Icon name="auto_awesome" className="size-3.5 text-[#08B3C6]" />
            <span>
              Ảnh cảm hứng &amp; ý định → 3 Chặng → 1 Điểm lưu trú đề xuất
            </span>
          </div>
          <div className={styles.disclaimerActionCue}>
            Bạn toàn quyền điều chỉnh ở bước tiếp theo →
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ExploreSection from "./sections/ExploreSection";
import {
  applyPreference,
  createInitialLandingState,
  LANDING_ASSETS,
  type LandingTripState,
} from "./landingDemo";
import styles from "./landing-redesign.module.css";

const DESTINATIONS = [
  {
    name: "Vịnh Hạ Long",
    image: "/landing/destinations/destination-photo-01.jpg",
    alt: "Thuyền du lịch giữa những đảo đá vôi ở vịnh Hạ Long",
    credit: "Ammie Ngo",
    position: "50% 55%",
  },
  {
    name: "Cầu Vàng · Bà Nà Hills",
    image: "/landing/destinations/destination-photo-02.jpg",
    alt: "Cầu Vàng uốn quanh đôi bàn tay đá giữa núi rừng",
    credit: "Andreea Popa",
    position: "50% 46%",
  },
  {
    name: "Tam Cốc · Ninh Bình",
    image: "/landing/destinations/destination-photo-03.jpg",
    alt: "Người chèo thuyền nan trên dòng nước xanh ở Ninh Bình",
    credit: "Giau Tran",
    position: "34% 58%",
  },
  {
    name: "Phố đường tàu · Hà Nội",
    image: "/landing/place_sample/ryan-le-EKFPwbPkDec-unsplash.jpg",
    alt: "Đoàn tàu chạy giữa phố đường ray ở Hà Nội",
    credit: "Ryan Le",
    position: "50% 50%",
  },
  {
    name: "Phố cổ Hội An",
    image: "/landing/place_sample/toomas-tartes-27HacQwqvA0-unsplash.jpg",
    alt: "Thuyền nhỏ đi qua con phố ven sông với những ngôi nhà vàng ở Hội An",
    credit: "Toomas Tartes",
    position: "50% 60%",
  },
  {
    name: "Ngõ đường ray · Hà Nội",
    image: "/landing/destinations/destination-photo-06.jpg",
    alt: "Đường ray len giữa khu phố Hà Nội với cờ Việt Nam",
    credit: "Silver Ringvee",
    position: "46% 55%",
  },
] as const;

const DESTINATION_CLONE_COUNT = 3;
const DESTINATION_CAROUSEL = [
  ...DESTINATIONS.slice(-DESTINATION_CLONE_COUNT),
  ...DESTINATIONS,
  ...DESTINATIONS.slice(0, DESTINATION_CLONE_COUNT),
];

const ITINERARY_PHOTOS = [
  {
    src: "/landing/place_sample/dalat-day-01.jpg",
    alt: "Thuyền nhỏ trên hồ Đà Lạt lúc bình minh",
    credit: "Mạnh Ngô / Unsplash",
    position: "50% 45%",
  },
  {
    src: LANDING_ASSETS.finalJourney.path,
    alt: "Du khách đi bộ trên lối đá rợp bóng cây tại Thiền Viện Trúc Lâm, Đà Lạt",
    credit: LANDING_ASSETS.finalJourney.attribution,
    position: "50% 45%",
  },
  {
    src: "/landing/place_sample/dalat-day-03.jpg",
    alt: "Đồi và rừng thông Đà Lạt chìm trong sương sớm",
    credit: "Pete Walls / Unsplash",
    position: "50% 50%",
  },
] as const;

function installReferenceReveals(root: ParentNode = document) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new Map<Element, Animation>();
  const elements = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
  const finish = (element: HTMLElement) => {
    element.dataset.revealPlayed = "true";
    animations.get(element)?.cancel();
    animations.delete(element);
  };
  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const element = entry.target as HTMLElement;
              observer?.unobserve(element);
              element.dataset.revealPlayed = "true";
              if (
                reduced.matches ||
                document.visibilityState === "hidden" ||
                entry.boundingClientRect.bottom <= 0
              ) {
                finish(element);
              } else {
                animations.get(element)?.play();
              }
            }
          },
          { threshold: 0, rootMargin: "0px 0px 96px 0px" },
        )
      : undefined;
  const stop = () => {
    observer?.disconnect();
    elements.forEach(finish);
  };
  const onPreference = () => {
    if (reduced.matches) stop();
  };
  reduced.addEventListener("change", onPreference);
  for (const element of elements) {
    if (element.dataset.revealPlayed === "true") continue;
    const rect = element.getBoundingClientRect();
    if (
      reduced.matches ||
      !observer ||
      !element.animate ||
      rect.top < innerHeight ||
      document.visibilityState === "hidden"
    ) {
      finish(element);
      continue;
    }
    const transform =
      element.dataset.reveal === "media"
        ? "scale(1.025)"
        : element.dataset.reveal === "slide"
          ? "translateX(-12px)"
          : "translateY(12px)";
    const animation = element.animate(
      [
        { opacity: 0, transform },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 600,
        delay: Number(element.dataset.revealDelay) || 0,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      },
    );
    animation.pause();
    animation.onfinish = () => finish(element);
    animations.set(element, animation);
    observer.observe(element);
  }
  const finishSkipped = () => {
    for (const element of elements) {
      if (
        element.dataset.revealPlayed === "true" ||
        element.getBoundingClientRect().bottom > 0
      )
        continue;
      observer?.unobserve(element);
      finish(element);
    }
  };
  window.addEventListener("scroll", finishSkipped, { passive: true });
  return () => {
    observer?.disconnect();
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    window.removeEventListener("scroll", finishSkipped);
    reduced.removeEventListener("change", onPreference);
  };
}

export default function LandingPage() {
  const [activeCarouselSlot, setActiveCarouselSlot] = React.useState(
    DESTINATION_CLONE_COUNT,
  );
  const [activeDay, setActiveDay] = React.useState(1);
  const destinationSectionRef = React.useRef<HTMLElement>(null);
  const preferencesSectionRef = React.useRef<HTMLElement>(null);
  const destinationTrackRef = React.useRef<HTMLOListElement>(null);
  const shouldScrollDestinationRef = React.useRef(true);
  const previousDestination = React.useRef<number | null>(null);
  const destinationProgrammaticScrollRef = React.useRef(false);
  const destinationScrollEndTimerRef = React.useRef<number | null>(null);
  const destinationHoveredRef = React.useRef(false);
  const destinationPointerActiveRef = React.useRef(false);
  const preferencesHoveredRef = React.useRef(false);
  const preferencesPointerActiveRef = React.useRef(false);
  const [destinationInView, setDestinationInView] = React.useState(false);
  const [preferencesInView, setPreferencesInView] = React.useState(false);
  const [lastDestinationActivityAt, setLastDestinationActivityAt] =
    React.useState(0);
  const [lastPreferencesActivityAt, setLastPreferencesActivityAt] =
    React.useState(0);
  const [tripState, setTripState] = React.useState<LandingTripState>(() =>
    createInitialLandingState(),
  );
  const currentDay =
    tripState.days.find((day) => day.dayNumber === activeDay) ??
    tripState.days[0];
  const currentDayPhoto = ITINERARY_PHOTOS[currentDay.dayNumber - 1];
  const activeDestination =
    (activeCarouselSlot - DESTINATION_CLONE_COUNT + DESTINATIONS.length) %
    DESTINATIONS.length;

  React.useEffect(() => installReferenceReveals(), []);

  const noteDestinationActivity = React.useCallback(() => {
    setLastDestinationActivityAt(Date.now());
  }, []);
  const notePreferencesActivity = React.useCallback(() => {
    setLastPreferencesActivityAt(Date.now());
  }, []);
  const changePreference = React.useCallback(
    (preference: "default" | "less_travel") => {
      setTripState((current) => applyPreference(current, preference));
    },
    [],
  );

  const moveDestination = React.useCallback(
    (direction: -1 | 1) => {
      destinationProgrammaticScrollRef.current = true;
      shouldScrollDestinationRef.current = true;
      setActiveCarouselSlot((currentSlot) => {
        const realSlot =
          currentSlot < DESTINATION_CLONE_COUNT
            ? currentSlot + DESTINATIONS.length
            : currentSlot >= DESTINATION_CLONE_COUNT + DESTINATIONS.length
              ? currentSlot - DESTINATIONS.length
              : currentSlot;
        return realSlot + direction;
      });
      noteDestinationActivity();
    },
    [noteDestinationActivity],
  );

  React.useEffect(() => {
    const section = destinationSectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setDestinationInView(entry.isIntersecting);
      noteDestinationActivity();
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [noteDestinationActivity]);

  React.useEffect(() => {
    const section = preferencesSectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setPreferencesInView(entry.isIntersecting);
      notePreferencesActivity();
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [notePreferencesActivity]);

  React.useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const noteActivity = () => {
      noteDestinationActivity();
      notePreferencesActivity();
    };
    preference.addEventListener("change", noteActivity);
    document.addEventListener("visibilitychange", noteActivity);
    return () => {
      preference.removeEventListener("change", noteActivity);
      document.removeEventListener("visibilitychange", noteActivity);
    };
  }, [noteDestinationActivity, notePreferencesActivity]);

  React.useEffect(() => {
    const releasePointer = () => {
      if (destinationPointerActiveRef.current) {
        destinationPointerActiveRef.current = false;
        noteDestinationActivity();
      }
      if (preferencesPointerActiveRef.current) {
        preferencesPointerActiveRef.current = false;
        notePreferencesActivity();
      }
    };
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    return () => {
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
    };
  }, [noteDestinationActivity, notePreferencesActivity]);

  React.useEffect(() => {
    const section = destinationSectionRef.current;
    if (
      !section ||
      !destinationInView ||
      document.visibilityState !== "visible" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      destinationHoveredRef.current ||
      destinationPointerActiveRef.current ||
      (document.activeElement instanceof HTMLElement &&
        section.contains(document.activeElement) &&
        document.activeElement.matches(":focus-visible")) ||
      lastDestinationActivityAt === 0
    )
      return;

    const remaining = Math.max(
      0,
      1500 - (Date.now() - lastDestinationActivityAt),
    );
    const timer = window.setTimeout(() => {
      moveDestination(1);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [destinationInView, lastDestinationActivityAt, moveDestination]);

  React.useEffect(() => {
    const section = preferencesSectionRef.current;
    if (
      !section ||
      !preferencesInView ||
      document.visibilityState !== "visible" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      preferencesHoveredRef.current ||
      preferencesPointerActiveRef.current ||
      (document.activeElement instanceof HTMLElement &&
        section.contains(document.activeElement) &&
        document.activeElement.matches(":focus-visible")) ||
      lastPreferencesActivityAt === 0
    )
      return;

    const remaining = Math.max(
      0,
      5000 - (Date.now() - lastPreferencesActivityAt),
    );
    const timer = window.setTimeout(() => {
      changePreference(
        tripState.preference === "default" ? "less_travel" : "default",
      );
      notePreferencesActivity();
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [
    changePreference,
    lastPreferencesActivityAt,
    notePreferencesActivity,
    preferencesInView,
    tripState.preference,
  ]);

  React.useEffect(
    () => () => {
      if (destinationScrollEndTimerRef.current !== null) {
        window.clearTimeout(destinationScrollEndTimerRef.current);
      }
    },
    [],
  );

  React.useLayoutEffect(() => {
    if (!shouldScrollDestinationRef.current) return;
    shouldScrollDestinationRef.current = false;
    const isInitialPosition = previousDestination.current === null;
    previousDestination.current = activeDestination;
    const card = destinationTrackRef.current?.querySelector<HTMLElement>(
      `[data-carousel-slot="${activeCarouselSlot}"]`,
    );
    if (!card || !destinationTrackRef.current) return;
    const track = destinationTrackRef.current;
    destinationProgrammaticScrollRef.current = true;
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const snapStart =
      Number.parseFloat(getComputedStyle(track).scrollPaddingInlineStart) ||
      track.clientWidth * 0.05;
    track.scrollTo({
      left: track.scrollLeft + cardRect.left - trackRect.left - snapStart,
      behavior:
        isInitialPosition ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
    });
  }, [activeCarouselSlot]);

  const changeDestination = (index: number) => {
    noteDestinationActivity();
    const next = (index + DESTINATIONS.length) % DESTINATIONS.length;
    const nextSlot = next + DESTINATION_CLONE_COUNT;
    if (activeCarouselSlot === nextSlot) return;
    destinationProgrammaticScrollRef.current = true;
    shouldScrollDestinationRef.current = true;
    setActiveCarouselSlot(nextSlot);
  };

  const syncDestinationFromScroll = () => {
    const track = destinationTrackRef.current;
    if (!track) return;
    const snapStart =
      Number.parseFloat(getComputedStyle(track).scrollPaddingInlineStart) ||
      track.clientWidth * 0.05;
    const cards = [
      ...track.querySelectorAll<HTMLElement>("[data-carousel-index]"),
    ];
    const nearest = cards.reduce<{
      index: number;
      slot: number;
      distance: number;
    } | null>((closest, card) => {
      const index = Number(card.dataset.carouselIndex);
      const slot = Number(card.dataset.carouselSlot);
      const distance = Math.abs(
        card.getBoundingClientRect().left -
          track.getBoundingClientRect().left -
          snapStart,
      );
      return !closest || distance < closest.distance
        ? { index, slot, distance }
        : closest;
    }, null);
    if (!nearest) return;

    if (!destinationProgrammaticScrollRef.current) {
      setActiveCarouselSlot(nearest.slot);
    }
    if (destinationScrollEndTimerRef.current !== null) {
      window.clearTimeout(destinationScrollEndTimerRef.current);
    }
    destinationScrollEndTimerRef.current = window.setTimeout(() => {
      const slot = nearest.slot;
      if (
        slot < DESTINATION_CLONE_COUNT ||
        slot >= DESTINATION_CLONE_COUNT + DESTINATIONS.length
      ) {
        const realSlot =
          slot < DESTINATION_CLONE_COUNT
            ? slot + DESTINATIONS.length
            : slot - DESTINATIONS.length;
        const card = track.querySelector<HTMLElement>(
          `[data-carousel-slot="${realSlot}"]`,
        );
        if (card) {
          const trackRect = track.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          track.scrollTo({
            left: track.scrollLeft + cardRect.left - trackRect.left - snapStart,
            behavior: "auto",
          });
          setActiveCarouselSlot(realSlot);
          destinationProgrammaticScrollRef.current = false;
        }
      } else {
        destinationProgrammaticScrollRef.current = false;
      }
      destinationScrollEndTimerRef.current = null;
    }, 140);
  };

  return (
    <div className={styles.page}>
      <section
        id="y-tuong"
        className={styles.hero}
        aria-labelledby="hero-title"
      >
        <Image
          src={LANDING_ASSETS.heroInspiration.path}
          alt={LANDING_ASSETS.heroInspiration.alt}
          fill
          priority
          sizes="100vw"
          className={styles.heroPhoto}
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroMeta}>
            <div
              className={styles.heroPhotoGroup}
              role="group"
              aria-label="Ảnh gợi ý điểm đến"
            >
              {DESTINATIONS.slice(0, 3).map((destination, index) => (
                <a
                  key={destination.image}
                  href="#ban-muon-di-dau"
                  className={styles.heroPhotoLink}
                  onClick={() => changeDestination(index)}
                  aria-label={"Xem cảm hứng từ " + destination.name}
                >
                  <Image
                    src={destination.image}
                    alt={destination.alt}
                    fill
                    sizes="110px"
                    style={{ objectPosition: destination.position }}
                  />
                </a>
              ))}
              <p className={styles.heroMetaLabel}>
                Ảnh và ghi chú
                <br />
                thành lịch trình
              </p>
            </div>
            <p className={styles.heroMetaNote}>
              Cảm hứng của bạn
              <br />
              lựa chọn của bạn
            </p>
          </div>
          <hr className={styles.heroRule} />
          <div className={styles.heroMain}>
            <div>
              <p className={styles.heroSupertitle}>VISTRA</p>
              <h1 id="hero-title" className={styles.heroTitle}>
                Gom cảm hứng.
                <br />
                Chọn từng chặng.
              </h1>
            </div>
            <div className={styles.heroAside}>
              <span className={styles.heroAsideMark}>
                LÊN Ý TƯỞNG · LÊN ĐƯỜNG
              </span>
              <p className={styles.heroBody}>
                VISTRA gợi ý điểm đến và phác thảo lịch trình từ ảnh hoặc ghi
                chú. Bạn tự chọn mỗi chặng.
              </p>
              <div className={styles.heroActions}>
                <Link href="/create-trip" className={styles.buttonPrimary}>
                  Bắt đầu ý tưởng chuyến đi
                  <Icon name="arrow_forward" className="size-4" />
                </Link>
                <a href="#tong-quan" className={styles.buttonSecondary}>
                  Xem cách lên kế hoạch
                  <Icon name="arrow_forward" className="size-4" />
                </a>
              </div>
            </div>
          </div>
          <p className={styles.heroWordmark} aria-hidden="true">
            VISTRA
          </p>
          <hr className={styles.heroBottomRule} />
          <div className={styles.heroFootnote}>
            <span>
              Ảnh Đà Lạt: Nguyễn Tấn Phát / Wikimedia Commons / CC BY-SA 3.0
            </span>
            <span>Gợi ý từ ảnh và ghi chú</span>
          </div>
        </div>
      </section>

      <section
        ref={destinationSectionRef}
        id="ban-muon-di-dau"
        className={styles.section + " " + styles.destination}
        aria-labelledby="destination-title"
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          destinationHoveredRef.current = true;
          noteDestinationActivity();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "touch") return;
          destinationHoveredRef.current = false;
          noteDestinationActivity();
        }}
        onPointerDownCapture={() => {
          destinationPointerActiveRef.current = true;
          noteDestinationActivity();
        }}
        onFocusCapture={noteDestinationActivity}
        onBlurCapture={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
          )
            return;
          noteDestinationActivity();
        }}
        onKeyDownCapture={noteDestinationActivity}
        onWheelCapture={noteDestinationActivity}
        onClickCapture={noteDestinationActivity}
      >
        <div className={styles.destinationGrid}>
          <div className={styles.destinationIntro}>
            <div className={styles.destinationTitleGroup}>
              <p className={styles.eyebrow}>Gợi ý điểm đến</p>
              <h2 id="destination-title" className={styles.destinationTitle}>
                Bắt đầu từ nơi bạn
                <br />
                muốn đến.
              </h2>
            </div>
            <div className={styles.destinationLead}>
              <p className={styles.sectionBody}>
                Chọn một điểm đến để xem ảnh và mở danh sách hành trình liên
                quan.
              </p>
              <Link href="/destinations" className={styles.destinationAllLink}>
                Xem tất cả điểm đến
                <Icon name="arrow_forward" className="size-4" />
              </Link>
            </div>
          </div>
          <div
            className={styles.destinationControls}
            role="group"
            aria-label="Điều khiển điểm đến"
          >
            <button
              type="button"
              className={styles.destinationArrow}
              onClick={() => moveDestination(-1)}
              aria-label="Điểm đến trước"
            >
              <Icon name="arrow_back" className="size-5" />
            </button>
            <button
              type="button"
              className={styles.destinationArrow}
              onClick={() => moveDestination(1)}
              aria-label="Điểm đến tiếp theo"
            >
              <Icon name="arrow_forward" className="size-5" />
            </button>
          </div>
          <ol
            ref={destinationTrackRef}
            className={styles.destinationTrack}
            aria-label="Chọn điểm đến"
            onScroll={syncDestinationFromScroll}
          >
            {DESTINATION_CAROUSEL.map((destination, carouselIndex) => {
              const isClone =
                carouselIndex < DESTINATION_CLONE_COUNT ||
                carouselIndex >= DESTINATION_CLONE_COUNT + DESTINATIONS.length;
              const index =
                (carouselIndex -
                  DESTINATION_CLONE_COUNT +
                  DESTINATIONS.length) %
                DESTINATIONS.length;
              return (
                <li
                  key={carouselIndex}
                  className={styles.destinationCardSlot}
                  aria-hidden={isClone || undefined}
                >
                  <button
                    type="button"
                    className={styles.destinationCard}
                    data-carousel-index={index}
                    data-carousel-slot={carouselIndex}
                    data-destination-index={isClone ? undefined : index}
                    data-selected={activeDestination === index || undefined}
                    tabIndex={isClone ? -1 : 0}
                    onClick={() => changeDestination(index)}
                    aria-pressed={
                      isClone ? undefined : activeDestination === index
                    }
                    aria-label={"Chọn điểm đến " + destination.name}
                    data-reveal="media"
                    data-reveal-delay={Math.min(index, 3) * 70}
                  >
                    <span className={styles.destinationImageFrame}>
                      <Image
                        src={destination.image}
                        alt=""
                        fill
                        sizes="(max-width: 760px) 85vw, 29vw"
                        className={styles.destinationImage}
                        style={{ objectPosition: destination.position }}
                      />
                    </span>
                    <span className={styles.destinationCardCaption}>
                      <span className={styles.destinationName}>
                        {destination.name}
                      </span>
                      <small>Ảnh: {destination.credit} / Unsplash</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section
        id="tong-quan"
        className={styles.section + " " + styles.overview}
        aria-labelledby="overview-title"
      >
        <div className={styles.overviewMain}>
          <div className={styles.overviewCopy}>
            <p className={styles.eyebrow}>Tổng quan</p>
            <h2 id="overview-title" className={styles.overviewTitle}>
              Sắp xếp ảnh,
              <br />
              ghi chú và
              <br />
              điểm đến thành
              <br />
              hành trình.
            </h2>
            <p className={styles.overviewBody}>
              Gom cảm hứng thành lộ trình để bạn xem lại, điều chỉnh nhịp đi và
              tự quyết định từng chặng.
            </p>
            <a href="#kham-pha" className={styles.buttonPrimary}>
              Xem cách khám phá
              <Icon name="arrow_forward" className="size-4" />
            </a>
          </div>
          <figure className={styles.overviewMedia} data-reveal="media">
            <Image
              src={DESTINATIONS[1].image}
              alt={DESTINATIONS[1].alt}
              fill
              sizes="(max-width: 760px) 90vw, 40vw"
              className={styles.overviewImage}
              style={{ objectPosition: DESTINATIONS[1].position }}
            />
            <figcaption>Cầu Vàng · Bà Nà Hills</figcaption>
          </figure>
        </div>
        <ul
          className={styles.overviewFeatures}
          aria-label="Việc bạn có thể làm với VISTRA"
        >
          <li className={styles.overviewFeature}>
            <h3>Bắt đầu từ cảm hứng</h3>
            <p>Dùng ảnh hoặc ghi chú để mở đầu cho một chuyến đi.</p>
          </li>
          <li className={styles.overviewFeature}>
            <h3>Chọn điểm đến</h3>
            <p>Xem ảnh từng nơi và mở danh sách điểm đến liên quan.</p>
          </li>
          <li className={styles.overviewFeature}>
            <h3>Điều chỉnh nhịp đi</h3>
            <p>So sánh bản nháp khám phá rộng hơn với lựa chọn ít di chuyển.</p>
          </li>
          <li className={styles.overviewFeature}>
            <h3>Xem từng ngày</h3>
            <p>Mở lịch trình để rà lại điểm dừng và hoạt động theo ngày.</p>
          </li>
        </ul>
      </section>

      <ExploreSection />

      <section
        ref={preferencesSectionRef}
        id="cung-xay"
        className={styles.section + " " + styles.preferences}
        aria-labelledby="preferences-title"
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          preferencesHoveredRef.current = true;
          notePreferencesActivity();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "touch") return;
          preferencesHoveredRef.current = false;
          notePreferencesActivity();
        }}
        onPointerDownCapture={() => {
          preferencesPointerActiveRef.current = true;
          notePreferencesActivity();
        }}
        onFocusCapture={notePreferencesActivity}
        onBlurCapture={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
          )
            return;
          notePreferencesActivity();
        }}
        onKeyDownCapture={notePreferencesActivity}
        onClickCapture={notePreferencesActivity}
      >
        <div className={styles.preferencesGrid}>
          <div>
            <p className={styles.eyebrow}>Cùng điều chỉnh</p>
            <h2 id="preferences-title" className={styles.sectionTitle}>
              Chọn nhịp đi theo bạn.
            </h2>
            <p className={styles.sectionBody}>
              Thử một lựa chọn để xem bản nháp thay đổi. Bạn luôn có thể chọn
              lại.
            </p>
            <div
              className={styles.choiceList}
              role="group"
              aria-label="Chọn nhịp di chuyển"
            >
              <button
                type="button"
                className={styles.choiceButton}
                onClick={() => changePreference("default")}
                aria-pressed={tripState.preference === "default"}
              >
                <span className={styles.choiceTitle}>
                  Giữ bản nháp
                  {tripState.preference === "default" && (
                    <Icon
                      name="check_circle"
                      className="size-6"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className={styles.choiceDetail}>Khám phá rộng hơn</span>
              </button>
              <button
                type="button"
                className={styles.choiceButton}
                onClick={() => changePreference("less_travel")}
                aria-pressed={tripState.preference === "less_travel"}
              >
                <span className={styles.choiceTitle}>
                  Ít di chuyển
                  {tripState.preference === "less_travel" && (
                    <Icon
                      name="check_circle"
                      className="size-6"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className={styles.choiceDetail}>Gom điểm gần nhau</span>
              </button>
            </div>
          </div>

          <article
            className={styles.planPreview}
            aria-label="Bản nháp lịch trình minh họa tại Đà Lạt"
            data-reveal="rise"
          >
            <div key={tripState.preference} className={styles.previewState}>
              <header className={styles.previewHeader} aria-live="polite">
                <small>Lịch trình minh họa · Đà Lạt</small>
                <h3>Ngày 1 · {tripState.days[0].pace}</h3>
                <p>{tripState.days[0].routeSummary}</p>
              </header>
              <div className={styles.conversation}>
                <p className={styles.message + " " + styles.messageUser}>
                  {tripState.transcript[1]?.content}
                </p>
                <p className={styles.message + " " + styles.messageAssistant}>
                  {tripState.preference === "less_travel"
                    ? "Bản nháp đã gom điểm dừng gần nhau để buổi chiều linh hoạt hơn."
                    : "Bản nháp giữ điểm ngắm đồi xa để bạn cân nhắc thêm một chặng."}
                </p>
              </div>
              <div className={styles.activityList}>
                <h3>Các điểm dừng trong ngày</h3>
                {tripState.days[0].activities
                  .filter((activity) => activity.decisionStatus !== "skipped")
                  .map((activity) => (
                    <div key={activity.id} className={styles.activityRow}>
                      <time>{activity.timeLabel}</time>
                      <div>
                        <strong>{activity.title}</strong>
                        <span>{activity.description}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        id="xac-nhan"
        className={styles.section + " " + styles.review}
        aria-labelledby="review-title"
      >
        <div className={styles.reviewTop}>
          <div className={styles.reviewIntro}>
            <p className={styles.eyebrow}>Trước khi xác nhận</p>
            <h2 id="review-title" className={styles.sectionTitle}>
              Cân nhắc điểm dừng,
              <br />
              nhịp đi và hoạt động.
            </h2>
          </div>
        </div>
        <div className={styles.reviewCards}>
          {[3, 4, 5].map((destinationIndex, cardIndex) => {
            const destination = DESTINATIONS[destinationIndex];
            const labels = ["Điểm dừng", "Nhịp di chuyển", "Hoạt động"];
            const descriptions = [
              "Xem lại những nơi đã chọn trong bản nháp.",
              "Đối chiếu khoảng cách giữa các điểm dừng.",
              "Mở từng ngày để xem hoạt động và ghi chú.",
            ];
            return (
              <article
                key={destination.image}
                className={styles.reviewCard}
                data-reveal="rise"
                data-reveal-delay={cardIndex * 70}
              >
                <div className={styles.reviewThumb}>
                  <Image
                    src={destination.image}
                    alt={destination.alt}
                    fill
                    sizes="(max-width: 760px) 90vw, 31vw"
                    className={styles.reviewThumbImage}
                    style={{ objectPosition: destination.position }}
                  />
                </div>
                <div className={styles.reviewCardText}>
                  <strong>{labels[cardIndex]}</strong>
                  <p>
                    {destination.name} · {descriptions[cardIndex]}
                  </p>
                  <small>Ảnh: {destination.credit} / Unsplash</small>
                </div>
              </article>
            );
          })}
        </div>
        <div className={styles.reviewActions}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() =>
              setTripState((current) => ({
                ...current,
                isConfirmed: !current.isConfirmed,
              }))
            }
            aria-pressed={tripState.isConfirmed}
          >
            {tripState.isConfirmed
              ? "Đã xác nhận lựa chọn"
              : "Xác nhận lựa chọn"}
            <Icon
              name={tripState.isConfirmed ? "check_circle" : "arrow_forward"}
              className="size-4"
            />
          </button>
          <p className={styles.confirmStatus} role="status" aria-live="polite">
            {tripState.isConfirmed
              ? "Lịch trình minh họa đã được xác nhận."
              : "Lịch trình minh họa chưa được xác nhận."}
          </p>
        </div>
      </section>

      <section
        id="trai-nghiem"
        className={styles.section + " " + styles.itinerary}
        aria-labelledby="itinerary-title"
      >
        <div className={styles.itineraryGrid}>
          <div className={styles.itineraryCopy}>
            <p className={styles.eyebrow}>Bản kế hoạch</p>
            <h2 id="itinerary-title" className={styles.sectionTitle}>
              Một lịch trình,
              <br />
              ba ngày, từng chặng.
            </h2>
            <p className={styles.sectionBody}>
              Hành trình ví dụ tại Đà Lạt. Chọn ngày để xem điểm dừng, hoạt động
              và ghi chú di chuyển.
            </p>
          </div>

          <div className={styles.itineraryDayCards}>
            <div className={styles.itineraryDayGallery}>
              <div
                className={styles.itineraryDaySelector}
                role="group"
                aria-label="Chọn ngày trong lịch trình"
              >
                {tripState.days.map((day) => (
                  <button
                    key={day.dayNumber}
                    type="button"
                    aria-pressed={activeDay === day.dayNumber}
                    aria-controls="itinerary-selected-day-image itinerary-panel"
                    aria-label={"Xem lịch trình " + day.dayTitle}
                    onClick={() => setActiveDay(day.dayNumber)}
                  >
                    Ngày {day.dayNumber}
                  </button>
                ))}
              </div>
              <figure
                id="itinerary-selected-day-image"
                className={styles.itineraryDayMedia}
                tabIndex={0}
                aria-label={
                  currentDay.dayTitle +
                  ". " +
                  currentDay.routeSummary +
                  ". Ảnh: " +
                  currentDayPhoto.credit
                }
              >
                <span className={styles.itineraryDayImage}>
                  <Image
                    src={currentDayPhoto.src}
                    alt={currentDayPhoto.alt}
                    fill
                    sizes="(max-width: 760px) 90vw, 32vw"
                    className={styles.dayPhoto}
                    style={{ objectPosition: currentDayPhoto.position }}
                  />
                  <span className={styles.itineraryDayNumber}>
                    Ngày {currentDay.dayNumber}
                  </span>
                  <span
                    className={styles.itineraryDayOverlay}
                    aria-hidden="true"
                  >
                    <strong>{currentDay.dayTitle}</strong>
                    <span>{currentDay.routeSummary}</span>
                    <small>Ảnh: {currentDayPhoto.credit}</small>
                  </span>
                </span>
              </figure>
            </div>
            <article
              className={styles.ticket}
              data-reveal="rise"
              aria-label="Chi tiết lịch trình minh họa ba ngày tại Đà Lạt"
            >
              <header className={styles.ticketHeader}>
                <div>
                  <span className={styles.ticketLabel}>
                    Lịch trình minh họa · Đà Lạt
                  </span>
                  <h3>{tripState.tripTitle}</h3>
                </div>
                <span className={styles.ticketStatus}>
                  {tripState.isConfirmed ? "Đã xác nhận" : "Bản nháp"}
                </span>
              </header>
              <div
                key={activeDay}
                id="itinerary-panel"
                className={styles.itineraryPanel}
                aria-live="polite"
                aria-label={"Ngày " + currentDay.dayNumber}
              >
                <div className={styles.daySummary}>
                  <strong>{currentDay.dayTitle}</strong>
                  <p>{currentDay.routeSummary}</p>
                </div>
                <div className={styles.ticketActivities}>
                  {currentDay.activities
                    .filter((activity) => activity.decisionStatus !== "skipped")
                    .map((activity) => (
                      <div key={activity.id} className={styles.ticketActivity}>
                        <time>{activity.timeLabel}</time>
                        <div>
                          <strong>{activity.title}</strong>
                          <span>{activity.description}</span>
                        </div>
                      </div>
                    ))}
                </div>
                <p className={styles.ticketRoute}>
                  {currentDay.pace} · {currentDay.highlight}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="bat-dau" className={styles.cta} aria-labelledby="cta-title">
        <div className={styles.ctaInner}>
          <h2 id="cta-title" className={styles.ctaTitle}>
            Bắt đầu chuyến đi của bạn.
          </h2>
          <p className={styles.ctaBody}>
            Thêm một ảnh hoặc vài dòng ghi chú để bắt đầu phác thảo lịch trình.
          </p>
          <Link
            href="/create-trip"
            className={styles.buttonPrimary + " " + styles.ctaButton}
          >
            Bắt đầu ý tưởng chuyến đi
            <Icon name="arrow_forward" className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

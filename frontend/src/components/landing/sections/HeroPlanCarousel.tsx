"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import styles from '../hero/landing-hero.module.css';

interface HeroPlanCarouselProps {
  children: React.ReactNode;
}

const IMAGES = [
  { src: '/landing/place_sample/ammie-ngo-vcu-OZBxxRk-unsplash.jpg', alt: 'Thuyền tham quan giữa những đảo đá vôi ở vịnh Hạ Long' },
  { src: '/landing/place_sample/andreea-popa-PknaOrb1lVo-unsplash.jpg', alt: 'Cầu Vàng uốn quanh đôi bàn tay đá giữa núi rừng' },
  { src: '/landing/place_sample/giau-tran-ZMdXvd6jGww-unsplash.jpg', alt: 'Du khách ngắm núi đá và dòng sông ở Ninh Bình' },
  { src: '/landing/place_sample/juan-bacab-A3PS6Ffu20s-unsplash.jpg', alt: 'Bãi biển nhiệt đới với hàng dừa và thuyền đánh cá' },
  { src: '/landing/place_sample/pexels-hoang-hi-u-nguy-n-2163979614-39365021.jpg', alt: 'Hoàng hôn trên bãi đá ven biển Cái Chiên' },
  { src: '/landing/place_sample/ryan-le-EKFPwbPkDec-unsplash.jpg', alt: 'Tàu chạy giữa phố đường ray đông đúc ở Hà Nội' },
  { src: '/landing/place_sample/silver-ringvee-niFWqrLdjlE-unsplash.jpg', alt: 'Đường ray len giữa khu phố và những lá cờ Việt Nam' },
  { src: '/landing/place_sample/toomas-tartes-27HacQwqvA0-unsplash.jpg', alt: 'Thuyền đi qua con phố ven sông với những ngôi nhà vàng' },
];

export default function HeroPlanCarousel({ children }: HeroPlanCarouselProps) {
  const imageCount = IMAGES.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isPaused = isHovering || isFocused || prefersReducedMotion;
  const slideIndex = Math.min(activeIndex, imageCount - 1);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (isPaused || imageCount < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (Math.min(current, imageCount - 1) + 1) % imageCount);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [imageCount, isPaused]);

  const goToPrevious = () => {
    if (imageCount > 1) setActiveIndex((slideIndex + imageCount - 1) % imageCount);
  };

  const goToNext = () => {
    if (imageCount > 1) setActiveIndex((slideIndex + 1) % imageCount);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) goToNext();
      else goToPrevious();
    }
  };

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ảnh cảm hứng du lịch"
      aria-live={isPaused ? 'polite' : 'off'}
      tabIndex={imageCount > 1 ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsFocused(false);
      }}
      onTouchStart={(event) => {
        touchStart.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      }}
      onTouchEnd={handleTouchEnd}
    >
      {IMAGES.map((image, index) => (
        <div
          key={image.src}
          className={`${styles.slide} ${index === slideIndex ? styles.activeSlide : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${image.alt} · ${index + 1} trên ${imageCount}`}
          aria-hidden={index !== slideIndex}
        >
          {(index === slideIndex || index === (slideIndex + 1) % imageCount) && (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              preload={index === 0}
              className={styles.slideImage}
            />
          )}
        </div>
      ))}

      <div className={styles.imageOverlay} aria-hidden="true" />

      <div className={styles.heroContentLayer}>
        {children}
      </div>

      {imageCount > 1 && <div className={styles.carouselControls} role="group" aria-label="Điều khiển ảnh">
        <button
          type="button"
          onClick={goToPrevious}
          className={styles.controlButton}
          aria-label="Ảnh trước"
        >
          <Icon name="chevron_left" className="size-5" />
        </button>

        {imageCount <= 8 && <div className={styles.carouselDots} role="group" aria-label="Chọn ảnh">
          {IMAGES.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={styles.dotButton}
              aria-label={`Chuyển đến ảnh ${index + 1}: ${image.alt}`}
              aria-current={slideIndex === index ? 'true' : undefined}
            >
              <span className={`${styles.dot} ${slideIndex === index ? styles.activeDot : ''}`} />
            </button>
          ))}
        </div>}

        <button
          type="button"
          onClick={goToNext}
          className={styles.controlButton}
          aria-label="Ảnh tiếp theo"
        >
          <Icon name="chevron_right" className="size-5" />
        </button>
      </div>}
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import styles from '../hero/landing-hero.module.css';

const PLACE_SAMPLE_IMAGES = [
  {
    src: '/landing/place_sample/ammie-ngo-vcu-OZBxxRk-unsplash.jpg',
    alt: 'Rừng thông Đà Lạt ngập trong sương sớm',
  },
  {
    src: '/landing/place_sample/andreea-popa-PknaOrb1lVo-unsplash.jpg',
    alt: 'Cung đường đèo uốn lượn tại Hà Giang',
  },
  {
    src: '/landing/place_sample/giau-tran-ZMdXvd6jGww-unsplash.jpg',
    alt: 'Phố cổ Hội An rực rỡ đèn lồng buổi chiều tà',
  },
  {
    src: '/landing/place_sample/juan-bacab-A3PS6Ffu20s-unsplash.jpg',
    alt: 'Bãi biển xanh mát và rặng dừa tại Phú Quốc',
  },
  {
    src: '/landing/place_sample/pexels-hoang-hi-u-nguy-n-2163979614-39365021.jpg',
    alt: 'Khung cảnh non nước hữu tình tại Ninh Bình',
  },
  {
    src: '/landing/place_sample/ryan-le-EKFPwbPkDec-unsplash.jpg',
    alt: 'Đồi chè Mộc Châu xanh mướt trong sương',
  },
  {
    src: '/landing/place_sample/silver-ringvee-niFWqrLdjlE-unsplash.jpg',
    alt: 'Hoàng hôn buông trên dãy Hoàng Liên Sơn',
  },
  {
    src: '/landing/place_sample/toomas-tartes-27HacQwqvA0-unsplash.jpg',
    alt: 'Cửa hang động kỳ vĩ giữa rừng nguyên sinh Quảng Bình',
  },
];

interface HeroPlanCarouselProps {
  children: React.ReactNode;
}

export default function HeroPlanCarousel({ children }: HeroPlanCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isPaused = isHovering || isFocused || prefersReducedMotion;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % PLACE_SAMPLE_IMAGES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const goToPrevious = () => {
    setActiveIndex((current) => (current + PLACE_SAMPLE_IMAGES.length - 1) % PLACE_SAMPLE_IMAGES.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % PLACE_SAMPLE_IMAGES.length);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
    } else if (event.key === 'ArrowRight') {
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
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
      }}
      onTouchStart={(event) => {
        touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }}
      onTouchEnd={handleTouchEnd}
    >
      {PLACE_SAMPLE_IMAGES.map((image, index) => (
        <div
          key={image.src}
          className={`${styles.slide} ${index === activeIndex ? styles.activeSlide : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`Ảnh ${index + 1} trên ${PLACE_SAMPLE_IMAGES.length}`}
          aria-hidden={index !== activeIndex}
        >
          {(index === activeIndex || index === (activeIndex + 1) % PLACE_SAMPLE_IMAGES.length) && (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              priority={index === 0}
              className={styles.slideImage}
            />
          )}
        </div>
      ))}

      <div className={styles.imageOverlay} aria-hidden="true" />

      <div className={styles.heroContentLayer}>
        {children}
      </div>

      <div className={styles.carouselControls} role="group" aria-label="Điều khiển ảnh">
        <button
          type="button"
          onClick={goToPrevious}
          className={styles.controlButton}
          aria-label="Ảnh trước"
        >
          <Icon name="chevron_left" className="size-5" />
        </button>

        <div className={styles.carouselDots} role="group" aria-label="Chọn ảnh">
          {PLACE_SAMPLE_IMAGES.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={styles.dotButton}
              aria-label={`Chuyển đến ảnh ${index + 1}`}
              aria-current={activeIndex === index ? 'true' : undefined}
            >
              <span className={`${styles.dot} ${activeIndex === index ? styles.activeDot : ''}`} />
            </button>
          ))}
        </div>

        <span className={styles.carouselCounter} aria-hidden="true">
          {String(activeIndex + 1).padStart(2, '0')} / {String(PLACE_SAMPLE_IMAGES.length).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={goToNext}
          className={styles.controlButton}
          aria-label="Ảnh tiếp theo"
        >
          <Icon name="chevron_right" className="size-5" />
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import VistraMap, { type MapMarker } from "@/components/shared/VistraMap";
import Icon from "@/components/ui/Icon";
import styles from "../landing-redesign.module.css";

interface StepInfo {
  id: 1 | 2 | 3;
  title: string;
  copy: string;
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  route: [number, number][];
}

const STEPS: StepInfo[] = [
  {
    id: 1,
    title: "Ý tưởng ban đầu",
    copy: "Gom các điểm đến tiềm năng từ nguồn cảm hứng của bạn.",
    center: [106.5, 16.2],
    zoom: 5,
    markers: [
      { id: "s1-1", name: "Hà Giang", lng: 104.98, lat: 22.82, kind: "scenic" },
      { id: "s1-2", name: "Hạ Long", lng: 107.07, lat: 20.95, kind: "scenic" },
      {
        id: "s1-3",
        name: "Đồng Hới",
        lng: 106.62,
        lat: 17.47,
        kind: "culture",
      },
      {
        id: "s1-4",
        name: "Phong Nha",
        lng: 106.28,
        lat: 17.58,
        kind: "scenic",
      },
      { id: "s1-5", name: "Huế", lng: 107.59, lat: 16.46, kind: "culture" },
      { id: "s1-6", name: "Đà Nẵng", lng: 108.22, lat: 16.07, kind: "scenic" },
      { id: "s1-7", name: "Hội An", lng: 108.33, lat: 15.88, kind: "culture" },
    ],
    route: [],
  },
  {
    id: 2,
    title: "Hội tụ về một vùng",
    copy: "Thu hẹp khoảng cách và giữ các điểm đến thuận tiện nhất.",
    center: [106.4, 17.58],
    zoom: 9,
    markers: [
      {
        id: "s2-1",
        name: "Động Phong Nha",
        lng: 106.28,
        lat: 17.58,
        kind: "scenic",
      },
      {
        id: "s2-2",
        name: "Động Thiên Đường",
        lng: 106.22,
        lat: 17.52,
        kind: "scenic",
      },
      {
        id: "s2-3",
        name: "Suối Nước Moọc",
        lng: 106.24,
        lat: 17.54,
        kind: "scenic",
      },
      {
        id: "s2-4",
        name: "Sông Chày Hang Tối",
        lng: 106.26,
        lat: 17.56,
        kind: "scenic",
      },
      {
        id: "s2-5",
        name: "Thung lũng Hava",
        lng: 106.27,
        lat: 17.55,
        kind: "scenic",
      },
      {
        id: "s2-6",
        name: "Bãi đá Nhảy",
        lng: 106.5,
        lat: 17.71,
        kind: "scenic",
      },
      {
        id: "s2-7",
        name: "Đồi cát Quang Phú",
        lng: 106.63,
        lat: 17.51,
        kind: "scenic",
      },
      {
        id: "s2-8",
        name: "Tượng đài Mẹ Suốt",
        lng: 106.62,
        lat: 17.47,
        kind: "culture",
      },
    ],
    route: [],
  },
  {
    id: 3,
    title: "Lộ trình thông suốt",
    copy: "Kết nối các chặng dừng thành lịch trình theo từng ngày.",
    center: [106.4, 17.58],
    zoom: 9,
    markers: [
      {
        id: "s3-1",
        name: "Tượng đài Mẹ Suốt",
        lng: 106.62,
        lat: 17.47,
        order: 1,
        kind: "culture",
      },
      {
        id: "s3-2",
        name: "Đồi cát Quang Phú",
        lng: 106.63,
        lat: 17.51,
        order: 2,
        kind: "scenic",
      },
      {
        id: "s3-3",
        name: "Bãi đá Nhảy",
        lng: 106.5,
        lat: 17.71,
        order: 3,
        kind: "scenic",
      },
      {
        id: "s3-4",
        name: "Động Phong Nha",
        lng: 106.28,
        lat: 17.58,
        order: 4,
        kind: "scenic",
      },
      {
        id: "s3-5",
        name: "Động Thiên Đường",
        lng: 106.22,
        lat: 17.52,
        order: 5,
        kind: "scenic",
      },
    ],
    route: [
      [106.62, 17.47],
      [106.63, 17.51],
      [106.5, 17.71],
      [106.28, 17.58],
      [106.22, 17.52],
    ],
  },
];

export default function ExploreSection() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const currentStep = STEPS[activeStep - 1];

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = document.getElementById("kham-pha");
    if (!section || typeof IntersectionObserver === "undefined") return;

    let timer: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && timer === undefined) {
        timer = window.setInterval(() => {
          setActiveStep((current) =>
            current === 3 ? 1 : current === 1 ? 2 : 3,
          );
          setSelectedMarkerId(null);
        }, 2000);
      } else if (!entry.isIntersecting && timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    });
    observer.observe(section);
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, []);

  const selectStep = (step: StepInfo) => {
    setActiveStep(step.id);
    setSelectedMarkerId(null);
  };

  return (
    <section
      id="kham-pha"
      className={styles.exploreWrap}
      aria-labelledby="explore-title"
    >
      <div className={styles.exploreInner}>
        <div className={styles.exploreLayout}>
          <div className={styles.exploreCopyColumn}>
            <header className={styles.exploreHeading}>
              <p className={styles.eyebrow}>Định hình tuyến điểm</p>
              <h2 id="explore-title" className={styles.exploreTitle}>
                Gom điểm dừng thành lộ trình.
              </h2>
            </header>

            <div
              className={styles.exploreRows}
              role="group"
              aria-label="Các giai đoạn kiến tạo hành trình"
            >
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  id={"explore-step-" + step.id}
                  type="button"
                  aria-expanded={activeStep === step.id}
                  aria-controls="explore-active-copy explore-active-panel"
                  aria-labelledby={"explore-stage-title-" + step.id}
                  aria-describedby={
                    activeStep === step.id ? "explore-active-copy" : undefined
                  }
                  className={styles.exploreRowButton}
                  onClick={() => selectStep(step)}
                >
                  <span className={styles.exploreStageText}>
                    <span id={"explore-stage-title-" + step.id}>
                      {step.title}
                    </span>
                    {activeStep === step.id && (
                      <span
                        id="explore-active-copy"
                        className={styles.exploreCopy}
                        aria-live="polite"
                      >
                        {step.copy}
                      </span>
                    )}
                  </span>
                  <span className={styles.exploreRowIcon} aria-hidden="true">
                    <Icon
                      name={
                        activeStep === step.id
                          ? "arrow_downward"
                          : "arrow_forward"
                      }
                      className="size-5"
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div
            id="explore-active-panel"
            className={styles.exploreActivePanel}
            role="region"
            aria-label={"Bản đồ lộ trình: " + currentStep.title}
            data-reveal="media"
          >
            <div className={styles.exploreMapFrame}>
              <VistraMap
                key={currentStep.id}
                markers={currentStep.markers}
                route={currentStep.route}
                center={currentStep.center}
                zoom={currentStep.zoom}
                selectedMarkerId={selectedMarkerId}
                onMarkerSelect={(marker) =>
                  setSelectedMarkerId(marker?.id ?? null)
                }
                deferTiles={false}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

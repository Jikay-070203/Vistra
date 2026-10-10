"use client";

import { useEffect, useRef, useState } from "react";
import { getPublicLanding } from "@/services/publicLandingService";
import type { PublicLandingView } from "@/types/publicLandingApi";

export function useLandingContent() {
  const [data, setData] = useState<PublicLandingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestGeneration = useRef(0);

  useEffect(() => {
    let active = true;
    const generation = requestGeneration.current;
    getPublicLanding()
      .then((data) => {
        if (active && generation === requestGeneration.current)
          setData({
            ...data,
            heroPlans: data.heroPlans.slice(0, 8),
            introDestinations: data.introDestinations.slice(0, 6),
          });
      })
      .catch((cause: unknown) => {
        if (active && generation === requestGeneration.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải nội dung trang chủ.",
          );
      })
      .finally(() => {
        if (active && generation === requestGeneration.current)
          setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    requestGeneration.current += 1;
    setData(null);
    setError(null);
    setLoading(true);
    setAttempt((value) => value + 1);
  };

  return { data, loading, error, retry };
}

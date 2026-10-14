"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { getProvinceCatalog } from "@/services/catalogService";
import type { TripDetailDto } from "@/types/tripApi";
import type { ProvinceCatalogItem } from "@/types/catalogApi";

interface PlannerHeaderProps {
  trip?: TripDetailDto | null;
  hasPreview?: boolean;
  busy?: boolean;
  onDocument?: () => void;
  onConfirm?: () => void;
  onPublish?: () => void;
  returnUrl?: string;
  returnTitle?: string;
}

let cachedProvinces: ProvinceCatalogItem[] | null = null;
let provinceFetchPromise: Promise<ProvinceCatalogItem[]> | null = null;

export async function fetchProvinceCatalog(): Promise<ProvinceCatalogItem[]> {
  if (cachedProvinces) return cachedProvinces;
  if (!provinceFetchPromise) {
    provinceFetchPromise = getProvinceCatalog()
      .then((res) => {
        cachedProvinces = res.data;
        return res.data;
      })
      .catch(() => []);
  }
  return provinceFetchPromise;
}

export function useProvinceName(
  idOrSlug?: number | string | null,
  fallbackSlug?: string | null,
): string {
  const [items, setItems] = useState<ProvinceCatalogItem[]>(
    cachedProvinces ?? [],
  );

  useEffect(() => {
    let active = true;
    if (!cachedProvinces) {
      fetchProvinceCatalog().then((provinces) => {
        if (active) setItems(provinces);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  if (idOrSlug === undefined || idOrSlug === null || idOrSlug === "") {
    return fallbackSlug ?? "";
  }

  // 1. If destination_id is provided as number (from trip.destination_id)
  if (typeof idOrSlug === "number") {
    const match = items.find((p) => p.id === idOrSlug);
    if (match) return match.name;
    if (fallbackSlug) {
      const matchSlug = items.find(
        (p) => p.slug === fallbackSlug || p.name === fallbackSlug,
      );
      if (matchSlug) return matchSlug.name;
      return fallbackSlug;
    }
    return "";
  }

  // 2. If idOrSlug is string, it might be a numeric string ID or slug
  const numericId = Number(idOrSlug);
  if (
    !Number.isNaN(numericId) &&
    Number.isInteger(numericId) &&
    numericId > 0
  ) {
    const match = items.find((p) => p.id === numericId);
    if (match) return match.name;
  }

  const match = items.find((p) => p.slug === idOrSlug || p.name === idOrSlug);
  return match ? match.name : fallbackSlug || idOrSlug;
}

interface ReturnInfo {
  url: string;
  title: string;
  hasInternalHistory: boolean;
}

function getRouteDescription(url: string): { label: string; title: string } {
  const cleanPath = url.split("?")[0].toLowerCase();
  if (cleanPath.startsWith("/create-trip")) {
    return { label: "Tạo chuyến đi", title: "Quay lại trang tạo chuyến đi" };
  }
  if (cleanPath.startsWith("/my-trips")) {
    return { label: "Chuyến đi của tôi", title: "Quay lại Chuyến đi của tôi" };
  }
  if (cleanPath.startsWith("/trip-plan")) {
    return { label: "Xem lịch trình", title: "Quay lại xem lịch trình" };
  }
  if (cleanPath.startsWith("/community")) {
    return { label: "Cộng đồng", title: "Quay lại khám phá cộng đồng" };
  }
  if (cleanPath.startsWith("/destinations")) {
    return { label: "Điểm đến", title: "Quay lại danh sách điểm đến" };
  }
  if (cleanPath === "/" || cleanPath === "") {
    return { label: "Trang chủ", title: "Quay lại Trang chủ" };
  }
  return { label: "Quay lại", title: "Quay lại trang trước" };
}

function getDefaultFallbackUrl(trip?: TripDetailDto | null): string {
  if (trip?.status === "confirmed" && trip?.id) {
    return `/trip-plan?id=${encodeURIComponent(trip.id)}`;
  }
  return "/my-trips";
}

export default function PlannerHeader({
  trip,
  hasPreview = false,
  busy = false,
  onDocument,
  onConfirm,
  onPublish,
  returnUrl: propReturnUrl,
  returnTitle: propReturnTitle,
}: PlannerHeaderProps) {
  const router = useRouter();
  const editable = trip?.status === "draft";
  const destinationName = useProvinceName(
    trip?.destination_id,
    trip?.request?.destination,
  );

  const [returnInfo, setReturnInfo] = useState<ReturnInfo>(() => {
    const fallback = propReturnUrl || getDefaultFallbackUrl(trip);
    const desc = getRouteDescription(fallback);
    return {
      url: fallback,
      title: propReturnTitle || desc.title,
      hasInternalHistory: false,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (propReturnUrl) {
      const desc = getRouteDescription(propReturnUrl);
      setReturnInfo({
        url: propReturnUrl,
        title: propReturnTitle || desc.title,
        hasInternalHistory: true,
      });
      return;
    }

    // 1. Check query param `from` or `returnUrl` (e.g. /planner?id=...&from=/my-trips)
    const params = new URLSearchParams(window.location.search);
    const queryReturn = params.get("from") || params.get("returnUrl");
    if (queryReturn && queryReturn.startsWith("/")) {
      const desc = getRouteDescription(queryReturn);
      setReturnInfo({
        url: queryReturn,
        title: desc.title,
        hasInternalHistory: true,
      });
      return;
    }

    // 2. Check sessionStorage recorded by SiteChrome on preceding non-planner page
    let storedUrl: string | null = null;
    let hasInternal = false;
    try {
      storedUrl = sessionStorage.getItem("vistra_planner_return_url");
      hasInternal = sessionStorage.getItem("vistra_internal_visited") === "true";
    } catch {
      // Storage unavailable
    }

    if (storedUrl && storedUrl.startsWith("/")) {
      const desc = getRouteDescription(storedUrl);
      setReturnInfo({
        url: storedUrl,
        title: desc.title,
        hasInternalHistory: hasInternal,
      });
      return;
    }

    // 3. Check document.referrer if it belongs to the same origin
    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin) {
          const refPath = refUrl.pathname + refUrl.search;
          if (
            !refPath.startsWith("/planner") &&
            !refPath.startsWith("/login") &&
            !refPath.startsWith("/register") &&
            !refPath.startsWith("/auth")
          ) {
            const desc = getRouteDescription(refPath);
            setReturnInfo({
              url: refPath,
              title: desc.title,
              hasInternalHistory: true,
            });
            return;
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // 4. Default fallback
    const fallback = getDefaultFallbackUrl(trip);
    const desc = getRouteDescription(fallback);
    setReturnInfo({
      url: fallback,
      title: desc.title,
      hasInternalHistory: false,
    });
  }, [trip?.status, trip?.id, propReturnUrl, propReturnTitle]);

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Preserve standard browser behaviors for modified clicks (Ctrl, Cmd, Shift, middle-click)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    e.preventDefault();

    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      returnInfo.hasInternalHistory
    ) {
      router.back();
    } else {
      router.push(returnInfo.url);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#EBF1F0]/95 backdrop-blur-md border-b border-[#0E1D4F]/10 shadow-[0_2px_12px_rgba(14,29,79,0.04)] transition-all">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left:Back + Trip Title & Metadata */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Dynamic Return to the previous page */}
          <Link
            href={returnInfo.url}
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#4B5875] hover:text-[#0E1D4F] hover:bg-white/80 transition-colors shrink-0"
            title={returnInfo.title}
            aria-label={returnInfo.title}
          >
            <Icon name="arrow_back" className="size-4 text-[#205BD6]" />
            <span className="hidden md:inline">Quay lại</span>
          </Link>
          {/* Active Trip Info (when loaded) */}
          {trip && (
            <>
              <div className="h-6 w-px bg-[#0E1D4F]/15 shrink-0 hidden lg:block" />
              <div className="min-w-0 flex-1 hidden lg:flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-[#0E1D4F] truncate max-w-[280px] xl:max-w-[420px]">
                    {destinationName || trip.request.destination}
                  </h1>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      trip.status === "draft"
                        ? "bg-[#205BD6]/10 text-[#205BD6] border border-[#205BD6]/20"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {trip.status === "draft" ? "Bản nháp" : "Đã chốt"}
                  </span>
                </div>
                <p className="text-[11px] text-[#4B5875] truncate">
                  {trip.request.start_date} · {trip.request.days} ngày ·{" "}
                  {trip.request.people} người
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions & User Avatar */}
        {trip && (
          <>
            {/* Trip Plan Document Popup */}
            <button
              type="button"
              onClick={onDocument}
              disabled={!onDocument}
              className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-xl border border-[#0E1D4F]/15 bg-white text-xs font-semibold text-[#0E1D4F] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
              title="Xem tài liệu hành trình tại đây"
            >
              <Icon name="description" className="size-4 text-[#205BD6]" />
              <span className="hidden sm:inline">Tài liệu hành trình</span>
              <span className="sr-only sm:hidden">Tài liệu hành trình</span>
            </button>

            {/* Confirm Plan Action (Draft status) */}
            {editable && onConfirm && (
              <button
                type="button"
                disabled={busy || hasPreview}
                onClick={onConfirm}
                aria-label="Chốt lịch trình"
                className="inline-flex min-h-11 min-w-11 items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#0739A8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Chốt lịch trình để hoàn thiện và khóa phiên bản"
              >
                <Icon name="check_circle" className="size-4" />
                <span className="hidden xs:inline sm:inline">
                  Chốt lịch trình
                </span>
              </button>
            )}

            {/* Publish Action (Confirmed status) */}
            {trip.status === "confirmed" && onPublish && (
              <button
                type="button"
                disabled={busy}
                onClick={onPublish}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  trip.is_published
                    ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                title={
                  trip.is_published
                    ? "Hủy chia sẻ hành trình này trên cộng đồng"
                    : "Chia sẻ hành trình lên cộng đồng du khách"
                }
              >
                <Icon
                  name={trip.is_published ? "close" : "share"}
                  className="size-4"
                />
                <span>
                  {trip.is_published ? "Hủy chia sẻ" : "Chia sẻ cộng đồng"}
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}

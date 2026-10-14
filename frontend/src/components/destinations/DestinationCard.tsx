"use client";

import Image from "next/image";
import Icon from "@/components/ui/Icon";
import type { DestinationRecommendationView } from "@/types/recommendationApi";

interface DestinationCardProps {
  dest: DestinationRecommendationView;
  isSelected: boolean;
  compareDisabled: boolean;
  isExpanded: boolean;
  onToggleCompare: (id: string) => void;
  onToggleDetails: (id: string) => void;
  onSelectDestination: (slug: string) => void;
}

export default function DestinationCard({
  dest,
  isSelected,
  compareDisabled,
  isExpanded,
  onToggleCompare,
  onToggleDetails,
  onSelectDestination,
}: DestinationCardProps) {
  return (
    <article
      className={`relative flex min-w-0 flex-row overflow-hidden rounded-xl border bg-warm-surface transition-shadow md:flex-col ${
        isSelected ? "border-[#205BD6]/50 shadow-sm" : "border-[#0E1D4F]/10"
      } ${compareDisabled ? "opacity-70" : "hover:shadow-sm"}`}
    >
      <div className="relative min-h-40 w-28 shrink-0 bg-[#EBF1F0] sm:w-32 md:h-40 md:w-full">
        {dest.imageUrl ? (
          <Image
            src={dest.imageUrl}
            alt={dest.name}
            fill
            sizes="(max-width: 767px) 128px, (max-width: 1280px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-[#4B5875] md:min-h-0">
            <Icon name="landscape" className="size-7" />
            <span className="text-xs">Chưa có ảnh</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5 md:p-4">
        <div>
          <p className="text-xs font-semibold text-[#53634D]">
            {[dest.region, dest.country].filter(Boolean).join(" · ")}
          </p>
          <h2 className="mt-1 font-headline-sm text-base font-bold leading-snug text-[#0E1D4F]">
            {dest.name}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-[#4B5875]">
          {dest.rationale}
        </p>

        <div className="space-y-1 border-t border-[#0E1D4F]/10 pt-2 text-xs text-[#4B5875]">
          {dest.durationDays !== null && (
            <p className="font-semibold text-[#0E1D4F]">
              {dest.durationDays} ngày
            </p>
          )}
          {dest.estimatedCostVnd !== null && (
            <p>Chi phí: {dest.estimatedCostVnd.toLocaleString("vi-VN")} đ</p>
          )}
          {(dest.estimatedCostVnd === null || dest.seasonMatchPct === null) && (
            <p>
              {dest.estimatedCostVnd === null ? "Chưa có chi phí. " : ""}
              {dest.seasonMatchPct === null ? "Chưa có đánh giá mùa vụ." : ""}
            </p>
          )}
          {dest.seasonMatchPct !== null && (
            <p>Phù hợp mùa vụ: {dest.seasonMatchPct}%</p>
          )}
        </div>

        {/* {compareDisabled && (
          <p className="rounded-md bg-[#EBF1F0] px-2.5 py-1.5 text-xs font-semibold text-[#4B5875]">
            Đã đạt tối đa 3 lựa chọn
          </p>
        )} */}
        <label
          className={`flex min-h-9 items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-[#0E1D4F] transition-colors ${
            compareDisabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:bg-[#EBF1F0]"
          }`}
        >
          <span className="relative flex size-[14px] shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              disabled={compareDisabled}
              onChange={() => onToggleCompare(dest.id)}
              className="peer sr-only"
              aria-label={`${isSelected ? "Bỏ chọn" : "Chọn"} ${dest.name} để so sánh`}
            />
            <span
              className={`flex size-[14px] items-center justify-center rounded-full border transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#205BD6] peer-focus-visible:ring-offset-1 ${
                isSelected
                  ? "border-[#205BD6] bg-[#205BD6] text-white"
                  : "border-[#0E1D4F]/30 bg-warm-surface"
              }`}
            >
              {isSelected && (
                <Icon name="check" className="size-3 text-white stroke-[2.5]" />
              )}
            </span>
          </span>
          <span className="text-xs">
            {isSelected
              ? "Đang so sánh"
              : compareDisabled
                ? "Đã chọn tối đa 3"
                : "Chọn so sánh"}
          </span>
        </label>

        <div className="mt-auto grid grid-cols-1 gap-2">
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => onToggleDetails(dest.id)}
            className="min-h-11 rounded-lg border border-[#0E1D4F]/20 bg-warm-surface px-3 py-2 text-sm font-semibold text-[#0E1D4F] transition-colors hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
          >
            {isExpanded ? "Đóng chi tiết" : "Thông tin điểm đến"}
          </button>
          <button
            type="button"
            onClick={() => onSelectDestination(dest.id)}
            className="min-h-11 rounded-lg bg-[#205BD6] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
          >
            Tạo kế hoạch tại đây
          </button>
        </div>
      </div>
    </article>
  );
}

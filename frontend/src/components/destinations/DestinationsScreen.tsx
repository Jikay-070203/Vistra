"use client";

import Icon from "@/components/ui/Icon";
import { useDestinationsController } from "./useDestinationsController";
import DestinationCard from "./DestinationCard";
import DestinationDetailPanel from "./DestinationDetailPanel";
import ComparisonDialog from "./ComparisonDialog";

export default function DestinationsScreen() {
  const {
    destinations,
    isLoadingRecommendations,
    recommendationsError,
    retryRecommendations,
    selectedForCompare,
    expandedDetails,
    showComparisonModal,
    setShowComparisonModal,
    comparedDestinations,
    toggleCompare,
    toggleDetails,
    handleSelectDestination,
  } = useDestinationsController();
  const expanded = destinations.find((item) => item.id === expandedDetails);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
      <header className="flex flex-col gap-5 border-b border-[#0E1D4F]/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#08B3C6]"></span>
            <span className="font-label-caps text-xs text-[#08B3C6] uppercase tracking-widest font-bold">
              KHÁM PHÁ ĐIỂM ĐẾN
            </span>
          </div>
          <h1
            id="destinations-title"
            className="mt-2 font-headline-lg text-3xl font-bold tracking-tight text-[#0E1D4F] sm:text-4xl"
          >
            Khám phá điểm đến
          </h1>
          <p className="mt-3 w-full text-sm leading-relaxed text-[#4B5875]">
            Gợi ý từ danh mục điểm đến đang hoạt động. Dữ liệu cá nhân hóa, dự
            báo thời tiết và chi phí chưa khả dụng.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-[#4B5875]"
          >
            Đã chọn {selectedForCompare.length}/3 điểm đến
          </p>
          <button
            type="button"
            disabled={selectedForCompare.length < 2}
            onClick={() => setShowComparisonModal(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#0E1D4F]/20 bg-warm-surface px-4 py-2.5 text-sm font-semibold text-[#0E1D4F] transition-colors hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="compare_arrows" className="size-4" />
            <span>So sánh điểm đến</span>
          </button>
        </div>
      </header>

      {isLoadingRecommendations ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-8 text-center"
        >
          <span className="size-8 animate-spin rounded-full border-4 border-[#205BD6]/25 border-t-[#205BD6]" />
          <p className="text-sm font-semibold text-[#0E1D4F]">
            Đang tải điểm đến...
          </p>
        </div>
      ) : recommendationsError ? (
        <div
          role="alert"
          className="mt-8 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900"
        >
          <Icon name="error" className="mb-3 size-8 text-rose-700" />
          <p className="max-w-lg text-sm">{recommendationsError}</p>
          <button
            type="button"
            onClick={retryRecommendations}
            className="mt-4 min-h-11 rounded-lg bg-[#205BD6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
          >
            Thử lại
          </button>
        </div>
      ) : destinations.length === 0 ? (
        <div
          role="status"
          className="mt-8 rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-8 text-center text-sm text-[#4B5875]"
        >
          Danh mục chưa có điểm đến.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {destinations.map((dest) => (
            <DestinationCard
              key={dest.id}
              dest={dest}
              isSelected={selectedForCompare.includes(dest.id)}
              compareDisabled={
                selectedForCompare.length >= 3 &&
                !selectedForCompare.includes(dest.id)
              }
              isExpanded={expandedDetails === dest.id}
              onToggleCompare={toggleCompare}
              onToggleDetails={toggleDetails}
              onSelectDestination={handleSelectDestination}
            />
          ))}
        </div>
      )}

      {expanded && (
        <DestinationDetailPanel
          key={expanded.id}
          dest={expanded}
          onClose={() => toggleDetails(expanded.id)}
          onSelectDestination={handleSelectDestination}
        />
      )}
      {showComparisonModal && (
        <ComparisonDialog
          isOpen={showComparisonModal}
          comparedDestinations={comparedDestinations}
          onRemoveDestination={toggleCompare}
          onClose={() => setShowComparisonModal(false)}
          onSelectDestination={handleSelectDestination}
        />
      )}
    </div>
  );
}

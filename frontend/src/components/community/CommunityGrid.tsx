'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import type { TripCardView } from '@/types/tripCollectionApi';
import CommunityPlanCard from './CommunityPlanCard';

interface CommunityGridProps {
  paginatedPlans: TripCardView[];
  likesState: Record<string, { liked: boolean; count: number }>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onToggleLike: (e: React.MouseEvent, planId: string) => void;
  onClearFilters: () => void;
  pendingLikes: string[];
  pendingClone: string | null;
  onClone: (id: string) => void;
  isFiltered?: boolean;
  className?: string;
}

export default function CommunityGrid({
  paginatedPlans,
  likesState,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onToggleLike,
  onClearFilters,
  pendingLikes, pendingClone, onClone,
  isFiltered = false,
  className = "lg:col-span-8",
}: CommunityGridProps) {
  return (
    <main className={`flex flex-col gap-5 ${className}`}>
      <div className="flex items-end justify-between gap-4 border-b border-[#0E1D4F]/10 pb-3">
        <h2 className="font-headline-sm text-base font-bold text-[#0E1D4F] sm:text-lg">Hành trình từ cộng đồng</h2>
        <p className="shrink-0 text-xs text-[#4B5875]">{totalCount} kết quả</p>
      </div>
      {paginatedPlans.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedPlans.map((plan, index) => {
            const currentLike = likesState[plan.id] ?? {
              liked: plan.likedByMe,
              count: plan.likesCount,
            };
            return (
              <CommunityPlanCard
                key={plan.id}
                plan={plan}
                isLiked={currentLike.liked}
                likesCount={currentLike.count}
                priority={index < 3}
                onToggleLike={onToggleLike}
                likePending={pendingLikes.includes(plan.id)}
                clonePending={pendingClone !== null}
                onClone={onClone}
              />
            );
          })}
        </div>
      ) : isFiltered ? (
        <div className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-8 py-16 text-center">
          <Icon name="search_off" className="size-10 text-[#4B5875]/60 mb-3 mx-auto" />
          <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold mb-1">
            Không tìm thấy hành trình cộng đồng phù hợp
          </h3>
          <p className="text-xs text-[#4B5875] max-w-sm mx-auto mb-4">
            Hãy thử nới lỏng các tiêu chí thời lượng, ngân sách hoặc địa điểm để khám phá thêm nhiều cung đường khác.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="min-h-11 rounded-lg bg-[#205BD6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-8 py-16 text-center">
          <Icon name="auto_awesome" className="size-10 text-[#205BD6] mb-3 mx-auto" />
          <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold mb-1">
            Hãy tạo dấu ấn riêng của bạn
          </h3>
          <p className="text-xs text-[#4B5875] max-w-sm mx-auto mb-4">
            Chưa có hành trình nào được chia sẻ trong cộng đồng. Hãy là người đầu tiên tạo và chia sẻ hành trình của bạn!
          </p>
          <Link
            href="/create-trip"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#205BD6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
          >
            <Icon name="add" className="size-4" />
            <span>Tạo chuyến đi mới</span>
          </Link>
        </div>
      )}

      {/* 12-CARD PAGINATION CONTROLS (UX-COM-01D) */}
      {totalPages > 1 && (
        <nav className="mt-3 flex flex-col items-center justify-between gap-3 border-t border-[#0E1D4F]/10 pt-4 text-center sm:flex-row sm:text-left" aria-label="Phân trang cộng đồng">
          <span className="text-xs text-[#4B5875]">
            Đang xem trang <strong className="text-[#0E1D4F]">{currentPage}</strong> / {totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#0E1D4F]/20 bg-warm-surface px-3 py-2 text-sm font-semibold text-[#0E1D4F] transition-colors hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="arrow_back" className="size-3.5" />
              <span>Trước</span>
            </button>

            <span className="px-3 py-1.5 text-sm font-medium text-[#4B5875]">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#0E1D4F]/20 bg-warm-surface px-3 py-2 text-sm font-semibold text-[#0E1D4F] transition-colors hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Sau</span>
              <Icon name="arrow_forward" className="size-3.5" />
            </button>
          </div>
        </nav>
      )}
    </main>
  );
}

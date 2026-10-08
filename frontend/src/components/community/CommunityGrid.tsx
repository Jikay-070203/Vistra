'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import type { TripCardView } from '@/types/tripCollectionApi';
import CommunityPlanCard from './CommunityPlanCard';

interface CommunityGridProps {
  paginatedPlans: TripCardView[];
  likesState: Record<string, { liked: boolean; count: number }>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onToggleLike: (e: React.MouseEvent, planId: string) => void;
  onClearFilters: () => void;
  pendingLikes: string[];
  pendingClone: string | null;
  onClone: (id: string) => void;
  isFiltered?: boolean;
}

export default function CommunityGrid({
  paginatedPlans,
  likesState,
  currentPage,
  totalPages,
  onPageChange,
  onToggleLike,
  onClearFilters,
  pendingLikes, pendingClone, onClone,
  isFiltered = false,
}: CommunityGridProps) {
  return (
    <main className="lg:col-span-9 flex flex-col gap-6">
      {paginatedPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-8">
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
            className="px-4 py-2 bg-[#205BD6] text-white text-xs font-semibold rounded-xl hover:bg-[#1847a8] transition-colors cursor-pointer"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      ) : (
        <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-8">
          <Icon name="auto_awesome" className="size-10 text-[#205BD6] mb-3 mx-auto" />
          <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold mb-1">
            Hãy tạo dấu ấn riêng của bạn
          </h3>
          <p className="text-xs text-[#4B5875] max-w-sm mx-auto mb-4">
            Chưa có hành trình nào được chia sẻ trong cộng đồng. Hãy là người đầu tiên tạo và chia sẻ hành trình của bạn!
          </p>
          <Link
            href="/create-trip"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#205BD6] text-white text-xs font-semibold rounded-xl hover:bg-[#1847a8] transition-colors shadow-sm"
          >
            <Icon name="add" className="size-4" />
            <span>Tạo chuyến đi mới</span>
          </Link>
        </div>
      )}

      {/* 12-CARD PAGINATION CONTROLS (UX-COM-01D) */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#0E1D4F]/10" aria-label="Phân trang cộng đồng">
          <span className="text-xs text-[#4B5875]">
            Đang xem trang <strong className="text-[#0E1D4F]">{currentPage}</strong> / {totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#0E1D4F]/15 bg-white text-[#0E1D4F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Icon name="arrow_back" className="size-3.5" />
              <span>Trước</span>
            </button>

            <span className="px-3 py-1.5 text-xs text-[#4B5875] font-medium">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#0E1D4F]/15 bg-white text-[#0E1D4F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Sau</span>
              <Icon name="arrow_forward" className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';
import CommunityPlanCard from './CommunityPlanCard';

interface CommunityGridProps {
  paginatedPlans: DemoPlan[];
  likedPlans: Record<string, boolean>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenDetail: (plan: DemoPlan) => void;
  onReusePlan: (e: React.MouseEvent, plan: DemoPlan) => void;
  onToggleLike: (e: React.MouseEvent, planId: string) => void;
  onClearFilters: () => void;
}

export default function CommunityGrid({
  paginatedPlans,
  likedPlans,
  currentPage,
  totalPages,
  onPageChange,
  onOpenDetail,
  onReusePlan,
  onToggleLike,
  onClearFilters,
}: CommunityGridProps) {
  return (
    <main className="lg:col-span-9 flex flex-col gap-6">
      {paginatedPlans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {paginatedPlans.map((plan, index) => (
            <CommunityPlanCard
              key={plan.id}
              plan={plan}
              isLiked={Boolean(likedPlans[plan.id])}
              priority={index < 4}
              onOpenDetail={onOpenDetail}
              onReusePlan={onReusePlan}
              onToggleLike={onToggleLike}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-8">
          <Icon name="travel_explore" className="size-10 text-[#4B5875]/60 mb-3 mx-auto" />
          <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold mb-1">
            Không tìm thấy hành trình cộng đồng phù hợp
          </h3>
          <p className="text-xs text-[#4B5875] max-w-sm mx-auto mb-4">
            Hãy thử nới lỏng các bộ lọc thời lượng hoặc từ khóa để khám phá thêm nhiều cung đường khác.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 bg-[#205BD6] text-white text-xs font-semibold rounded-xl hover:bg-[#1847a8] transition-colors cursor-pointer"
          >
            Xóa tất cả bộ lọc
          </button>
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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#205BD6] text-white shadow-xs'
                    : 'bg-white border border-[#0E1D4F]/15 text-[#0E1D4F] hover:bg-[#EBF1F0]'
                }`}
              >
                {page}
              </button>
            ))}

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

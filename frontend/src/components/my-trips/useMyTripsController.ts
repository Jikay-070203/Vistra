'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useUserAuth } from '@/lib/userAuth';
import { getMyTrips } from '@/services/tripService';
import type { TripCardView } from '@/types/tripCollectionApi';
import type { UnifiedTripCard } from './TripCard';

export const ITEMS_PER_PAGE = 12;
export const BUDGET_MIN_DEFAULT = 1000000;
export const BUDGET_MAX_DEFAULT = 1000000000;
export const BUDGET_STEP = 500000;
export type TripFilterType = 'all' | 'draft' | 'confirmed';

export function useMyTripsController() {
  const { isLoggedIn, isLoaded: isAuthLoaded, user } = useUserAuth();
  const userId = user?.id ?? null;
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [result, setResult] = useState<{ owner: string; page: number; items: TripCardView[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const generation = useRef(0);
  const previousOwner = useRef(userId);

  useEffect(() => {
    if (!isAuthLoaded) return;
    let active = true;
    const request = ++generation.current;
    const ownerChanged = previousOwner.current !== userId;
    previousOwner.current = userId;
    queueMicrotask(() => {
      if (!active || request !== generation.current) return;
      setError(null);
      setLoading(isLoggedIn && !!userId);
      if (!isLoggedIn || ownerChanged) setResult(null);
      if (ownerChanged) setCurrentPage(1);
    });
    if (isLoggedIn && userId && !(ownerChanged && currentPage !== 1)) {
      getMyTrips({ page: currentPage, pageSize: ITEMS_PER_PAGE }).then(response => {
        if (!active || request !== generation.current || !response.data) return;
        const data = response.data;
        const pages = Math.max(1, data.totalPages);
        if (currentPage > pages) { setCurrentPage(pages); return; }
        setResult({ owner: userId, page: currentPage, items: data.items, total: data.total, pages });
      }).catch((cause: unknown) => {
        if (active && request === generation.current) {
          setResult(null);
          setError(cause instanceof Error ? cause.message : 'Không thể tải chuyến đi.');
        }
      }).finally(() => {
        if (active && request === generation.current) setLoading(false);
      });
    }
    return () => { active = false; };
  }, [isAuthLoaded, isLoggedIn, userId, currentPage, reload]);

  const visible = isLoggedIn && result?.owner === userId && result.page === currentPage ? result : null;
  const paginatedPlans: UnifiedTripCard[] = useMemo(() => (visible?.items ?? []).map(item => ({
    id: item.id, title: item.title, destination: item.destination,
    duration: `${item.durationDays} ngày`,
    dates: item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : 'Chưa có ngày',
    budget: item.estimatedCostVnd != null ? `${item.estimatedCostVnd.toLocaleString('vi-VN')} đ`
      : item.budgetMinVnd != null ? `${item.budgetMinVnd.toLocaleString('vi-VN')} đ` : 'Chưa có dữ liệu',
    coverImage: item.coverImageUrl, status: item.status, isPublished: item.isPublished,
  })), [visible]);

  return {
    activeFilter: 'all' as TripFilterType, searchQuery: '', currentPage, setCurrentPage,
    paginatedPlans, counts: { all: visible?.total ?? '—', draft: '—', confirmed: '—' },
    totalPages: visible?.pages ?? 1, totalCount: visible?.total ?? 0,
    isLoadingServerTrips: loading || (isLoggedIn && !visible && !error), serverTripsError: error,
    retryLoadServerTrips: () => setReload(value => value + 1), isLoggedIn, isAuthLoaded,
    sidebarOpen, setSidebarOpen, startDate: '', endDate: '', budgetMin: BUDGET_MIN_DEFAULT,
    budgetMax: BUDGET_MAX_DEFAULT, isBudgetTouched: false, isAnyFilterActive: false,
    dateValidationWarning: null, budgetValidationWarning: null, excludedMissingCount: 0,
    // The collection endpoint supports pagination only; controls remain disabled in server mode.
    handleFilterChange: () => {}, handleSearchChange: () => {}, handleDateChange: () => {},
    handleBudgetChange: () => {}, clearAllFilters: () => setCurrentPage(1),
  };
}

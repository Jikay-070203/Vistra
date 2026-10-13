'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserAuth } from '@/lib/userAuth';
import { getAllMyTrips } from '@/services/tripService';
import type { TripCardView } from '@/types/tripCollectionApi';
import type { UnifiedTripCard } from './TripCard';

export const ITEMS_PER_PAGE = 12;
export const BUDGET_MIN_DEFAULT = 1_000_000;
export const BUDGET_MAX_DEFAULT = 1_000_000_000;
export const BUDGET_STEP = 500_000;
export type TripFilterType = 'all' | 'draft' | 'confirmed';

function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi-VN');
}

function calendarDate(value: string | null): string | null {
  if (!value) return null;
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? null : date;
}

export function useMyTripsController() {
  const { isLoggedIn, isLoaded: isAuthLoaded, user } = useUserAuth();
  const userId = user?.id ?? null;
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TripFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState({ min: BUDGET_MIN_DEFAULT, max: BUDGET_MAX_DEFAULT });
  const [isBudgetTouched, setIsBudgetTouched] = useState(false);
  const [result, setResult] = useState<{ owner: string; items: TripCardView[] } | null>(null);
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
      setLoading(isLoggedIn && Boolean(userId));
      if (ownerChanged) {
        setResult(null);
        setCurrentPage(1);
        setActiveFilter('all');
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setBudget({ min: BUDGET_MIN_DEFAULT, max: BUDGET_MAX_DEFAULT });
        setIsBudgetTouched(false);
      }
      if (!isLoggedIn || !userId) {
        setResult(null);
        setLoading(false);
      }
    });
    if (!isLoggedIn || !userId) {
      return () => { active = false; };
    }

    getAllMyTrips().then(items => {
      if (active && request === generation.current) {
        setResult({ owner: userId, items });
        setCurrentPage(1);
      }
    }).catch((cause: unknown) => {
      if (active && request === generation.current) {
        setResult(null);
        setError(cause instanceof Error ? cause.message : 'Không thể tải chuyến đi.');
      }
    }).finally(() => {
      if (active && request === generation.current) setLoading(false);
    });
    return () => { active = false; };
  }, [isAuthLoaded, isLoggedIn, userId, reload]);

  const visible = isLoggedIn && result?.owner === userId ? result : null;
  const dateValidationWarning = startDate && endDate && startDate > endDate
    ? 'Ngày đi không thể sau ngày về.'
    : null;
  const budgetValidationWarning = isBudgetTouched && (budget.min < BUDGET_MIN_DEFAULT ||
    budget.max > BUDGET_MAX_DEFAULT || budget.min > budget.max)
    ? 'Hãy chọn khoảng ngân sách hợp lệ.'
    : null;

  const filteredCollection = useMemo(() => {
    const items: TripCardView[] = [];
    let excludedMissingCount = 0;
    const query = normalizeSearchText(searchQuery.trim());
    if (!visible || dateValidationWarning || budgetValidationWarning) return { items, excludedMissingCount };

    for (const trip of visible.items) {
      if (query && !normalizeSearchText(`${trip.title} ${trip.destination}`).includes(query)) continue;
      const tripStart = calendarDate(trip.startDate);
      const tripEnd = calendarDate(trip.endDate);
      if (startDate && (!tripStart || tripStart < startDate)) continue;
      if (endDate && (!tripEnd || tripEnd > endDate)) continue;

      if (isBudgetTouched) {
        const estimate = trip.estimatedCostVnd;
        const tripMin = estimate ?? trip.budgetMinVnd;
        const tripMax = estimate ?? trip.budgetMaxVnd;
        if (tripMin == null || tripMax == null) {
          excludedMissingCount += 1;
          continue;
        }
        if (tripMax < budget.min || tripMin > budget.max) continue;
      }
      items.push(trip);
    }
    return { items, excludedMissingCount };
  }, [visible, searchQuery, startDate, endDate, budget, isBudgetTouched, dateValidationWarning, budgetValidationWarning]);

  const counts = useMemo(() => ({
    all: filteredCollection.items.length,
    draft: filteredCollection.items.filter(item => item.status === 'draft').length,
    confirmed: filteredCollection.items.filter(item => item.status === 'confirmed').length,
  }), [filteredCollection.items]);
  const filteredItems = useMemo(() => activeFilter === 'all'
    ? filteredCollection.items
    : filteredCollection.items.filter(item => item.status === activeFilter), [filteredCollection.items, activeFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);

  const paginatedPlans: UnifiedTripCard[] = useMemo(() => filteredItems
    .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    .map(item => ({
      id: item.id, title: item.title, destination: item.destination,
      duration: `${item.durationDays} ngày`,
      dates: item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : 'Chưa có ngày',
      budget: item.estimatedCostVnd != null ? `${item.estimatedCostVnd.toLocaleString('vi-VN')} đ`
        : item.budgetMinVnd != null ? `${item.budgetMinVnd.toLocaleString('vi-VN')} đ` : 'Chưa có dữ liệu',
      coverImage: item.coverImageUrl, status: item.status, isPublished: item.isPublished,
    })), [filteredItems, page]);

  const handleFilterChange = (filter: TripFilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };
  const handleBudgetChange = (min: number, max: number) => {
    setBudget({ min, max });
    setIsBudgetTouched(true);
    setCurrentPage(1);
  };
  const clearAllFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setBudget({ min: BUDGET_MIN_DEFAULT, max: BUDGET_MAX_DEFAULT });
    setIsBudgetTouched(false);
    setCurrentPage(1);
  };

  return {
    activeFilter, searchQuery, currentPage: page, setCurrentPage,
    paginatedPlans, counts, totalPages, totalCount: filteredItems.length,
    hasTrips: Boolean(visible?.items.length),
    isLoadingServerTrips: loading || (isLoggedIn && !visible && !error), serverTripsError: error,
    retryLoadServerTrips: () => setReload(value => value + 1), isLoggedIn, isAuthLoaded,
    sidebarOpen, setSidebarOpen, startDate, endDate, budgetMin: budget.min, budgetMax: budget.max,
    isBudgetTouched, isAnyFilterActive: activeFilter !== 'all' || Boolean(searchQuery.trim() || startDate || endDate || isBudgetTouched),
    dateValidationWarning, budgetValidationWarning, excludedMissingCount: filteredCollection.excludedMissingCount,
    handleFilterChange, handleSearchChange, handleDateChange, handleBudgetChange, clearAllFilters,
  };
}

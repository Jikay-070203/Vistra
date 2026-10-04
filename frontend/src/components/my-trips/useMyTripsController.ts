'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoPlan, DemoPlan } from '@/context/DemoPlanContext';

export const ITEMS_PER_PAGE = 12; // 4 columns x 3 rows grid (UX-MY-01)

export type TripFilterType = 'all' | 'draft' | 'confirmed';

export function useMyTripsController() {
  const router = useRouter();
  const { plans, setActivePlanId } = useDemoPlan();

  const [activeFilter, setActiveFilter] = useState<TripFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Range filters for duration (days) and budget (VND)
  const [durationMin, setDurationMin] = useState<number | ''>('');
  const [durationMax, setDurationMax] = useState<number | ''>('');
  const [budgetMin, setBudgetMin] = useState<number | ''>('');
  const [budgetMax, setBudgetMax] = useState<number | ''>('');

  const isDurationFilterActive = durationMin !== '' || durationMax !== '';
  const isBudgetFilterActive = budgetMin !== '' || budgetMax !== '';
  const isAnyRangeFilterActive = isDurationFilterActive || isBudgetFilterActive;

  const durationValidationWarning =
    durationMin !== '' && durationMax !== '' && Number(durationMin) > Number(durationMax)
      ? 'Thời lượng tối thiểu không được lớn hơn tối đa'
      : null;

  const budgetValidationWarning =
    budgetMin !== '' && budgetMax !== '' && Number(budgetMin) > Number(budgetMax)
      ? 'Ngân sách tối thiểu không được lớn hơn tối đa'
      : null;

  // Filter & Search logic
  const { filteredPlans, excludedMissingCount } = useMemo(() => {
    let excluded = 0;

    const list = plans.filter((plan) => {
      // 1. Status filter
      const matchesFilter = activeFilter === 'all' || plan.status === activeFilter;
      if (!matchesFilter) return false;

      // 2. Search query
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesQuery =
          plan.title.toLowerCase().includes(query) ||
          plan.destination.toLowerCase().includes(query) ||
          plan.origin.toLowerCase().includes(query) ||
          plan.dates.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // 3. Duration range filter
      if (isDurationFilterActive && !durationValidationWarning) {
        const dayMatch = plan.duration ? plan.duration.match(/\d+/) : null;
        if (!dayMatch) {
          excluded++;
          return false;
        }
        const days = parseInt(dayMatch[0], 10);
        if (durationMin !== '' && days < Number(durationMin)) return false;
        if (durationMax !== '' && days > Number(durationMax)) return false;
      }

      // 4. Budget range filter
      if (isBudgetFilterActive && !budgetValidationWarning) {
        const numOnly = plan.budget ? plan.budget.replace(/[^\d]/g, '') : '';
        if (!numOnly) {
          excluded++;
          return false;
        }
        const cost = parseInt(numOnly, 10);
        if (budgetMin !== '' && cost < Number(budgetMin)) return false;
        if (budgetMax !== '' && cost > Number(budgetMax)) return false;
      }

      return true;
    });

    return { filteredPlans: list, excludedMissingCount: excluded };
  }, [
    plans,
    activeFilter,
    searchQuery,
    durationMin,
    durationMax,
    budgetMin,
    budgetMax,
    isDurationFilterActive,
    isBudgetFilterActive,
    durationValidationWarning,
    budgetValidationWarning,
  ]);

  // Derived counts
  const counts = {
    all: plans.length,
    draft: plans.filter((p) => p.status === 'draft').length,
    confirmed: plans.filter((p) => p.status === 'confirmed').length,
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredPlans.length / ITEMS_PER_PAGE);
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlans.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlans, currentPage]);

  const handleFilterChange = (filter: TripFilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleDurationChange = (min: number | '', max: number | '') => {
    setDurationMin(min);
    setDurationMax(max);
    setCurrentPage(1);
  };

  const handleBudgetChange = (min: number | '', max: number | '') => {
    setBudgetMin(min);
    setBudgetMax(max);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
    setDurationMin('');
    setDurationMax('');
    setBudgetMin('');
    setBudgetMax('');
    setCurrentPage(1);
  };

  // Card click behavior based on lifecycle state (for backwards compatibility)
  const handleOpenPlan = (plan: DemoPlan) => {
    setActivePlanId(plan.id);
    if (plan.status === 'draft') {
      router.push(`/planner?id=${encodeURIComponent(plan.id)}`);
    } else {
      router.push(`/trip-plan?id=${encodeURIComponent(plan.id)}`);
    }
  };

  return {
    activeFilter,
    searchQuery,
    currentPage,
    setCurrentPage,
    filteredPlans,
    paginatedPlans,
    counts,
    totalPages,
    durationMin,
    durationMax,
    budgetMin,
    budgetMax,
    isDurationFilterActive,
    isBudgetFilterActive,
    isAnyRangeFilterActive,
    durationValidationWarning,
    budgetValidationWarning,
    excludedMissingCount,
    handleFilterChange,
    handleSearchChange,
    handleDurationChange,
    handleBudgetChange,
    clearAllFilters,
    handleOpenPlan,
  };
}

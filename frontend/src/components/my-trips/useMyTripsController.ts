'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoPlan, DemoPlan } from '@/context/DemoPlanContext';

export const ITEMS_PER_PAGE = 16; // Exact 4 columns x 4 rows requested grid

export type TripFilterType = 'all' | 'draft' | 'confirmed';

export function useMyTripsController() {
  const router = useRouter();
  const { plans, setActivePlanId } = useDemoPlan();

  const [activeFilter, setActiveFilter] = useState<TripFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Search logic
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesFilter =
        activeFilter === 'all' || plan.status === activeFilter;
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        plan.title.toLowerCase().includes(query) ||
        plan.destination.toLowerCase().includes(query) ||
        plan.origin.toLowerCase().includes(query) ||
        plan.dates.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [plans, activeFilter, searchQuery]);

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
    setCurrentPage(1); // Reset safely when filter changes
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset safely when query changes
  };

  // Card click behavior based on lifecycle state
  const handleOpenPlan = (plan: DemoPlan) => {
    setActivePlanId(plan.id);
    if (plan.status === 'draft') {
      router.push(`/create-trip?resumePlanId=${encodeURIComponent(plan.id)}`);
    } else {
      router.push('/trip-plan');
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
    handleFilterChange,
    handleSearchChange,
    handleOpenPlan,
  };
}

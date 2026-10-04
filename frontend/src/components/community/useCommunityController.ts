'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoPlan, DemoPlan } from '@/context/DemoPlanContext';

export const COMMUNITY_CARDS_PER_PAGE = 12; // 4 cols x 3 rows = 12 cards/page (UX-COM-01A)

export function useCommunityController() {
  const router = useRouter();
  const { plans, setActivePlanId, createDraftFromInput } = useDemoPlan();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [budgetMin, setBudgetMin] = useState<number | ''>('');
  const [budgetMax, setBudgetMax] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [likedPlans, setLikedPlans] = useState<Record<string, boolean>>({});

  // Only published plans are shown in community
  const publishedPlans = useMemo(() => {
    return plans.filter((p) => p.isPublished);
  }, [plans]);

  // Extract structured provinces from published plans (UX-COM-01B)
  const allProvinces = useMemo(() => {
    const set = new Set<string>();
    publishedPlans.forEach((p) => {
      if (Array.isArray(p.provinces)) {
        p.provinces.forEach((prov) => {
          if (prov && typeof prov === 'string') {
            set.add(prov.trim());
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [publishedPlans]);

  const isBudgetFilterActive = budgetMin !== '' || budgetMax !== '';
  const budgetValidationWarning =
    budgetMin !== '' && budgetMax !== '' && Number(budgetMin) > Number(budgetMax)
      ? 'Ngân sách tối thiểu không được lớn hơn tối đa'
      : null;

  // Filtering (UX-COM-01B, UX-COM-01C)
  const { filteredPlans, excludedBudgetMissingCount } = useMemo(() => {
    let excludedMissing = 0;

    const list = publishedPlans.filter((plan) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        plan.title.toLowerCase().includes(q) ||
        plan.destination.toLowerCase().includes(q) ||
        plan.origin.toLowerCase().includes(q);

      const matchesDuration =
        selectedDuration === 'all' ||
        plan.duration.toLowerCase().includes(selectedDuration.toLowerCase());

      const matchesTag =
        selectedTag === 'all' ||
        plan.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()));

      // Province filter (matches any province in plan.provinces array)
      const matchesProvince =
        selectedProvince === 'all' ||
        (Array.isArray(plan.provinces) && plan.provinces.includes(selectedProvince));

      // Budget filter
      if (isBudgetFilterActive && !budgetValidationWarning) {
        const numOnly = plan.budget ? plan.budget.replace(/[^\d]/g, '') : '';
        if (!numOnly) {
          excludedMissing++;
          return false;
        }
        const cost = parseInt(numOnly, 10);
        if (budgetMin !== '' && cost < Number(budgetMin)) return false;
        if (budgetMax !== '' && cost > Number(budgetMax)) return false;
      }

      return matchesQuery && matchesDuration && matchesTag && matchesProvince;
    });

    return { filteredPlans: list, excludedBudgetMissingCount: excludedMissing };
  }, [
    publishedPlans,
    searchQuery,
    selectedDuration,
    selectedTag,
    selectedProvince,
    isBudgetFilterActive,
    budgetValidationWarning,
    budgetMin,
    budgetMax,
  ]);

  // Pagination (12 cards per page)
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / COMMUNITY_CARDS_PER_PAGE));
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * COMMUNITY_CARDS_PER_PAGE;
    return filteredPlans.slice(start, start + COMMUNITY_CARDS_PER_PAGE);
  }, [filteredPlans, currentPage]);

  const handleOpenDetail = useCallback(
    (plan: DemoPlan) => {
      setActivePlanId(plan.id);
      router.push(`/trip-plan?id=${encodeURIComponent(plan.id)}`);
    },
    [setActivePlanId, router]
  );

  const handleReusePlan = useCallback(
    (e: React.MouseEvent, plan: DemoPlan) => {
      e.stopPropagation();
      createDraftFromInput({
        origin: plan.origin,
        dates: plan.dates,
        duration: plan.duration,
        travelers: plan.travelers,
        budget: plan.budget,
        narrative: `Tái sử dụng từ hành trình cộng đồng: ${plan.title}`,
        selectedDestination: plan.destination,
        clonedDays: plan.days,
        clonedSources: plan.sources,
        coverImage: plan.coverImage,
      });
      router.push('/planner');
    },
    [createDraftFromInput, router]
  );

  const handleToggleLike = useCallback((e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    setLikedPlans((prev) => ({ ...prev, [planId]: !prev[planId] }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleSelectDuration = useCallback((duration: string) => {
    setSelectedDuration(duration);
    setCurrentPage(1);
  }, []);

  const handleSelectTag = useCallback((tag: string) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  }, []);

  const handleSelectProvince = useCallback((province: string) => {
    setSelectedProvince(province);
    setCurrentPage(1);
  }, []);

  const handleBudgetChange = useCallback((min: number | '', max: number | '') => {
    setBudgetMin(min);
    setBudgetMax(max);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedDuration('all');
    setSelectedTag('all');
    setSelectedProvince('all');
    setBudgetMin('');
    setBudgetMax('');
    setCurrentPage(1);
  }, []);

  return {
    searchQuery,
    onSearchChange: handleSearchChange,
    selectedDuration,
    onSelectDuration: handleSelectDuration,
    selectedTag,
    onSelectTag: handleSelectTag,
    selectedProvince,
    onSelectProvince: handleSelectProvince,
    allProvinces,
    budgetMin,
    budgetMax,
    onBudgetChange: handleBudgetChange,
    budgetValidationWarning,
    excludedBudgetMissingCount,
    isBudgetFilterActive,
    currentPage,
    setCurrentPage,
    likedPlans,
    publishedPlans,
    filteredPlans,
    totalPages,
    paginatedPlans,
    handleOpenDetail,
    handleReusePlan,
    handleToggleLike,
    handleResetFilters,
  };
}

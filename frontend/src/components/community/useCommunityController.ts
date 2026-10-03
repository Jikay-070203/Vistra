'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoPlan, DemoPlan } from '@/context/DemoPlanContext';

export const COMMUNITY_CARDS_PER_PAGE = 24; // Requested 4 cols x 6 rows = 24 cards/page

export function useCommunityController() {
  const router = useRouter();
  const { plans, setActivePlanId, createDraftFromInput } = useDemoPlan();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [likedPlans, setLikedPlans] = useState<Record<string, boolean>>({});

  // Only published plans are shown in community
  const publishedPlans = useMemo(() => {
    return plans.filter((p) => p.isPublished);
  }, [plans]);

  // Filtering
  const filteredPlans = useMemo(() => {
    return publishedPlans.filter((plan) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        plan.title.toLowerCase().includes(q) ||
        plan.destination.toLowerCase().includes(q) ||
        plan.origin.toLowerCase().includes(q);

      const matchesDuration =
        selectedDuration === 'all' ||
        plan.duration.toLowerCase().includes(selectedDuration.toLowerCase());

      const matchesTag =
        selectedTag === 'all' ||
        plan.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()));

      return matchesQuery && matchesDuration && matchesTag;
    });
  }, [publishedPlans, searchQuery, selectedDuration, selectedTag]);

  // Pagination (24 cards per page)
  const totalPages = Math.ceil(filteredPlans.length / COMMUNITY_CARDS_PER_PAGE);
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * COMMUNITY_CARDS_PER_PAGE;
    return filteredPlans.slice(start, start + COMMUNITY_CARDS_PER_PAGE);
  }, [filteredPlans, currentPage]);

  const handleOpenDetail = useCallback((plan: DemoPlan) => {
    setActivePlanId(plan.id);
    router.push('/trip-plan');
  }, [setActivePlanId, router]);

  const handleReusePlan = useCallback((e: React.MouseEvent, plan: DemoPlan) => {
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
  }, [createDraftFromInput, router]);

  const handleToggleLike = useCallback((e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    setLikedPlans((prev) => ({ ...prev, [planId]: !prev[planId] }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedDuration('all');
    setSelectedTag('all');
    setCurrentPage(1);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    selectedDuration,
    setSelectedDuration,
    selectedTag,
    setSelectedTag,
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

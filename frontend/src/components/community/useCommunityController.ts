'use client';

import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/lib/userAuth';
import { getProvinceCatalog } from '@/services/catalogService';
import { getCommunityTrips, setTripLike, cloneCommunityTrip } from '@/services/communityService';
import type { ProvinceCatalogItem } from '@/types/catalogApi';
import type { TripCardView } from '@/types/tripCollectionApi';

export const COMMUNITY_CARDS_PER_PAGE = 9;
export const BUDGET_MIN_DEFAULT = 1000000;
export const BUDGET_MAX_DEFAULT = 1000000000;
export const BUDGET_STEP = 500000;

export function useCommunityController() {
  const params = useSearchParams();
  const router = useRouter();
  const provinceParam = params.get('province') ?? 'all';
  const { isLoggedIn, isLoaded, user } = useUserAuth();
  const viewer = user?.id ?? null;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState(provinceParam);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [budgetMin, setBudgetMin] = useState(BUDGET_MIN_DEFAULT);
  const [budgetMax, setBudgetMax] = useState(BUDGET_MAX_DEFAULT);
  const [isBudgetTouched, setIsBudgetTouched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiProvinces, setApiProvinces] = useState<ProvinceCatalogItem[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [provincesError, setProvincesError] = useState<string | null>(null);
  const [provinceReload, setProvinceReload] = useState(0);
  const [result, setResult] = useState<{ viewer: string | null; items: TripCardView[]; total: number; pages: number } | null>(null);
  const [isLoadingServerCommunity, setLoading] = useState(true);
  const [serverCommunityError, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingLikes, setPendingLikes] = useState<string[]>([]);
  const [pendingClone, setPendingClone] = useState<string | null>(null);
  const cloneBusy = useRef(false);
  const busy = useRef(new Set<string>());
  const [reload, setReload] = useState(0);
  const generation = useRef(0);
  const actionGeneration = useRef(0);
  const previousViewer = useRef(viewer);

  useEffect(() => {
    const actionVersion = ++actionGeneration.current;
    let active = true;
    const changed = previousViewer.current !== viewer;
    previousViewer.current = viewer;
    queueMicrotask(() => {
      if (!active) return;
      busy.current.clear(); setPendingLikes([]); cloneBusy.current = false; setPendingClone(null); setActionError(null);
      if (changed) setCurrentPage(1);
      if (!viewer) setShowOnlyFavorites(false);
    });
    return () => { active = false; actionGeneration.current = actionVersion + 1; };
  }, [viewer]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setIsLoadingProvinces(true); });
    getProvinceCatalog().then(response => {
      if (active) { setApiProvinces(response.data ?? []); setProvincesError(null); }
    }).catch((cause: unknown) => {
      if (active) { setApiProvinces([]); setProvincesError(cause instanceof Error ? cause.message : 'Không thể tải danh mục.'); }
    }).finally(() => { if (active) setIsLoadingProvinces(false); });
    return () => { active = false; };
  }, [provinceReload]);

  const province = apiProvinces.find(item => item.slug === selectedProvince || item.name === selectedProvince);
  const provinceSlug = province?.slug;
  const urlProvinceNotice = selectedProvince !== 'all' && !isLoadingProvinces && !province
    ? `Điểm đến "${selectedProvince}" không có trong danh mục máy chủ. Vui lòng chọn một điểm đến bên dưới.` : null;
  const isBudgetFilterActive = isBudgetTouched && (budgetMin > BUDGET_MIN_DEFAULT || budgetMax < BUDGET_MAX_DEFAULT);
  const budgetValidationWarning = budgetMin > budgetMax ? 'Ngân sách tối thiểu không được lớn hơn tối đa' : null;

  useEffect(() => {
    if (!isLoaded || (selectedProvince !== 'all' && isLoadingProvinces)) return;
    let active = true;
    const request = ++generation.current;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true); setError(null);
    });
    getCommunityTrips({ page: currentPage, pageSize: COMMUNITY_CARDS_PER_PAGE,
      q: searchQuery.trim() || undefined, provinceSlug,
      durationDays: selectedDuration === 'all' ? undefined : Number(selectedDuration),
      tag: selectedTag === 'all' ? undefined : selectedTag,
      likedByMe: showOnlyFavorites ? true : undefined,
      budgetMinVnd: isBudgetFilterActive && !budgetValidationWarning ? budgetMin : undefined,
      budgetMaxVnd: isBudgetFilterActive && !budgetValidationWarning ? budgetMax : undefined,
    }).then(response => {
      if (!active || request !== generation.current || !response.data) return;
      const data = response.data;
      const pages = Math.max(1, data.totalPages);
      if (currentPage > pages) { setCurrentPage(pages); return; }
      setResult({ viewer, items: data.items, total: data.total, pages });
    }).catch((cause: unknown) => {
      if (active && request === generation.current) { setResult(null); setError(cause instanceof Error ? cause.message : 'Không thể tải hành trình.'); }
    }).finally(() => { if (active && request === generation.current) setLoading(false); });
    return () => { active = false; };
  }, [isLoaded, viewer, currentPage, searchQuery, selectedDuration, selectedTag, provinceSlug, selectedProvince,
    isLoadingProvinces, showOnlyFavorites, isBudgetFilterActive, budgetValidationWarning, budgetMin, budgetMax, reload]);

  const visible = result?.viewer === viewer ? result : null;
  const serverTrips = visible?.items ?? [];
  const likesState = Object.fromEntries(serverTrips.map(item => [item.id, { liked: item.likedByMe, count: item.likesCount }]));
  const durationOptions = Array.from(new Set(['1', '2', '3', '4', '5', '7', ...serverTrips.map(item => String(item.durationDays))])).sort((a, b) => Number(a) - Number(b));
  const allProvinces = apiProvinces.map(item => ({ value: item.slug, label: item.name }));

  async function handleToggleLike(event: React.MouseEvent, id: string) {
    event.stopPropagation();
    if (!isLoggedIn) { setActionError('Đăng nhập để thích hành trình.'); return; }
    if (busy.current.has(id)) return;
    const item = serverTrips.find(trip => trip.id === id);
    if (!item) return;
    const request = actionGeneration.current;
    busy.current.add(id); setPendingLikes(Array.from(busy.current)); setActionError(null);
    try {
      const response = await setTripLike(id, !item.likedByMe);
      if (request !== actionGeneration.current || !response.data) return;
      const like = response.data;
      setResult(previous => previous?.viewer === viewer ? { ...previous, items: previous.items.map(trip => trip.id === id ? { ...trip, likedByMe: like.liked, likesCount: like.likesCount } : trip) } : previous);
      ++generation.current;
      setReload(value => value + 1);
    } catch (cause: unknown) {
      if (request === actionGeneration.current) setActionError(cause instanceof Error ? cause.message : 'Không thể cập nhật lượt thích.');
    } finally {
      if (request === actionGeneration.current) { busy.current.delete(id); setPendingLikes(Array.from(busy.current)); }
    }
  }
  function reset() {
    setSearchQuery(''); setSelectedDuration('all'); setSelectedTag('all'); setSelectedProvince('all'); setShowOnlyFavorites(false);
    setBudgetMin(BUDGET_MIN_DEFAULT); setBudgetMax(BUDGET_MAX_DEFAULT); setIsBudgetTouched(false); setCurrentPage(1);
  }
  async function handleClone(id: string) {
    if (!isLoggedIn) { setActionError('Đăng nhập để sao chép hành trình.'); return; }
    if (cloneBusy.current) return;
    const request = actionGeneration.current;
    cloneBusy.current = true; setPendingClone(id); setActionError(null);
    try {
      await cloneCommunityTrip(id);
      if (request === actionGeneration.current) router.push('/my-trips');
    } catch (cause: unknown) {
      if (request === actionGeneration.current) setActionError(cause instanceof Error ? cause.message : 'Không thể sao chép hành trình.');
    } finally {
      if (request === actionGeneration.current) { cloneBusy.current = false; setPendingClone(null); }
    }
  }
  return {
    searchQuery, onSearchChange: (value: string) => { setSearchQuery(value); setCurrentPage(1); },
    selectedDuration, onSelectDuration: (value: string) => { setSelectedDuration(value); setCurrentPage(1); }, durationOptions,
    selectedTag, onSelectTag: (value: string) => { setSelectedTag(value); setCurrentPage(1); },
    selectedProvince: provinceSlug ?? (selectedProvince === 'all' ? 'all' : selectedProvince),
    onSelectProvince: (value: string) => { setSelectedProvince(value); setCurrentPage(1); },
    allProvinces, isLoadingProvinces, provincesError, retryLoadProvinces: () => setProvinceReload(value => value + 1), urlProvinceNotice,
    showOnlyFavorites, onToggleShowOnlyFavorites: () => {
      if (!isLoggedIn) { setActionError('Đăng nhập để xem hành trình đã thích.'); return; }
      setShowOnlyFavorites(value => !value); setCurrentPage(1);
    }, budgetMin, budgetMax, onBudgetChange: (min: number, max: number) => { setBudgetMin(min); setBudgetMax(max); setIsBudgetTouched(true); setCurrentPage(1); },
    isBudgetTouched, budgetValidationWarning, excludedBudgetMissingCount: 0, isBudgetFilterActive,
    currentPage, setCurrentPage, likesState, totalPages: visible?.pages ?? 1, paginatedPlans: serverTrips,
    isLoadingServerCommunity: !isLoaded || isLoadingServerCommunity || (!!result && !visible), serverCommunityError,
    retryLoadCommunity: () => setReload(value => value + 1), totalCount: visible?.total ?? 0,
    handleToggleLike, handleResetFilters: reset, actionError, pendingLikes, handleClone, pendingClone,
  };
}

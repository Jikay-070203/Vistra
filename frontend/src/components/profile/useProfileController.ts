'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProfile, updateProfile } from '@/services/profileService';
import { getMyTrips } from '@/services/tripService';
import { useUserAuth } from '@/lib/userAuth';
import type { TripCardView } from '@/types/tripCollectionApi';

const useIdentityEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type ProfileTabType = 'info' | 'dna' | 'subscription' | 'activity' | 'feedback';

export interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  defaultOrigin: string;
  bio: string;
  preferredPace: string;
  preferredStay: string;
  dietaryPreference: string;
}

const EMPTY_FORM_DATA: ProfileFormData = {
  fullName: '',
  email: '',
  phone: '',
  defaultOrigin: '',
  bio: '',
  preferredPace: '',
  preferredStay: '',
  dietaryPreference: '',
};

export function useProfileController() {
  const searchParams = useSearchParams();
  const { user } = useUserAuth();

  const tabParam = searchParams.get('tab');
  const validUrlTab = (tabParam === 'feedback' || tabParam === 'dna' || tabParam === 'subscription' || tabParam === 'activity' || tabParam === 'info')
    ? (tabParam as ProfileTabType)
    : null;

  const [activeTabOverride, setActiveTabOverride] = useState<ProfileTabType | null>(null);
  const [prevTabParam, setPrevTabParam] = useState<string | null>(tabParam);

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    setActiveTabOverride(null);
  }

  const activeTab: ProfileTabType = activeTabOverride ?? validUrlTab ?? 'info';
  const setActiveTab = (tab: ProfileTabType) => {
    setActiveTabOverride(tab);
  };

  // Normalize absent ID strictly to null to avoid undefined vs null mismatch loops
  const currentUserId = user?.id ?? null;
  const [activeUserId, setActiveUserId] = useState<string | null>(currentUserId);

  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_FORM_DATA);
  const [initialLoadedData, setInitialLoadedData] = useState<ProfileFormData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(currentUserId));
  const [profileReloadTrigger, setProfileReloadTrigger] = useState(0);
  const retryLoadProfile = () => {
    setIsLoading(true);
    setSaveError(null);
    setProfileReloadTrigger((value) => value + 1);
  };

  // Authenticated activity via getMyTrips
  const [serverTrips, setServerTrips] = useState<TripCardView[]>([]);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
  const [activityPage, setActivityPage] = useState<number>(1);
  const [activityPageSize, setActivityPageSize] = useState<number>(5);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(Boolean(currentUserId));
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityReloadTrigger, setActivityReloadTrigger] = useState(0);

  const retryLoadActivity = () => {
    setIsLoadingActivity(true);
    setActivityError(null);
    setActivityReloadTrigger((v) => v + 1);
  };

  const handleActivityPageChange = (nextPage: number) => {
    if (nextPage === activityPage || isLoadingActivity) return;
    setIsLoadingActivity(true);
    setActivityError(null);
    setActivityPage(nextPage);
  };

  // Immediate state normalization when account/identity changes
  if (currentUserId !== activeUserId) {
    setActiveUserId(currentUserId);
    setFormData(EMPTY_FORM_DATA);
    setInitialLoadedData(null);
    setAvatarUrl(null);
    setJoinedAt(null);
    setSaveError(null);
    setSavedSuccess(false);
    setIsSaving(false);
    setIsLoading(Boolean(currentUserId));
    setServerTrips([]);
    setServerTotal(null);
    setServerTotalPages(null);
    setActivityPage(1);
    setActivityPageSize(5);
    setActivityError(null);
    setIsLoadingActivity(Boolean(currentUserId));
  }

  // Generation tracking for async operations; invalidated on identity change and unmount
  const asyncGenRef = useRef(0);
  const liveUserIdRef = useRef<string | null>(currentUserId);

  useIdentityEffect(() => {
    liveUserIdRef.current = currentUserId;
    asyncGenRef.current += 1;
    return () => {
      asyncGenRef.current += 1;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let isMounted = true;
    const opGen = asyncGenRef.current;
    const opUserId = currentUserId;

    async function fetchUserProfile() {
      try {
        const result = await getProfile();
        if (!isMounted || asyncGenRef.current !== opGen || liveUserIdRef.current !== opUserId) {
          return;
        }
        if (result.data) {
          const profile = result.data;
          const loaded: ProfileFormData = {
            fullName: profile.fullName || '',
            email: profile.email || '',
            phone: profile.phone ?? '',
            defaultOrigin: profile.defaultOrigin ?? '',
            bio: profile.bio ?? '',
            preferredPace: profile.preferredPace ?? '',
            preferredStay: profile.preferredStay ?? '',
            dietaryPreference: profile.dietaryPreference ?? '',
          };
          setFormData(loaded);
          setInitialLoadedData(loaded);
          setAvatarUrl(profile.avatarUrl ?? null);
          setJoinedAt(profile.joinedAt ?? null);
          setSaveError(null);
          setSavedSuccess(false);
        }
      } catch (err: unknown) {
        if (!isMounted || asyncGenRef.current !== opGen || liveUserIdRef.current !== opUserId) {
          return;
        }
        setSaveError(err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ từ máy chủ.');
      } finally {
        if (isMounted && asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
          setIsLoading(false);
        }
      }
    }

    fetchUserProfile();
    return () => {
      isMounted = false;
    };
  }, [currentUserId, profileReloadTrigger]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !initialLoadedData || !currentUserId || activeUserId !== currentUserId) {
      return;
    }

    // Diff against initialLoadedData to only send fields modified by the user
    const patchPayload: Record<string, string | null> = {};
    if (formData.fullName.trim() !== initialLoadedData.fullName) {
      patchPayload.fullName = formData.fullName.trim();
    }
    if (formData.email.trim() !== initialLoadedData.email) {
      patchPayload.email = formData.email.trim();
    }
    if ((formData.phone.trim() || null) !== (initialLoadedData.phone || null)) {
      patchPayload.phone = formData.phone.trim() || null;
    }
    if ((formData.defaultOrigin.trim() || null) !== (initialLoadedData.defaultOrigin || null)) {
      patchPayload.defaultOrigin = formData.defaultOrigin.trim() || null;
    }
    if ((formData.bio.trim() || null) !== (initialLoadedData.bio || null)) {
      patchPayload.bio = formData.bio.trim() || null;
    }
    if ((formData.preferredPace || null) !== (initialLoadedData.preferredPace || null)) {
      patchPayload.preferredPace = formData.preferredPace || null;
    }
    if ((formData.preferredStay || null) !== (initialLoadedData.preferredStay || null)) {
      patchPayload.preferredStay = formData.preferredStay || null;
    }
    if ((formData.dietaryPreference || null) !== (initialLoadedData.dietaryPreference || null)) {
      patchPayload.dietaryPreference = formData.dietaryPreference || null;
    }

    if (Object.keys(patchPayload).length === 0) {
      setSaveError('Chưa có thay đổi để lưu.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const opGen = asyncGenRef.current;
    const opUserId = currentUserId;

    try {
      const result = await updateProfile(patchPayload);

      if (asyncGenRef.current !== opGen || liveUserIdRef.current !== opUserId) {
        return;
      }

      if (result.data) {
        const updated = result.data.profile;
        // Nullable pace/stay/dietary return null => empty, not old draft
        const nextData: ProfileFormData = {
          fullName: updated.fullName,
          email: updated.email,
          phone: updated.phone ?? '',
          defaultOrigin: updated.defaultOrigin ?? '',
          bio: updated.bio ?? '',
          preferredPace: updated.preferredPace ?? '',
          preferredStay: updated.preferredStay ?? '',
          dietaryPreference: updated.dietaryPreference ?? '',
        };
        setFormData(nextData);
        setInitialLoadedData(nextData);
        setAvatarUrl(updated.avatarUrl ?? null);
        setJoinedAt(updated.joinedAt ?? null);
        setSavedSuccess(true);
        setTimeout(() => {
          if (asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
            setSavedSuccess(false);
          }
        }, 3500);
      }
    } catch (error) {
      if (asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
        const msg = error instanceof Error ? error.message : 'Lỗi cập nhật hồ sơ.';
        setSaveError(msg);
      }
    } finally {
      if (asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let isMounted = true;
    const opGen = asyncGenRef.current;
    const opUserId = currentUserId;

    const ACTIVITY_PAGE_SIZE = 5;

    getMyTrips({ page: activityPage, pageSize: ACTIVITY_PAGE_SIZE })
      .then((res) => {
        if (!isMounted || asyncGenRef.current !== opGen || liveUserIdRef.current !== opUserId) {
          return;
        }
        if (res.data) {
          setServerTrips(res.data.items);
          setServerTotal(res.data.total);
          setServerTotalPages(res.data.totalPages);
          setActivityPage(res.data.page);
          setActivityPageSize(res.data.pageSize);
          setActivityError(null);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted || asyncGenRef.current !== opGen || liveUserIdRef.current !== opUserId) {
          return;
        }
        setServerTrips([]);
        // Failed activity GET totals must remain null/unavailable, not 0/1 presented as API total
        setServerTotal(null);
        setServerTotalPages(null);
        setActivityError(err instanceof Error ? err.message : 'Không thể tải nhật ký hành trình từ máy chủ.');
      })
      .finally(() => {
        if (isMounted && asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
          setIsLoadingActivity(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserId, activityPage, activityReloadTrigger]);

  const isLoggedIn = Boolean(currentUserId);
  const totalPlansCount: number | string = isLoggedIn
    ? (serverTotal !== null ? serverTotal : (isLoadingActivity ? '...' : '—'))
    : '—';
  // Unknown confirmed/published aggregates for authenticated user: show unavailable ('—') rather than zero or fixture counts
  const confirmedPlansCount = '—';
  const publishedPlansCount = '—';

  return {
    isLoggedIn,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    avatarUrl,
    joinedAt,
    savedSuccess,
    setSavedSuccess,
    saveError,
    isSaving,
    isLoading,
    retryLoadProfile,
    hasLoadedProfile: initialLoadedData !== null,
    handleSave,
    totalPlansCount,
    confirmedPlansCount,
    publishedPlansCount,
    serverTrips,
    serverTotal,
    serverTotalPages,
    activityPage,
    activityPageSize,
    setActivityPage: handleActivityPageChange,
    handleActivityPageChange,
    isLoadingActivity,
    activityError,
    retryLoadActivity,
  };
}

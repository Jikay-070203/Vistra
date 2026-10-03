'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDemoPlan } from '@/context/DemoPlanContext';

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

export function useProfileController() {
  const { plans } = useDemoPlan();
  const searchParams = useSearchParams();

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

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: 'Vũ Song Toàn',
    email: 'toan.vu@vistra-travel.vn',
    phone: '0912 345 678',
    defaultOrigin: 'Hà Nội, Việt Nam',
    bio: 'Nhiếp ảnh gia phong cảnh bán chuyên & du khách yêu thích các cung đường núi non Tây Bắc, Đà Lạt tĩnh lặng.',
    preferredPace: 'Thư thái (1–2 điểm/ngày)',
    preferredStay: 'Boutique Villa & Homestay bản địa',
    dietaryPreference: 'Thưởng thức đặc sản vùng miền địa phương',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const confirmedPlansCount = plans.filter((p) => p.status === 'confirmed').length;
  const publishedPlansCount = plans.filter((p) => p.isPublished).length;

  return {
    plans,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    savedSuccess,
    setSavedSuccess,
    handleSave,
    confirmedPlansCount,
    publishedPlansCount,
  };
}

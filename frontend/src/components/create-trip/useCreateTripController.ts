'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/lib/userAuth';
import { createTrip } from '@/services/tripService';
import { getProvinceCatalog } from '@/services/catalogService';
import type { PlanPace } from '@/types/planApi';
import type { CreatedTripView } from '@/types/tripCreateApi';
import { DEFAULT_BUDGET_MIN } from '@/components/shared/BudgetRangeField';
import type { MoodPhoto, TravelDnaState } from './types';

const INITIAL_DNA: TravelDnaState = {
  exploration: 50,
  natureCulture: 50,
  pace: 50,
  cuisine: 50,
  budget: 50,
};

const DEFAULT_SAMPLE_PHOTOS: MoodPhoto[] = [
  {
    id: 'sample-1',
    url: '/landing/hero-inspiration.jpg',
    caption: 'Hồ sương sớm & rừng thông Đà Lạt',
    tags: ['Bình yên', 'Thiên nhiên'],
  },
  {
    id: 'sample-2',
    url: '/landing/final-journey.jpg',
    caption: 'Cung đường đèo mây & hoàng hôn',
    tags: ['Cảnh quan', 'Phiêu lưu'],
  },
];

export function useCreateTripController() {
  const router = useRouter();
  const { user, isLoggedIn, isLoaded } = useUserAuth();
  const preferredProvince = useSearchParams().get('province');
  const accountId = isLoggedIn ? user?.id ?? null : null;
  const accountRef = useRef<string | null>(accountId);

  useLayoutEffect(() => {
    accountRef.current = accountId;
    return () => { accountRef.current = null; };
  }, [accountId]);

  // Auth Guard: Auto-redirect anonymous users to login
  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      router.replace('/login?next=/create-trip');
    }
  }, [isLoaded, isLoggedIn, router]);

  const submittingRef = useRef(false);
  const [catalog, setCatalog] = useState<Array<{ id: number; slug: string; name: string }>>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // Form core fields (accepted by backend API)
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState({ min: DEFAULT_BUDGET_MIN, max: DEFAULT_BUDGET_MIN });
  const [people, setPeople] = useState(1);
  const [pace, setPace] = useState<PlanPace>('normal');

  // Extended fields (stored locally on client; clearly marked pending backend API support)
  const [notes, setNotes] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<number>(3); // 1-5 default 3 (Vừa phải)
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [photos, setPhotos] = useState<MoodPhoto[]>(DEFAULT_SAMPLE_PHOTOS);
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<MoodPhoto | null>(null);
  const [travelDna, setTravelDna] = useState<TravelDnaState>(INITIAL_DNA);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ accountId: string; message: string } | null>(null);
  const [created, setCreated] = useState<(CreatedTripView & { accountId: string }) | null>(null);

  useEffect(() => {
    let active = true;
    getProvinceCatalog().then(({ data: items }) => {
      if (!active) return;
      setCatalog(items);
      setCatalogError(null);
      if (preferredProvince) {
        const match = items.find(item => item.slug === preferredProvince || item.name === preferredProvince);
        if (match) setDestination(match.slug);
      }
    }).catch((cause: unknown) => {
      if (active) setCatalogError(cause instanceof Error ? cause.message : 'Không thể tải danh mục tỉnh.');
    }).finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [reload, preferredProvince]);

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(item => item !== allergy) : [...prev, allergy]
    );
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const addCustomPhoto = (photo: MoodPhoto) => {
    setPhotos(prev => [...prev, photo]);
  };

  const resetTravelDna = () => {
    setTravelDna(INITIAL_DNA);
  };

  const submit = async () => {
    if (submittingRef.current || !accountRef.current) return;
    const days = (Date.parse(endDate) - Date.parse(startDate)) / 86400000 + 1;
    if (!catalog.some(item => item.slug === destination) || !startDate || !endDate ||
        !Number.isInteger(days) || days < 1 || !Number.isInteger(people) || people < 1 || people > 50) {
      setError({ accountId: accountRef.current, message: 'Chọn tỉnh, ngày đi/ngày về hợp lệ và số người từ 1 đến 50.' });
      return;
    }
    const currentAccId = accountRef.current;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      // ONLY send parameters defined in tripCreateApi schema (no unsupported fields sent to backend)
      const result = await createTrip({
        destination,
        start_date: startDate,
        days,
        people,
        budget_vnd: budget.max,
        budget_scope: 'total',
        transport: 'car',
        pace,
      });
      if (accountRef.current === currentAccId) setCreated({ ...result.data, accountId: currentAccId });
    } catch (cause: unknown) {
      if (accountRef.current === currentAccId) setError({ accountId: currentAccId, message: cause instanceof Error ? cause.message : 'Không thể tạo chuyến đi.' });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    isLoggedIn,
    isLoaded,
    catalog,
    catalogLoading,
    catalogError,
    retryCatalog: () => { setCatalogLoading(true); setCatalogError(null); setReload(value => value + 1); },
    destination,
    setDestination,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    budget,
    setBudget,
    people,
    setPeople,
    pace,
    setPace,
    notes,
    setNotes,
    fitnessLevel,
    setFitnessLevel,
    selectedAllergies,
    toggleAllergy,
    photos,
    addCustomPhoto,
    removePhoto,
    selectedPhotoForModal,
    setSelectedPhotoForModal,
    travelDna,
    setTravelDna,
    resetTravelDna,
    isSubmitting,
    error: error?.accountId === accountId ? error.message : null,
    created: created?.accountId === accountId ? created : null,
    submit,
  };
}

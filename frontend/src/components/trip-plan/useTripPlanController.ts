'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDemoPlan, DemoPlan } from '@/context/DemoPlanContext';

export function useTripPlanController() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('id');

  const {
    getActivePlan,
    getPlanById,
    isLoaded,
    confirmPlan,
    publishPlan,
    unpublishPlan,
    setActivePlanId,
  } = useDemoPlan();

  const [expandedDays, setExpandedDays] = useState<number[]>([1, 2]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize plan from query parameter or active plan (FIX-06)
  const activePlan: DemoPlan | undefined = useMemo(() => {
    if (requestedId) {
      return getPlanById(requestedId);
    }
    return getActivePlan();
  }, [requestedId, getPlanById, getActivePlan]);

  const isNotFound = isLoaded && Boolean(requestedId) && !activePlan;

  useEffect(() => {
    if (activePlan && activePlan.id !== getActivePlan().id) {
      setActivePlanId(activePlan.id);
    }
  }, [activePlan, setActivePlanId, getActivePlan]);

  const isConfirmed = activePlan?.status === 'confirmed';

  const toggleDay = (dayNum: number) => {
    if (expandedDays.includes(dayNum)) {
      setExpandedDays(expandedDays.filter((d) => d !== dayNum));
    } else {
      setExpandedDays([...expandedDays, dayNum]);
    }
  };

  const expandAll = () => {
    if (activePlan) {
      setExpandedDays(activePlan.days.map((d) => d.dayNumber));
    }
  };

  const collapseAll = () => setExpandedDays([]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setToastMessage('Đã sao chép liên kết chia sẻ hành trình vào khay nhớ tạm!');
    }
  };

  const handleExportPdf = () => {
    setToastMessage('Đang mở hộp thoại xuất file in / PDF trình duyệt...');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 400);
  };

  const handleConfirmNow = () => {
    if (activePlan) {
      confirmPlan(activePlan.id);
      setToastMessage('Đã chuyển bản nháp thành Kế hoạch chính thức!');
    }
  };

  const handleTogglePublish = () => {
    if (!activePlan) return;
    if (activePlan.isPublished) {
      unpublishPlan(activePlan.id);
      setToastMessage('Đã hủy xuất bản hành trình khỏi Cộng đồng.');
    } else {
      publishPlan(activePlan.id);
      setToastMessage('Đã xuất bản thành công hành trình lên Khám phá cộng đồng!');
    }
  };

  return {
    activePlan: activePlan || getActivePlan(),
    isLoaded,
    isNotFound,
    isConfirmed,
    expandedDays,
    toastMessage,
    setToastMessage,
    toggleDay,
    expandAll,
    collapseAll,
    handlePrint,
    handleShare,
    handleExportPdf,
    handleConfirmNow,
    handleTogglePublish,
  };
}

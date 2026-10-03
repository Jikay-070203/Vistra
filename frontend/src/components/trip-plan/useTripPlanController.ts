'use client';

import { useState } from 'react';
import { useDemoPlan, DemoPlan } from '@/context/DemoPlanContext';

export function useTripPlanController() {
  const { getActivePlan, confirmPlan, publishPlan, unpublishPlan } = useDemoPlan();
  const activePlan: DemoPlan = getActivePlan();

  const [expandedDays, setExpandedDays] = useState<number[]>([1, 2]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isConfirmed = activePlan.status === 'confirmed';

  const toggleDay = (dayNum: number) => {
    if (expandedDays.includes(dayNum)) {
      setExpandedDays(expandedDays.filter((d) => d !== dayNum));
    } else {
      setExpandedDays([...expandedDays, dayNum]);
    }
  };

  const expandAll = () => setExpandedDays(activePlan.days.map((d) => d.dayNumber));
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
    confirmPlan(activePlan.id);
    setToastMessage('Đã chuyển bản nháp thành Kế hoạch chính thức!');
  };

  const handleTogglePublish = () => {
    if (activePlan.isPublished) {
      unpublishPlan(activePlan.id);
      setToastMessage('Đã hủy xuất bản hành trình khỏi Cộng đồng.');
    } else {
      publishPlan(activePlan.id);
      setToastMessage('Đã xuất bản thành công hành trình lên Khám phá cộng đồng!');
    }
  };

  return {
    activePlan,
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

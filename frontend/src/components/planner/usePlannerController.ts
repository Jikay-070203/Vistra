'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDemoPlan, DemoPlan } from '@/context/DemoPlanContext';
import { DayItinerary } from '@/data/mockData';

export function usePlannerController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('id');

  const {
    getActivePlan,
    getPlanById,
    isLoaded,
    addChatMessage,
    confirmPlan,
    setActivePlanId,
  } = useDemoPlan();

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

  const currentPlan = activePlan || getActivePlan();

  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(2);
  const [inputText, setInputText] = useState('');
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [isOpenMobileMap, setIsOpenMobileMap] = useState(false);
  const [isCollapsedDesktopMap, setIsCollapsedDesktopMap] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'itinerary'>('chat');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mobileMapTriggerRef = useRef<HTMLButtonElement>(null);
  const sourcesTriggerRef = useRef<HTMLButtonElement>(null);

  const currentDay: DayItinerary =
    currentPlan.days.find((d) => d.dayNumber === selectedDayNumber) || currentPlan.days[0];

  // FIX-01 & UX-PL-02: Scroll internal chat container, never window
  const prevMsgCountRef = useRef(currentPlan.chatMessages.length);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNewMessage = currentPlan.chatMessages.length > prevMsgCountRef.current;
    prevMsgCountRef.current = currentPlan.chatMessages.length;

    if (isNewMessage) {
      // Check if user was near bottom (within 150px)
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom <= 150) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        setHasNewMessages(false);
      } else {
        // User was looking up at older messages
        setHasNewMessages(true);
      }
    }
  }, [currentPlan.chatMessages]);

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      setHasNewMessages(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    addChatMessage(currentPlan.id, inputText.trim());
    setInputText('');
    setToastMessage('Đã gửi tin nhắn & cập nhật bản nháp hành trình!');

    // Always scroll internal container to bottom on user send
    setTimeout(() => {
      scrollToBottom();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConfirmPlan = () => {
    confirmPlan(currentPlan.id);
    setConfirmModalOpen(false);
    setToastMessage('Đã xác nhận chốt kế hoạch chính thức và lưu vào Chuyến đi của tôi!');
    setTimeout(() => {
      router.push(`/trip-plan?id=${encodeURIComponent(currentPlan.id)}`);
    }, 400);
  };

  return {
    activePlan: currentPlan,
    isLoaded,
    isNotFound,
    currentDay,
    selectedDayNumber,
    setSelectedDayNumber,
    inputText,
    setInputText,
    sourcesModalOpen,
    setSourcesModalOpen,
    isOpenMobileMap,
    setIsOpenMobileMap,
    isCollapsedDesktopMap,
    setIsCollapsedDesktopMap,
    mobileTab,
    setMobileTab,
    toastMessage,
    setToastMessage,
    confirmModalOpen,
    setConfirmModalOpen,
    hasNewMessages,
    scrollToBottom,
    chatContainerRef,
    mobileMapTriggerRef,
    sourcesTriggerRef,
    handleSendMessage,
    handleKeyDown,
    handleConfirmPlan,
  };
}

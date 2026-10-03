'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoPlan } from '@/context/DemoPlanContext';
import { DayItinerary } from '@/data/mockData';

export function usePlannerController() {
  const router = useRouter();
  const { getActivePlan, addChatMessage, confirmPlan } = useDemoPlan();
  const activePlan = getActivePlan();

  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(2);
  const [inputText, setInputText] = useState('');
  const [showSources, setShowSources] = useState(true);
  const [mobileTab, setMobileTab] = useState<'chat' | 'itinerary' | 'sources'>('chat');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentDay: DayItinerary =
    activePlan.days.find((d) => d.dayNumber === selectedDayNumber) || activePlan.days[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activePlan.chatMessages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    addChatMessage(activePlan.id, inputText.trim());
    setInputText('');
    setToastMessage('Đã gửi tin nhắn & cập nhật bản nháp hành trình!');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConfirmPlan = () => {
    confirmPlan(activePlan.id);
    setConfirmModalOpen(false);
    setToastMessage('Đã xác nhận chốt kế hoạch chính thức và lưu vào Chuyến đi của tôi!');
    setTimeout(() => {
      router.push('/my-trips');
    }, 400);
  };

  return {
    activePlan,
    currentDay,
    selectedDayNumber,
    setSelectedDayNumber,
    inputText,
    setInputText,
    showSources,
    setShowSources,
    mobileTab,
    setMobileTab,
    toastMessage,
    setToastMessage,
    confirmModalOpen,
    setConfirmModalOpen,
    messagesEndRef,
    handleSendMessage,
    handleKeyDown,
    handleConfirmPlan,
  };
}

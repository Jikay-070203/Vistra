'use client';

import React from 'react';
import Link from 'next/link';
import Toast from '@/components/shared/Toast';
import Icon from '@/components/ui/Icon';
import { usePlannerController } from './usePlannerController';
import PlannerCommandBar from './PlannerCommandBar';
import ChatPanel from './ChatPanel';
import ItineraryPanel from './ItineraryPanel';
import GeographicMapPanel from './GeographicMapPanel';
import SourcesModal from './SourcesModal';
import ConfirmPlanDialog from './ConfirmPlanDialog';

export default function PlannerScreen() {
  const {
    activePlan,
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
  } = usePlannerController();

  if (!isLoaded) {
    return (
      <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-24 text-center">
        <div className="inline-block size-8 border-3 border-[#205BD6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#4B5875] mt-3">Đang mở bàn làm việc kiến tạo...</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="max-w-[720px] mx-auto w-full px-4 py-24 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EBF1F0] flex items-center justify-center text-[#4B5875] mb-4 shadow-xs">
          <Icon name="search_off" className="size-8" />
        </div>
        <h1 className="font-headline-lg text-2xl font-bold text-[#0E1D4F] mb-2">
          Không tìm thấy chuyến đi
        </h1>
        <p className="text-sm text-[#4B5875] mb-6 max-w-md">
          Mã hành trình được yêu cầu không tồn tại trong kho lưu trữ hoặc đã bị xóa.
        </p>
        <Link
          href="/my-trips"
          className="px-5 py-2.5 bg-[#205BD6] text-white text-sm font-semibold rounded-xl hover:bg-[#1847a8] transition-colors shadow-xs"
        >
          Quay lại Chuyến đi của tôi
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-76px)]">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Workspace Command Bar */}
      <PlannerCommandBar
        activePlan={activePlan}
        onOpenSourcesModal={() => setSourcesModalOpen(true)}
        onOpenMobileMap={() => setIsOpenMobileMap(true)}
        onOpenConfirmModal={() => setConfirmModalOpen(true)}
        sourcesTriggerRef={sourcesTriggerRef}
        mobileMapTriggerRef={mobileMapTriggerRef}
      />

      {/* Workspace Layout */}
      <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex-1 flex flex-col">
        {/* Mobile / Tablet View Switcher Tab Bar (< 1024px) */}
        <div className="lg:hidden flex items-center p-1 bg-white/80 backdrop-blur-md rounded-xl border border-[#0E1D4F]/10 mb-4 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'chat'
                ? 'bg-[#205BD6] text-white shadow-xs'
                : 'text-[#4B5875] hover:text-[#0E1D4F]'
            }`}
          >
            <Icon name="chat" className="size-3.5" />
            <span>Hội thoại ({activePlan.chatMessages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('itinerary')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'itinerary'
                ? 'bg-[#205BD6] text-white shadow-xs'
                : 'text-[#4B5875] hover:text-[#0E1D4F]'
            }`}
          >
            <Icon name="calendar_today" className="size-3.5" />
            <span>Lịch trình ({activePlan.days.length} ngày)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* PANEL 1: Chat Panel (5 columns) */}
          <ChatPanel
            activePlan={activePlan}
            mobileTab={mobileTab}
            inputText={inputText}
            onInputChange={setInputText}
            onKeyDown={handleKeyDown}
            onSendMessage={handleSendMessage}
            chatContainerRef={chatContainerRef}
            hasNewMessages={hasNewMessages}
            onScrollToBottom={scrollToBottom}
          />

          {/* PANEL 2: Itinerary Panel (4 columns when map open, 7 columns when collapsed) */}
          <ItineraryPanel
            activePlan={activePlan}
            currentDay={currentDay}
            selectedDayNumber={selectedDayNumber}
            onSelectDayNumber={setSelectedDayNumber}
            isCollapsedDesktopMap={isCollapsedDesktopMap}
            mobileTab={mobileTab}
          />

          {/* PANEL 3: Geographic Map Panel (3 columns or collapsed, plus Mobile overlay) */}
          <GeographicMapPanel
            activePlan={activePlan}
            currentDay={currentDay}
            selectedDayNumber={selectedDayNumber}
            isOpenMobile={isOpenMobileMap}
            onCloseMobile={() => setIsOpenMobileMap(false)}
            mobileTriggerRef={mobileMapTriggerRef}
            isCollapsedDesktop={isCollapsedDesktopMap}
            onToggleCollapseDesktop={() => setIsCollapsedDesktopMap(!isCollapsedDesktopMap)}
          />
        </div>
      </div>

      {/* SOURCES MODAL (UX-PL-01C) */}
      <SourcesModal
        isOpen={sourcesModalOpen}
        activePlan={activePlan}
        onClose={() => setSourcesModalOpen(false)}
        triggerRef={sourcesTriggerRef}
      />

      {/* CONFIRM PLAN MODAL */}
      <ConfirmPlanDialog
        isOpen={confirmModalOpen}
        activePlan={activePlan}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmPlan}
      />
    </div>
  );
}

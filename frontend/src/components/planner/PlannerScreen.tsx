'use client';

import React from 'react';
import Toast from '@/components/shared/Toast';
import Icon from '@/components/ui/Icon';
import { usePlannerController } from './usePlannerController';
import PlannerCommandBar from './PlannerCommandBar';
import ChatPanel from './ChatPanel';
import ItineraryPanel from './ItineraryPanel';
import SourcesPanel from './SourcesPanel';
import ConfirmPlanDialog from './ConfirmPlanDialog';

export default function PlannerScreen() {
  const {
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
  } = usePlannerController();

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-76px)]">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Workspace Command Bar */}
      <PlannerCommandBar
        activePlan={activePlan}
        showSources={showSources}
        onToggleSources={() => setShowSources(!showSources)}
        onOpenConfirmModal={() => setConfirmModalOpen(true)}
      />

      {/* 3-Panel Desktop Workspace Layout (1920x1080 / Responsive multi-device) */}
      <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex-1 flex flex-col">
        {/* Mobile / Tablet View Switcher Tab Bar (< 1024px) */}
        <div className="lg:hidden flex items-center p-1 bg-white/80 backdrop-blur-md rounded-xl border border-[#0E1D4F]/10 mb-4 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'chat'
                ? 'bg-[#205BD6] text-white shadow-xs'
                : 'text-[#4B5875] hover:text-[#0E1D4F]'
            }`}
          >
            <Icon name="chat" className="size-3.5" />
            <span>Hội thoại</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('itinerary')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'itinerary'
                ? 'bg-[#205BD6] text-white shadow-xs'
                : 'text-[#4B5875] hover:text-[#0E1D4F]'
            }`}
          >
            <Icon name="calendar_today" className="size-3.5" />
            <span>Lịch trình</span>
          </button>
          {showSources && (
            <button
              type="button"
              onClick={() => setMobileTab('sources')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'sources'
                  ? 'bg-[#205BD6] text-white shadow-xs'
                  : 'text-[#4B5875] hover:text-[#0E1D4F]'
              }`}
            >
              <Icon name="menu_book" className="size-3.5" />
              <span>Nguồn</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* PANEL 1: Chat Panel */}
          <ChatPanel
            activePlan={activePlan}
            showSources={showSources}
            mobileTab={mobileTab}
            inputText={inputText}
            onInputChange={setInputText}
            onKeyDown={handleKeyDown}
            onSendMessage={handleSendMessage}
            messagesEndRef={messagesEndRef}
          />

          {/* PANEL 2: Itinerary Panel */}
          <ItineraryPanel
            activePlan={activePlan}
            currentDay={currentDay}
            selectedDayNumber={selectedDayNumber}
            onSelectDayNumber={setSelectedDayNumber}
            showSources={showSources}
            mobileTab={mobileTab}
          />

          {/* PANEL 3: Sources Panel (Collapsible) */}
          {showSources && (
            <SourcesPanel
              activePlan={activePlan}
              mobileTab={mobileTab}
              onCloseSources={() => setShowSources(false)}
            />
          )}
        </div>
      </div>

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

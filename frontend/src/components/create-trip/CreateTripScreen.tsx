'use client';

import React from 'react';
import Toast from '@/components/shared/Toast';
import { useCreateTripController } from './useCreateTripController';
import MoodboardSection from './MoodboardSection';
import TripRequestSection from './TripRequestSection';
import TripConstraintsSection from './TripConstraintsSection';
import TravelDnaSidebar from './TravelDnaSidebar';

export default function CreateTripScreen() {
  const {
    existingPlan,
    photos,
    narrative,
    setNarrative,
    pace,
    setPace,
    toastMessage,
    setToastMessage,
    startCity,
    setStartCity,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    adultsCount,
    setAdultsCount,
    elderlyCount,
    setElderlyCount,
    childrenCount,
    setChildrenCount,
    dietaryNote,
    setDietaryNote,
    mobilityNote,
    setMobilityNote,
    handleAddPhoto,
    handleRemovePhoto,
    handleStartPlanning,
  } = useCreateTripController();

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Editorial Header */}
      <div className="pb-8 mb-8 border-b border-[#0E1D4F]/10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#205BD6]"></span>
            <span className="font-label-caps text-xs text-[#205BD6] uppercase tracking-widest font-bold">
              01 / NGUỒN CẢM HỨNG ĐA PHƯƠNG THỨC
            </span>
          </div>
          {existingPlan && (
            <span className="px-3 py-1 rounded-full bg-[#205BD6]/10 text-[#205BD6] font-label-caps text-xs font-bold border border-[#205BD6]/30">
              Đang tiếp tục bản nháp: {existingPlan.title}
            </span>
          )}
        </div>
        <h1 className="font-headline-lg text-2xl sm:text-4xl text-[#0E1D4F] tracking-tight font-bold">
          {existingPlan ? 'Tiếp tục chỉnh sửa bản nháp hành trình' : 'Tạo chuyến đi & Giải mã DNA Du lịch'}
        </h1>
        <p className="font-body-md text-sm sm:text-base text-[#4B5875] mt-2 max-w-3xl leading-relaxed">
          {existingPlan
            ? `Bản nháp được lưu từ ${existingPlan.lastUpdated}. Bạn có thể tinh chỉnh các thông số ràng buộc trước khi quay lại không gian hội thoại kiến tạo.`
            : 'Tải lên ảnh moodboard, lựa chọn bối cảnh phong cảnh hoặc mô tả bằng lời văn tự nhiên. Visual Agent của VISTRA sẽ giải mã gu thẩm mỹ và tính toán sự hòa hợp với các ràng buộc thực địa.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Moodboard (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <MoodboardSection
            photos={photos}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
          />

          <TripRequestSection
            narrative={narrative}
            onNarrativeChange={setNarrative}
          />

          <TripConstraintsSection
            startCity={startCity}
            onStartCityChange={setStartCity}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            budgetMin={budgetMin}
            onBudgetMinChange={setBudgetMin}
            budgetMax={budgetMax}
            onBudgetMaxChange={setBudgetMax}
            adultsCount={adultsCount}
            onAdultsCountChange={setAdultsCount}
            elderlyCount={elderlyCount}
            onElderlyCountChange={setElderlyCount}
            childrenCount={childrenCount}
            onChildrenCountChange={setChildrenCount}
            dietaryNote={dietaryNote}
            onDietaryNoteChange={setDietaryNote}
            mobilityNote={mobilityNote}
            onMobilityNoteChange={setMobilityNote}
            pace={pace}
            onPaceChange={setPace}
          />
        </div>

        {/* Right Column: Sticky Interactive TRAVEL DNA Component (4 Cols) */}
        <TravelDnaSidebar
          existingPlan={existingPlan}
          photoCount={photos.length}
          onStartPlanning={handleStartPlanning}
        />
      </div>
    </div>
  );
}

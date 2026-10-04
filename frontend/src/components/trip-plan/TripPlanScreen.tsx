'use client';

import React from 'react';
import Link from 'next/link';
import Toast from '@/components/shared/Toast';
import Icon from '@/components/ui/Icon';
import { useTripPlanController } from './useTripPlanController';
import DayAccordion from './DayAccordion';
import CostSummary from './CostSummary';
import { getPlanDisplayCode } from '@/lib/planUtils';

export default function TripPlanScreen() {
  const {
    activePlan,
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
    handleConfirmNow,
    handleTogglePublish,
  } = useTripPlanController();

  if (!isLoaded) {
    return (
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-20 text-center">
        <div className="inline-block size-8 border-3 border-[#205BD6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#4B5875] mt-3">Đang đồng bộ hồ sơ hành trình...</p>
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
    <div className="flex flex-col w-full pb-20 print-page">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Action Control Bar (Hidden on print) */}
      <section className="bg-white/90 backdrop-blur-md border-b border-[#0E1D4F]/10 py-3.5 px-4 sm:px-6 lg:px-12 sticky top-[76px] z-30 shadow-2xs no-print">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/my-trips"
            className="inline-flex items-center gap-2 text-xs font-label-lg font-semibold text-[#0E1D4F] hover:text-[#205BD6] transition-colors"
          >
            <Icon name="arrow_back" className="size-4" />
            <span>Về danh mục Chuyến đi của tôi</span>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Publish / Unpublish button (only if confirmed) */}
            {isConfirmed && (
              <button
                type="button"
                onClick={handleTogglePublish}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  activePlan.isPublished
                    ? 'bg-[#08B3C6]/15 border-[#08B3C6]/30 text-[#08B3C6]'
                    : 'bg-white border-[#0E1D4F]/15 text-[#0E1D4F] hover:bg-[#EBF1F0]'
                }`}
                title="Đăng hành trình này lên cộng đồng khám phá"
              >
                <Icon name={activePlan.isPublished ? 'public' : 'public_off'} className="size-4 text-[#08B3C6]" />
                <span>{activePlan.isPublished ? 'Đã xuất bản Cộng đồng' : 'Xuất bản lên Cộng đồng'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] text-white font-label-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Mở hộp thoại in hoặc Lưu dưới dạng PDF qua trình duyệt"
            >
              <Icon name="print" className="size-4" />
              <span>In / Lưu PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EBF1F0] hover:bg-white text-[#0E1D4F] font-label-lg text-xs font-semibold transition-colors border border-[#0E1D4F]/10 cursor-pointer"
            >
              <Icon name="share" className="size-4 text-[#205BD6]" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Document Container */}
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8">
        {/* Banner if opened as unconfirmed draft */}
        {!isConfirmed && (
          <div className="mb-6 p-4 rounded-2xl bg-[#E7AD2E]/15 border border-[#E7AD2E]/30 text-xs text-[#0E1D4F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Icon name="warning" className="size-5 text-[#E7AD2E] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-sm">Hành trình này hiện đang ở trạng thái BẢN NHÁP</strong>
                <span className="text-[#4B5875]">Bạn có thể xem trước nội dung tài liệu, thảo luận thêm tại Bàn làm việc hoặc bấm xác nhận chốt chính thức.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/planner"
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#0E1D4F]/15 font-semibold text-xs text-[#0E1D4F] hover:bg-[#EBF1F0]"
              >
                Về Bàn làm việc
              </Link>
              <button
                type="button"
                onClick={handleConfirmNow}
                className="px-4 py-1.5 rounded-xl bg-[#205BD6] text-white font-semibold text-xs hover:bg-[#1847a8] shadow-xs cursor-pointer"
              >
                Chốt phương án này
              </button>
            </div>
          </div>
        )}

        {/* Editorial Hero Banner */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-6 sm:p-10 mb-8 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {isConfirmed ? (
                <span className="px-3 py-1 rounded-md bg-[#205BD6] text-white text-xs font-label-caps font-bold tracking-wider flex items-center gap-1 shadow-2xs">
                  <Icon name="verified" className="size-3.5" />
                  <span>TÀI LIỆU HÀNH TRÌNH CHÍNH THỨC</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-md bg-[#0E1D4F] text-white text-xs font-label-caps font-bold tracking-wider shadow-2xs">
                  BẢN XEM TRƯỚC HÀNH TRÌNH (DRAFT PREVIEW)
                </span>
              )}
              <span className="text-xs text-[#4B5875] bg-[#EBF1F0] px-2.5 py-0.5 rounded-md font-mono">
                Mã hồ sơ: {getPlanDisplayCode(activePlan.id)}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0E1D4F] tracking-tight leading-tight">
              {activePlan.title}
            </h1>

            <p className="font-body-md text-sm sm:text-base text-[#4B5875] leading-relaxed">
              Hành trình {activePlan.duration} được định hình theo phong cách Serene Editorial Voyage. Kết hợp nhịp điệu tĩnh lặng của cảnh quan bản địa và các điểm dừng tối ưu theo giờ.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-label-md text-[#4B5875] border-t border-[#0E1D4F]/10">
              <span className="flex items-center gap-1.5">
                <Icon name="near_me" className="size-4 text-[#205BD6]" />
                <span>Xuất phát: <strong>{activePlan.origin}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="calendar_today" className="size-4 text-[#08B3C6]" />
                <span>{activePlan.dates}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="group" className="size-4 text-[#08B3C6]" />
                <span>{activePlan.travelers}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="payments" className="size-4 text-[#205BD6]" />
                <span>Ngân sách: <strong>{activePlan.budget}</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <DayAccordion
            days={activePlan.days}
            expandedDays={expandedDays}
            onToggleDay={toggleDay}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />

          <CostSummary activePlan={activePlan} />
        </div>
      </div>
    </div>
  );
}

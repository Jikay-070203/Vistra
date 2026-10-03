'use client';

import React from 'react';
import { appConfig } from '@/config/appConfig';

export default function AdminKpiSummary() {
  return (
    <>
      {/* Top Breadcrumb & Tag */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#205BD6]"></span>
        <span className="font-label-caps text-xs text-[#205BD6] uppercase tracking-widest font-bold">
          QUẢN TRỊ HỆ THỐNG &amp; ĐÁNH GIÁ CHẤT LƯỢNG MÔ HÌNH AI
        </span>
      </div>

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#0E1D4F]/10 mb-8">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl text-[#0E1D4F] tracking-tight font-bold">
            Trung tâm Giám sát AI &amp; Vận hành Thử nghiệm
          </h1>
          <p className="font-body-md text-sm sm:text-base text-[#4B5875] mt-2">
            Theo dõi sức khỏe các agent điều phối, độ trễ vi khí hậu RAG, chỉ số đánh giá LLM-as-a-Judge và nhật ký thực thi lịch trình.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ thống Thử nghiệm: Sẵn sàng
          </span>
        </div>
      </div>

      {/* Prominent Demo & Telemetry Notice Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-[#0E1D4F] mb-8">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-bold text-sm text-[#0E1D4F] mb-1">
              Thông báo Minh bạch Bản quyền &amp; Giới hạn Demo Telemetry
            </h4>
            <p className="text-xs text-[#4B5875] leading-relaxed">
              Các bản ghi trace log, chỉ số độ trễ, điểm đánh giá LLM-as-a-Judge và số liệu vận hành hiển thị tại trang này là{' '}
              <strong>dữ liệu fixture mẫu chuẩn hóa</strong> được cấu hình tại <code>src/config/appConfig.ts</code> phục vụ kiểm thử giao diện và đánh giá kiến trúc. Hệ thống không kết nối với cụm máy chủ sản xuất thực tế hay thu thập dữ liệu nhạy cảm của người dùng.
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
          <span className="text-xs font-bold text-[#4B5875] uppercase tracking-wider block mb-2">
            Người dùng trải nghiệm
          </span>
          <div className="text-3xl font-bold text-[#0E1D4F]">1.240</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <span>↑ 18%</span>
            <span className="text-[#4B5875] font-normal">so với tuần trước</span>
          </div>
          <span className="text-[11px] text-[#4B5875]/80 block mt-3 pt-2 border-t border-[#0E1D4F]/5">
            Dữ liệu mô phỏng demo
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
          <span className="text-xs font-bold text-[#4B5875] uppercase tracking-wider block mb-2">
            Tỷ lệ khớp ý định thực tế
          </span>
          <div className="text-3xl font-bold text-[#205BD6]">
            {appConfig.hero.planAcceptanceRate.value}
          </div>
          <div className="text-xs text-[#4B5875] mt-2">
            {appConfig.hero.planAcceptanceRate.subtext}
          </div>
          <span className="text-[11px] text-[#4B5875]/80 block mt-3 pt-2 border-t border-[#0E1D4F]/5">
            {appConfig.hero.planAcceptanceRate.mockNotice}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
          <span className="text-xs font-bold text-[#4B5875] uppercase tracking-wider block mb-2">
            Tối ưu thời gian lập kế hoạch
          </span>
          <div className="text-3xl font-bold text-[#08B3C6]">
            {appConfig.hero.planningTimeOptimization.value}
          </div>
          <div className="text-xs text-[#4B5875] mt-2">
            {appConfig.hero.planningTimeOptimization.subtext}
          </div>
          <span className="text-[11px] text-[#4B5875]/80 block mt-3 pt-2 border-t border-[#0E1D4F]/5">
            {appConfig.hero.planningTimeOptimization.mockNotice}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
          <span className="text-xs font-bold text-[#4B5875] uppercase tracking-wider block mb-2">
            Độ trễ điều phối AI (P95)
          </span>
          <div className="text-3xl font-bold text-[#0E1D4F]">1.42s</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">
            ✓ Trong ngưỡng SLA &lt; 2.0s
          </div>
          <span className="text-[11px] text-[#4B5875]/80 block mt-3 pt-2 border-t border-[#0E1D4F]/5">
            RAG vi khí hậu &amp; giải ràng buộc
          </span>
        </div>
      </div>
    </>
  );
}

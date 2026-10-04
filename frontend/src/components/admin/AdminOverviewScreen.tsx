'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';
import { MOCK_TRACE_LOGS, LATENCY_SPIKE_THRESHOLD_MS } from './traceFixtures';

export default function AdminOverviewScreen() {
  const { tickets } = useFeedback();

  const unassignedCount = tickets.filter((t) => t.status === 'unassigned').length;
  const ratedTickets = tickets.filter((t) => t.userAnswerRating !== undefined);
  const avgRating =
    ratedTickets.length > 0
      ? (
          ratedTickets.reduce((acc, t) => acc + (t.userAnswerRating || 0), 0) /
          ratedTickets.length
        ).toFixed(1)
      : null;

  // 12-Month Plan Creation & Confirmation Distribution (ADM-OV-02)
  const monthlyData = [
    { month: '11/25', created: 380, confirmed: 240 },
    { month: '12/25', created: 490, confirmed: 350 },
    { month: '01/26', created: 620, confirmed: 430 },
    { month: '02/26', created: 580, confirmed: 410 },
    { month: '03/26', created: 640, confirmed: 470 },
    { month: '04/26', created: 780, confirmed: 590 },
    { month: '05/26', created: 820, confirmed: 610 },
    { month: '06/26', created: 910, confirmed: 720 },
    { month: '07/26', created: 960, confirmed: 750 },
    { month: '08/26', created: 890, confirmed: 680 },
    { month: '09/26', created: 940, confirmed: 730 },
    { month: '10/26*', created: 1120, confirmed: 860, isCurrent: true, isPeak: true },
  ];

  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.created, d.confirmed)));

  // Top 4 recent trace logs for preview (ADM-OV-03)
  const recentTraces = MOCK_TRACE_LOGS.slice(0, 4);

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Top Banner (ADM-OV-01A: No action buttons in title section; sidebar handles navigation) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
            BẢNG ĐIỀU HÀNH TỔNG QUAN
          </span>
        </div>
        <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
          Tổng quan Vận hành &amp; Tương tác Du khách
        </h1>
        <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-3xl leading-relaxed">
          Theo dõi tổng người dùng, diễn biến kế hoạch tạo và xác nhận 12 tháng, doanh thu ước tính, cảnh báo hòm thư phản hồi và chất lượng truy vấn AI.
        </p>
      </div>

      {/* 5 Prominent KPI Cards (ADM-OV-01B, AD-OV-01C) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* KPI 1: Users */}
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#4B5875]">Tổng người dùng</span>
              <div className="w-8 h-8 rounded-xl bg-[#205BD6]/10 text-[#205BD6] flex items-center justify-center">
                <Icon name="group" className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0E1D4F]">2,840</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <Icon name="trending_up" className="size-3.5" />
              <span>+18.4% tháng này</span>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#0E1D4F]/5 text-[11px] text-[#4B5875] flex justify-between">
            <span>Đang hoạt động:</span>
            <strong className="text-[#0E1D4F]">2,385 (84%)</strong>
          </div>
        </div>

        {/* KPI 2: Peak Creation Month (ADM-OV-01B: Correct business definition) */}
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#4B5875]">Đỉnh tạo kế hoạch</span>
              <div className="w-8 h-8 rounded-xl bg-[#08B3C6]/10 text-[#08B3C6] flex items-center justify-center">
                <Icon name="calendar_month" className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0E1D4F]">1,120</div>
            <div className="text-xs text-[#205BD6] font-bold mt-1 flex items-center gap-1">
              <Icon name="bolt" className="size-3.5" />
              <span>Tháng 10/2026 (Đỉnh mùa)</span>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#0E1D4F]/5 text-[11px] text-[#4B5875] flex justify-between">
            <span>Đã chốt xác nhận:</span>
            <strong className="text-[#0E1D4F]">860 kế hoạch</strong>
          </div>
        </div>

        {/* KPI 3: Estimated Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#4B5875]">Doanh thu ước tính (Th10/26)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Icon name="payments" className="size-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#0E1D4F]">248.5 tr ₫</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <Icon name="trending_up" className="size-3.5" />
              <span>+24.2% MoM</span>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#0E1D4F]/5 text-[11px] text-[#4B5875] flex justify-between">
            <span>MRR định kỳ:</span>
            <strong className="text-[#0E1D4F]">42.6 tr ₫</strong>
          </div>
        </div>

        {/* KPI 4: Feedback (ADM-OV-01C: Warning state with icon and text when unassigned > 0) */}
        <div
          className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition-all ${
            unassignedCount > 0
              ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/50'
              : 'bg-white border-[#0E1D4F]/10'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#4B5875]">Hòm thư phản hồi</span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  unassignedCount > 0
                    ? 'bg-amber-500 text-white animate-bounce'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                <Icon name={unassignedCount > 0 ? 'warning' : 'rate_review'} className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0E1D4F]">{tickets.length}</div>
            <div className="text-xs font-semibold mt-1 flex items-center gap-1">
              {unassignedCount > 0 ? (
                <span className="text-amber-700 flex items-center gap-1 font-bold">
                  <Icon name="priority_high" className="size-3.5" />
                  <span>Cảnh báo: {unassignedCount} phiếu chưa phân loại!</span>
                </span>
              ) : (
                <span className="text-emerald-600">Đã phân loại toàn bộ</span>
              )}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#0E1D4F]/5 text-[11px] text-[#4B5875] flex justify-between">
            <span>Đánh giá từ khách:</span>
            {avgRating ? (
              <strong className="text-amber-600">★ {avgRating}/5.0 ({ratedTickets.length})</strong>
            ) : (
              <span className="text-[#4B5875]/70 italic">Chưa có đánh giá</span>
            )}
          </div>
        </div>

        {/* KPI 5: System Health */}
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#4B5875]">Sức khỏe hệ thống AI</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Icon name="memory" className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">99.8%</div>
            <div className="flex items-center gap-1.5 text-xs text-[#4B5875] font-medium mt-1">
              <span>Độ trễ TB: 1.42s</span>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#0E1D4F]/5 text-[11px] text-[#4B5875] flex justify-between">
            <span>LLM-as-a-Judge:</span>
            <strong className="text-[#205BD6]">4.85 / 5.0</strong>
          </div>
        </div>
      </div>

      {/* 2-Column Section: 12-Month Dual Chart & Trace Logs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 12-Month Plan Creation & Confirmation Chart (7 cols) (ADM-OV-02, FIX-02) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0E1D4F]/10 pb-4">
            <div>
              <h3 className="font-headline-sm text-base sm:text-lg text-[#0E1D4F] font-bold">
                Diễn biến Lập Kế hoạch &amp; Xác nhận (12 Tháng Gần Nhất)
              </h3>
              <p className="text-xs text-[#4B5875] mt-0.5">
                So sánh số kế hoạch được tạo (Created) và số kế hoạch đã chốt (Confirmed) theo tháng.
              </p>
            </div>
            <div className="px-3 py-1 bg-[#205BD6]/10 text-[#205BD6] text-xs rounded-xl font-semibold flex items-center gap-1 self-start sm:self-auto">
              <Icon name="trending_up" className="size-3.5" />
              <span>Đỉnh: Tháng 10/2026 (1,120 plan)</span>
            </div>
          </div>

          {/* 12-Month Dual Bar Visualizer (FIX-02: explicit height, clear bars) */}
          <div className="pt-4">
            <div className="h-56 flex items-end justify-between gap-1 sm:gap-2 px-2" aria-label="Biểu đồ 12 tháng">
              {monthlyData.map((d, i) => {
                const createdHeightPercent = Math.max(8, Math.round((d.created / maxVal) * 100));
                const confirmedHeightPercent = Math.max(6, Math.round((d.confirmed / maxVal) * 100));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 px-2.5 py-1.5 rounded-xl bg-[#0E1D4F] text-white text-[10px] whitespace-nowrap pointer-events-none z-20 shadow-md flex flex-col gap-0.5">
                      <strong className="text-amber-300">Tháng {d.month}</strong>
                      <span>Tạo: {d.created} kế hoạch</span>
                      <span>Chốt: {d.confirmed} kế hoạch</span>
                    </div>

                    {/* Dual Bars Side-by-Side */}
                    <div className="w-full flex items-end justify-center gap-0.5 h-44">
                      {/* Created bar */}
                      <div
                        className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                          d.isPeak
                            ? 'bg-[#205BD6]'
                            : 'bg-[#205BD6]/70 group-hover:bg-[#205BD6]'
                        }`}
                        style={{ height: `${createdHeightPercent}%` }}
                      ></div>
                      {/* Confirmed bar */}
                      <div
                        className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                          d.isPeak
                            ? 'bg-[#08B3C6]'
                            : 'bg-[#08B3C6]/70 group-hover:bg-[#08B3C6]'
                        }`}
                        style={{ height: `${confirmedHeightPercent}%` }}
                      ></div>
                    </div>

                    <span className={`text-[9px] sm:text-[10px] font-mono ${d.isCurrent ? 'font-bold text-[#205BD6]' : 'text-[#4B5875]'}`}>
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#0E1D4F]/10 flex flex-wrap items-center justify-between text-xs text-[#4B5875] gap-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#205BD6]"></span>
                <span className="font-semibold text-[#0E1D4F]">Kế hoạch được tạo (Created)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#08B3C6]"></span>
                <span className="font-semibold text-[#0E1D4F]">Đã chốt xác nhận (Confirmed)</span>
              </span>
            </div>
            <span className="text-[11px] text-[#4B5875] italic">* Dữ liệu tháng 10/2026 tính đến thời điểm hiện tại</span>
          </div>
        </div>

        {/* Right: Trace Logs Review Preview (5 cols) (ADM-OV-03) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0E1D4F]/10 pb-4">
            <div>
              <h3 className="font-headline-sm text-base sm:text-lg text-[#0E1D4F] font-bold flex items-center gap-2">
                <Icon name="dns" className="size-4 text-[#205BD6]" />
                <span>Nhật ký Trace AI Mới nhất</span>
              </h3>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Giám sát thực thi mô hình và cảnh báo độ trễ vi khí hậu RAG
              </p>
            </div>
            <Link
              href="/admin/system"
              className="text-xs font-semibold text-[#205BD6] hover:underline flex items-center gap-0.5"
            >
              <span>Xem tất cả</span>
              <Icon name="arrow_forward" className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTraces.map((trace) => {
              const isLatencySpike = trace.latencyMs > LATENCY_SPIKE_THRESHOLD_MS;

              return (
                <Link
                  key={trace.id}
                  href={`/admin/system?traceId=${trace.id}`}
                  className="block p-3.5 rounded-2xl border border-[#0E1D4F]/10 hover:border-[#205BD6] hover:bg-[#205BD6]/5 transition-all text-xs space-y-1.5 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0E1D4F] group-hover:text-[#205BD6]">
                      {trace.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLatencySpike || trace.status === 'LATENCY_SPIKE'
                            ? 'bg-red-100 text-red-700'
                            : trace.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isLatencySpike ? 'ĐỘ TRỄ CAO' : trace.status}
                      </span>
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          isLatencySpike ? 'text-red-600' : 'text-[#4B5875]'
                        }`}
                      >
                        {trace.latencyMs} ms
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#4B5875]">
                    <span className="font-medium text-[#0E1D4F]">{trace.traceType}</span>
                    <span>{trace.timestamp}</span>
                  </div>

                  <p className="text-[11px] text-[#4B5875] line-clamp-1 group-hover:text-[#0E1D4F]">
                    {trace.context}
                  </p>
                </Link>
              );
            })}
          </div>

          <Link
            href="/admin/system"
            className="w-full py-2.5 bg-[#EBF1F0] hover:bg-white border border-[#0E1D4F]/10 text-[#0E1D4F] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Icon name="terminal" className="size-4 text-[#205BD6]" />
            <span>Mở trang Quản trị Hệ thống &amp; Trace Logs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

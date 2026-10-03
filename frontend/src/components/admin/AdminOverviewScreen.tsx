'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';

export default function AdminOverviewScreen() {
  const { tickets } = useFeedback();

  const unassignedCount = tickets.filter((t) => t.status === 'unassigned').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const answeredCount = tickets.filter((t) => t.status === 'answered' || t.status === 'resolved').length;

  const ratedTickets = tickets.filter((t) => t.userAnswerRating !== undefined);
  const avgRating =
    ratedTickets.length > 0
      ? (ratedTickets.reduce((acc, t) => acc + (t.userAnswerRating || 0), 0) / ratedTickets.length).toFixed(1)
      : '4.8';

  // 24-Hour hourly plan creation distribution data (hours 0 to 23)
  const hourlyData = [
    { hour: '0h', count: 8 },
    { hour: '2h', count: 3 },
    { hour: '4h', count: 2 },
    { hour: '6h', count: 14 },
    { hour: '8h', count: 48 },
    { hour: '10h', count: 86 },
    { hour: '12h', count: 62 },
    { hour: '14h', count: 95 },
    { hour: '16h', count: 110 },
    { hour: '18h', count: 82 },
    { hour: '20h', count: 142, isPeak: true },
    { hour: '21h', count: 138, isPeak: true },
    { hour: '22h', count: 98 },
    { hour: '23h', count: 35 },
  ];

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              BẢNG ĐIỀU HÀNH TỔNG QUAN · KHU VỰC THỬ NGHIỆM SANDBOX
            </span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Tổng quan Vận hành &amp; Tương tác Du khách
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-2xl leading-relaxed">
            Giám sát toàn diện người dùng, tần suất tạo hành trình du lịch, chỉ số doanh thu và luồng xử lý thắc mắc của khách du lịch trên nền tảng VISTRA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/feedback"
            className="px-4 py-2.5 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-2"
          >
            <Icon name="mail" className="size-4" />
            <span>Xử lý hòm thư phản hồi</span>
            {unassignedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-[#0E1D4F] font-bold text-[10px]">
                {unassignedCount} mới
              </span>
            )}
          </Link>
          <Link
            href="/admin/system"
            className="px-4 py-2.5 rounded-xl bg-white border border-[#0E1D4F]/15 hover:bg-[#EBF1F0] text-[#0E1D4F] text-xs font-semibold transition-all flex items-center gap-2"
          >
            <Icon name="dns" className="size-4 text-[#205BD6]" />
            <span>Kiểm thử Hạ tầng AI</span>
          </Link>
        </div>
      </div>

      {/* 5 Prominent KPI Cards */}
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

        {/* KPI 2: Peak Creation Time */}
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#4B5875]">Kế hoạch &amp; Giờ cao điểm</span>
              <div className="w-8 h-8 rounded-xl bg-[#08B3C6]/10 text-[#08B3C6] flex items-center justify-center">
                <Icon name="schedule" className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0E1D4F]">8,420</div>
            <div className="text-xs text-[#205BD6] font-bold mt-1 flex items-center gap-1">
              <Icon name="bolt" className="size-3.5" />
              <span>Cao điểm: 20:00 – 22:00</span>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#0E1D4F]/5 text-[11px] text-[#4B5875] flex justify-between">
            <span>Tốc độ đỉnh:</span>
            <strong className="text-[#0E1D4F]">142 lịch trình/giờ</strong>
          </div>
        </div>

        {/* KPI 3: Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#4B5875]">Doanh thu ước tính</span>
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

        {/* KPI 4: Feedback Tickets */}
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#4B5875]">Hòm thư phản hồi</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Icon name="rate_review" className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0E1D4F]">{tickets.length}</div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mt-1">
              <span>{unassignedCount} chờ phân loại</span>
              <span>·</span>
              <span>{inProgressCount} đang xử lý</span>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#0E1D4F]/5 text-[11px] text-[#4B5875] flex justify-between">
            <span>Hài lòng câu trả lời:</span>
            <strong className="text-amber-500">★ {avgRating}/5.0</strong>
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

      {/* 2-Column Section: 24h Hourly Distribution & Recent Feedback Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 24h Hourly Distribution Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0E1D4F]/10 pb-4">
            <div>
              <h3 className="font-headline-sm text-base sm:text-lg text-[#0E1D4F] font-bold">
                Phân bố Lưu lượng Lập Kế hoạch theo Giờ (24 Giờ)
              </h3>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Xác định khung giờ người dùng tương tác với AI nhiều nhất trong ngày.
              </p>
            </div>
            <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-semibold flex items-center gap-1 self-start sm:self-auto">
              <Icon name="access_time" className="size-3.5 text-amber-600" />
              <span>Đỉnh điểm: 20:00 – 22:00 (142 lượt/h)</span>
            </div>
          </div>

          {/* Hourly Bar Visualizer */}
          <div className="pt-4">
            <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 px-2">
              {hourlyData.map((d, i) => {
                const heightPercent = Math.max(8, Math.round((d.count / 142) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded bg-[#0E1D4F] text-white text-[10px] whitespace-nowrap pointer-events-none z-10">
                      {d.count} kế hoạch ({d.hour})
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        d.isPeak
                          ? 'bg-gradient-to-t from-[#205BD6] to-[#08B3C6] shadow-sm'
                          : 'bg-[#EBF1F0] group-hover:bg-[#205BD6]/40'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                    <span className="text-[10px] text-[#4B5875] font-mono">{d.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#0E1D4F]/10 flex flex-wrap items-center justify-between text-xs text-[#4B5875]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#205BD6] to-[#08B3C6]"></span>
                <span className="font-semibold text-[#0E1D4F]">Khung giờ cao điểm (20:00 - 22:00)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EBF1F0]"></span>
                <span>Khung giờ bình thường</span>
              </span>
            </div>
            <span className="text-[11px] text-[#4B5875]">Dữ liệu tổng hợp từ 8,420 phiên làm việc</span>
          </div>
        </div>

        {/* Right: Feedback Queue Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0E1D4F]/10 pb-4">
            <div>
              <h3 className="font-headline-sm text-base sm:text-lg text-[#0E1D4F] font-bold">
                Ý kiến Phản hồi Gần đây
              </h3>
              <p className="text-xs text-[#4B5875] mt-0.5">
                {unassignedCount} phiếu mới chờ xử lý · {answeredCount} đã phản hồi
              </p>
            </div>
            <Link
              href="/admin/feedback"
              className="text-xs font-semibold text-[#205BD6] hover:underline flex items-center gap-0.5"
            >
              <span>Xem tất cả</span>
              <Icon name="arrow_forward" className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {tickets.slice(0, 3).map((ticket) => (
              <div
                key={ticket.id}
                className="p-3.5 rounded-2xl border border-[#0E1D4F]/10 hover:border-[#205BD6]/30 bg-[#EBF1F0]/20 transition-all text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0E1D4F]">{ticket.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ticket.status === 'unassigned'
                        ? 'bg-amber-100 text-amber-800'
                        : ticket.status === 'in_progress'
                        ? 'bg-blue-100 text-[#205BD6]'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {ticket.status === 'unassigned'
                      ? 'Chưa phân loại'
                      : ticket.status === 'in_progress'
                      ? 'Đang xử lý'
                      : 'Đã trả lời'}
                  </span>
                </div>
                <h4 className="font-bold text-[#0E1D4F] line-clamp-1">{ticket.subject}</h4>
                <p className="text-[#4B5875] line-clamp-1">{ticket.description}</p>
                <div className="flex items-center justify-between text-[11px] text-[#4B5875] pt-1">
                  <span>{ticket.userName}</span>
                  <span>{ticket.createdAt}</span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/admin/feedback"
            className="w-full py-2.5 bg-[#EBF1F0] hover:bg-white border border-[#0E1D4F]/10 text-[#0E1D4F] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Icon name="support_agent" className="size-4 text-[#205BD6]" />
            <span>Chuyển tới Hòm thư Hỗ trợ &amp; Trả lời</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFeedback } from '@/context/FeedbackContext';
import { useUserAuth } from '@/lib/userAuth';
import { getTraces } from '@/services/systemService';
import type { TraceListItemView } from '@/types/adminSystemApi';
import AdminKpiSummary from './AdminKpiSummary';
import MockBadge from './demo/MockBadge';
import { ADMIN_MOCK_PLAN_TRENDS, ADMIN_MOCK_PLAN_STATUS_DISTRIBUTION } from './demo/adminDemoData';
import Icon from '@/components/ui/Icon';

export default function AdminOverviewScreen() {
  const { counts } = useFeedback();
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  const [snapshot, setSnapshot] = useState<{ accountId: string; traces: TraceListItemView[]; error: string | null } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!accountId) return;
    let active = true;
    getTraces({ page: 1, pageSize: 4 }).then(result => {
      if (active) setSnapshot({ accountId, traces: result.data.items, error: null });
    }).catch((cause: unknown) => {
      if (active) setSnapshot({ accountId, traces: [], error: cause instanceof Error ? cause.message : 'Không thể tải trace.' });
    });
    return () => { active = false; };
  }, [accountId, reload]);

  const current = snapshot?.accountId === accountId ? snapshot : null;

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      <header className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm">
        <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
          Tổng quan Vận hành &amp; Tương tác Du khách
        </h1>
      </header>

      <AdminKpiSummary />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          ['Tổng số phản hồi', counts?.total],
          ['Phản hồi chưa phân loại', counts?.unassigned],
        ].map(([label, value]) => (
          <Link
            key={String(label)}
            href="/admin/feedback"
            className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm text-[#0E1D4F] hover:border-[#205BD6]/40 transition-colors"
          >
            <h2 className="text-sm font-semibold">{label}</h2>
            <p className="text-2xl font-bold mt-3">{value == null ? 'Chưa có dữ liệu' : value}</p>
          </Link>
        ))}
      </div>

      {/* VST-ADMIN-01: Plan Trends & User Distribution Mock Visuals */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#0E1D4F]/10">
          <div>
            <h2 className="text-xl font-bold text-[#0E1D4F]">Xu hướng Kế hoạch &amp; Phân bố Trạng thái</h2>
            <p className="text-xs sm:text-sm text-[#4B5875] mt-1">
              Thống kê lượng kế hoạch khởi tạo, tỷ lệ chốt hành trình và cơ cấu phân loại trong hệ thống.
            </p>
          </div>
          <MockBadge />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Trend Bar Chart Visualization (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0E1D4F] flex items-center gap-2">
                <Icon name="trending_up" className="size-4 text-[#205BD6]" />
                <span>Số lượng kế hoạch theo tháng (T05/2026 – T10/2026)</span>
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#4B5875]">
                  <span className="size-2.5 rounded-full bg-[#205BD6]" />
                  <span>Khởi tạo</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#4B5875]">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span>Đã chốt</span>
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {ADMIN_MOCK_PLAN_TRENDS.map((item) => (
                <div key={item.month} className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#0E1D4F] font-semibold">
                    <span>{item.month}</span>
                    <span className="text-[#4B5875] font-normal">
                      {item.confirmed}/{item.created} kế hoạch ({Math.round((item.confirmed / item.created) * 100)}%)
                    </span>
                  </div>
                  <div className="h-4 w-full bg-[#EBF1F0] rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#205BD6] h-full transition-all"
                      style={{ width: `${(item.created / 180) * 100}%` }}
                      title={`Khởi tạo: ${item.created}`}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all -ml-1"
                      style={{ width: `${(item.confirmed / 180) * 100}%` }}
                      title={`Đã chốt: ${item.confirmed}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Breakdown Distribution (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[#EBF1F0]/40 rounded-2xl border border-[#0E1D4F]/5 space-y-4">
            <h3 className="text-sm font-bold text-[#0E1D4F] flex items-center gap-2">
              <Icon name="pie_chart" className="size-4 text-[#205BD6]" />
              <span>Cơ cấu trạng thái hành trình</span>
            </h3>

            <div className="space-y-3 pt-1">
              {ADMIN_MOCK_PLAN_STATUS_DISTRIBUTION.map((item) => (
                <div key={item.label} className="p-3 bg-white rounded-xl border border-[#0E1D4F]/10 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#0E1D4F] flex items-center gap-2">
                      <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span>{item.label}</span>
                    </span>
                    <span className="font-bold text-[#0E1D4F]">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EBF1F0] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#4B5875] leading-relaxed pt-1">
              Tỷ lệ hoàn thành và chốt hành trình đạt 32%, thể hiện mức độ tương tác tốt trong các phiên đồng sáng tạo với AI Planner.
            </p>
          </div>
        </div>
      </section>

      {/* System Traces section (Live endpoint) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#0E1D4F]">Trace gần nhất</h2>
          <Link href="/admin/system" className="text-sm font-semibold text-[#205BD6]">
            Xem tất cả trace
          </Link>
        </div>
        {!accountId ? (
          <p>Cần phiên quản trị.</p>
        ) : !current ? (
          <p role="status" className="text-sm text-[#4B5875]">Đang tải trace…</p>
        ) : current.error ? (
          <p role="alert" className="text-sm text-rose-700">{current.error}</p>
        ) : !current.traces.length ? (
          <p className="text-sm text-[#4B5875]">Máy chủ chưa có trace được lưu.</p>
        ) : (
          <div className="space-y-3">
            {current.traces.map(trace => (
              <Link
                key={trace.id}
                href={`/admin/system?traceId=${encodeURIComponent(trace.id)}`}
                className="block rounded-2xl border border-[#0E1D4F]/10 p-4 hover:bg-[#EBF1F0]/50"
              >
                <p className="break-words text-sm font-semibold text-[#0E1D4F]">
                  {trace.traceType} · {trace.status}
                </p>
                <p className="text-xs text-[#4B5875] mt-1 break-all">
                  {trace.id} · {trace.timestamp} · {trace.latencyMs == null ? 'Chưa đo độ trễ' : `${trace.latencyMs} ms`}
                </p>
              </Link>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={!accountId || !current}
          onClick={() => { setSnapshot(null); setReload(value => value + 1); }}
          className="rounded-xl border border-[#0E1D4F]/15 px-4 py-2.5 text-sm text-[#205BD6] font-semibold disabled:opacity-50 cursor-pointer"
        >
          Tải lại trace
        </button>
      </section>
    </div>
  );
}

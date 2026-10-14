'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserAuth } from '@/lib/userAuth';
import { getAdminOverview } from '@/services/adminOperationsService';
import { getTraces } from '@/services/systemService';
import type { AdminOverviewView } from '@/types/adminOperationsApi';
import type { TraceListItemView } from '@/types/adminSystemApi';
import AdminKpiSummary from './AdminKpiSummary';
import Icon from '@/components/ui/Icon';

export default function AdminOverviewScreen() {
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  const [overview, setOverview] = useState<{ accountId: string; data: AdminOverviewView | null; error: string | null } | null>(null);
  const [traces, setTraces] = useState<{ accountId: string; items: TraceListItemView[]; error: string | null } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    getAdminOverview(controller.signal).then(result => {
      if (!controller.signal.aborted) setOverview({ accountId, data: result.data, error: null });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setOverview({ accountId, data: null, error: cause instanceof Error ? cause.message : 'Không thể tải số liệu tổng quan.' });
    });
    return () => controller.abort();
  }, [accountId, reload]);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    getTraces({ page: 1, pageSize: 4 }).then(result => {
      if (!controller.signal.aborted) setTraces({ accountId, items: result.data.items, error: null });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setTraces({ accountId, items: [], error: cause instanceof Error ? cause.message : 'Không thể tải trace.' });
    });
    return () => controller.abort();
  }, [accountId, reload]);

  const currentOverview = overview?.accountId === accountId ? overview : null;
  const currentTraces = traces?.accountId === accountId ? traces : null;
  const formatCount = (value: number | undefined) => value == null ? '—' : value.toLocaleString('vi-VN');

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      <header className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
          Tổng quan Vận hành &amp; Tương tác Du khách
        </h1>
        <button type="button" disabled={!accountId} onClick={() => { setOverview(null); setTraces(null); setReload(value => value + 1); }} className="min-h-11 rounded-xl border border-[#0E1D4F]/15 px-4 py-2.5 text-sm text-[#205BD6] font-semibold disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
          Tải lại dữ liệu
        </button>
      </header>

      <AdminKpiSummary />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-[#0E1D4F]">Chỉ số tổng quan</h2>
          <p role={currentOverview?.error ? 'alert' : 'status'} className="text-xs text-[#4B5875]">
            {!accountId ? 'Cần phiên quản trị.' : currentOverview?.error ?? (currentOverview?.data ? 'Cập nhật: ' + currentOverview.data.updatedAt : 'Đang tải số liệu…')}
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {[
            ['Tổng người dùng', currentOverview?.data?.users],
            ['Tổng chuyến đi', currentOverview?.data?.trips],
            ['Địa điểm', currentOverview?.data?.places],
            ['Feedback đã nhận', currentOverview?.data?.feedback],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-warm-surface rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B5875]">{label}</h3>
              <p className="text-2xl font-bold text-[#0E1D4F] mt-3">{formatCount(value as number | undefined)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#0E1D4F]/10">
          <div>
            <h2 className="text-xl font-bold text-[#0E1D4F]">Xu hướng kế hoạch</h2>
            <p className="text-xs sm:text-sm text-[#4B5875] mt-1">Chưa có dữ liệu kế hoạch theo tháng trong API tổng quan hiện tại.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warm-paper text-[#4B5875] border border-[#0E1D4F]/10">
            <Icon name="info" className="size-3.5 text-[#205BD6]" />
            <span>Chưa có dữ liệu</span>
          </span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="p-8 rounded-2xl border border-dashed border-[#0E1D4F]/15 bg-warm-paper text-center space-y-3">
            <div className="size-10 rounded-xl bg-warm-surface border border-[#0E1D4F]/10 flex items-center justify-center mx-auto text-[#205BD6]">
              <Icon name="trending_up" className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-[#0E1D4F]">Kế hoạch theo tháng</h3>
            <p className="text-sm text-[#4B5875]">API hiện chỉ cung cấp tổng số chuyến đi, chưa có chuỗi dữ liệu theo tháng.</p>
          </div>
          <div className="p-8 rounded-2xl border border-dashed border-[#0E1D4F]/15 bg-warm-paper text-center space-y-3">
            <div className="size-10 rounded-xl bg-warm-surface border border-[#0E1D4F]/10 flex items-center justify-center mx-auto text-[#205BD6]">
              <Icon name="pie_chart" className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-[#0E1D4F]">Trạng thái hành trình</h3>
            <p className="text-sm text-[#4B5875]">API chưa trả dữ liệu phân bố theo trạng thái; không có số liệu để dựng biểu đồ.</p>
          </div>
        </div>
      </section>

      <section className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#0E1D4F]">Trace gần nhất</h2>
          <Link href="/admin/system" className="text-sm font-semibold text-[#205BD6]">Xem tất cả trace</Link>
        </div>
        {!accountId ? (
          <p>Cần phiên quản trị.</p>
        ) : !currentTraces ? (
          <p role="status" className="text-sm text-[#4B5875]">Đang tải trace…</p>
        ) : currentTraces.error ? (
          <p role="alert" className="text-sm text-rose-700">{currentTraces.error}</p>
        ) : !currentTraces.items.length ? (
          <p className="text-sm text-[#4B5875]">Máy chủ chưa có trace được lưu.</p>
        ) : (
          <div className="space-y-3">
            {currentTraces.items.map(trace => (
          <Link key={trace.id} href={'/admin/system?traceId=' + encodeURIComponent(trace.id)} className="block rounded-2xl border border-[#0E1D4F]/10 p-4 hover:bg-warm-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
                <p className="break-words text-sm font-semibold text-[#0E1D4F]">{trace.traceType} · {trace.status}</p>
                <p className="text-xs text-[#4B5875] mt-1 break-all">
                  {trace.id} · {trace.timestamp} · {trace.latencyMs == null ? 'Chưa đo độ trễ' : trace.latencyMs + ' ms'}
                </p>
              </Link>
            ))}
          </div>
        )}
        <button type="button" disabled={!accountId || !currentTraces} onClick={() => { setTraces(null); setReload(value => value + 1); }} className="min-h-11 rounded-xl border border-[#0E1D4F]/15 px-4 py-2.5 text-sm text-[#205BD6] font-semibold disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
          Tải lại trace
        </button>
      </section>
    </div>
  );
}

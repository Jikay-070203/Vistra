'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useUserAuth } from '@/lib/userAuth';
import { getAdminRevenue } from '@/services/adminOperationsService';
import type { AdminRevenueView } from '@/types/adminOperationsApi';

function formatMoney(amount: number | null, currency: string): string {
  return amount == null ? 'Chưa có dữ liệu' : new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
}

export default function AdminRevenueScreen() {
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  const [snapshot, setSnapshot] = useState<{ accountId: string; data: AdminRevenueView | null; error: string | null } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    getAdminRevenue(controller.signal).then(result => {
      if (!controller.signal.aborted) setSnapshot({ accountId, data: result.data, error: null });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setSnapshot({ accountId, data: null, error: cause instanceof Error ? cause.message : 'Không thể tải dữ liệu doanh thu.' });
    });
    return () => controller.abort();
  }, [accountId, reload]);

  const current = snapshot?.accountId === accountId ? snapshot : null;
  const data = current?.data;
  const notConfigured = !current?.error && data && !data.available;

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      <header className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">Doanh thu &amp; Thống kê Giao dịch</h1>
          <p className="text-sm text-[#4B5875] mt-1">Dữ liệu doanh thu chỉ hiển thị khi máy chủ có lịch sử thanh toán.</p>
        </div>
        <button type="button" disabled={!accountId || current == null} onClick={() => { setSnapshot(null); setReload(value => value + 1); }} className="rounded-xl border border-[#0E1D4F]/15 px-4 py-2.5 text-sm text-[#205BD6] font-semibold disabled:opacity-50">
          Tải lại
        </button>
      </header>

      <p role={current?.error ? 'alert' : 'status'} className={current?.error ? 'text-sm text-rose-700' : 'text-sm text-[#4B5875]'}>
        {!accountId ? 'Cần phiên quản trị.' : current?.error ?? (current ? (data?.available ? 'Dữ liệu doanh thu đã được tải.' : data?.message) : 'Đang tải dữ liệu doanh thu…')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          ['Tổng doanh thu tích lũy', formatMoney(data?.total ?? null, data?.currency ?? 'VND')],
          ['Doanh thu định kỳ', formatMoney(data?.mrr ?? null, data?.currency ?? 'VND')],
          ['Lịch sử thanh toán', data?.available ? 'Đã cấu hình' : current ? 'Chưa cấu hình' : '—'],
          ['Giao dịch', data?.items.length ? String(data.items.length) : current ? 'Chưa có dữ liệu' : '—'],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs space-y-1">
            <span className="text-xs text-[#4B5875] font-semibold">{label}</span>
            <p className="text-xl font-bold text-[#0E1D4F] mt-2">{current?.error ? '—' : value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10">
          <h2 className="text-lg font-bold text-[#0E1D4F] flex items-center gap-2">
            <Icon name="donut_large" className="size-5 text-[#205BD6]" />
            <span>Phân bố doanh thu</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF1F0] text-[#4B5875] border border-[#0E1D4F]/10">
            <Icon name="info" className="size-3.5 text-[#205BD6]" />
            <span>{data?.available ? 'Chưa có phân bố' : 'Chưa khả dụng'}</span>
          </span>
        </div>
        <div className="p-8 rounded-2xl border border-dashed border-[#0E1D4F]/15 bg-[#EBF1F0]/30 text-center space-y-3">
          <div className="size-10 rounded-xl bg-white border border-[#0E1D4F]/10 flex items-center justify-center mx-auto text-[#205BD6]">
            <Icon name="pie_chart" className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0E1D4F]">{notConfigured ? 'Chưa có dữ liệu thanh toán' : 'Chưa có dữ liệu phân bố'}</h3>
            <p className="text-xs text-[#4B5875] mt-1 max-w-md mx-auto">
              {current?.error ?? (data?.message || 'API hiện chưa cung cấp dữ liệu phân bố doanh thu theo gói.')}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[#0E1D4F]">Lịch sử giao dịch</h2>
          <p className="text-xs text-[#4B5875] mt-0.5">API hiện chưa cung cấp danh sách giao dịch.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-[#0E1D4F]/15 bg-[#EBF1F0]/30 p-10 text-center">
          {current?.error ? (
            <p role="alert" className="text-sm text-rose-700">{current.error}</p>
          ) : !current ? (
            <p role="status" className="text-sm text-[#4B5875]">Đang tải lịch sử thanh toán…</p>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#4B5875]">
              <Icon name="receipt_long" className="size-8" />
              <p className="text-sm font-semibold text-[#0E1D4F]">{notConfigured ? 'Lịch sử thanh toán chưa được cấu hình' : 'Chưa có giao dịch để hiển thị'}</p>
              <p className="text-xs max-w-lg">{data?.message || 'Backend chưa trả dữ liệu giao dịch.'}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

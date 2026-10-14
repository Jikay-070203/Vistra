'use client';
import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { getAdminMetrics } from '@/services/adminMetricsService';
import { getSystemHealth } from '@/services/systemService';
import { useUserAuth } from '@/lib/userAuth';
import type { AdminMetrics } from '@/types/adminEvaluationApi';

export default function AdminKpiSummary() {
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  const [snapshot, setSnapshot] = useState<{ accountId: string; data: AdminMetrics | null; error: string | null } | null>(null);
  const [reload, setReload] = useState(0);
  const [health, setHealth] = useState<{ loading: boolean; message: string; latencyMs?: number; error?: boolean }>({ loading: false, message: 'Chưa kiểm tra' });

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    getAdminMetrics(controller.signal).then(result => {
      if (!controller.signal.aborted) setSnapshot({ accountId, data: result.data, error: null });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setSnapshot({ accountId, data: null, error: error instanceof Error ? error.message : 'Không thể tải số liệu hệ thống.' });
    });
    return () => controller.abort();
  }, [accountId, reload]);

  const metrics = snapshot?.accountId === accountId ? snapshot.data : null;
  const error = snapshot?.accountId === accountId ? snapshot.error : null;
  const loading = Boolean(accountId && snapshot?.accountId !== accountId);
  const format = (value: number | null | undefined, unit: string) => value == null ? 'Chưa có dữ liệu' : value.toLocaleString('vi-VN') + unit;
  const cards = [
    { label: 'Khả dụng hệ thống', value: format(metrics?.availabilityPct, '%') },
    { label: 'Tỷ lệ chấp nhận kế hoạch', value: format(metrics?.planAcceptancePct, '%') },
    { label: 'Độ trễ phản hồi AI (P95)', value: format(metrics?.aiResponseLatencyMs.p95, ' ms') },
    { label: 'Độ trễ API (P95)', value: format(metrics?.apiLatencyMs.p95, ' ms') },
  ];
  const checkHealth = async () => {
    if (health.loading) return;
    setHealth({ loading: true, message: 'Đang kiểm tra…' });
    const started = performance.now();
    try {
      const result = await getSystemHealth();
      setHealth({ loading: false, message: `API: ${result.data.status} · HTTP ${result.httpStatus}`, latencyMs: Math.round(performance.now() - started) });
    } catch (cause: unknown) {
      setHealth({ loading: false, message: cause instanceof Error ? cause.message : 'Kiểm tra API thất bại.', error: true });
    }
  };
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#4B5875]">
      <p role="status">{!accountId ? 'Cần phiên quản trị.' : loading ? 'Đang tải số liệu…' : error || 'Số liệu do máy chủ cung cấp; trường chưa đo lường hiển thị chưa có dữ liệu.'}</p>
      <button type="button" disabled={!accountId || loading} onClick={() => { setSnapshot(null); setReload(value => value + 1); }} className="min-h-11 px-4 py-2.5 rounded-xl border border-[#0E1D4F]/15 bg-warm-surface text-[#205BD6] font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">Tải lại số liệu</button>
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {cards.map(card => <div key={card.label} className="bg-warm-surface rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B5875]">{card.label}</h3>
        <p className="text-xl font-bold text-[#0E1D4F] mt-3">{card.value}</p>
      </div>)}
    </div>
    {metrics && <p className="text-xs text-[#4B5875]">Máy chủ cập nhật: {metrics.checkedAt}</p>}
    <div className="bg-warm-surface rounded-2xl p-4 border border-[#0E1D4F]/10 flex flex-wrap items-center gap-4">
      <button type="button" id="btn-check-api-health" disabled={health.loading} onClick={checkHealth} className="inline-flex min-h-11 gap-2 items-center px-4 py-2.5 rounded-xl bg-[#205BD6] text-white text-sm font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#205BD6]">
        <Icon name="sync" className="size-4" aria-hidden="true" />{health.loading ? 'Đang kiểm tra…' : 'Kiểm tra API'}
      </button>
      <p role="status" className={`text-sm ${health.error ? 'text-rose-700' : 'text-[#4B5875]'}`}>{health.message}{health.latencyMs != null && ` · ${health.latencyMs} ms (request /health gần nhất)`}</p>
    </div>
  </section>;
}

'use client';

import { useEffect, useState } from 'react';
import { getAdminBenchmarks } from '@/services/adminBenchmarkService';

export default function BenchmarkPanel() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminBenchmarks>>['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => { const controller = new AbortController(); getAdminBenchmarks(controller.signal).then(result => setData(result.data)).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Không thể tải benchmark.'); }); return () => controller.abort(); }, [reload]);
  const latest = data?.latest;
  const value = (number: number | null | undefined, suffix = '') => number == null ? 'Chưa có dữ liệu' : `${number}${suffix}`;
  return <section className="space-y-4 rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#0E1D4F]">Benchmark AI</h2><p className="mt-1 text-sm text-[#4B5875]">Chỉ hiển thị kết quả benchmark đã được backend lưu.</p></div><button type="button" onClick={() => { setData(null); setError(null); setReload(value => value + 1); }} className="rounded-xl border border-[#0E1D4F]/15 px-3 py-2 text-sm font-semibold text-[#205BD6]">Tải lại</button></div>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}{!error && !data && <p role="status" className="text-sm text-[#4B5875]">Đang tải dữ liệu thật…</p>}{data && <><div className="grid grid-cols-1 gap-4 md:grid-cols-4">{[['Điểm tổng', value(latest?.scorePct, '%')], ['CLIP', value(latest?.clipScore)], ['Retrieval', value(latest?.retrievalAccuracyPct, '%')], ['LLM', value(latest?.llmScore)]].map(([label, amount]) => <div key={label} className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-paper p-4"><p className="text-xs font-semibold text-[#4B5875]">{label}</p><p className="mt-2 font-bold text-[#0E1D4F]">{amount}</p></div>)}</div><p className="text-sm text-[#4B5875]">{data.history.length ? `Lịch sử: ${data.history.length} lần chạy` : 'Chưa có lịch sử benchmark.'}</p>{latest?.counts && <p className="text-sm text-[#4B5875]">Pass: {latest.counts.passed} · Warning: {latest.counts.warning} · Failed: {latest.counts.failed}</p>}</>}</section>;
}

'use client';

import { useEffect, useState } from 'react';
import { getQdrantChatMemory, getQdrantStatus, moveQdrantChatMemory } from '@/services/systemService';

type MemoryItem = { id?: string | number; role?: string; content?: string; created_at?: string; trip_id?: string; user_id?: string };

function cleanChatText(value: unknown) {
  return String(value ?? '').replace(/\\([#*])/g, '$1').split(/\r?\n/).map(line => line
    .replace(/^\s*#{1,6}\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[-*]\s+/, '• ')).join('\n').trim();
}

function formatDate(value?: string) {
  if (!value) return 'Không rõ thời gian';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
}

export default function QdrantMemoryPanel() {
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [memory, setMemory] = useState<MemoryItem[]>([]);
  const [selected, setSelected] = useState<MemoryItem | null>(null);
  const check = () => getQdrantStatus().then(result => setStatus((result.data as any)?.data ?? result.data)).catch(error => setStatus({ ok: false, message: error instanceof Error ? error.message : 'Không kiểm tra được Qdrant' }));
  const loadMemory = () => getQdrantChatMemory().then(result => setMemory((result.data as any)?.data?.items ?? [])).catch(() => setMemory([]));
  useEffect(() => { check(); loadMemory(); }, []);
  const move = async () => { setBusy(true); try { await moveQdrantChatMemory(); check(); loadMemory(); } finally { setBusy(false); } };
  return <section className="space-y-4 rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm">
    <div><h2 className="text-lg font-bold text-[#0E1D4F]">Qdrant Chat Memory</h2><p className="text-sm text-[#4B5875]">Trạng thái: <strong>{status ? (status.ok ? 'Đang hoạt động' : 'Không kết nối') : 'Đang kiểm tra…'}</strong> · Chờ đồng bộ: {status?.pending ?? '—'}</p></div>
    {status?.message && <p role="alert" className="text-sm text-rose-700">{status.message}</p>}
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { check(); loadMemory(); }} className="rounded-xl border px-4 py-2 text-sm font-semibold">Kiểm tra Qdrant</button><button type="button" onClick={() => void move()} disabled={busy || !status?.ok || !status?.pending} className="rounded-xl bg-[#205BD6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang chuyển…' : 'Move dữ liệu chờ'}</button></div>
    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">{memory.length ? memory.map((item, index) => <article key={String(item.id ?? index)} className="flex items-center gap-3 rounded-xl border border-[#0E1D4F]/10 bg-white px-3 py-2 shadow-sm"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.role === 'user' ? 'bg-[#205BD6]' : 'bg-[#16A085]'}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 text-xs text-[#4B5875]"><span className="font-semibold text-[#0E1D4F]">{item.role === 'user' ? 'Người dùng' : 'Agent'}</span><span>·</span><span>{formatDate(item.created_at)}</span></div><p className="truncate text-sm text-[#4B5875]">{cleanChatText(item.content)}</p></div><button type="button" onClick={() => setSelected(item)} className="shrink-0 rounded-lg border border-[#205BD6] px-3 py-1 text-sm font-semibold text-[#205BD6]">Xem</button></article>) : <p className="rounded-xl border border-dashed p-5 text-sm text-[#4B5875]">Chưa có chat memory trong Qdrant.</p>}</div>
    {selected && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1D4F]/40 p-4" onClick={() => setSelected(null)}><div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold text-[#0E1D4F]">Chi tiết cuộc trò chuyện</h3><p className="mt-1 text-xs text-[#4B5875]">{selected.role === 'user' ? 'Người dùng' : 'Agent'} · {formatDate(selected.created_at)}</p></div><button type="button" aria-label="Đóng" onClick={() => setSelected(null)} className="rounded-lg border px-3 py-1 text-sm">Đóng</button></div><div className="mt-5 whitespace-pre-wrap rounded-xl bg-[#F7F5EE] p-4 text-sm leading-6 text-[#0E1D4F]">{cleanChatText(selected.content)}</div></div></div>}
  </section>;
}

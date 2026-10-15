'use client';
import { useEffect, useState } from 'react';
import { getQdrantChatMemory, getQdrantStatus, moveQdrantChatMemory } from '@/services/systemService';

export default function QdrantMemoryPanel() {
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [memory, setMemory] = useState<any[]>([]);
  const check = () => { getQdrantStatus().then(result => setStatus((result.data as any)?.data ?? result.data)).catch(error => setStatus({ ok: false, message: error instanceof Error ? error.message : 'Không kiểm tra được Qdrant' })); };
  const loadMemory = () => { getQdrantChatMemory().then(result => setMemory((result.data as any)?.data?.items ?? [])).catch(() => setMemory([])); };
  useEffect(() => { check(); loadMemory(); }, []);
  const move = async () => { setBusy(true); try { await moveQdrantChatMemory(); check(); loadMemory(); } finally { setBusy(false); } };
  return <section className="rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm space-y-3">
    <h2 className="text-lg font-bold text-[#0E1D4F]">Qdrant Chat Memory</h2>
    <p className="text-sm text-[#4B5875]">Trạng thái: <strong>{status ? (status.ok ? 'Đang hoạt động' : 'Không kết nối') : 'Đang kiểm tra…'}</strong> · Chờ đồng bộ: {status?.pending ?? '—'}</p>
    {status?.message && <p role="alert" className="text-sm text-rose-700">{status.message}</p>}
    <div className="flex gap-2"><button type="button" onClick={check} className="rounded-xl border px-4 py-2 text-sm font-semibold">Kiểm tra Qdrant</button><button type="button" onClick={() => void move()} disabled={busy || !status?.ok || !status?.pending} className="rounded-xl bg-[#205BD6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang chuyển…' : 'Move dữ liệu chờ'}</button></div>
    <div className="max-h-80 overflow-auto rounded-xl border border-[#0E1D4F]/10">{memory.length ? memory.map(item => <div key={String(item.id)} className="border-b p-3 text-xs last:border-0"><div className="font-semibold">{item.role} · {item.created_at} · trip {item.trip_id}</div><div className="mt-1 whitespace-pre-wrap text-[#4B5875]">{item.content}</div></div>) : <p className="p-4 text-sm text-[#4B5875]">Chưa có chat memory trong Qdrant.</p>}</div>
  </section>;
}

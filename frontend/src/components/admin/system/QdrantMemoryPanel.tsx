'use client';
import { useEffect, useState } from 'react';
import { getQdrantStatus, moveQdrantChatMemory } from '@/services/systemService';

export default function QdrantMemoryPanel() {
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const check = () => { getQdrantStatus().then(result => setStatus((result.data as any)?.data ?? result.data)).catch(error => setStatus({ ok: false, message: error instanceof Error ? error.message : 'Không kiểm tra được Qdrant' })); };
  useEffect(() => { check(); }, []);
  const move = async () => { setBusy(true); try { await moveQdrantChatMemory(); check(); } finally { setBusy(false); } };
  return <section className="rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm space-y-3">
    <h2 className="text-lg font-bold text-[#0E1D4F]">Qdrant Chat Memory</h2>
    <p className="text-sm text-[#4B5875]">Trạng thái: <strong>{status ? (status.ok ? 'Đang hoạt động' : 'Không kết nối') : 'Đang kiểm tra…'}</strong> · Chờ đồng bộ: {status?.pending ?? '—'}</p>
    {status?.message && <p role="alert" className="text-sm text-rose-700">{status.message}</p>}
    <div className="flex gap-2"><button type="button" onClick={check} className="rounded-xl border px-4 py-2 text-sm font-semibold">Kiểm tra Qdrant</button><button type="button" onClick={() => void move()} disabled={busy || !status?.ok || !status?.pending} className="rounded-xl bg-[#205BD6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang chuyển…' : 'Move dữ liệu chờ'}</button></div>
  </section>;
}

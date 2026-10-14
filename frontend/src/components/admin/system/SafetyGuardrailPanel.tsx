'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useUserAuth } from '@/lib/userAuth';
import { evaluateAdminSafetyPrompt, getAdminSafetyPresets } from '@/services/adminSafetyService';
import type { AdminSafetyEvaluation, AdminSafetyPresets } from '@/types/adminSafetyApi';

export default function SafetyGuardrailPanel() {
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  const [presets, setPresets] = useState<AdminSafetyPresets | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AdminSafetyEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    getAdminSafetyPresets(controller.signal)
      .then(response => { if (!controller.signal.aborted) setPresets(response.data); })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Không thể tải kịch bản an toàn.');
      });
    return () => controller.abort();
  }, [accountId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountId || loading) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await evaluateAdminSafetyPrompt(prompt, undefined, controller.signal);
      setResult(response.data);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Không thể gửi yêu cầu kiểm thử.');
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full rounded-xl border border-[#0E1D4F]/20 bg-warm-surface px-3 py-2.5 text-sm text-[#0E1D4F]';
  const button = 'min-h-11 rounded-xl border border-[#0E1D4F]/15 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]';

  return <section className="space-y-4 rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm">
    <div>
      <h2 className="text-lg font-bold text-[#0E1D4F]">Kiểm thử Prompt Injection &amp; Safety Guardrails</h2>
      <p className="mt-1 text-sm text-[#4B5875]">API hiện ở chế độ tham chiếu; phản hồi không đo lường guardrail hoặc đánh giá model thật.</p>
    </div>

    {!accountId ? <p className="text-sm text-[#4B5875]">Cần phiên quản trị để sử dụng chức năng này.</p> : <>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {presets && <p className="text-sm text-[#4B5875]">
        {presets.items.length
          ? `Máy chủ trả về ${presets.items.length} mục, nhưng chưa có cấu trúc để chọn kịch bản; hãy nhập prompt cần gửi.`
          : 'Máy chủ chưa cung cấp kịch bản mẫu; hãy nhập prompt cần gửi.'}
        {' '}Chế độ API: <strong>{presets.mode}</strong>.
      </p>}
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-semibold text-[#0E1D4F]" htmlFor="admin-safety-prompt">Prompt cần kiểm tra</label>
        <textarea
          id="admin-safety-prompt"
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          maxLength={12000}
          rows={5}
          required
          className={input + ' resize-y'}
          placeholder="Nhập nội dung prompt cần gửi đến API tham chiếu…"
        />
        <button type="submit" disabled={loading || !prompt.trim()} className={button + ' bg-[#205BD6] text-white'}>
          {loading ? 'Đang gửi…' : 'Gửi yêu cầu tham chiếu'}
        </button>
      </form>
      {result && <div role="status" className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p><strong>Chế độ trả về:</strong> {result.executionMode}. Backend phản chiếu dữ liệu tham chiếu, không chạy đánh giá an toàn thực tế.</p>
        <p><strong>blocked:</strong> {String(result.blocked)} · <strong>blockedCount:</strong> {result.blockedCount}</p>
        <p><strong>Thời gian:</strong> {result.latencyMs == null ? 'Chưa có dữ liệu' : `${result.latencyMs} ms`}</p>
        <details>
          <summary className="cursor-pointer font-semibold">Xem phản hồi từ API</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-warm-surface p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
        </details>
      </div>}
    </>}
  </section>;
}

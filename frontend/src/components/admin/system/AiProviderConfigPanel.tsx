'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Icon from '@/components/ui/Icon';
import { useUserAuth } from '@/lib/userAuth';
import { getAiProviderSettings, updateAiProviderSettings } from '@/services/adminAiProviderService';
import type { AiProvider, AiProviderModel, AiProviderSettings } from '@/types/adminAiProviderApi';

const providerOptions: { provider: AiProvider; model: AiProviderModel; label: string }[] = [
  { provider: 'gemini', model: 'gemini-3.5-flash-lite', label: 'Google Gemini' },
  { provider: 'openai', model: 'gpt-4o-mini', label: 'OpenAI' },
];

interface ProviderLoadState {
  key: string;
  settings: AiProviderSettings | null;
  error: string | null;
}

export default function AiProviderConfigPanel() {
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  const [loadState, setLoadState] = useState<ProviderLoadState | null>(null);
  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const loadKey = accountId ? `${accountId}:${reload}` : null;
  const currentLoad = loadKey && loadState?.key === loadKey ? loadState : null;
  const settings = currentLoad?.settings ?? null;
  const loadError = currentLoad?.error ?? null;
  const loading = Boolean(accountId && !currentLoad);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    void getAiProviderSettings(controller.signal)
      .then(response => {
        if (controller.signal.aborted) return;
        setLoadState({ key: `${accountId}:${reload}`, settings: response.data, error: null });
        setProvider(response.data.provider);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadState({
            key: `${accountId}:${reload}`,
            settings: null,
            error: cause instanceof Error ? cause.message : 'Không thể tải cấu hình AI.',
          });
        }
      });
    return () => controller.abort();
  }, [accountId, reload]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings || saving || !apiKey.trim()) return;
    const model = providerOptions.find(option => option.provider === provider)?.model;
    if (!model) return;
    const controller = new AbortController();
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    try {
      const response = await updateAiProviderSettings({ provider, model, apiKey: apiKey.trim() }, controller.signal);
      if (loadKey) setLoadState({ key: loadKey, settings: response.data, error: null });
      setProvider(response.data.provider);
      setApiKey('');
      setNotice('Cấu hình AI đã được cập nhật. Các yêu cầu mới sẽ sử dụng nhà cung cấp này.');
    } catch (cause: unknown) {
      setSaveError(cause instanceof Error ? cause.message : 'Không thể cập nhật cấu hình AI.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-[#0E1D4F]/20 bg-white px-3.5 py-3 text-sm text-[#0E1D4F] outline-none transition focus:border-[#205BD6] focus:ring-2 focus:ring-[#205BD6]/20 disabled:bg-slate-100';
  const model = providerOptions.find(option => option.provider === provider)?.model;

  return (
    <section className="space-y-5 rounded-3xl border border-[#0E1D4F]/10 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="ai-provider-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="ai-provider-title" className="text-xl font-bold text-[#0E1D4F]">Nhà cung cấp AI</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#4B5875]">Chọn nhà cung cấp và model sẽ nhận các yêu cầu AI mới. API key được gửi đến backend để mã hóa và lưu; giao diện không đọc lại hoặc hiển thị giá trị đã lưu.</p>
        </div>
        {settings && (
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${settings.hasKey ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <Icon name={settings.hasKey ? 'check_circle' : 'warning'} className="size-4" />
            {settings.hasKey ? 'API key đã cấu hình' : 'Chưa cấu hình API key'}
          </span>
        )}
      </div>

      {!accountId ? (
        <p className="rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/50 p-4 text-sm text-[#4B5875]">Cần phiên quản trị để xem hoặc cập nhật cấu hình.</p>
      ) : (
        <>
          {loadError && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>{loadError}</p><button type="button" onClick={() => setReload(value => value + 1)} className="shrink-0 font-semibold underline">Thử lại</button></div>}
          {loading && <p role="status" className="text-sm text-[#4B5875]">Đang tải cấu hình từ backend…</p>}
          {settings && (
            <>
              <p className="text-sm text-[#4B5875]">
                Đang áp dụng: <strong className="text-[#0E1D4F]">{settings.provider} · {settings.model}</strong>
                {settings.updatedAt && <> · Cập nhật {new Date(settings.updatedAt).toLocaleString('vi-VN')}</>}
              </p>

              <form onSubmit={submit} className="space-y-5">
                <fieldset disabled={loading || saving}>
                  <legend className="mb-3 text-sm font-semibold text-[#0E1D4F]">Chọn nhà cung cấp và model</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {providerOptions.map(option => (
                      <label key={option.provider} className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${provider === option.provider ? 'border-[#205BD6] bg-[#205BD6]/5 ring-1 ring-[#205BD6]/30' : 'border-[#0E1D4F]/15 hover:bg-[#EBF1F0]/60'}`}>
                        <input
                          type="radio"
                          name="ai-provider"
                          value={option.provider}
                          checked={provider === option.provider}
                          onChange={() => setProvider(option.provider)}
                          className="mt-1 size-4 accent-[#205BD6]"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-[#0E1D4F]">{option.label}</span>
                          <span className="mt-1 block break-all font-mono text-xs text-[#4B5875]">{option.model}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <label className="block text-sm font-semibold text-[#0E1D4F]" htmlFor="ai-provider-api-key">
                    API key mới
                    <input
                      id="ai-provider-api-key"
                      name="apiKey"
                      type="password"
                      autoComplete="new-password"
                      required
                      maxLength={500}
                      value={apiKey}
                      onChange={event => setApiKey(event.target.value)}
                      className={`${inputClass} mt-2`}
                      placeholder="Nhập API key để lưu cấu hình"
                      disabled={loading || saving}
                    />
                    <span className="mt-1 block text-xs font-normal text-[#4B5875]">Backend không trả API key đã lưu. Mỗi lần cập nhật cần nhập key mới.</span>
                  </label>
                  <button type="submit" disabled={!settings || loading || saving || !apiKey.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#205BD6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1749b2] disabled:cursor-not-allowed disabled:opacity-50">
                    {saving ? <Icon name="sync" className="size-4 animate-spin" /> : <Icon name="save" className="size-4" />}
                    {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
                  </button>
                </div>
                <p className="text-xs text-[#4B5875]">Model sẽ dùng: <code className="rounded bg-[#EBF1F0] px-1.5 py-0.5">{model}</code></p>
              </form>
            </>
          )}
          {saveError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{saveError}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        </>
      )}
    </section>
  );
}

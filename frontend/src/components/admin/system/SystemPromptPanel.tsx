'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/apiClient';
import { getSessionProxyBaseUrl } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';

export default function SystemPromptPanel() {
  const [prompt, setPrompt] = useState(''); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState('');
  useEffect(() => { void apiRequest(API_ENDPOINTS.ADMIN_SYSTEM.SYSTEM_PROMPT, getSessionProxyBaseUrl()).then(result => setPrompt((result.data as any).data.prompt)); }, []);
  const save = async () => { setSaving(true); setNotice(''); try { await apiRequest(API_ENDPOINTS.ADMIN_SYSTEM.SYSTEM_PROMPT, getSessionProxyBaseUrl(), { method: 'PUT', jsonBody: { prompt } }); setNotice('Đã lưu system prompt.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể lưu system prompt.'); } finally { setSaving(false); } };
  return <section className="space-y-4 rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm"><div><h2 className="text-lg font-bold text-[#0E1D4F]">System prompt cho Agent</h2><p className="text-sm text-[#4B5875]">Prompt này được dùng làm hướng dẫn nền cho các cuộc trò chuyện mới.</p></div><textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={8} className="w-full rounded-xl border border-[#0E1D4F]/15 bg-white p-3 text-sm" /><div className="flex items-center gap-3"><button type="button" disabled={saving || !prompt.trim()} onClick={() => void save()} className="rounded-xl bg-[#205BD6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu system prompt'}</button>{notice && <span className="text-sm text-[#4B5875]">{notice}</span>}</div></section>;
}

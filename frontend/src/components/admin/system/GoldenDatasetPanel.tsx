'use client';
import { useEffect, useRef, useState } from 'react';
import { useUserAuth } from '@/lib/userAuth';
import { createDataset, getDatasetDetail, getDatasetRuns, getDatasets, getEvaluationRun, startEvaluation } from '@/services/evaluationService';
import type { AdminPageView, GoldenDatasetMetadataView } from '@/types/adminSystemApi';
import type { EvaluationRun } from '@/types/adminEvaluationApi';

export default function GoldenDatasetPanel() {
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  return accountId ? <DatasetPanel key={accountId} /> : <section className="bg-warm-surface rounded-3xl p-6 border border-[#0E1D4F]/10 text-sm text-[#4B5875]">Cần phiên quản trị để quản lý bộ dữ liệu.</section>;
}

function DatasetPanel() {
  const [data, setData] = useState<AdminPageView<GoldenDatasetMetadataView> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [json, setJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [run, setRun] = useState<EvaluationRun | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [detail, setDetail] = useState<import('@/types/adminSystemApi').GoldenDatasetDetailView | null>(null);
  const [history, setHistory] = useState<import('@/types/adminSystemApi').GoldenDatasetRunView[]>([]);
  const [pollRevision, setPollRevision] = useState(0);
  const mutation = useRef<AbortController | null>(null);
  const pending = run?.status === 'queued' || run?.status === 'running';
  const selected = data?.items.find(item => item.id === selectedId);
  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    Promise.all([getDatasetDetail(selectedId, controller.signal), getDatasetRuns(selectedId, controller.signal)]).then(([datasetResult, runsResult]) => {
      if (!controller.signal.aborted) { setDetail(datasetResult.data); setHistory(runsResult.data.items); }
    }).catch(() => { if (!controller.signal.aborted) { setDetail(null); setHistory([]); } });
    return () => controller.abort();
  }, [selectedId, reload]);

  useEffect(() => () => mutation.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    getDatasets(controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setData(result.data);
      setError(null);
      setSelectedId(current => result.data.items.some(item => item.id === current) ? current : result.data.items[0]?.id ?? '');
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Không thể tải bộ dữ liệu.');
    });
    return () => controller.abort();
  }, [reload]);

  const runId = run?.runId;
  useEffect(() => {
    if (!runId || !pending) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const result = await getEvaluationRun(runId, controller.signal);
        if (controller.signal.aborted) return;
        setRun(result.data);
        setRunError(null);
        if (result.data.status === 'queued' || result.data.status === 'running') timer = setTimeout(poll, 5000);
      } catch (cause: unknown) {
        if (!controller.signal.aborted) setRunError(cause instanceof Error ? cause.message : 'Không thể đọc trạng thái đánh giá.');
      }
    };
    void poll();
    return () => { controller.abort(); if (timer) clearTimeout(timer); };
  }, [runId, pending, pollRevision]);

  const refresh = () => { setData(null); setError(null); setReload(value => value + 1); };
  const submitImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const controller = new AbortController();
    mutation.current = controller;
    setSaving(true); setActionError(null); setNotice(null);
    try {
      const test_cases = JSON.parse(json);
      const result = await createDataset({ name, description, test_cases }, controller.signal);
      if (controller.signal.aborted) return;
      setNotice(`Máy chủ đã lưu bộ dữ liệu ${result.data.name} (${result.data.testCasesCount} case).`);
      setShowImport(false); setName(''); setDescription(''); setJson('');
      setSelectedId(result.data.id); refresh();
    } catch (cause: unknown) {
      if (!controller.signal.aborted) setActionError(cause instanceof Error ? cause.message : 'Không thể nhập bộ dữ liệu.');
    } finally { if (!controller.signal.aborted) setSaving(false); }
  };
  const startRun = async () => {
    if (!selected || saving || pending) return;
    const controller = new AbortController();
    mutation.current = controller;
    setSaving(true); setActionError(null); setNotice(null);
    try {
      const result = await startEvaluation(selected.id, controller.signal);
      if (!controller.signal.aborted) { setRun(result.data); setRunError(null); }
    } catch (cause: unknown) {
      if (!controller.signal.aborted) setActionError(cause instanceof Error ? cause.message : 'Không thể gửi lượt đánh giá.');
    } finally { if (!controller.signal.aborted) setSaving(false); }
  };

  const button = 'px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#0E1D4F]/15 disabled:opacity-50 disabled:cursor-not-allowed';
  const input = 'w-full px-3 py-2.5 rounded-xl border border-[#0E1D4F]/20 bg-warm-surface text-sm text-[#0E1D4F]';
  return <section className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-5">
    <div className="flex flex-wrap justify-between items-start gap-3">
      <div><h2 className="text-xl font-bold text-[#0E1D4F]">Golden Datasets & Đánh giá AI</h2><p className="mt-2 text-sm text-[#4B5875]">Bộ dữ liệu được lưu trên máy chủ. Backend hiện chỉ xếp hàng đánh giá; chưa có worker xử lý và kết quả.</p></div>
      <button type="button" disabled={saving} onClick={() => { setShowImport(value => !value); setActionError(null); }} className={button + ' text-[#205BD6]'}>{showImport ? 'Đóng form nhập' : 'Nhập JSON lên máy chủ'}</button>
    </div>
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    {actionError && <p role="alert" className="text-sm text-rose-700">{actionError}</p>}
    {showImport && <form onSubmit={submitImport} className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-paper p-4 space-y-3">
      <label className="block text-sm text-[#0E1D4F]">Tên bộ dữ liệu<input required maxLength={200} value={name} onChange={event => setName(event.target.value)} className={input} disabled={saving} /></label>
      <label className="block text-sm text-[#0E1D4F]">Mô tả<textarea maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} className={input} disabled={saving} /></label>
      <label className="block text-sm text-[#0E1D4F]">Mảng JSON test cases<textarea required rows={7} value={json} onChange={event => setJson(event.target.value)} placeholder="Mỗi object cần name; input và expected là dữ liệu JSON." className={input + ' font-mono'} disabled={saving} /></label>
      <p className="text-xs text-[#4B5875]">1–1.000 case. Không gửi thông tin bí mật trong test cases.</p>
      <button type="submit" disabled={saving} className={button + ' bg-[#205BD6] text-white'}>{saving ? 'Đang lưu…' : 'Lưu bộ dữ liệu'}</button>
    </form>}
    {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : !data ? <p role="status" className="text-sm text-[#4B5875]">Đang tải bộ dữ liệu…</p> : !data.items.length ? <p className="text-sm text-[#4B5875]">Máy chủ chưa có bộ dữ liệu trong trang này.</p> : <>
      <label className="block text-sm font-semibold text-[#0E1D4F]">Bộ dữ liệu<select value={selectedId} onChange={event => setSelectedId(event.target.value)} className={input}>{data.items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.testCasesCount} case)</option>)}</select></label>
      {selected && <div className="rounded-2xl bg-warm-paper p-4 text-sm text-[#4B5875] space-y-2"><p className="font-bold text-[#0E1D4F]">{selected.name}</p><p>{selected.description || 'Chưa có mô tả.'}</p><p>{selected.testCasesCount} case · {selected.isBuiltin ? 'Có sẵn trên máy chủ' : 'Được tạo trên máy chủ'}</p><p>API danh sách chỉ trả metadata; chưa hỗ trợ xem từng test case.</p></div>}
    </>}
    <div className="flex flex-wrap gap-3 items-center">
      <button type="button" onClick={refresh} disabled={saving} className={button + ' text-[#205BD6]'}>Tải lại danh sách</button>
      <button type="button" onClick={startRun} disabled={!selected || saving || pending} className={button + ' bg-[#205BD6] text-white'}>{saving ? 'Đang gửi…' : 'Gửi lượt đánh giá'}</button>
    </div>
    {detail && <div className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-paper p-4 text-sm"><p className="font-semibold text-[#0E1D4F]">Chi tiết test case ({detail.testCases.length})</p><ul className="mt-2 space-y-1 text-[#4B5875]">{detail.testCases.map(item => <li key={item.id} className="rounded-lg border border-[#0E1D4F]/10 p-2"><span className="font-semibold">{item.name}</span><pre className="mt-1 max-h-24 overflow-auto text-xs">{JSON.stringify({ input: item.input, expected: item.expected }, null, 2)}</pre></li>)}</ul></div>}
    {history.length > 0 && <div className="rounded-2xl border border-[#0E1D4F]/10 p-4 text-sm"><p className="font-semibold text-[#0E1D4F]">Lịch sử chạy</p><ul className="mt-2 space-y-1 text-[#4B5875]">{history.map(item => <li key={item.runId}>{item.createdAt ?? item.runId} · {item.status} · {item.scorePct == null ? 'Chưa có điểm' : `${item.scorePct}%`}</li>)}</ul></div>}
    {data && <p className="text-sm text-[#4B5875]">{data.total} bộ dữ liệu · API hiện cung cấp tối đa 20 bộ đầu tiên.</p>}
    {run && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
      <p className="break-all">Lượt đánh giá: {run.runId} · Trạng thái máy chủ: <strong>{run.status}</strong></p>
      {pending && <p>Đang chờ máy chủ xử lý. Chưa có điểm hoặc kết quả pass/fail. Kiểm tra trạng thái mỗi 5 giây khi màn hình này mở.</p>}
      {!pending && <><p>Điểm: {run.scorePct == null ? 'Chưa có dữ liệu' : run.scorePct + '%'}</p>{run.counts && <p>Passed: {run.counts.passed} · Warning: {run.counts.warning} · Failed: {run.counts.failed}</p>}</>}
      {runError && <><p role="alert" className="text-rose-700">{runError}</p><button type="button" onClick={() => { setRunError(null); setPollRevision(value => value + 1); }} className={button}>Thử đọc trạng thái lại</button></>}
    </div>}
  </section>;
}

'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiClientError } from '@/services/apiClient';
import { importAdminPlaceImages, importAdminPlaces } from '@/services/adminSystemDataService';
import { adminPlaceImagesImportSchema, adminPlacesImportSchema } from '@/schemas/adminDataImportSchema';
import { createAdminImportTemplate, type AdminImportKind } from '@/schemas/adminDataImportRules';
import type { ApiFieldErrors } from '@/types/api';
import type { AdminImportResult } from '@/types/adminSystemDataApi';

const statuses = { completed: 'Đã xử lý', completed_with_errors: 'Đã xử lý, có mục lỗi', already_processed: 'Batch đã được xử lý trước đó' };

export default function AdminDataImporter({ onProcessed }: { onProcessed: () => void }) {
  const [kind, setKind] = useState<AdminImportKind>('places');
  const [jsonText, setJsonText] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewPayload, setReviewPayload] = useState<unknown | null>(null);
  const [reviewValidationError, setReviewValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminImportResult | null>(null);
  const [error, setError] = useState<{ message: string; fields?: ApiFieldErrors } | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const feedback = useRef<HTMLDivElement>(null);
  const reviewFeedback = useRef<HTMLDivElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (result || error) feedback.current?.focus();
    else if (reviewValidationError) reviewFeedback.current?.focus();
  }, [result, error, reviewValidationError]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || inFlight.current) return;
    setResult(null); setError(null); setReviewPayload(null);
    try {
      const raw: unknown = JSON.parse(jsonText);
      const payload = kind === 'places' ? adminPlacesImportSchema.parse(raw) : adminPlaceImagesImportSchema.parse(raw);
      setReviewPayload(payload);
      setReviewValidationError(null);
    } catch (cause: unknown) {
      setReviewValidationError(cause instanceof Error ? cause.message : 'Không thể xác thực payload.');
    }
  }

  async function confirmImport() {
    if (reviewPayload === null || inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setResult(null); setError(null);
    try {
      const response = await (kind === 'places' ? importAdminPlaces(reviewPayload) : importAdminPlaceImages(reviewPayload));
      if (!mounted.current) return;
      setResult(response.data);
      onProcessed();
    } catch (cause: unknown) {
      if (mounted.current) setError({ message: cause instanceof Error ? cause.message : 'Không thể nhập dữ liệu.',
        fields: cause instanceof ApiClientError ? cause.fieldErrors : undefined });
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const button = 'min-h-11 rounded-xl border border-[#0E1D4F]/20 px-4 py-2 text-sm font-semibold text-[#205BD6] disabled:cursor-not-allowed disabled:opacity-50';
  return <section className="space-y-4 rounded-3xl border border-[#0E1D4F]/10 bg-white p-6 shadow-sm" aria-labelledby="data-import-title">
    <div>
      <h2 id="data-import-title" className="text-xl font-bold text-[#0E1D4F]">Nhập địa điểm và ảnh vào DB</h2>
      <p className="mt-1 text-sm text-[#4B5875]">Importer chuyên biệt của backend. Dữ liệu gửi tại đây được ghi thật; đây không phải thao tác CRUD cho mọi bảng.</p>
    </div>
    <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor="admin-import-kind" className="block text-sm font-semibold text-[#0E1D4F]">Loại dữ liệu</label>
          <select id="admin-import-kind" value={kind} disabled={busy} onChange={event => {
          setKind(event.target.value as AdminImportKind); setJsonText(''); setReviewPayload(null); setReviewValidationError(null); setResult(null); setError(null);
          }} className="min-h-11 w-full rounded-xl border border-[#0E1D4F]/20 bg-white px-3 py-2 text-sm">
            <option value="places">Địa điểm · tối đa 100 mục / 2 MB</option>
            <option value="images">Ảnh địa điểm · tối đa 50 mục / 1 MB</option>
          </select>
        </div>
        <button type="button" disabled={busy} className={button} onClick={() => {
          setJsonText(JSON.stringify(createAdminImportTemplate(kind), null, 2)); setReviewPayload(null); setReviewValidationError(null); setResult(null); setError(null);
        }}>Điền khung JSON</button>
      </div>
      <p id="admin-import-guidance" className="text-sm text-[#4B5875]">
        {kind === 'places'
          ? 'Địa điểm được thêm hoặc cập nhật theo source_place_id. Tên tỉnh cần có mapping sang destination tại backend; thiếu mapping sẽ trả lỗi từng mục.'
          : 'Ảnh cần source_place_id đã tồn tại. image_url dùng HTTPS trên upload.wikimedia.org, thumb.wikimedia.org hoặc Cloudinary; ảnh trùng source_image_id hoặc sha256 sẽ được bỏ qua.'}
        {' '}Dùng batch_id mới cho mỗi batch, kể cả khi đổi loại dữ liệu hoặc sửa các mục lỗi. Gửi lại cùng batch_id chỉ nhận kết quả đã lưu, không xử lý lại.
      </p>
      <div className="space-y-1">
        <label htmlFor="admin-import-json" className="block text-sm font-semibold text-[#0E1D4F]">Payload JSON: source, batch_id, items</label>
        <textarea id="admin-import-json" value={jsonText} disabled={busy} required rows={10} onChange={event => {
          setJsonText(event.target.value); setReviewPayload(null); setReviewValidationError(null); setResult(null); setError(null);
        }} aria-describedby="admin-import-guidance admin-import-template-note" className="w-full rounded-xl border border-[#0E1D4F]/20 px-3 py-2.5 font-mono text-sm" />
        <p id="admin-import-template-note" className="text-xs text-[#4B5875]">Khung JSON chỉ minh họa cấu trúc. Thay bằng dữ liệu và URL ảnh thật trước khi gửi.</p>
      </div>
      <button type="submit" disabled={busy || !jsonText.trim()} className="min-h-11 rounded-xl bg-[#205BD6] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        Review &amp; Confirm
      </button>
    </form>
    {reviewValidationError && <div ref={reviewFeedback} tabIndex={-1} role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 focus:outline-2 focus:outline-rose-700">
      <p className="font-semibold">Validation errors</p>
      <p className="mt-1 break-words">{reviewValidationError}</p>
    </div>}
    {reviewPayload !== null && <section aria-labelledby="admin-import-review-title" className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div>
        <h3 id="admin-import-review-title" className="font-bold text-[#0E1D4F]">Review &amp; Confirm</h3>
        <p className="mt-1 text-sm text-[#4B5875]">Kiểm tra payload đã xác thực. Chỉ chọn “Confirm import” mới gửi dữ liệu và ghi vào database.</p>
      </div>
      <pre aria-label="Parsed payload" className="max-h-80 overflow-auto rounded-xl bg-white p-3 text-xs text-[#0E1D4F]"><code>{JSON.stringify(reviewPayload, null, 2)}</code></pre>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} className={button} onClick={() => setReviewPayload(null)}>Sửa JSON</button>
        <button type="button" disabled={busy} onClick={confirmImport} className="min-h-11 rounded-xl bg-[#205BD6] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? 'Đang gửi đến backend…' : 'Confirm import'}
        </button>
      </div>
    </section>}
    {(error || result) && <div ref={feedback} tabIndex={-1} className="rounded-xl border border-[#0E1D4F]/15 p-4 text-sm focus:outline-2 focus:outline-[#205BD6]">
      {error && <div role="alert" className="space-y-2 break-words text-rose-800">
        <p>{error.message}</p>
        {error.fields && <ul className="list-inside list-disc">{Object.entries(error.fields).map(([field, messages]) => <li key={field}><span className="font-mono">{field}</span>: {messages.join('; ')}</li>)}</ul>}
      </div>}
      {result && <div className="space-y-3 text-[#0E1D4F]">
        <p role="status" className="break-words font-semibold">{statuses[result.status]} · Batch {result.batch_id}</p>
        <p>Nhận: {result.received} · Thêm: {result.inserted} · Cập nhật: {result.updated} · Bỏ qua: {result.skipped} · Lỗi: {result.failed}</p>
        {result.status === 'already_processed' && <p className="text-[#4B5875]">Các số liệu thuộc lần xử lý trước. Backend không lưu chi tiết lỗi từng mục để trả lại khi replay.</p>}
        {result.errors.length > 0 && <ul className="list-inside list-disc space-y-1 break-words text-rose-800">{result.errors.map((row, index) => <li key={index}>Mục #{row.index + 1} · {row.code}: {row.message}</li>)}</ul>}
      </div>}
    </div>}
  </section>;
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Icon from '@/components/ui/Icon';
import AdminDataImporter from './AdminDataImporter';
import { useUserAuth } from '@/lib/userAuth';
import { getAdminEntityMetadata, getAdminEntityRecords } from '@/services/adminSystemDataService';
import type { AdminEntityMetadata, AdminEntityRecords, AdminEntityTableId } from '@/types/adminSystemDataApi';

const PAGE_SIZE = 20;

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export default function SchemaMapViewer() {
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  const [metadata, setMetadata] = useState<{ accountId: string; data: AdminEntityMetadata; error: string | null } | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<AdminEntityTableId | ''>('');
  const [page, setPage] = useState(1);
  const [queryDraft, setQueryDraft] = useState('');
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<{ key: string; data: AdminEntityRecords | null; error: string | null } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    getAdminEntityMetadata(controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setMetadata({ accountId, data: result.data, error: null });
      setSelectedTableId(current => result.data.tables.some(table => table.tableName === current)
        ? current
        : result.data.tables[0]?.tableName ?? '');
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) {
        setMetadata({ accountId, data: { tables: [] }, error: cause instanceof Error ? cause.message : 'Không thể tải metadata bảng.' });
      }
    });
    return () => controller.abort();
  }, [accountId, reload]);

  const table = metadata?.accountId === accountId
    ? metadata.data.tables.find(item => item.tableName === selectedTableId)
    : undefined;
  const selectedTableName = table?.tableName;
  const recordsKey = `${accountId ?? ''}:${selectedTableId}:${page}:${query}`;

  useEffect(() => {
    if (!accountId || !selectedTableName) return;
    const controller = new AbortController();
    getAdminEntityRecords(selectedTableName, { page, pageSize: PAGE_SIZE, q: query }, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        if (result.data.table !== selectedTableName) throw new TypeError('Bảng trong phản hồi không khớp bảng đã chọn.');
        setRecords({ key: recordsKey, data: result.data, error: null });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setRecords({ key: recordsKey, data: null, error: cause instanceof Error ? cause.message : 'Không thể tải bản ghi.' });
        }
      });
    return () => controller.abort();
  }, [accountId, selectedTableName, page, query, reload, recordsKey]);

  const activeRecords = records?.key === recordsKey ? records.data : null;
  const recordsError = records?.key === recordsKey ? records.error : null;
  const totalPages = activeRecords ? Math.ceil(activeRecords.total / activeRecords.pageSize) : 0;
  const button = 'inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#0E1D4F]/15 px-3.5 py-2 text-xs font-semibold text-[#205BD6] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]';
  const metadataError = metadata?.accountId === accountId ? metadata.error : null;
  const tables = metadata?.accountId === accountId ? metadata.data.tables : [];

  return <div className="space-y-6">
    {accountId && <AdminDataImporter key={accountId} onProcessed={() => setReload(value => value + 1)} />}
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-[#0E1D4F]">Dữ liệu thực thể</h2>
        <p className="mt-1 text-sm text-[#4B5875]">Viewer thực thể chỉ hỗ trợ đọc. Nhập địa điểm và ảnh dùng importer chuyên biệt phía trên.</p>
      </div>
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">Viewer chỉ đọc · Chưa có CRUD thực thể tổng quát</span>
    </div>

    {!accountId ? <p className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 text-sm text-[#4B5875]">Cần phiên quản trị để xem dữ liệu.</p> : <>
      {metadataError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{metadataError}</p>}
      {!metadata && <p role="status" className="text-sm text-[#4B5875]">Đang tải metadata bảng…</p>}
      {metadata && !metadataError && tables.length === 0 && <p className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 text-sm text-[#4B5875]">Backend chưa trả metadata bảng.</p>}
      {tables.length > 0 && <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-4">
        <aside className="space-y-2 rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-4 shadow-sm">
          <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#4B5875]">Bảng trong backend</h3>
          {tables.map(item => <button
            key={item.tableName}
            type="button"
            onClick={() => { setSelectedTableId(item.tableName); setPage(1); setQuery(''); setQueryDraft(''); }}
            className={`flex w-full items-center justify-between gap-2 rounded-2xl p-3 text-left text-xs font-semibold transition-colors ${
              item.tableName === selectedTableId ? 'bg-[#205BD6] text-white' : 'text-[#4B5875] hover:bg-warm-paper'
            }`}
          >
            <span className="min-w-0"><span className="block truncate font-bold">{item.name}</span><span className={`block truncate font-mono text-[11px] ${item.tableName === selectedTableId ? 'text-blue-100' : 'text-[#4B5875]'}`}>{item.tableName}</span></span>
            <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px]">{item.recordCount.toLocaleString('vi-VN')}</span>
          </button>)}
        </aside>

        {table && <section className="min-w-0 space-y-6 xl:col-span-3">
          <div className="overflow-hidden rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#0E1D4F]">{table.name}</h3>
              <p className="mt-1 text-xs text-[#4B5875]">{table.description}</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-[#0E1D4F]/10">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="border-b border-[#0E1D4F]/10 bg-warm-paper text-[11px] uppercase text-[#4B5875]">
                  <tr><th className="px-4 py-3">Tên trường</th><th className="px-4 py-3">Kiểu dữ liệu</th><th className="px-4 py-3">Bắt buộc</th></tr>
                </thead>
                <tbody className="divide-y divide-[#0E1D4F]/10">
                  {table.fields.map(field => <tr key={field.name} className="hover:bg-warm-paper">
                    <td className="px-4 py-3 font-mono font-semibold text-[#0E1D4F]">{field.name}</td>
                    <td className="px-4 py-3 font-mono text-blue-700">{field.type}</td>
                    <td className="px-4 py-3">{field.required ? 'Có' : 'Không'}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-[#0E1D4F]/10 bg-warm-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h3 className="text-base font-bold text-[#0E1D4F]">Bản ghi</h3><p className="mt-1 text-xs text-[#4B5875]">Mỗi trang tối đa {PAGE_SIZE} bản ghi.</p></div>
              <button type="button" onClick={() => setReload(value => value + 1)} className={button}><Icon name="sync" size={14} />Tải lại</button>
            </div>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setPage(1); setQuery(queryDraft.trim()); }} className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="admin-entity-search">Tìm trong bản ghi</label>
              <input id="admin-entity-search" value={queryDraft} onChange={event => setQueryDraft(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#0E1D4F]/20 px-3 py-2.5 text-sm" placeholder="Tìm bản ghi…" />
              <button type="submit" className={button}><Icon name="search" size={14} />Tìm</button>
            </form>
            {recordsError && <p role="alert" className="text-sm text-rose-700">{recordsError}</p>}
            {!recordsError && !activeRecords && <p role="status" className="text-sm text-[#4B5875]">Đang tải bản ghi…</p>}
            {activeRecords && (activeRecords.items.length === 0 ? <p className="text-sm text-[#4B5875]">Không có bản ghi phù hợp.</p> : <div className="overflow-x-auto rounded-2xl border border-[#0E1D4F]/10">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-[#0E1D4F]/10 bg-warm-paper text-[11px] uppercase text-[#4B5875]">
                  <tr>{table.fields.map(field => <th key={field.name} className="px-4 py-3">{field.name}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#0E1D4F]/10">
                  {activeRecords.items.map((row, index) => <tr key={String(row.id ?? index)} className="hover:bg-warm-paper">
                    {table.fields.map(field => <td key={field.name} className="max-w-64 px-4 py-3 text-[#4B5875]" title={displayValue(row[field.name])}><span className="block truncate">{displayValue(row[field.name])}</span></td>)}
                  </tr>)}
                </tbody>
              </table>
            </div>)}
            {activeRecords && <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#4B5875]">
              <span>{activeRecords.total.toLocaleString('vi-VN')} bản ghi · Trang {activeRecords.page}/{totalPages || 1}</span>
              <div className="flex gap-2">
                <button type="button" disabled={activeRecords.page <= 1} onClick={() => setPage(value => value - 1)} className={button}>Trước</button>
                <button type="button" disabled={activeRecords.page >= totalPages} onClick={() => setPage(value => value + 1)} className={button}>Sau</button>
              </div>
            </div>}
          </div>
        </section>}
      </div>}
    </>}
  </div>;
}

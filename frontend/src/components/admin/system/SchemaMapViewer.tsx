'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import ConfirmModal from '../ConfirmModal';
import JsonImportModal from './JsonImportModal';
import {
  TableName,
  SCHEMA_REGISTRY,
  TableSchema,
  getAdminDataStore,
  subscribeAdminDataStore,
  deleteRecord,
  canDeleteRecord,
  addRecord,
  updateRecord,
} from '@/lib/adminDataStore';

export default function SchemaMapViewer() {
  const [selectedTableName, setSelectedTableName] = useState<TableName>('destinations');
  const [storeState, setStoreState] = useState(getAdminDataStore());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [recordFormData, setRecordFormData] = useState<Record<string, unknown>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // High-risk delete confirmation state (ADM-DATA-02B)
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<Record<string, unknown> | null>(null);
  const [blockedDeleteReason, setBlockedDeleteReason] = useState<string | null>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);

  const PAGE_SIZE = 6;

  // Subscribe to real-time store changes (ADM-DATA-01B)
  useEffect(() => {
    const unsubscribe = subscribeAdminDataStore((newStore) => {
      setStoreState(newStore);
    });
    return unsubscribe;
  }, []);

  const activeSchema: TableSchema = SCHEMA_REGISTRY[selectedTableName];
  const allRecords = useMemo(() => storeState[selectedTableName] || [], [storeState, selectedTableName]);

  // Filter records by search query
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return allRecords;
    const q = searchQuery.toLowerCase();
    return allRecords.filter((rec: Record<string, unknown>) =>
      Object.values(rec).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [allRecords, searchQuery]);

  // Pagination (ADM-SYS-04C): reset to page 1 on table change
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage, PAGE_SIZE]);

  const handleSelectTable = (table: TableName) => {
    setSelectedTableName(table);
    setCurrentPage(1);
    setSearchQuery('');
    setEditingRecord(null);
    setIsCreatingNew(false);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3500);
  };

  // Form handling (Add / Edit)
  const handleOpenCreate = () => {
    const emptyForm: Record<string, unknown> = {};
    activeSchema.fields.forEach((f) => {
      emptyForm[f.name] = f.type === 'number' ? 0 : f.type === 'boolean' ? false : '';
    });
    setRecordFormData(emptyForm);
    setFormErrors({});
    setIsCreatingNew(true);
    setEditingRecord(null);
  };

  const handleOpenEdit = (rec: Record<string, unknown>) => {
    setRecordFormData({ ...rec });
    setFormErrors({});
    setEditingRecord(rec);
    setIsCreatingNew(false);
  };

  const handleCloseForm = () => {
    setIsCreatingNew(false);
    setEditingRecord(null);
    setRecordFormData({});
    setFormErrors({});
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate required fields
    activeSchema.fields.forEach((f) => {
      const val = recordFormData[f.name];
      if (f.required && (val === undefined || val === null || String(val).trim() === '')) {
        errors[f.name] = `${f.label} là bắt buộc.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (isCreatingNew) {
      const res = addRecord(selectedTableName, recordFormData);
      if (!res.success) {
        showNotification(res.error || 'Lỗi thêm bản ghi', 'error');
        return;
      }
      showNotification(`Đã tạo mới bản ghi [${recordFormData.id}] trong bảng ${selectedTableName}`);
    } else if (editingRecord) {
      const res = updateRecord(selectedTableName, String(editingRecord.id), recordFormData);
      if (!res.success) {
        showNotification(res.error || 'Lỗi cập nhật bản ghi', 'error');
        return;
      }
      showNotification(`Đã cập nhật bản ghi [${editingRecord.id}] trong bảng ${selectedTableName}`);
    }

    handleCloseForm();
  };

  // Delete handling with referential integrity check (ADM-DATA-02B)
  const handleInitiateDelete = (rec: Record<string, unknown>, triggerEl: HTMLButtonElement) => {
    deleteTriggerRef.current = triggerEl;
    const check = canDeleteRecord(selectedTableName, String(rec.id));
    if (!check.canDelete) {
      setBlockedDeleteReason(check.reason || 'Bản ghi đang được tham chiếu bởi bảng khác.');
      return;
    }
    setPendingDeleteRecord(rec);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteRecord) return;
    const res = deleteRecord(selectedTableName, String(pendingDeleteRecord.id));
    if (res.success) {
      showNotification(`Đã xóa bản ghi [${pendingDeleteRecord.id}] khỏi bảng ${selectedTableName}`);
      if (paginatedRecords.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } else {
      showNotification(res.error || 'Lỗi xóa bản ghi', 'error');
    }
    setPendingDeleteRecord(null);
  };

  const handleImportSuccess = (count: number, table: string) => {
    showNotification(`Đã nạp thành công ${count} bản ghi vào bảng ${table} (Lưu trữ trình duyệt).`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notice && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-2xl text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            notice.type === 'error'
              ? 'bg-rose-600'
              : notice.type === 'warning'
              ? 'bg-amber-600'
              : 'bg-[#0E1D4F]'
          }`}
        >
          <Icon
            name={notice.type === 'error' ? 'error' : notice.type === 'warning' ? 'warning' : 'check_circle'}
            className="size-5 text-white"
          />
          <span className="text-xs font-semibold">{notice.message}</span>
        </div>
      )}

      {/* Blocked Delete Dialog (ADM-DATA-02B) */}
      {blockedDeleteReason && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setBlockedDeleteReason(null);
          }}
          tabIndex={-1}
        >
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-amber-300 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Icon name="gpp_bad" className="size-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#0E1D4F]">Thao tác xóa bị chặn</h4>
                <p className="text-xs text-[#4B5875] mt-1 leading-relaxed">{blockedDeleteReason}</p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 leading-relaxed border border-amber-200">
              Quy tắc toàn vẹn dữ liệu: Để tránh tạo ra các bản ghi con mồ côi (orphaned records), bạn phải xóa hoặc di chuyển các bản ghi con trước khi xóa bản ghi cha.
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setBlockedDeleteReason(null)}
                className="px-4 py-2 rounded-xl bg-[#0E1D4F] text-white text-xs font-semibold hover:bg-[#182a63] cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal (ADM-DATA-02B) */}
      <ConfirmModal
        isOpen={pendingDeleteRecord !== null}
        title={`Xác nhận xóa bản ghi [${pendingDeleteRecord?.id}]`}
        message={`Bạn có chắc chắn muốn xóa bản ghi này khỏi bảng ${selectedTableName}? Dữ liệu sau khi xóa sẽ được cập nhật trong bộ nhớ trình duyệt.`}
        subjectInfo={`Bảng: ${selectedTableName} · ID: ${pendingDeleteRecord?.id}`}
        consequenceWarning="Thao tác này sẽ gỡ bỏ bản ghi và có thể ảnh hưởng đến các màn hình hiển thị tương ứng."
        confirmLabel="Xóa bản ghi"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteRecord(null)}
        triggerRef={deleteTriggerRef}
      />

      {/* Schema Map Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-5">
        <div className="border-b border-[#0E1D4F]/10 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              SƠ ĐỒ CƠ SỞ DỮ LIỆU THỰC THỂ (SCHEMA MAP)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-[#205BD6] text-[10px] font-bold">
              5 THỰC THỂ DỮ LIỆU
            </span>
          </div>
          <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
            Kiến trúc Thực thể Dữ liệu &amp; Liên kết Bảng (Schema Entities)
          </h3>
          <p className="text-xs text-[#4B5875] mt-0.5">
            Mô hình hóa 5 bảng cốt lõi của VISTRA: điểm đến, hành trình, ngày lịch trình, điểm dừng hoạt động và hồ sơ phản hồi.
          </p>
        </div>

        {/* Entities Tabs (5 tables) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(Object.keys(SCHEMA_REGISTRY) as TableName[]).map((tbl) => {
            const schema = SCHEMA_REGISTRY[tbl];
            const isSelected = tbl === selectedTableName;
            const count = (storeState[tbl] || []).length;
            return (
              <button
                key={tbl}
                type="button"
                onClick={() => handleSelectTable(tbl)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? 'border-[#205BD6] bg-[#205BD6]/5 shadow-xs'
                    : 'border-[#0E1D4F]/10 bg-white hover:bg-[#EBF1F0]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0E1D4F]">{tbl}</span>
                  <span className="text-[10px] font-bold text-[#205BD6] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {count} records
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#205BD6] truncate">{schema.name}</h4>
                <p className="text-[11px] text-[#4B5875] line-clamp-2">{schema.description}</p>
              </button>
            );
          })}
        </div>

        {/* Schema Inspector with 6-column grid on desktop (ADM-SYS-04A) */}
        <div className="p-5 rounded-2xl bg-[#EBF1F0]/40 border border-[#0E1D4F]/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0E1D4F]/10 pb-2">
            <div>
              <span className="text-xs font-bold text-[#0E1D4F]">
                Bảng đang chọn: <code className="font-mono text-[#205BD6]">{selectedTableName}</code>
              </span>
              <span className="text-xs text-[#4B5875] ml-2">({activeSchema.description})</span>
            </div>
            <div className="text-xs text-[#4B5875] flex items-center gap-1">
              <span>Liên kết bảng:</span>
              <strong className="text-[#0E1D4F]">
                {activeSchema.relations.length > 0 ? activeSchema.relations.join(', ') : 'Không có khóa ngoại'}
              </strong>
            </div>
          </div>

          {/* 6 COLUMNS ON WIDE SCREENS (ADM-SYS-04A) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {activeSchema.fields.map((f, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-white border border-[#0E1D4F]/10 text-xs flex flex-col justify-between gap-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0E1D4F] truncate" title={f.name}>
                    {f.name}
                  </span>
                  {f.isPrimary && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                      PK
                    </span>
                  )}
                  {f.isForeign && (
                    <span className="text-[9px] bg-blue-100 text-[#205BD6] font-bold px-1 rounded">
                      FK
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#4B5875] truncate">{f.label}</div>
                <div className="flex items-center justify-between pt-1 border-t border-[#0E1D4F]/5">
                  <span className="font-mono text-[9px] text-[#205BD6] bg-[#205BD6]/10 px-1 py-0.2 rounded">
                    {f.type}
                  </span>
                  {f.required && <span className="text-[9px] text-red-500 font-bold">Bắt buộc</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Record Viewer & Editor Table (ADM-SYS-04B, ADM-DATA-03..05, ADM-LIST-01) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#0E1D4F]/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
                BẢN GHI DỮ LIỆU THỰC THỂ
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
              <span className="font-mono text-xs font-bold text-[#205BD6]">
                {selectedTableName} ({allRecords.length} records)
              </span>
            </div>
            <p className="text-xs text-[#4B5875]">
              Quản lý danh sách, thêm mới, điều chỉnh và xóa bản ghi với kiểm tra toàn vẹn liên kết.
            </p>
          </div>

          {/* Action Buttons: Add Record + Raw JSON Import in the Data Block (ADM-SYS-04B) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#205BD6] text-[#205BD6] hover:bg-[#205BD6]/5 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Icon name="add" className="size-4" />
              <span>Thêm bản ghi</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Icon name="file_upload" className="size-4" />
              <span>Nhập JSON cho bảng này</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Header (ADM-SYS-04C) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder={`Tìm kiếm trong ${selectedTableName}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-[#0E1D4F]/15 text-xs text-[#0E1D4F] focus:outline-none focus:border-[#205BD6]"
            />
            <Icon name="search" className="size-4 text-[#4B5875] absolute left-2.5 top-2.5" />
          </div>

          <span className="text-xs text-[#4B5875] self-center">
            Hiển thị {paginatedRecords.length} / {filteredRecords.length} bản ghi
          </span>
        </div>

        {/* Dynamic Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0E1D4F]">
            <thead className="bg-[#EBF1F0] text-[#0E1D4F] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                {activeSchema.fields.map((f) => (
                  <th key={f.name} className="py-3 px-3">
                    {f.label}
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1D4F]/5">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={activeSchema.fields.length + 1} className="py-10 text-center text-[#4B5875]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Icon name="inbox" className="size-6 text-[#4B5875]/50" />
                      <span className="text-xs font-semibold">Chưa có bản ghi nào trong bảng này</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec: Record<string, unknown>, idx: number) => (
                  <tr key={String(rec.id || idx)} className="hover:bg-[#EBF1F0]/40 transition-colors">
                    {activeSchema.fields.map((f) => {
                      const val = rec[f.name];
                      return (
                        <td key={f.name} className="py-3 px-3 text-xs max-w-[200px] truncate" title={String(val ?? '')}>
                          {f.isPrimary ? (
                            <span className="font-mono font-bold text-[#205BD6]">{String(val ?? '')}</span>
                          ) : f.type === 'boolean' ? (
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                val ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {val ? 'Có' : 'Không'}
                            </span>
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="px-2.5 py-1 rounded-lg bg-[#205BD6]/10 text-[#205BD6] hover:bg-[#205BD6] hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleInitiateDelete(rec, e.currentTarget)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (ADM-SYS-04C, ADM-LIST-01) */}
        <div className="pt-3 border-t border-[#0E1D4F]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5875]">
          <div>
            Trang <strong className="text-[#0E1D4F]">{currentPage}</strong> /{' '}
            <strong className="text-[#0E1D4F]">{totalPages}</strong> ({filteredRecords.length} bản ghi)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-xl border border-[#0E1D4F]/15 bg-white text-[#0E1D4F] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] transition-colors cursor-pointer"
            >
              ← Trước
            </button>
            <span className="px-2 font-mono">{currentPage}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-[#0E1D4F]/15 bg-white text-[#0E1D4F] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] transition-colors cursor-pointer"
            >
              Sau →
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT RECORD MODAL */}
      {(isCreatingNew || editingRecord) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCloseForm();
          }}
          tabIndex={-1}
        >
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#205BD6]">
                  {selectedTableName}
                </span>
                <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                  {isCreatingNew ? 'Thêm bản ghi thực thể mới' : `Chỉnh sửa bản ghi [${editingRecord?.id}]`}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] border border-[#0E1D4F]/10 cursor-pointer"
                aria-label="Đóng form bản ghi"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              {activeSchema.fields.map((f) => {
                const val = recordFormData[f.name];
                const error = formErrors[f.name];
                const isIdDisabled = !isCreatingNew && f.isPrimary;

                return (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold text-[#0E1D4F] mb-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                      {f.isPrimary && <span className="text-[10px] text-[#4B5875] ml-1">(Khóa chính)</span>}
                      {f.isForeign && <span className="text-[10px] text-[#205BD6] ml-1">(Khóa ngoại → {f.foreignTable})</span>}
                    </label>

                    {f.type === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) =>
                            setRecordFormData((prev) => ({ ...prev, [f.name]: e.target.checked }))
                          }
                          className="rounded text-[#205BD6]"
                        />
                        <span className="text-xs text-[#0E1D4F]">Kích hoạt / Bật</span>
                      </label>
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        disabled={isIdDisabled}
                        value={val !== undefined && val !== null ? String(val) : ''}
                        onChange={(e) => {
                          const updatedVal =
                            f.type === 'number' ? Number(e.target.value) : e.target.value;
                          setRecordFormData((prev) => ({ ...prev, [f.name]: updatedVal }));
                          if (formErrors[f.name]) {
                            setFormErrors((prev) => ({ ...prev, [f.name]: '' }));
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs text-[#0E1D4F] focus:outline-none ${
                          error ? 'border-red-500 bg-red-50/30' : 'border-[#0E1D4F]/15 bg-white'
                        } ${isIdDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                      />
                    )}

                    {error && <span className="text-[11px] text-red-500 font-medium mt-0.5 block">{error}</span>}
                  </div>
                );
              })}

              <div className="pt-3 border-t border-[#0E1D4F]/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F] font-semibold text-xs hover:bg-[#EBF1F0]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#205BD6] text-white font-semibold text-xs hover:bg-[#1847a8] shadow-xs"
                >
                  {isCreatingNew ? 'Thêm bản ghi' : 'Lưu cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      <JsonImportModal
        isOpen={isImportModalOpen}
        activeTable={selectedTableName}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

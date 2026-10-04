'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import {
  TableName,
  SCHEMA_REGISTRY,
  validateBatchJson,
  executeBatchImport,
  BatchValidationResult,
  ValidatedRecordItem,
} from '@/lib/adminDataStore';

interface JsonImportModalProps {
  isOpen: boolean;
  activeTable?: TableName;
  onClose: () => void;
  onImportSuccess: (count: number, tableName: string) => void;
}

const SAMPLE_JSONS: Record<TableName, string> = {
  destinations: JSON.stringify(
    [
      {
        id: 'DEST-NEW-01',
        name: 'Cao Bằng - Thác Bản Giốc',
        region: 'Đông Bắc',
        duration: '3N2Đ',
        estimatedCost: '3.800.000 ₫',
        visualMatch: 92,
        budgetMatch: 89,
        goldenHour: '06:30 Bình minh thác',
      },
      {
        id: 'DEST-NEW-02',
        name: 'Y Tý - Biển Mây Mường Hum',
        region: 'Tây Bắc',
        duration: '3N2Đ',
        estimatedCost: '3.400.000 ₫',
        visualMatch: 95,
        budgetMatch: 91,
        goldenHour: '16:45 Hoàng hôn ngắm mây',
      },
    ],
    null,
    2
  ),
  plans: JSON.stringify(
    [
      {
        id: 'PLAN-NEW-01',
        userId: 'USR-101',
        title: 'Hành trình Mùa thu Tây Bắc',
        destination: 'Sa Pa',
        status: 'draft',
        isPublished: true,
        duration: '3N2Đ',
        budget: '7.500.000 ₫',
        createdAt: '03/10/2026',
      },
    ],
    null,
    2
  ),
  itinerary_days: JSON.stringify(
    [
      {
        id: 'DAY-NEW-01',
        planId: 'sapa-autumn-retreat',
        dayNumber: 4,
        title: 'Ngày 4: Bản Tả Van & Chợ phiên',
        theme: 'Văn hóa bản địa & Trải nghiệm thong thả',
      },
    ],
    null,
    2
  ),
  activities: JSON.stringify(
    [
      {
        id: 'ACT-NEW-01',
        dayId: 'DAY-sapa-autumn-retreat-1',
        time: '16:30',
        title: 'Thưởng trà chiều ngắm thung lũng Mường Hoa',
        location: 'Eco-Lodge Cafe',
        category: 'Thư giãn',
        cost: '150.000 ₫',
      },
    ],
    null,
    2
  ),
  feedback_tickets: JSON.stringify(
    [
      {
        id: 'FB-NEW-01',
        userName: 'Trần Văn Hoàng',
        userEmail: 'hoang.tran@gmail.com',
        category: 'Lỗi logic hành trình',
        severity: 'Trung bình',
        status: 'Chờ phân loại',
        subject: 'Cần cập nhật giờ xe buýt đưa đón Fansipan',
        createdAt: '03/10/2026 10:15',
      },
    ],
    null,
    2
  ),
};

export default function JsonImportModal({
  isOpen,
  activeTable = 'destinations',
  onClose,
  onImportSuccess,
}: JsonImportModalProps) {
  const [targetTable, setTargetTable] = useState<TableName>(activeTable);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_JSONS[activeTable] || '');
  const [validationResult, setValidationResult] = useState<BatchValidationResult | null>(null);
  const [reviewedRecords, setReviewedRecords] = useState<ValidatedRecordItem[]>([]);

  const [prevProps, setPrevProps] = useState({ activeTable, isOpen });
  if (activeTable !== prevProps.activeTable || isOpen !== prevProps.isOpen) {
    setPrevProps({ activeTable, isOpen });
    setTargetTable(activeTable);
    setJsonInput(SAMPLE_JSONS[activeTable] || '');
    setStep('input');
    setValidationResult(null);
  }

  if (!isOpen) return null;

  const currentSchema = SCHEMA_REGISTRY[targetTable];

  const handleTableChange = (newTable: TableName) => {
    setTargetTable(newTable);
    setJsonInput(SAMPLE_JSONS[newTable] || '');
    setStep('input');
    setValidationResult(null);
    setReviewedRecords([]);
  };

  // Step 1: Validate
  const handleValidate = () => {
    const result = validateBatchJson(targetTable, jsonInput);
    setValidationResult(result);
    if (result.isSyntaxValid) {
      setReviewedRecords(result.records);
      setStep('review');
    }
  };

  // Allow removing an invalid or unwanted record in review step
  const handleRemoveRecord = (index: number) => {
    setReviewedRecords((prev) => prev.filter((r) => r.index !== index));
  };

  // Step 2: Confirm & Import
  const validRecordsToImport = reviewedRecords.filter((r) => r.isValid);
  const remainingInvalidCount = reviewedRecords.filter((r) => !r.isValid).length;
  const canConfirm = validRecordsToImport.length > 0 && remainingInvalidCount === 0;

  const handleConfirmImport = () => {
    const dataList = validRecordsToImport.map((r) => r.data);
    const { importedCount } = executeBatchImport(targetTable, dataList);
    onImportSuccess(importedCount, targetTable);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setStep('input');
    setValidationResult(null);
    setReviewedRecords([]);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleResetAndClose();
      }}
      tabIndex={-1}
    >
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (FIX-12: aria-label on close button) */}
        <div className="p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-[#205BD6] font-bold">
                CÔNG CỤ NHẬP LIỆU DỮ LIỆU JSON CHUẨN HÓA
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white text-[#0E1D4F] font-semibold border border-[#0E1D4F]/10">
                Bước {step === 'input' ? '1: Nhập mã' : '2: Kiểm định (Review & Confirm)'}
              </span>
            </div>
            <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
              {step === 'input'
                ? `Nhập Dữ liệu Bảng [${targetTable}] qua JSON`
                : `Kiểm định Cấu trúc Bảng [${targetTable}] & Xác nhận`}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] border border-[#0E1D4F]/10 cursor-pointer"
            aria-label="Đóng hộp thoại nhập JSON"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {step === 'input' ? (
            <>
              {/* Table Selector (ADM-SYS-04B: source of truth from selected table) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0E1D4F]">Bảng thực thể đích:</span>
                  <select
                    value={targetTable}
                    onChange={(e) => handleTableChange(e.target.value as TableName)}
                    className="px-3 py-1.5 rounded-xl border border-[#0E1D4F]/15 bg-white font-mono font-bold text-[#205BD6] focus:outline-none"
                  >
                    {Object.values(SCHEMA_REGISTRY).map((s) => (
                      <option key={s.tableName} value={s.tableName}>
                        {s.tableName} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setJsonInput(SAMPLE_JSONS[targetTable] || '')}
                  className="text-xs text-[#205BD6] font-semibold hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Tải mẫu JSON hợp lệ cho bảng này
                </button>
              </div>

              {/* Syntax Error Notice */}
              {validationResult && !validationResult.isSyntaxValid && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <Icon name="error" className="size-4 shrink-0" />
                  <span>
                    <strong>Lỗi cú pháp:</strong> {validationResult.syntaxError}
                  </span>
                </div>
              )}

              {/* JSON Textarea */}
              <div>
                <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                  Dán nội dung mảng JSON các bản ghi cần nhập:
                </label>
                <textarea
                  rows={10}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={'[\n  {\n    "id": "..."\n  }\n]'}
                  className="w-full p-3.5 rounded-xl border border-[#0E1D4F]/15 bg-gray-50 font-mono text-[11px] text-[#0E1D4F] focus:outline-none focus:border-[#205BD6] leading-relaxed"
                />
              </div>

              {/* Schema Fields Reference */}
              <div className="p-3.5 rounded-xl bg-[#EBF1F0]/50 border border-[#0E1D4F]/10 space-y-1.5">
                <span className="font-semibold text-[#0E1D4F] block">
                  Các trường trong schema <code>{targetTable}</code>:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentSchema.fields.map((f) => (
                    <span
                      key={f.name}
                      className="px-2 py-0.5 rounded bg-white border border-[#0E1D4F]/10 text-[10px] font-mono text-[#4B5875]"
                    >
                      {f.name}
                      {f.required ? ' *' : ''} ({f.type})
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#0E1D4F]/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F] font-semibold hover:bg-[#EBF1F0] transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={!jsonInput.trim()}
                  className="px-5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-40 text-white font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="fact_check" className="size-4" />
                  <span>Kiểm tra &amp; Xem trước (Validate)</span>
                </button>
              </div>
            </>
          ) : (
            /* STEP 2: Review & Confirm (ADM-DATA-06B, ADM-DATA-06C, ADM-DATA-06D) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-[#0E1D4F]/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#0E1D4F]">
                    Tổng số bản ghi: {reviewedRecords.length}
                  </span>
                  <div className="text-[11px] text-[#4B5875] mt-0.5">
                    Hợp lệ: <strong className="text-emerald-600">{validRecordsToImport.length}</strong> ·{' '}
                    Lỗi: <strong className="text-red-600">{remainingInvalidCount}</strong>
                  </div>
                </div>

                {validationResult?.hasDuplicates && (
                  <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-[10px] font-bold border border-red-200">
                    ✕ Phát hiện ID trùng lặp
                  </span>
                )}
              </div>

              {/* Duplicate ID Warning Banner (ADM-DATA-06C) */}
              {validationResult?.hasDuplicates && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Icon name="block" className="size-4" />
                    <span>Lô nhập bị chặn do trùng lặp mã định danh (Primary Key):</span>
                  </div>
                  <p className="text-[11px] text-red-600">
                    Các mã xung đột: <strong>{validationResult.duplicateIds.join(', ')}</strong>. Vui lòng
                    chỉnh sửa mã hoặc bấm nút loại bỏ (Xóa) bản ghi lỗi bên dưới.
                  </p>
                </div>
              )}

              {/* Record by record review list */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {reviewedRecords.map((r) => (
                  <div
                    key={r.index}
                    className={`p-3.5 rounded-xl border transition-all ${
                      r.isValid
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0E1D4F]">
                          Bản ghi #{r.index}:{' '}
                          {String(r.data.name || r.data.title || r.data.id || 'Không có tên')}
                        </span>
                        {r.data.id ? (
                          <span className="font-mono text-[10px] text-[#4B5875]">({String(r.data.id)})</span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            r.isValid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {r.isValid ? 'HỢP LỆ' : 'KHÔNG HỢP LỆ'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecord(r.index)}
                          className="px-2 py-0.5 rounded text-[10px] text-red-600 hover:bg-red-50 font-semibold cursor-pointer border border-red-200"
                          title="Loại bỏ bản ghi này khỏi lô nhập"
                        >
                          Loại bỏ
                        </button>
                      </div>
                    </div>

                    {!r.isValid && (
                      <ul className="space-y-0.5 text-[11px] text-red-600 list-disc list-inside pt-1">
                        {r.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#0E1D4F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-2 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F] font-semibold hover:bg-[#EBF1F0] transition-colors cursor-pointer"
                >
                  ← Quay lại chỉnh sửa JSON
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canConfirm}
                    onClick={handleConfirmImport}
                    className="px-5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Xác nhận nhập ({validRecordsToImport.length} bản ghi)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

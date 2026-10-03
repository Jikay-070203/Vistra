'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

interface ImportRecordData {
  id?: string;
  name?: string;
  region?: string;
  duration?: string;
  estimatedCost?: string;
  visualMatch?: number;
  budgetMatch?: number;
  goldenHour?: string;
  [key: string]: unknown;
}

interface ValidationResult {
  recordIndex: number;
  data: ImportRecordData;
  isValid: boolean;
  errors: string[];
}

const SAMPLE_VALID_JSON = JSON.stringify(
  [
    {
      id: 'DEST-NEW-01',
      name: 'Cao Bằng - Thác Bản Giốc',
      region: 'Đông Bắc',
      duration: '3N2Đ',
      estimatedCost: '3.800.000 ₫',
      visualMatch: 91,
      budgetMatch: 88,
      goldenHour: '06:30 Bình minh thác',
    },
    {
      id: 'DEST-NEW-02',
      name: 'Y Tý - Mường Hum',
      region: 'Tây Bắc',
      duration: '3N2Đ',
      estimatedCost: '3.400.000 ₫',
      visualMatch: 95,
      budgetMatch: 90,
      goldenHour: '16:45 Hoàng hôn biển mây',
    },
  ],
  null,
  2
);

const SAMPLE_INVALID_JSON = JSON.stringify(
  [
    {
      id: 'DEST-ERR-01',
      name: 'Hồ Ba Bể',
      region: 'Đông Bắc',
      duration: '2N1Đ',
      estimatedCost: '2.500.000 ₫',
      visualMatch: 88,
      budgetMatch: 92,
      goldenHour: '06:00 Sương mù hồ',
    },
    {
      id: '', // Missing ID
      name: 'Mù Cang Chải',
      region: 'Tây Bắc',
      // Missing duration
      visualMatch: 'not-a-number', // Invalid type
      goldenHour: '17:00 Mâm xôi',
    },
  ],
  null,
  2
);

export default function JsonImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: JsonImportModalProps) {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [targetTable, setTargetTable] = useState<'destinations' | 'plans' | 'feedback_tickets'>('destinations');
  const [jsonInput, setJsonInput] = useState(SAMPLE_VALID_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validatedRecords, setValidatedRecords] = useState<ValidationResult[]>([]);

  if (!isOpen) return null;

  const handleValidate = () => {
    setParseError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setParseError('Dữ liệu JSON phải là một mảng (Array) các đối tượng bản ghi.');
        return;
      }
      if (parsed.length === 0) {
        setParseError('Mảng JSON không chứa bản ghi nào.');
        return;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setParseError(`Lỗi cú pháp JSON không hợp lệ: ${errMsg}`);
      return;
    }

    // Validate fields according to target schema (e.g. destinations)
    const records = parsed as ImportRecordData[];
    const results: ValidationResult[] = records.map((item: ImportRecordData, idx: number) => {
      const errors: string[] = [];

      if (!item.id || typeof item.id !== 'string') {
        errors.push('Thiếu trường khóa chính [id] hoặc id không phải chuỗi ký tự.');
      }
      if (!item.name || typeof item.name !== 'string') {
        errors.push('Thiếu trường [name] của điểm đến.');
      }
      if (!item.duration || typeof item.duration !== 'string') {
        errors.push('Thiếu trường thời lượng [duration].');
      }
      if (
        item.visualMatch === undefined ||
        typeof item.visualMatch !== 'number' ||
        isNaN(item.visualMatch) ||
        item.visualMatch < 0 ||
        item.visualMatch > 100
      ) {
        errors.push('Trường [visualMatch] phải là số từ 0 đến 100.');
      }

      return {
        recordIndex: idx + 1,
        data: item,
        isValid: errors.length === 0,
        errors,
      };
    });

    setValidatedRecords(results);
    setStep('review');
  };

  const validCount = validatedRecords.filter((r) => r.isValid).length;
  const invalidCount = validatedRecords.filter((r) => !r.isValid).length;
  const hasInvalid = invalidCount > 0;

  const handleConfirmImport = (onlyValid: boolean = false) => {
    const importableCount = onlyValid ? validCount : validatedRecords.length;
    onImportSuccess(importableCount);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setStep('input');
    setParseError(null);
    setValidatedRecords([]);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
    >
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
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
                ? 'Nhập Dữ liệu Hệ thống qua Định dạng JSON'
                : 'Kiểm định Cấu trúc Dữ liệu & Xác nhận Nhập'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] border border-[#0E1D4F]/10 cursor-pointer"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {step === 'input' ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0E1D4F]">Bảng thực thể đích:</span>
                  <select
                    value={targetTable}
                    onChange={(e) => setTargetTable(e.target.value as 'destinations' | 'plans' | 'feedback_tickets')}
                    className="px-3 py-1.5 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/15 font-mono text-[#0E1D4F]"
                  >
                    <option value="destinations">destinations (Điểm đến)</option>
                    <option value="plans">plans (Lịch trình)</option>
                    <option value="feedback_tickets">feedback_tickets (Hồ sơ phản hồi)</option>
                  </select>
                </div>

                {/* Sample load buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setJsonInput(SAMPLE_VALID_JSON);
                      setParseError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold cursor-pointer"
                  >
                    Mẫu hợp lệ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJsonInput(SAMPLE_INVALID_JSON);
                      setParseError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-semibold cursor-pointer"
                  >
                    Mẫu có lỗi
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0E1D4F] mb-1.5">
                  Dán nội dung JSON (Mảng các bản ghi):
                </label>
                <textarea
                  rows={10}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] text-[#0E1D4F] bg-[#EBF1F0]/20"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
                  <Icon name="error" className="size-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-[#0E1D4F]/10">
                <span className="text-[#4B5875]">
                  Hệ thống sẽ đối chiếu schema bắt buộc trước khi cho phép nhập vào cơ sở dữ liệu.
                </span>
                <button
                  type="button"
                  onClick={handleValidate}
                  className="px-5 py-2.5 bg-[#205BD6] hover:bg-[#1847a8] text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Kiểm định cú pháp (Review)</span>
                  <Icon name="arrow_forward" className="size-4" />
                </button>
              </div>
            </>
          ) : (
            /* Review & Confirm Step */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#EBF1F0]/50 border border-[#0E1D4F]/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#0E1D4F]">
                    Tổng số bản ghi: <strong>{validatedRecords.length}</strong>
                  </span>
                  <span className="w-px h-4 bg-[#0E1D4F]/20"></span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Icon name="check_circle" className="size-4" />
                    <span>{validCount} Hợp lệ</span>
                  </span>
                  {hasInvalid && (
                    <>
                      <span className="w-px h-4 bg-[#0E1D4F]/20"></span>
                      <span className="text-red-600 font-bold flex items-center gap-1">
                        <Icon name="error" className="size-4" />
                        <span>{invalidCount} Lỗi định dạng</span>
                      </span>
                    </>
                  )}
                </div>

                {hasInvalid && (
                  <span className="text-[11px] text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded-lg border border-red-200">
                    Chặn xác nhận toàn bộ do có bản ghi lỗi
                  </span>
                )}
              </div>

              {/* Records List Review */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {validatedRecords.map((r) => (
                  <div
                    key={r.recordIndex}
                    className={`p-3.5 rounded-xl border transition-all ${
                      r.isValid
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-red-300 bg-red-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0E1D4F]">
                          Bản ghi #{r.recordIndex}: {r.data.name || r.data.id || 'Không có tên'}
                        </span>
                        {r.data.id && (
                          <span className="font-mono text-[10px] text-[#4B5875]">({r.data.id})</span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          r.isValid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.isValid ? 'HỢP LỆ' : 'KHÔNG HỢP LỆ'}
                      </span>
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
                  {hasInvalid && validCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleConfirmImport(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors cursor-pointer"
                    >
                      Chỉ nhập {validCount} bản ghi hợp lệ
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={hasInvalid || validCount === 0}
                    onClick={() => handleConfirmImport(false)}
                    className="px-5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Xác nhận nhập tất cả ({validCount} bản ghi)
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

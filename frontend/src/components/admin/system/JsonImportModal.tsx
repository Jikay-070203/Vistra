'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import MockBadge from '../demo/MockBadge';
import {
  DEMO_ENTITY_TABLES,
  DemoEntityTable,
  validateRecordAgainstSchema,
  ValidatedRecord,
} from './demoSchema';

interface JsonImportModalProps {
  isOpen: boolean;
  activeTable?: string;
  onClose: () => void;
  onImportSuccess?: (count: number, tableName: string) => void;
}

export type ImportMode = 'single_form' | 'bulk_json';

export default function JsonImportModal({
  isOpen,
  activeTable = 'provinces',
  onClose,
  onImportSuccess,
}: JsonImportModalProps) {
  if (!isOpen) return null;
  return (
    <JsonImportModalInner
      activeTableId={activeTable}
      onClose={onClose}
      onImportSuccess={onImportSuccess}
    />
  );
}

function JsonImportModalInner({
  activeTableId,
  onClose,
  onImportSuccess,
}: {
  activeTableId: string;
  onClose: () => void;
  onImportSuccess?: (count: number, tableName: string) => void;
}) {
  const [selectedTableId, setSelectedTableId] = useState(activeTableId);
  const currentTable: DemoEntityTable = useMemo(() => {
    return (
      DEMO_ENTITY_TABLES.find((t) => t.id === selectedTableId) || DEMO_ENTITY_TABLES[0]
    );
  }, [selectedTableId]);

  const [mode, setMode] = useState<ImportMode>('bulk_json');

  // Single Form State
  const [singleFormData, setSingleFormData] = useState<Record<string, string>>({});
  const [singleFormTouched, setSingleFormTouched] = useState(false);

  // Bulk JSON State
  const [jsonText, setJsonText] = useState(currentTable.sampleJson);

  // Simulation Status
  const [simulationResult, setSimulationResult] = useState<{
    count: number;
    table: string;
  } | null>(null);

  // Validate single form record
  const singleRecordValidation = useMemo<ValidatedRecord>(() => {
    const rawData: Record<string, unknown> = {};
    for (const field of currentTable.fields) {
      const val = singleFormData[field.name];
      if (val === undefined || val === '') {
        continue;
      }
      if (field.type === 'number') {
        const num = Number(val);
        rawData[field.name] = Number.isNaN(num) ? val : num;
      } else if (field.type === 'array') {
        rawData[field.name] = val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        rawData[field.name] = val;
      }
    }

    return validateRecordAgainstSchema(rawData, currentTable, 0);
  }, [singleFormData, currentTable]);

  // Validate bulk JSON
  const bulkValidationResult = useMemo<{
    isValidJson: boolean;
    syntaxError: string | null;
    records: ValidatedRecord[];
    validCount: number;
    invalidCount: number;
  }>(() => {
    if (!jsonText.trim()) {
      return { isValidJson: true, syntaxError: null, records: [], validCount: 0, invalidCount: 0 };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err: unknown) {
      return {
        isValidJson: false,
        syntaxError: err instanceof Error ? err.message : 'Lỗi cú pháp JSON',
        records: [],
        validCount: 0,
        invalidCount: 0,
      };
    }

    if (!Array.isArray(parsed)) {
      if (typeof parsed === 'object' && parsed !== null) {
        // Single object entered in JSON bulk mode
        const single = validateRecordAgainstSchema(parsed, currentTable, 0);
        return {
          isValidJson: true,
          syntaxError: null,
          records: [single],
          validCount: single.isValid ? 1 : 0,
          invalidCount: single.isValid ? 0 : 1,
        };
      }
      return {
        isValidJson: false,
        syntaxError: 'Dữ liệu JSON phải là một mảng các đối tượng (Array of objects)',
        records: [],
        validCount: 0,
        invalidCount: 0,
      };
    }

    const validatedList = parsed.map((item, idx) =>
      validateRecordAgainstSchema(item, currentTable, idx)
    );

    const validCount = validatedList.filter((r) => r.isValid).length;
    const invalidCount = validatedList.length - validCount;

    return {
      isValidJson: true,
      syntaxError: null,
      records: validatedList,
      validCount,
      invalidCount,
    };
  }, [jsonText, currentTable]);

  // Load sample template
  const handleLoadSample = () => {
    setJsonText(currentTable.sampleJson);
  };

  // Handle single form input change
  const handleFieldChange = (name: string, value: string) => {
    setSingleFormData((prev) => ({ ...prev, [name]: value }));
    setSingleFormTouched(true);
  };

  // Perform Simulation
  const handleConfirmSimulation = () => {
    const count =
      mode === 'single_form'
        ? singleRecordValidation.isValid
          ? 1
          : 0
        : bulkValidationResult.validCount;

    if (count === 0) return;

    setSimulationResult({ count, table: currentTable.name });
    if (onImportSuccess) {
      onImportSuccess(count, currentTable.id);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="json-import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1D4F]/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 id="json-import-modal-title" className="font-bold text-base text-[#0E1D4F]">
                  Nhập dữ liệu thực thể (JSON Import)
                </h3>
                <MockBadge size="sm" />
              </div>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Mô phỏng quy trình nhập dữ liệu vào bảng thực thể • Backend chưa hỗ trợ API import
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Table Selector & Mode Switch Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Bảng mục tiêu:</span>
            <select
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                const tbl = DEMO_ENTITY_TABLES.find((t) => t.id === e.target.value);
                if (tbl) setJsonText(tbl.sampleJson);
                setSingleFormData({});
                setSingleFormTouched(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold text-[#0E1D4F] bg-slate-50"
            >
              {DEMO_ENTITY_TABLES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('single_form')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                mode === 'single_form'
                  ? 'bg-white text-[#205BD6] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nhập 1 bản ghi (Form)
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk_json')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                mode === 'bulk_json'
                  ? 'bg-white text-[#205BD6] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dán JSON hàng loạt
            </button>
          </div>
        </div>

        {/* Simulation Success Screen */}
        {simulationResult ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Icon name="check_circle" size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-lg text-[#0E1D4F]">
                Mô phỏng kiểm tra thành công!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Đã kiểm tra cú pháp và cấu trúc hợp lệ cho{' '}
                <strong className="text-emerald-700">{simulationResult.count} bản ghi</strong> của{' '}
                <strong>{simulationResult.table}</strong>.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 max-w-md mx-auto">
              <p className="font-semibold flex items-center justify-center gap-1">
                <Icon name="science" size={14} />
                Lưu ý: Dữ liệu minh họa
              </p>
              <p className="text-[11px] mt-0.5">
                Các bản ghi chưa được ghi vào cơ sở dữ liệu thật vì Backend chưa có API import thực thể.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSimulationResult(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Nhập tiếp
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#205BD6] text-white text-xs font-bold hover:bg-[#1847a8]"
              >
                Hoàn tất &amp; Đóng
              </button>
            </div>
          </div>
        ) : (
          /* Main Form / JSON Area */
          <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
            {/* Schema guidance box */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0E1D4F] flex items-center gap-1">
                  <Icon name="schema" size={14} className="text-[#205BD6]" />
                  Quy tắc Schema minh họa ({currentTable.fields.length} trường)
                </span>
                <span className="text-[11px] text-[#4B5875]">
                  Dữ liệu demo • Chưa kết nối DB
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {currentTable.fields.map((f) => (
                  <div
                    key={f.name}
                    className="p-2 rounded-lg bg-white border border-slate-200/80 space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{f.name}</span>
                      <span className="text-slate-500 font-mono">
                        {f.type} {f.required && <span className="text-red-500 font-bold">*</span>}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[10px]">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {mode === 'single_form' ? (
              /* SINGLE FORM MODE */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentTable.fields.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <label
                        htmlFor={`field-${field.name}`}
                        className="block font-semibold text-slate-700 text-xs"
                      >
                        {field.name}{' '}
                        {field.required && <span className="text-red-500">*</span>}
                        <span className="text-slate-400 font-normal ml-1">({field.type})</span>
                      </label>
                      <input
                        id={`field-${field.name}`}
                        type="text"
                        value={singleFormData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={`Ví dụ: ${String(field.example)}`}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:border-[#205BD6]"
                      />
                      <p className="text-[10px] text-slate-500">{field.description}</p>
                    </div>
                  ))}
                </div>

                {singleFormTouched && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      singleRecordValidation.isValid
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {singleRecordValidation.isValid ? (
                      <p className="font-semibold flex items-center gap-1.5">
                        <Icon name="check_circle" size={14} className="text-emerald-600" />
                        Bản ghi hợp lệ theo quy tắc schema minh họa.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <Icon name="error" size={14} className="text-red-500" />
                          Phát hiện lỗi cấu trúc:
                        </p>
                        <ul className="list-disc list-inside text-[11px] space-y-0.5 ml-1">
                          {singleRecordValidation.issues.map((issue, idx) => (
                            <li key={idx}>{issue.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* BULK JSON MODE */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="json-textarea-input" className="font-semibold text-slate-700">
                    Dán nội dung JSON (Mảng các object):
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-[11px] font-bold text-[#205BD6] hover:underline flex items-center gap-1"
                  >
                    <Icon name="refresh" size={12} />
                    Tải mẫu JSON hợp lệ
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    id="json-textarea-input"
                    rows={8}
                    value={jsonText}
                    onChange={(e) => {
                      setJsonText(e.target.value);
                    }}
                    placeholder={'[\n  {\n    "code": 79,\n    "name": "TP. Hồ Chí Minh",\n    "region": "Miền Nam"\n  }\n]'}
                    className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs text-slate-800 ${
                      !bulkValidationResult.isValidJson
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-slate-300 focus:border-[#205BD6]'
                    }`}
                  />
                </div>

                {/* Validation summary banner */}
                {!bulkValidationResult.isValidJson ? (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2"
                  >
                    <Icon name="error" size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Lỗi cú pháp JSON (Syntax Error)</p>
                      {bulkValidationResult.syntaxError && (
                        <p className="text-[11px] font-mono text-red-800 bg-red-100/60 px-2 py-0.5 rounded mt-1">
                          {bulkValidationResult.syntaxError}
                        </p>
                      )}
                      <p className="text-[11px] mt-1 text-red-600">
                        Chuỗi dán vào không phải là JSON hợp lệ hoặc thiếu dấu ngoặc đóng/mở. Hãy kiểm tra lại dấu phẩy, ngoặc kép và định dạng mảng.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0E1D4F]">
                        Kết quả phân tích ({bulkValidationResult.records.length} bản ghi)
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {bulkValidationResult.validCount} hợp lệ
                        </span>
                        {bulkValidationResult.invalidCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                            {bulkValidationResult.invalidCount} lỗi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Records breakdown list */}
                    {bulkValidationResult.records.length > 0 && (
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100 text-xs">
                        {bulkValidationResult.records.map((rec) => (
                          <div
                            key={rec.index}
                            className="p-2.5 flex items-start justify-between gap-3 hover:bg-white transition-colors"
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              {rec.isValid ? (
                                <Icon
                                  name="check_circle"
                                  size={16}
                                  className="text-emerald-500 shrink-0 mt-0.5"
                                />
                              ) : (
                                <Icon
                                  name="error"
                                  size={16}
                                  className="text-red-500 shrink-0 mt-0.5"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800 font-mono text-[11px]">
                                    #{rec.index + 1}
                                  </span>
                                  <span className="truncate text-slate-700">
                                    {String(rec.data.name || rec.data.id || 'Bản ghi')}
                                  </span>
                                </div>
                                {!rec.isValid && (
                                  <ul className="mt-1 list-disc list-inside text-[10px] text-red-600 space-y-0.5">
                                    {rec.issues.map((iss, i) => (
                                      <li key={i}>{iss.message}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                rec.isValid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {rec.isValid ? 'Hợp lệ' : 'Lỗi'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        {!simulationResult && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-[#4B5875] flex items-center gap-1.5">
              <MockBadge size="sm" />
              <span>Thao tác mô phỏng, không ghi vào database</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmSimulation}
                disabled={
                  mode === 'single_form'
                    ? !singleRecordValidation.isValid
                    : !bulkValidationResult.isValidJson ||
                      bulkValidationResult.validCount === 0
                }
                className="px-5 py-2 rounded-xl bg-[#205BD6] text-white font-bold hover:bg-[#1847a8] disabled:opacity-50 transition-colors shadow-xs"
              >
                {mode === 'single_form'
                  ? 'Mô phỏng nhập 1 bản ghi'
                  : `Mô phỏng nhập ${bulkValidationResult.validCount} bản ghi`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

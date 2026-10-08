'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import MockBadge from '../demo/MockBadge';
import JsonImportModal from './JsonImportModal';
import { DEMO_ENTITY_TABLES } from './demoSchema';

export default function SchemaMapViewer() {
  const [selectedTableId, setSelectedTableId] = useState<string>('provinces');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [simulatedCounts, setSimulatedCounts] = useState<Record<string, number>>({
    provinces: 63,
    pois: 128,
  });
  const [lastImportNotice, setLastImportNotice] = useState<string | null>(null);

  const activeTable = DEMO_ENTITY_TABLES.find((t) => t.id === selectedTableId) || DEMO_ENTITY_TABLES[0];

  const handleImportSuccess = (count: number, tableId: string) => {
    setSimulatedCounts((prev) => ({
      ...prev,
      [tableId]: (prev[tableId] || 0) + count,
    }));
    setLastImportNotice(
      `Đã mô phỏng nạp thành công ${count} bản ghi vào bảng ${tableId} (Chưa ghi vào database thật).`
    );
    setTimeout(() => setLastImportNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0E1D4F]">
              Quản trị Dữ liệu Thực thể &amp; Lược đồ Schema
            </h2>
            <MockBadge />
          </div>
          <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-2xl">
            Giao diện minh họa cấu trúc dữ liệu thực thể du lịch (Tỉnh thành, Điểm tham quan).
            Backend chưa cung cấp API duyệt schema và CRUD thực thể; mọi thao tác chỉ mô phỏng trên giao diện.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#205BD6] text-white text-xs font-bold hover:bg-[#1847a8] transition-colors flex items-center gap-2 shadow-xs"
          >
            <Icon name="upload_file" size={16} />
            <span>Nhập dữ liệu JSON</span>
          </button>
        </div>
      </div>

      {lastImportNotice && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <Icon name="check_circle" size={16} className="text-emerald-600" />
            <span className="font-semibold">{lastImportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLastImportNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Main Content: Table Selector Tabs & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Tables List */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-[#0E1D4F]/10 p-4 space-y-2 shadow-sm">
          <h3 className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Bảng thực thể demo
          </h3>
          <div className="space-y-1">
            {DEMO_ENTITY_TABLES.map((t) => {
              const count = simulatedCounts[t.id] ?? 0;
              const isSelected = t.id === selectedTableId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTableId(t.id)}
                  className={`w-full text-left p-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#205BD6] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate font-bold">{t.name.split(' ')[0]}</p>
                    <p className={`text-[11px] font-mono truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {t.id}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    ~{count} bản ghi
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 px-3 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Trạng thái API Backend:</p>
            <p className="text-amber-700">Chưa có API duyệt bảng &amp; CRUD entity</p>
          </div>
        </div>

        {/* Right Column: Schema Fields & Records Preview */}
        <div className="lg:col-span-3 space-y-6">
          {/* Schema Structure Card */}
          <div className="bg-white rounded-3xl border border-[#0E1D4F]/10 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0E1D4F] flex items-center gap-2">
                  <span>Cấu trúc lược đồ: {activeTable.name}</span>
                </h3>
                <p className="text-xs text-[#4B5875] mt-0.5">{activeTable.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0E1D4F] hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Icon name="code" size={14} className="text-[#205BD6]" />
                  <span>Dán JSON vào bảng này</span>
                </button>
              </div>
            </div>

            {/* Fields Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Tên trường</th>
                    <th className="py-3 px-4">Kiểu dữ liệu</th>
                    <th className="py-3 px-4">Bắt buộc</th>
                    <th className="py-3 px-4">Mô tả</th>
                    <th className="py-3 px-4">Mẫu dữ liệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTable.fields.map((field) => (
                    <tr key={field.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0E1D4F]">
                        {field.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-600 font-semibold">
                        {field.type}
                      </td>
                      <td className="py-3 px-4">
                        {field.required ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Bắt buộc
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            Tùy chọn
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{field.description}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 truncate max-w-xs">
                        {String(field.example)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample JSON Data Preview Card */}
          <div className="bg-white rounded-3xl border border-[#0E1D4F]/10 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#0E1D4F]">
                  Mẫu JSON tiêu chuẩn cho bảng {activeTable.id}
                </h4>
                <p className="text-xs text-[#4B5875] mt-0.5">
                  Định dạng mảng các đối tượng (Array of Objects) phục vụ kiểm thử nhập hàng loạt
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(activeTable.sampleJson);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                title="Sao chép mẫu JSON"
              >
                <Icon name="content_copy" size={14} />
                <span>Sao chép mẫu</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-64 leading-relaxed">
              {activeTable.sampleJson}
            </pre>
          </div>
        </div>
      </div>

      {/* JSON Import Modal */}
      <JsonImportModal
        isOpen={isImportModalOpen}
        activeTable={activeTable.id}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useAdminController } from './useAdminController';
import AdminKpiSummary from './AdminKpiSummary';
import BenchmarkPanel from './BenchmarkPanel';
import TraceTable from './TraceTable';
import TraceDetailDialog from './TraceDetailDialog';
import GoldenDatasetPanel from './system/GoldenDatasetPanel';
import SafetyGuardrailPanel from './system/SafetyGuardrailPanel';
import SchemaMapViewer from './system/SchemaMapViewer';
import JsonImportModal from './system/JsonImportModal';

export default function AdminSystemScreen() {
  const [activeSystemTab, setActiveSystemTab] = useState<'health' | 'management'>('health');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const {
    filterStatus,
    setFilterStatus,
    selectedLog,
    setSelectedLog,
    filteredLogs,
    totalLogsCount,
  } = useAdminController();

  const handleImportSuccess = (count: number) => {
    setImportNotice(`Nhập thành công ${count} bản ghi dữ liệu vào cơ sở dữ liệu VISTRA.`);
    setTimeout(() => setImportNotice(null), 4000);
  };

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Toast Notification */}
      {importNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0E1D4F] text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Icon name="check_circle" className="size-5 text-[#08B3C6]" />
          <span className="text-xs font-semibold">{importNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              TRUNG TÂM HẠ TẦNG KỸ THUẬT &amp; QUẢN TRỊ DỮ LIỆU
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0E1D4F]/10 text-[#0E1D4F] font-semibold">
              ADMIN CONTROL PLANE
            </span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Hạ tầng Agent AI &amp; Quản trị Dữ liệu Thực thể
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-2xl leading-relaxed">
            Giám sát độ trễ vi khí hậu RAG, nhật ký trace agent, bộ dữ liệu chuẩn (Golden Dataset), kiểm thử phòng thủ injection và quản trị cấu trúc bảng.
          </p>
        </div>

        {/* Action Button for JSON Import (ADM-10) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Icon name="file_upload" className="size-4" />
            <span>Nhập dữ liệu JSON chuẩn hóa</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation between System Health & System Management */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-[#0E1D4F]/10 w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSystemTab('health')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSystemTab === 'health'
              ? 'bg-[#0E1D4F] text-white shadow-xs'
              : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]'
          }`}
        >
          <Icon name="monitoring" className="size-4" />
          <span>Sức khỏe Hệ thống &amp; Kiểm thử AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSystemTab('management')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSystemTab === 'management'
              ? 'bg-[#0E1D4F] text-white shadow-xs'
              : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0]'
          }`}
        >
          <Icon name="storage" className="size-4" />
          <span>Quản trị Dữ liệu Thực thể (Data Management)</span>
        </button>
      </div>

      {/* Tab 1: System Health (ADM-06, ADM-07, ADM-08) */}
      {activeSystemTab === 'health' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Real-time KPI summary */}
          <AdminKpiSummary />

          {/* Benchmarks & Latency breakdown */}
          <BenchmarkPanel />

          {/* Golden Dataset Evaluation Panel (ADM-07) */}
          <GoldenDatasetPanel />

          {/* Adversarial Prompt & Safety Guardrail Test Bench (ADM-08) */}
          <SafetyGuardrailPanel />

          {/* Trace Logs Table & Detail (ADM-06) */}
          <TraceTable
            logs={filteredLogs}
            filterStatus={filterStatus}
            totalCount={totalLogsCount}
            onFilterChange={setFilterStatus}
            onSelectLog={setSelectedLog}
          />
          <TraceDetailDialog
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        </div>
      )}

      {/* Tab 2: System Management (ADM-09, ADM-10) */}
      {activeSystemTab === 'management' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <SchemaMapViewer />
        </div>
      )}

      {/* Schema-aware JSON Import Modal (ADM-10) */}
      <JsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

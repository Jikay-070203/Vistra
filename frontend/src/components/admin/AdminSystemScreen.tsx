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

export default function AdminSystemScreen() {
  const [activeSystemTab, setActiveSystemTab] = useState<'health' | 'management'>('health');

  const {
    filterStatus,
    setFilterStatus,
    selectedLog,
    setSelectedLog,
    notFoundTraceId,
    setNotFoundTraceId,
    traceDetailError,
    setTraceDetailError,
    isLoadingDetail,
    retryDetail,
    paginatedLogs,
    totalLogsCount,
    filteredCount,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    isLoadingTraces,
    tracesError,
    retryTraces,
  } = useAdminController();

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Not Found Trace Alert (ADM-SYS-01D, ADM-OV-03C) */}
      {notFoundTraceId && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#0E1D4F] flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Icon name="warning" className="size-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <strong>Không tìm thấy bản ghi Trace (404):</strong> Mã <code>{notFoundTraceId}</code> không tồn tại
              hoặc đã hết hạn lưu vết trong phiên làm việc hiện tại.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotFoundTraceId(null)}
            className="text-xs text-[#4B5875] hover:text-[#0E1D4F] font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Trace Detail Error (Network / 403 / 500) */}
      {traceDetailError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Icon name="error" className="size-5 text-rose-600 shrink-0" />
            <div className="text-xs">
              <strong>Lỗi tải chi tiết Trace:</strong> {traceDetailError}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={retryDetail}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => setTraceDetailError(null)}
              className="text-xs text-rose-600 hover:text-rose-900 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header Banner (ADM-SYS-01A: No JSON import button in header title) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Hạ tầng Agent AI &amp; Quản trị Dữ liệu Thực thể
          </h1>
        </div>

      </div>

      {/* Primary Tab Navigation between System Health & System Management (ADM-SYS-01C) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-2xl border border-[#0E1D4F]/10 w-fit max-w-full shadow-2xs">
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

      {/* Tab 1: System Health (ADM-SYS-01B: Trace directly below stats cards) */}
      {activeSystemTab === 'health' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* 1. Real-time KPI summary (Stats Cards) */}
          <AdminKpiSummary />

          {/* 2. Trace Logs Table & Detail (ADM-SYS-01B: Placed immediately below KPI stats cards) */}
          <TraceTable
            logs={paginatedLogs}
            filterStatus={filterStatus}
            totalCount={totalLogsCount}
            filteredCount={filteredCount}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            isLoading={isLoadingTraces}
            error={tracesError}
            onRetry={retryTraces}
            onPageChange={setCurrentPage}
            onFilterChange={setFilterStatus}
            onSelectLog={setSelectedLog}
          />
          <TraceDetailDialog
            log={selectedLog}
            isLoading={isLoadingDetail}
            error={traceDetailError}
            onRetry={retryDetail}
            onClose={() => {
              setSelectedLog(null);
              setTraceDetailError(null);
            }}
          />

          {/* 3. Golden Dataset & Safety Guardrail Panels (Shared row on desktop, stacked on mobile - balanced height) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <GoldenDatasetPanel />
            <SafetyGuardrailPanel />
          </div>

          {/* 4. Benchmarks & Latency breakdown (Nhóm tín hiệu) */}
          <BenchmarkPanel />
        </div>
      )}

      {/* Tab 2: System Management (ADM-SYS-04, ADM-DATA-01..07) */}
      {activeSystemTab === 'management' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <SchemaMapViewer />
        </div>
      )}
    </div>
  );
}

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
    paginatedLogs,
    totalLogsCount,
    filteredCount,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useAdminController();

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Not Found Trace Alert (ADM-SYS-01D, ADM-OV-03C) */}
      {notFoundTraceId && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#0E1D4F] flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Icon name="warning" className="size-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <strong>Không tìm thấy bản ghi Trace:</strong> Mã <code>{notFoundTraceId}</code> không tồn tại
              hoặc đã hết hạn lưu vết trong phiên làm việc hiện tại.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotFoundTraceId(null)}
            className="text-xs text-[#4B5875] hover:text-[#0E1D4F] font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner (ADM-SYS-01A: No JSON import button in header title) */}
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
            Giám sát độ trễ vi khí hậu RAG, nhật ký trace agent, bộ dữ liệu chuẩn (Golden Dataset), kiểm thử phòng thủ injection và quản trị cấu trúc 5 bảng thực thể.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ thống Thử nghiệm: Sẵn sàng
          </span>
        </div>
      </div>

      {/* Primary Tab Navigation between System Health & System Management (ADM-SYS-01C) */}
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
            onPageChange={setCurrentPage}
            onFilterChange={setFilterStatus}
            onSelectLog={setSelectedLog}
          />
          <TraceDetailDialog
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />

          {/* 3. Benchmarks & Latency breakdown (Stacked vertically) */}
          <BenchmarkPanel />

          {/* 4. Golden Dataset Evaluation Panel (ADM-SYS-02) */}
          <GoldenDatasetPanel />

          {/* 5. Adversarial Prompt & Safety Guardrail Test Bench (ADM-SYS-03) */}
          <SafetyGuardrailPanel />
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

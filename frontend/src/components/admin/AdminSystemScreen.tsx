'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import AdminKpiSummary from './AdminKpiSummary';
import BenchmarkPanel from './BenchmarkPanel';
import TraceTable from './TraceTable';
import TraceDetailDialog from './TraceDetailDialog';
import GoldenDatasetPanel from './system/GoldenDatasetPanel';
import SafetyGuardrailPanel from './system/SafetyGuardrailPanel';
import AiProviderConfigPanel from './system/AiProviderConfigPanel';
import { useAdminController } from './useAdminController';

type SystemView = 'health' | 'configuration';

export default function AdminSystemScreen() {
  const [view, setView] = useState<SystemView>('health');

  return (
    <main className="mx-auto w-full max-w-[1720px] space-y-8 px-4 py-8 sm:px-6 lg:px-12">
      <header className="rounded-3xl border border-[#0E1D4F]/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-headline-lg text-2xl font-bold text-[#0E1D4F] sm:text-3xl">Hạ tầng hệ thống</h1>
      </header>

      <div className="flex flex-wrap gap-2" aria-label="Các khu vực hạ tầng hệ thống">
        <button
          type="button"
          onClick={() => setView('health')}
          aria-pressed={view === 'health'}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            view === 'health' ? 'bg-[#0E1D4F] text-white' : 'border border-[#0E1D4F]/10 bg-white text-[#4B5875] hover:bg-[#EBF1F0]'
          }`}
        >
          <Icon name="monitoring" className="size-4" />
          Theo dõi sức khỏe
        </button>
        <button
          type="button"
          onClick={() => setView('configuration')}
          aria-pressed={view === 'configuration'}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            view === 'configuration' ? 'bg-[#0E1D4F] text-white' : 'border border-[#0E1D4F]/10 bg-white text-[#4B5875] hover:bg-[#EBF1F0]'
          }`}
        >
          <Icon name="tune" className="size-4" />
          Cấu hình hạ tầng
        </button>
      </div>

      {view === 'health' ? <SystemHealthView /> : <SystemConfigurationView />}
    </main>
  );
}

function SystemHealthView() {
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
    <div className="space-y-8">
      {notFoundTraceId && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-[#0E1D4F]">
          <div className="flex items-center gap-3">
            <Icon name="warning" className="size-5 shrink-0 text-amber-600" />
            <p className="text-sm">
              <strong>Không tìm thấy bản ghi Trace (404):</strong> Mã <code>{notFoundTraceId}</code> không tồn tại
              hoặc đã hết hạn lưu vết trong phiên làm việc hiện tại.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotFoundTraceId(null)}
            className="rounded p-2 text-[#4B5875] hover:text-[#0E1D4F]"
            aria-label="Đóng thông báo không tìm thấy trace"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>
      )}

      {traceDetailError && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div className="flex items-center gap-3">
            <Icon name="error" className="size-5 shrink-0 text-rose-600" />
            <p className="text-sm"><strong>Lỗi tải chi tiết Trace:</strong> {traceDetailError}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={retryDetail} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">Thử lại</button>
            <button type="button" onClick={() => setTraceDetailError(null)} className="rounded p-2 text-rose-700 hover:text-rose-900" aria-label="Đóng thông báo lỗi tải trace">
              <Icon name="close" className="size-4" />
            </button>
          </div>
        </div>
      )}

      <AdminKpiSummary />

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

      <BenchmarkPanel />
    </div>
  );
}

function SystemConfigurationView() {
  return (
    <div className="space-y-6">
      <AiProviderConfigPanel />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <GoldenDatasetPanel />
        <SafetyGuardrailPanel />
      </div>
    </div>
  );
}

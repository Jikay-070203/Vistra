'use client';

import React from 'react';
import { useAdminController } from './useAdminController';
import AdminKpiSummary from './AdminKpiSummary';
import BenchmarkPanel from './BenchmarkPanel';
import TraceTable from './TraceTable';
import TraceDetailDialog from './TraceDetailDialog';

export default function AdminScreen() {
  const {
    filterStatus,
    setFilterStatus,
    selectedLog,
    setSelectedLog,
    traceDetailError,
    setTraceDetailError,
    isLoadingDetail,
    retryDetail,
    paginatedLogs,
    totalLogsCount,
    filteredCount,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    isLoadingTraces,
    tracesError,
    retryTraces,
  } = useAdminController();

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      <AdminKpiSummary />
      <BenchmarkPanel />
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
    </div>
  );
}

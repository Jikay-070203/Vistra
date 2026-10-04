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
    paginatedLogs,
    totalLogsCount,
    filteredCount,
    currentPage,
    totalPages,
    setCurrentPage,
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
        onPageChange={setCurrentPage}
        onFilterChange={setFilterStatus}
        onSelectLog={setSelectedLog}
      />
      <TraceDetailDialog
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}

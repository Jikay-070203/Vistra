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
    filteredLogs,
    totalLogsCount,
  } = useAdminController();

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      <AdminKpiSummary />
      <BenchmarkPanel />
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
  );
}

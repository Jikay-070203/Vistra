'use client';

import { useState } from 'react';
import { MOCK_TRACE_LOGS, TraceLog } from './traceFixtures';

export function useAdminController() {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<TraceLog | null>(null);

  const filteredLogs = MOCK_TRACE_LOGS.filter((log) => {
    if (filterStatus === 'ALL') return true;
    return log.status === filterStatus;
  });

  return {
    filterStatus,
    setFilterStatus,
    selectedLog,
    setSelectedLog,
    filteredLogs,
    totalLogsCount: MOCK_TRACE_LOGS.length,
  };
}

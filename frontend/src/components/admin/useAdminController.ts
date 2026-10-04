'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MOCK_TRACE_LOGS, TraceLog } from './traceFixtures';

export function useAdminController() {
  const searchParams = useSearchParams();
  const traceIdParam = searchParams.get('traceId');

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<TraceLog | null>(null);
  const [notFoundTraceId, setNotFoundTraceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const PAGE_SIZE = 5;

  // React to ?traceId= in URL (ADM-SYS-01D, ADM-OV-03C)
  const [prevParam, setPrevParam] = useState<string | null>(null);
  if (traceIdParam !== prevParam) {
    setPrevParam(traceIdParam);
    if (traceIdParam) {
      const match = MOCK_TRACE_LOGS.find(
        (log) => log.id.toLowerCase() === traceIdParam.trim().toLowerCase()
      );
      if (match) {
        setSelectedLog(match);
        setNotFoundTraceId(null);
      } else {
        setNotFoundTraceId(traceIdParam);
        setSelectedLog(null);
      }
    }
  }

  const filteredLogs = useMemo(() => {
    return MOCK_TRACE_LOGS.filter((log) => {
      if (filterStatus === 'ALL') return true;
      return log.status === filterStatus;
    });
  }, [filterStatus]);

  // Reset page when filter changes
  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage, PAGE_SIZE]);

  return {
    filterStatus,
    setFilterStatus: handleFilterChange,
    selectedLog,
    setSelectedLog,
    notFoundTraceId,
    setNotFoundTraceId,
    filteredLogs,
    paginatedLogs,
    totalLogsCount: MOCK_TRACE_LOGS.length,
    filteredCount: filteredLogs.length,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}

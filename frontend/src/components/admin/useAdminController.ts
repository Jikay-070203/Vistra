'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUserAuth } from '@/lib/userAuth';
import { TraceLog } from './traceFixtures';
import { getTraces, getTrace } from '@/services/systemService';
import { ApiClientError } from '@/services/apiClient';
import type { TraceListItemView } from '@/types/adminSystemApi';

function parseTraceStatus(status: string): TraceLog['status'] {
  if (status === 'WARNING' || status === 'LATENCY_SPIKE' || status === 'SUCCESS') {
    return status;
  }
  return status || 'UNAVAILABLE';
}

function parseTraceDetails(item: TraceListItemView, contextStr: string): TraceLog['details'] {
  const maybeWithDetails = item as { details?: unknown };
  if (maybeWithDetails.details && typeof maybeWithDetails.details === 'object' && maybeWithDetails.details !== null) {
    const d = maybeWithDetails.details as Record<string, unknown>;
    const inputSummary = typeof d.inputSummary === 'string' ? d.inputSummary : contextStr;
    const retrievedSources = Array.isArray(d.retrievedSources)
      ? d.retrievedSources.map((s) => String(s))
      : [];
    const decisionImpact = typeof d.decisionImpact === 'string' ? d.decisionImpact : undefined;
    return { inputSummary, retrievedSources, decisionImpact };
  }
  return { inputSummary: contextStr, retrievedSources: [] };
}

function mapTraceItemToLog(item: TraceListItemView): TraceLog {
  const contextStr = typeof item.context === 'string'
    ? item.context
    : item.context && typeof item.context === 'object'
    ? JSON.stringify(item.context)
    : '—';

  return {
    id: item.id,
    timestamp: item.timestamp,
    traceType: item.traceType,
    status: parseTraceStatus(item.status),
    latencyMs: item.latencyMs != null ? item.latencyMs : null,
    confidence: item.confidence != null ? item.confidence : null,
    context: contextStr,
    details: parseTraceDetails(item, contextStr),
  };
}

export function useAdminController() {
  const searchParams = useSearchParams();
  const traceIdParam = searchParams.get('traceId');

  const { user, isLoggedIn } = useUserAuth();
  const currentAccountId = isLoggedIn && user?.role === 'admin' ? user.id : null;

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Authoritative server paging state
  const [targetPage, setTargetPage] = useState<number>(1);
  const [serverPage, setServerPage] = useState<number>(1);
  const [serverPageSize, setServerPageSize] = useState<number>(5);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
  const [serverTraces, setServerTraces] = useState<TraceListItemView[]>([]);
  const [isLoadingTraces, setIsLoadingTraces] = useState<boolean>(() => Boolean(currentAccountId));
  const [tracesError, setTracesError] = useState<string | null>(null);
  const [tracesRefreshIndex, setTracesRefreshIndex] = useState<number>(0);

  // Single detail lifecycle keyed on selectedTraceId with close cancellation
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(() => traceIdParam);
  const [selectedLog, setSelectedLog] = useState<TraceLog | null>(null);
  const [notFoundTraceId, setNotFoundTraceId] = useState<string | null>(null);
  const [traceDetailError, setTraceDetailError] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(() => Boolean(traceIdParam && currentAccountId));
  const [detailRefreshIndex, setDetailRefreshIndex] = useState<number>(0);

  // Identity change invalidation: clear all private admin state on account change or logout
  const [prevAccountId, setPrevAccountId] = useState(currentAccountId);
  if (currentAccountId !== prevAccountId) {
    setPrevAccountId(currentAccountId);
    setServerTraces([]);
    setServerTotal(null);
    setServerTotalPages(null);
    setTracesError(null);
    setIsLoadingTraces(Boolean(currentAccountId));
    const requestedId = currentAccountId ? traceIdParam : null;
    setSelectedTraceId(requestedId);
    setSelectedLog(null);
    setIsLoadingDetail(Boolean(requestedId));
    setTraceDetailError(null);
    setNotFoundTraceId(null);
  }

  // Sync when URL parameter changes; immediately clear old selectedLog so log A is not retained
  const [prevUrlTraceId, setPrevUrlTraceId] = useState<string | null>(traceIdParam);
  if (traceIdParam !== prevUrlTraceId) {
    setPrevUrlTraceId(traceIdParam);
    setSelectedTraceId(traceIdParam);
    setSelectedLog(null);
    if (traceIdParam) {
      setIsLoadingDetail(true);
      setTraceDetailError(null);
      setNotFoundTraceId(null);
    } else {
      setIsLoadingDetail(false);
      setTraceDetailError(null);
      setNotFoundTraceId(null);
    }
  }

  // Authoritative trace list fetch effect guarded against unmount, stale reads, and identity change
  useEffect(() => {
    if (!currentAccountId) {
      return;
    }

    let active = true;

    getTraces({ page: targetPage, pageSize: serverPageSize, status: filterStatus })
      .then((res) => {
        if (!active) return;
        if (res.data) {
          setServerTraces(res.data.items);
          if (typeof res.data.page === 'number') {
            setServerPage(res.data.page);
          }
          if (typeof res.data.pageSize === 'number') {
            setServerPageSize(res.data.pageSize);
          }
          setServerTotal(res.data.total);
          setServerTotalPages(res.data.totalPages);
          setTracesError(null);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setServerTraces([]);
        setServerTotal(null);
        setServerTotalPages(null);
        const message =
          err instanceof ApiClientError
            ? (err.errorType === 'network_error' ? 'Lỗi kết nối mạng khi tải danh sách trace.' : err.message)
            : err instanceof Error
            ? err.message
            : 'Không thể tải danh sách trace từ máy chủ.';
        setTracesError(message);
      })
      .finally(() => {
        if (active) {
          setIsLoadingTraces(false);
        }
      });

    return () => {
      active = false;
    };
  }, [targetPage, serverPageSize, filterStatus, tracesRefreshIndex, currentAccountId]);

  const handlePageChange = useCallback((newPage: number) => {
    setIsLoadingTraces(true);
    setTracesError(null);
    setTargetPage(newPage);
  }, []);

  const retryTraces = useCallback(() => {
    setIsLoadingTraces(true);
    setTracesError(null);
    setTracesRefreshIndex((prev) => prev + 1);
  }, []);

  // Detail retry action retriggering same selected trace
  const retryDetail = useCallback(() => {
    if (selectedTraceId) {
      setIsLoadingDetail(true);
      setTraceDetailError(null);
      setNotFoundTraceId(null);
      setDetailRefreshIndex((prev) => prev + 1);
    }
  }, [selectedTraceId]);

  // Single trace detail selection handler with immediate close cancellation
  const handleSelectLog = useCallback((log: TraceLog | null) => {
    if (!log) {
      setSelectedTraceId(null);
      setSelectedLog(null);
      setIsLoadingDetail(false);
      setTraceDetailError(null);
      setNotFoundTraceId(null);
      return;
    }

    setSelectedTraceId(log.id);
    setSelectedLog(log);
    setIsLoadingDetail(true);
    setTraceDetailError(null);
    setNotFoundTraceId(null);
  }, []);

  // Single detail lifecycle effect keyed on selectedTraceId and currentAccountId
  useEffect(() => {
    if (!selectedTraceId || !currentAccountId) {
      return;
    }

    let active = true;

    getTrace(selectedTraceId)
      .then((res) => {
        if (!active) return;
        if (res.data) {
          setSelectedLog(mapTraceItemToLog(res.data));
          setNotFoundTraceId(null);
          setTraceDetailError(null);
        } else {
          setNotFoundTraceId(selectedTraceId);
          setSelectedLog(null);
          setTraceDetailError(null);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSelectedLog(null);
        if (err instanceof ApiClientError) {
          if (err.httpStatus === 404) {
            setNotFoundTraceId(selectedTraceId);
            setTraceDetailError(null);
          } else if (err.httpStatus === 403) {
            setNotFoundTraceId(null);
            setTraceDetailError(`Không có quyền truy cập chi tiết trace ${selectedTraceId} (403 Forbidden).`);
          } else if (err.errorType === 'network_error') {
            setNotFoundTraceId(null);
            setTraceDetailError(`Lỗi kết nối mạng khi tải chi tiết trace ${selectedTraceId}.`);
          } else {
            setNotFoundTraceId(null);
            setTraceDetailError(err.message || `Lỗi tải chi tiết trace (${err.httpStatus || 'HTTP'}).`);
          }
        } else if (err instanceof Error) {
          setNotFoundTraceId(null);
          setTraceDetailError(err.message);
        } else {
          setNotFoundTraceId(null);
          setTraceDetailError(`Không thể tải chi tiết trace ${selectedTraceId}.`);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTraceId, detailRefreshIndex, currentAccountId]);

  const activeSourceLogs = useMemo(() => {
    if (serverTotal !== null) {
      return serverTraces.map(mapTraceItemToLog);
    }
    return [];
  }, [serverTotal, serverTraces]);

  // Backend does not provide a status query parameter; retain authoritative paging without faux global filtering
  const paginatedLogs = activeSourceLogs;

  const totalPages = serverTotalPages;
  const currentPage = serverTotal !== null ? serverPage : targetPage;

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  return {
    filterStatus,
    setFilterStatus: handleFilterChange,
    selectedLog,
    setSelectedLog: handleSelectLog,
    notFoundTraceId,
    setNotFoundTraceId,
    traceDetailError,
    setTraceDetailError,
    isLoadingDetail,
    retryDetail,
    filteredLogs: activeSourceLogs,
    paginatedLogs,
    totalLogsCount: serverTotal,
    filteredCount: serverTotal,
    currentPage,
    setCurrentPage: handlePageChange,
    totalPages,
    pageSize: serverPageSize,
    isLoadingTraces,
    tracesError,
    retryTraces,
  };
}

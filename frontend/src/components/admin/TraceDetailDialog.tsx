'use client';

import React, { useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { TraceLog } from './traceFixtures';

interface TraceDetailDialogProps {
  log: TraceLog | null;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

export default function TraceDetailDialog({
  log,
  isLoading = false,
  error = null,
  onClose,
  onRetry,
}: TraceDetailDialogProps) {
  useEffect(() => {
    if (!log && !isLoading && !error) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [log, isLoading, error, onClose]);

  if (!log && !isLoading && !error) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trace-dialog-title"
      className="fixed inset-0 z-50 bg-[#0E1D4F]/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#0E1D4F]/10 mb-5">
          <div className="flex items-center gap-3">
            <span id="trace-dialog-title" className="font-mono text-lg font-bold text-[#205BD6]">
              {log?.id ?? (isLoading ? 'Đang tải...' : 'Chi tiết Trace')}
            </span>
            {log?.traceType && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#0E1D4F]/5 text-xs font-mono font-bold">
                {log.traceType}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="w-8 h-8 rounded-full bg-[#EBF1F0] text-[#0E1D4F] hover:bg-[#0E1D4F] hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Icon name="error" className="size-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Lỗi truy xuất chi tiết Trace:</strong>
                <span>{error}</span>
              </div>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
              >
                Thử lại
              </button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="py-4 mb-4 flex items-center justify-center gap-2 text-xs text-[#4B5875] bg-[#EBF1F0]/30 rounded-xl">
            <div className="w-4 h-4 border-2 border-[#205BD6] border-t-transparent rounded-full animate-spin" />
            <span>Đang tải thông tin chi tiết đầy đủ từ máy chủ...</span>
          </div>
        )}

        {log && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#EBF1F0]/40 border border-[#0E1D4F]/5">
              <span className="font-bold text-[#0E1D4F] block mb-1">Dấu thời gian &amp; Độ trễ:</span>
              <div className="text-[#4B5875]">
                {log.timestamp} — Thời gian phản hồi: <strong>{log.latencyMs != null ? `${log.latencyMs} ms` : '—'}</strong> — Độ tin cậy:{' '}
                <strong>{log.confidence != null ? `${log.confidence}%` : '—'}</strong>
              </div>
            </div>

            <div>
              <span className="font-bold text-[#0E1D4F] block mb-1">Tóm tắt đầu vào (Input):</span>
              <p className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[#4B5875] font-mono leading-relaxed">
                {log.details.inputSummary || '—'}
              </p>
            </div>

            <div>
              <span className="font-bold text-[#0E1D4F] block mb-1">Nguồn tri thức truy vấn (Grounding Sources):</span>
              {log.details.retrievedSources.length > 0 ? (
                <ul className="list-disc pl-5 text-[#4B5875] space-y-1">
                  {log.details.retrievedSources.map((src, i) => (
                    <li key={i}>{src}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-[#4B5875]/70 italic">Máy chủ chưa cung cấp nguồn tri thức trong bản ghi này.</span>
              )}
            </div>

            <div>
              <span className="font-bold text-[#0E1D4F] block mb-1">Tác động lên bản nháp (Decision Impact):</span>
              {log.details.decisionImpact ? (
                <p className="p-3 rounded-xl bg-[#205BD6]/5 border border-[#205BD6]/20 text-[#0E1D4F] font-semibold leading-relaxed">
                  {log.details.decisionImpact}
                </p>
              ) : (
                <p className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[#4B5875] italic">
                  Không có thông tin tác động bản nháp được ghi nhận.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#0E1D4F]/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#0E1D4F] text-white text-xs font-bold hover:bg-[#205BD6] transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { TraceLog } from './traceFixtures';

interface TraceDetailDialogProps {
  log: TraceLog | null;
  onClose: () => void;
}

export default function TraceDetailDialog({ log, onClose }: TraceDetailDialogProps) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1D4F]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between pb-4 border-b border-[#0E1D4F]/10 mb-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-[#205BD6]">{log.id}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0E1D4F]/5 text-xs font-mono font-bold">
              {log.traceType}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#EBF1F0] text-[#0E1D4F] hover:bg-[#0E1D4F] hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#EBF1F0]/40 border border-[#0E1D4F]/5">
            <span className="font-bold text-[#0E1D4F] block mb-1">Dấu thời gian &amp; Độ trễ:</span>
            <div className="text-[#4B5875]">
              {log.timestamp} — Thời gian phản hồi: <strong>{log.latencyMs} ms</strong> — Độ tin cậy:{' '}
              <strong>{log.confidence}%</strong>
            </div>
          </div>

          <div>
            <span className="font-bold text-[#0E1D4F] block mb-1">Tóm tắt đầu vào (Input):</span>
            <p className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[#4B5875] font-mono leading-relaxed">
              {log.details.inputSummary}
            </p>
          </div>

          <div>
            <span className="font-bold text-[#0E1D4F] block mb-1">Nguồn tri thức truy vấn (Grounding Sources):</span>
            <ul className="list-disc pl-5 text-[#4B5875] space-y-1">
              {log.details.retrievedSources.map((src, i) => (
                <li key={i}>{src}</li>
              ))}
            </ul>
          </div>

          <div>
            <span className="font-bold text-[#0E1D4F] block mb-1">Tác động lên bản nháp (Decision Impact):</span>
            <p className="p-3 rounded-xl bg-[#205BD6]/5 border border-[#205BD6]/20 text-[#0E1D4F] font-semibold leading-relaxed">
              {log.details.decisionImpact}
            </p>
          </div>
        </div>

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

'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { TraceLog } from './traceFixtures';

interface TraceTableProps {
  logs: TraceLog[];
  filterStatus: string;
  totalCount: number;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onFilterChange: (status: string) => void;
  onSelectLog: (log: TraceLog) => void;
}

export default function TraceTable({
  logs,
  filterStatus,
  totalCount,
  filteredCount,
  currentPage,
  totalPages,
  onPageChange,
  onFilterChange,
  onSelectLog,
}: TraceTableProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#0E1D4F]/10 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              TELEMETRY &amp; AUDIT LOGS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#205BD6]"></span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#205BD6] font-semibold border border-blue-200">
              TRỰC TIẾP DƯỚI KPI
            </span>
          </div>
          <h2 className="font-headline-sm text-xl text-[#0E1D4F] font-bold">
            Nhật ký Thực thi Agent &amp; Trace Logs
          </h2>
          <p className="text-xs text-[#4B5875] mt-1">
            Chi tiết các bước điều phối nội bộ: trích xuất DNA, giải bài toán ràng buộc, truy vấn vi khí hậu và xác thực chốt kế hoạch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#4B5875] font-semibold">Lọc theo trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#0E1D4F]/15 bg-[#EBF1F0]/40 text-xs font-bold text-[#0E1D4F] focus:outline-none"
          >
            <option value="ALL">Tất cả ({totalCount})</option>
            <option value="SUCCESS">Thành công (SUCCESS)</option>
            <option value="WARNING">Cảnh báo (WARNING)</option>
            <option value="LATENCY_SPIKE">Tăng đột biến độ trễ</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#0E1D4F]">
          <thead className="bg-[#EBF1F0]/60 border-b border-[#0E1D4F]/10 text-[#4B5875] font-label-caps uppercase">
            <tr>
              <th className="py-3 px-4">Mã Trace</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4">Loại tác vụ AI</th>
              <th className="py-3 px-4">Độ trễ</th>
              <th className="py-3 px-4">Độ tin cậy</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Ngữ cảnh tóm tắt</th>
              <th className="py-3 px-4 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0E1D4F]/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#4B5875]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Icon name="search_off" className="size-8 text-[#4B5875]/60" />
                    <span className="text-sm font-semibold">Không tìm thấy bản ghi trace phù hợp</span>
                    <span className="text-xs text-[#4B5875]/80">Thử thay đổi bộ lọc trạng thái để xem dữ liệu</span>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#EBF1F0]/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#205BD6]">{log.id}</td>
                  <td className="py-3.5 px-4 text-[#4B5875]">{log.timestamp}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#0E1D4F]">
                    <span className="px-2.5 py-1 rounded-md bg-[#0E1D4F]/5 font-mono text-[11px]">
                      {log.traceType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold">{log.latencyMs} ms</td>
                  <td className="py-3.5 px-4 font-bold">{log.confidence}%</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.status === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#4B5875] max-w-xs truncate" title={log.context}>
                    {log.context}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectLog(log)}
                      className="px-3 py-1 rounded-lg bg-[#205BD6]/10 text-[#205BD6] hover:bg-[#205BD6] hover:text-white font-bold transition-all cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls (ADM-LIST-01, ADM-SYS-01D) */}
      <div className="pt-4 mt-4 border-t border-[#0E1D4F]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5875]">
        <div>
          Hiển thị{' '}
          <strong className="text-[#0E1D4F]">
            {logs.length > 0 ? (currentPage - 1) * 5 + 1 : 0} -{' '}
            {Math.min(currentPage * 5, filteredCount)}
          </strong>{' '}
          trên tổng số <strong className="text-[#0E1D4F]">{filteredCount}</strong> bản ghi
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1.5 rounded-xl border border-[#0E1D4F]/15 bg-white text-[#0E1D4F] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] transition-colors cursor-pointer"
          >
            ← Trước
          </button>
          <span className="px-3 py-1.5 font-semibold text-[#0E1D4F]">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1.5 rounded-xl border border-[#0E1D4F]/15 bg-white text-[#0E1D4F] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] transition-colors cursor-pointer"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}

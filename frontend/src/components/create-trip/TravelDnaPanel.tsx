'use client';

import Icon from '@/components/ui/Icon';
import { getTravelDnaLabel } from '@/config/travelDnaLabels';
import type { TravelDnaMetric } from '@/types/tripDna';

interface TravelDnaPanelProps {
  metrics: TravelDnaMetric[];
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error';
  error: string | null;
  onChange: (key: string, score: number) => void;
  onReset: () => void;
}

export default function TravelDnaPanel({ metrics, status, error, onChange, onReset }: TravelDnaPanelProps) {
  return (
    <section aria-labelledby="trip-dna-title" className="rounded-2xl border border-[#0E1D4F]/10 bg-white/85 p-5 shadow-xs backdrop-blur-md sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-[#0E1D4F]/10 pb-3">
        <div className="flex items-center gap-2">
          <Icon name="fingerprint" className="size-4 text-[#205BD6]" />
          <h2 id="trip-dna-title" className="text-base font-bold text-[#0E1D4F]">Ưu tiên Travel DNA cho chuyến đi</h2>
        </div>
        {metrics.length > 0 && (
          <button type="button" onClick={onReset} className="min-h-11 rounded px-1 text-xs font-medium text-[#205BD6] hover:underline focus-visible:outline-2 focus-visible:outline-[#205BD6]">
            Đặt lại
          </button>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[#4B5875]">
        Travel DNA được cập nhật từ ảnh đã tải lên. Bạn có thể tinh chỉnh các chỉ số cho bản nháp chuyến đi này.
      </p>

      {status === 'loading' && (
        <p role="status" className="mt-4 flex items-center gap-2 text-xs text-[#4B5875]">
          <span className="size-4 animate-spin rounded-full border-2 border-[#205BD6]/20 border-t-[#205BD6]" />
          Đang cập nhật Travel DNA từ ảnh…
        </p>
      )}

      {status === 'idle' && (
        <p className="mt-4 rounded-xl border border-dashed border-[#0E1D4F]/15 bg-[#EBF1F0]/50 p-4 text-xs text-[#4B5875]">
          Thêm ảnh cảm hứng để xem các chỉ số Travel DNA do hệ thống trả về.
        </p>
      )}

      {status === 'empty' && (
        <p role="status" className="mt-4 rounded-xl border border-dashed border-[#0E1D4F]/15 bg-[#EBF1F0]/50 p-4 text-xs text-[#4B5875]">
          Máy chủ chưa trả về chỉ số Travel DNA cho các ảnh này.
        </p>
      )}

      {status === 'error' && error && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>
      )}

      {metrics.length > 0 && (
        <div className="mt-5 space-y-4" aria-label="Các chỉ số Travel DNA">
          {metrics.map((metric) => (
            <label key={metric.key} className="block space-y-1.5">
              <span className="flex items-center justify-between gap-3 text-xs font-semibold text-[#0E1D4F]">
                <span>{getTravelDnaLabel(metric.key, metric.label)}</span>
                <span aria-hidden="true" className="tabular-nums text-[#4B5875]">{metric.score}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={metric.score}
                onChange={(event) => onChange(metric.key, Number(event.target.value))}
                className="w-full cursor-pointer accent-[#205BD6]"
                aria-label={getTravelDnaLabel(metric.key, metric.label)}
              />
            </label>
          ))}
          <p className="flex items-start gap-2 rounded-xl border border-[#0E1D4F]/5 bg-[#EBF1F0]/70 p-3 text-[11px] text-[#4B5875]">
            <Icon name="info" className="mt-0.5 size-3.5 shrink-0 text-[#205BD6]" />
            Các điều chỉnh chỉ áp dụng cho bản nháp chuyến đi này.
          </p>
        </div>
      )}
    </section>
  );
}

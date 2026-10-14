'use client';

import { useEffect, useState } from 'react';
import { getDestinationDetails } from '@/services/destinationService';
import type { DestinationDetailView, DestinationRecommendationView } from '@/types/recommendationApi';

interface DestinationDetailPanelProps {
  dest: DestinationRecommendationView;
  onClose: () => void;
  onSelectDestination: (slug: string) => void;
}

export default function DestinationDetailPanel({ dest, onClose, onSelectDestination }: DestinationDetailPanelProps) {
  const [detail, setDetail] = useState<DestinationDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setError(null); setDetail(null); } });
    getDestinationDetails([dest.id]).then(response => {
      if (!active) return;
      const item = response.data?.destinations.find(item => item.slug === dest.id);
      if (!item) throw new Error('Không có chi tiết điểm đến này.');
      setDetail(item);
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải chi tiết.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dest.id, reload]);
  return <section aria-label={`Thông tin ${dest.name}`} className="mt-8 space-y-4 rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 sm:p-7">
    <div className="flex items-center justify-between gap-3 border-b border-[#0E1D4F]/10 pb-4"><div><p className="font-label-caps text-xs font-bold uppercase tracking-wider text-[#08B3C6]">Thông tin điểm đến</p><h2 className="mt-1 font-headline-sm text-xl font-bold text-[#0E1D4F]">{dest.name}</h2></div><button type="button" onClick={onClose} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#0E1D4F]/20 px-4 py-2 text-sm font-semibold text-[#0E1D4F] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">Đóng</button></div>
    {loading ? <p role="status" className="py-6 text-sm text-[#4B5875]">Đang tải chi tiết...</p> : error ? <div role="alert" className="py-3"><p className="text-sm text-rose-800">{error}</p><button type="button" onClick={() => setReload(value => value + 1)} className="mt-3 min-h-11 rounded-lg border border-[#0E1D4F]/20 px-4 py-2 text-sm font-semibold text-[#0E1D4F] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">Thử lại</button></div> : detail ? <dl className="grid gap-4 text-sm text-[#4B5875] sm:grid-cols-2">
      {detail.region && <div><dt>Vùng</dt><dd className="font-semibold text-[#0E1D4F]">{detail.region}</dd></div>}
      <div><dt>Mã điểm đến</dt><dd>{detail.slug}</dd></div>
      <div><dt>Tọa độ</dt><dd>{detail.coordinates.lat !== null && detail.coordinates.lng !== null ? `${detail.coordinates.lat}, ${detail.coordinates.lng}` : 'Chưa có dữ liệu'}</dd></div>
      <div><dt>Số địa điểm mục tiêu của danh mục</dt><dd>{detail.targetPlaces}</dd></div>
      {detail.highlights.length > 0 && <div><dt>Nổi bật</dt><dd>{detail.highlights.join(', ')}</dd></div>}
    </dl> : null}
    <p className="text-sm leading-relaxed text-[#4B5875]">Chưa có dữ liệu dự báo, chi phí, chỗ ở hay điểm phù hợp Travel DNA.</p>
    <button type="button" onClick={() => onSelectDestination(dest.id)} className="min-h-11 rounded-lg bg-[#205BD6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">Tạo kế hoạch tại đây</button>
  </section>;
}

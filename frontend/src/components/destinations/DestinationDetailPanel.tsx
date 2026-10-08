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
  return <section aria-label={`Thông tin ${dest.name}`} className="mt-8 rounded-2xl bg-white border border-[#0E1D4F]/10 p-6 space-y-4">
    <div className="flex justify-between items-center gap-3"><h2 className="text-xl text-[#0E1D4F] font-bold">{dest.name}</h2><button type="button" onClick={onClose} className="border rounded-xl p-3 cursor-pointer">Đóng</button></div>
    {loading ? <p role="status">Đang tải chi tiết...</p> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)} className="mt-2 p-3 border rounded-xl">Thử lại</button></div> : detail ? <dl className="grid gap-3 text-sm text-[#4B5875]">
      {detail.region && <div><dt>Vùng</dt><dd className="font-semibold text-[#0E1D4F]">{detail.region}</dd></div>}
      <div><dt>Mã điểm đến</dt><dd>{detail.slug}</dd></div>
      <div><dt>Tọa độ</dt><dd>{detail.coordinates.lat !== null && detail.coordinates.lng !== null ? `${detail.coordinates.lat}, ${detail.coordinates.lng}` : 'Chưa có dữ liệu'}</dd></div>
      <div><dt>Số địa điểm mục tiêu của danh mục</dt><dd>{detail.targetPlaces}</dd></div>
      {detail.highlights.length > 0 && <div><dt>Nổi bật</dt><dd>{detail.highlights.join(', ')}</dd></div>}
    </dl> : null}
    <p className="text-xs text-[#4B5875]">Chưa có dữ liệu dự báo, chi phí, chỗ ở hay điểm phù hợp Travel DNA.</p>
    <button type="button" onClick={() => onSelectDestination(dest.id)} className="bg-[#205BD6] text-white rounded-xl p-3 cursor-pointer">Tạo kế hoạch tại đây</button>
  </section>;
}

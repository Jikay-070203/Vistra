'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { getDestinationDetails } from '@/services/destinationService';
import type { DestinationDetailView, DestinationRecommendationView } from '@/types/recommendationApi';
interface ComparisonDialogProps {
  isOpen: boolean;
  comparedDestinations: DestinationRecommendationView[];
  onRemoveDestination: (id: string) => void;
  onClose: () => void;
  onSelectDestination: (slug: string) => void;
}
export default function ComparisonDialog({ isOpen, comparedDestinations, onRemoveDestination, onClose, onSelectDestination }: ComparisonDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = comparedDestinations.map(item => item.id).join(',');
  const [details, setDetails] = useState<DestinationDetailView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const node = dialog.current;
    if (isOpen && node && !node.open) node.showModal();
    return () => { node?.close(); };
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || !ids) return;
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setError(null); setDetails([]); } });
    getDestinationDetails(ids.split(',')).then(response => { if (active) setDetails(response.data?.destinations ?? []); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải bảng so sánh.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, ids, reload]);
  if (!isOpen) return null;
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="comparison-title" className="fixed inset-0 m-auto max-h-[85vh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-4 shadow-xl backdrop:bg-[#0E1D4F]/55 sm:p-6">
    <div className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-3 border-b border-[#0E1D4F]/10 bg-warm-surface pb-4"><div><p className="font-label-caps text-xs font-bold uppercase tracking-wider text-[#08B3C6]">So sánh lựa chọn</p><h2 id="comparison-title" className="mt-1 font-headline-sm text-lg font-bold text-[#0E1D4F] sm:text-xl">So sánh thông tin điểm đến</h2></div><button type="button" onClick={onClose} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#0E1D4F]/20 px-4 py-2 text-sm font-semibold text-[#0E1D4F] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">Đóng</button></div>
    {comparedDestinations.length === 0 ? <p className="py-6 text-sm text-[#4B5875]">Chưa chọn điểm đến.</p> : loading ? <p role="status" className="py-6 text-sm text-[#4B5875]">Đang tải thông tin...</p> : error ? <div role="alert" className="py-4"><p className="text-sm text-rose-800">{error}</p><button type="button" onClick={() => setReload(value => value + 1)} className="mt-3 min-h-11 rounded-lg border border-[#0E1D4F]/20 px-4 py-2 text-sm font-semibold text-[#0E1D4F] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">Thử lại</button></div> : <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm text-[#4B5875]"><caption className="mb-4 text-left text-xs leading-relaxed">Dữ liệu danh mục. Chưa có so sánh thời tiết, chi phí hay Travel DNA.</caption><thead><tr><th className="p-3">Thông tin</th>{comparedDestinations.map(item => <th key={item.id} scope="col" className="p-3 text-[#0E1D4F]"><div className="flex items-center justify-between gap-2"><span className="font-bold">{item.name}</span><button type="button" onClick={() => onRemoveDestination(item.id)} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[#4B5875] transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]" aria-label={`Bỏ ${item.name} khỏi so sánh`} title={`Bỏ ${item.name} khỏi so sánh`}><Icon name="close" className="size-5" /></button></div></th>)}</tr></thead>
        <tbody>{['Vùng', 'Quốc gia', 'Tọa độ', 'Địa điểm mục tiêu'].map((label, index) => <tr key={label} className="border-t border-[#0E1D4F]/10"><th scope="row" className="p-3 font-semibold text-[#0E1D4F]">{label}</th>{comparedDestinations.map(item => {
          const detail = details.find(value => value.slug === item.id);
          const values = [item.region ?? 'Chưa có dữ liệu', item.country, detail?.coordinates.lat != null && detail.coordinates.lng != null ? `${detail.coordinates.lat}, ${detail.coordinates.lng}` : 'Chưa có dữ liệu', detail ? String(detail.targetPlaces) : 'Chưa có dữ liệu'];
          return <td key={item.id} className="p-3">{values[index]}</td>;
        })}</tr>)}
        <tr className="border-t border-[#0E1D4F]/10"><th scope="row" className="p-3 font-semibold text-[#0E1D4F]">Lựa chọn</th>{comparedDestinations.map(item => <td key={item.id} className="p-3"><button type="button" onClick={() => onSelectDestination(item.id)} className="min-h-11 w-full rounded-lg bg-[#205BD6] p-3 font-semibold text-white transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">Tạo kế hoạch</button></td>)}</tr></tbody>
      </table>
    </div>}
  </dialog>;
}

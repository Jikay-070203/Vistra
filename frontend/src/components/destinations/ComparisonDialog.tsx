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
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="comparison-title" className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-4xl max-h-[85vh] rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/50">
    <div className="flex justify-between gap-3 items-center mb-4"><h2 id="comparison-title" className="font-bold text-xl text-[#0E1D4F]">So sánh thông tin điểm đến</h2><button type="button" onClick={onClose} className="border rounded-xl p-3 cursor-pointer">Đóng</button></div>
    {comparedDestinations.length === 0 ? <p>Chưa chọn điểm đến.</p> : loading ? <p role="status">Đang tải thông tin...</p> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)} className="border rounded-xl p-3 mt-3">Thử lại</button></div> : <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-[#4B5875]"><caption className="text-left mb-4">Dữ liệu danh mục. Chưa có so sánh thời tiết, chi phí hay Travel DNA.</caption><thead><tr><th className="p-3">Thông tin</th>{comparedDestinations.map(item => <th key={item.id} scope="col" className="p-3 text-[#0E1D4F]"><div className="flex items-center justify-between gap-2"><span className="font-bold">{item.name}</span><button type="button" onClick={() => onRemoveDestination(item.id)} className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl text-[#4B5875] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" aria-label={`Bỏ ${item.name} khỏi so sánh`} title={`Bỏ ${item.name} khỏi so sánh`}><Icon name="close" className="size-5" /></button></div></th>)}</tr></thead>
        <tbody>{['Vùng', 'Quốc gia', 'Tọa độ', 'Địa điểm mục tiêu'].map((label, index) => <tr key={label} className="border-t"><th scope="row" className="p-3">{label}</th>{comparedDestinations.map(item => {
          const detail = details.find(value => value.slug === item.id);
          const values = [item.region ?? 'Chưa có dữ liệu', item.country, detail?.coordinates.lat != null && detail.coordinates.lng != null ? `${detail.coordinates.lat}, ${detail.coordinates.lng}` : 'Chưa có dữ liệu', detail ? String(detail.targetPlaces) : 'Chưa có dữ liệu'];
          return <td key={item.id} className="p-3">{values[index]}</td>;
        })}</tr>)}
        <tr className="border-t"><th scope="row" className="p-3">Lựa chọn</th>{comparedDestinations.map(item => <td key={item.id} className="p-3"><button type="button" onClick={() => onSelectDestination(item.id)} className="w-full bg-[#205BD6] hover:bg-[#1847a8] text-white p-3 rounded-xl font-medium transition-colors cursor-pointer">Tạo kế hoạch</button></td>)}</tr></tbody>
      </table>
    </div>}
  </dialog>;
}

'use client';
import { useState } from 'react';
import { getPlace } from '@/services/destinationService';
import type { PlaceDto } from '@/types/destinationApi';

export default function PlaceSources({ id }: { id: number }) {
  const [place, setPlace] = useState<PlaceDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (loading) return;
    setLoading(true); setError(null);
    try { setPlace((await getPlace(id)).data); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Không thể tải nguồn đối chiếu.'); }
    finally { setLoading(false); }
  };
  return <details className="mt-4 rounded-xl border border-[#0E1D4F]/10 p-3" onToggle={event => { if (event.currentTarget.open && !place && !loading && !error) void load(); }}>
    <summary className="min-h-11 flex items-center font-semibold cursor-pointer">Nguồn đối chiếu điểm đang chọn</summary>
    {loading && <p role="status" className="text-sm">Đang tải nguồn...</p>}
    {error && <div role="alert" className="text-sm text-rose-700">{error}<button type="button" className="min-h-11 underline ml-2" onClick={load}>Thử lại</button></div>}
    {place && <div className="text-sm space-y-2">
      <p className="font-semibold">{place.display_name}</p>{place.address && <p>{place.address}</p>}
      <p>Xác minh gần nhất: {place.last_verified_at ? new Date(place.last_verified_at).toLocaleDateString('vi-VN') : 'Chưa có ngày xác minh'}</p>
      {(place.sources ?? []).map((source, index) => {
        const url = typeof source.source_url === 'string' && /^https?:\/\//i.test(source.source_url) ? source.source_url : null;
        return url ? <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block min-h-11 text-[#205BD6] underline break-all">{typeof source.name === 'string' ? source.name : url}</a> : null;
      })}
      {!place.sources?.length && <p>Chưa có nguồn đối chiếu cho điểm này.</p>}
    </div>}
  </details>;
}

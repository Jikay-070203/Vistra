'use client';

import type { PlanItineraryDto, PlanRequestDto } from '@/types/planApi';
import { endDateFromDuration } from '@/lib/dateUtils';

export const tripButtonClass = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0E1D4F]/15 px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-[#EBF1F0] disabled:opacity-50 disabled:cursor-not-allowed';
export const tripPanelClass = 'min-w-0 rounded-2xl border border-[#0E1D4F]/10 bg-white/85 p-4 sm:p-5 text-[#0E1D4F]';
export const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

function time(value: string, timezone: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: timezone });
}

export default function ItineraryView({ itinerary, request, selectedDay, onDay, selectedPlace, onPlace, busy = false, onMove }:
  { itinerary: PlanItineraryDto; request: PlanRequestDto; selectedDay: number; onDay: (day: number) => void;
    selectedPlace: number | null; onPlace: (id: number) => void; busy?: boolean; onMove?: (id: number, target: number) => void }) {
  const days = Array.from({ length: request.days }, (_, index) => index + 1);
  const activities = itinerary.activities.filter(item => item.day === selectedDay);
  const date = endDateFromDuration(request.start_date, selectedDay);
  return <section className={tripPanelClass} aria-label="Lịch trình">
    <h2 className="text-lg font-bold mb-4">Lịch trình {onMove ? 'bản nháp' : 'chi tiết'}</h2>
    <div className="flex flex-wrap gap-2 mb-4 no-print" aria-label="Chọn ngày">
      {days.map(day => <button key={day} type="button" aria-pressed={day === selectedDay} onClick={() => onDay(day)} className={`${tripButtonClass} ${day === selectedDay ? 'bg-[#205BD6] text-white' : ''}`}>Ngày {day}</button>)}
    </div>
    <div className="space-y-3">
      {activities.length === 0 && <p className="text-[#4B5875]">Chưa có điểm dừng cho ngày này.</p>}
      {activities.map((item, index) => <article key={item.place_id} draggable={!!onMove && !busy}
        onDragStart={event => event.dataTransfer.setData('text/plain', String(item.place_id))}
        onDragOver={event => { if (onMove && !busy) event.preventDefault(); }}
        onDrop={event => { event.preventDefault(); if (!busy) onMove?.(Number(event.dataTransfer.getData('text/plain')), item.place_id); }}
        className={`rounded-xl border p-3 ${selectedPlace === item.place_id ? 'border-[#205BD6] bg-[#205BD6]/5' : 'border-[#0E1D4F]/10'}`}>
        <button type="button" onClick={() => onPlace(item.place_id)} className="min-h-11 text-left w-full cursor-pointer font-semibold text-[#0E1D4F]">
          {index + 1}. {item.name}
        </button>
        <p className="text-sm text-[#4B5875]">{time(item.start_at, itinerary.timezone)} – {time(item.end_at, itinerary.timezone)}</p>
        <p className="text-sm mt-2">{item.estimated_cost ? `${money(item.estimated_cost.min_vnd)} – ${money(item.estimated_cost.max_vnd)}` : 'Chưa có giá tham khảo'}</p>
        {item.reason && <p className="text-sm text-[#4B5875] mt-2">{item.reason}</p>}
        {item.notes.length > 0 && <details className="text-sm mt-2"><summary className="cursor-pointer min-h-11 flex items-center">Lưu ý điểm đến</summary><ul className="list-disc pl-5 space-y-1">{item.notes.map((note, n) => <li key={n}>{note}</li>)}</ul></details>}
        {onMove && <div className="flex gap-2 mt-2 no-print">
          <button type="button" disabled={busy || index === 0} onClick={() => onMove(item.place_id, activities[index - 1].place_id)} aria-label={`Đưa ${item.name} lên trước`} className={tripButtonClass}>↑</button>
          <button type="button" disabled={busy || index === activities.length - 1} onClick={() => onMove(item.place_id, activities[index + 1].place_id)} aria-label={`Đưa ${item.name} xuống sau`} className={tripButtonClass}>↓</button>
        </div>}
      </article>)}
    </div>
    {itinerary.route_legs.filter(leg => leg.day === selectedDay).map((leg, index) => <p key={index} className="text-sm text-[#4B5875] mt-3">
      Di chuyển bằng ô tô: {leg.distance_km.toLocaleString('vi-VN')} km · {leg.duration_min} phút
    </p>)}
    {itinerary.weather.type === 'unavailable' && <p className="text-sm text-[#4B5875] mt-4">Thời tiết: {itinerary.weather.reason}</p>}
    {itinerary.weather.type === 'forecast' && itinerary.weather.hourly && <details className="text-sm mt-4">
      <summary className="cursor-pointer min-h-11 flex items-center font-semibold">Thời tiết tại trung tâm điểm đến</summary>
      <p className="text-[#4B5875] mb-2">Nguồn: {itinerary.weather.source}</p>
      <div className="max-h-48 overflow-y-auto"><table className="w-full text-left"><thead><tr><th>Giờ</th><th>Nhiệt độ</th><th>Khả năng mưa</th></tr></thead><tbody>
        {itinerary.weather.hourly.time.map((hour, index) => hour.slice(0, 10) === date ? <tr key={hour}>
          <td className="py-2">{hour.slice(11, 16)}</td><td>{itinerary.weather.hourly!.temperature_2m[index] === null ? 'Chưa có' : `${itinerary.weather.hourly!.temperature_2m[index]} °C`}</td>
          <td>{itinerary.weather.hourly!.precipitation_probability[index] === null ? 'Chưa có' : `${itinerary.weather.hourly!.precipitation_probability[index]}%`}</td>
        </tr> : null)}
      </tbody></table></div>
    </details>}
    {itinerary.warnings.length > 0 && <details className="text-sm mt-4" open><summary className="font-semibold cursor-pointer">Lưu ý hành trình</summary><ul className="list-disc pl-5 mt-2">{itinerary.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}
  </section>;
}

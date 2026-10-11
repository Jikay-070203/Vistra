'use client';
import { useState } from 'react';
import Link from 'next/link';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { useTripWorkspace } from '@/components/planner/useTripWorkspace';
import TripPageState from '@/components/planner/TripPageState';
import { useProvinceName } from '@/components/planner/PlannerHeader';
import ItineraryView, { money, tripButtonClass, tripPanelClass } from './ItineraryView';
import TripMap from './TripMap';
import BudgetSummary from './BudgetSummary';

export default function TripPlanScreen() {
  const workspace = useTripWorkspace(true);
  if (!workspace.trip || workspace.loading) return <TripPageState workspace={workspace} title="Chi tiết hành trình" />;
  return <TripPlanDocument key={`${workspace.trip.owner_user_id}:${workspace.trip.id}`} workspace={workspace} />;
}

function TripPlanDocument({ workspace }: { workspace: ReturnType<typeof useTripWorkspace> }) {
  const { trip, itinerary, busy, error, budget, budgetError } = workspace;
  const destinationName = useProvinceName(trip?.destination_id, trip?.request.destination);
  const [day, setDay] = useState(1);
  const [place, setPlace] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!trip) return null;
  const selectedDay = day <= trip.request.days ? day : 1;
  const selectedPlace = itinerary?.activities.some(item => item.day === selectedDay && item.place_id === place) ? place : null;
  return <div className="print-page w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 text-[#0E1D4F] space-y-5">
    <nav className="no-print flex flex-wrap gap-2 justify-between" aria-label="Thao tác hành trình">
      <Link className={tripButtonClass} href="/my-trips">← Chuyến đi của tôi</Link>
      <div className="flex flex-wrap gap-2">
        <Link className={tripButtonClass} href={`/planner?id=${encodeURIComponent(trip.id)}`}>Bàn làm việc</Link>
        {workspace.canEdit && (trip.status === 'confirmed' ? <button type="button" disabled={busy} className={tripButtonClass} onClick={workspace.togglePublication}>{trip.is_published ? 'Gỡ khỏi cộng đồng' : 'Xuất bản lên cộng đồng'}</button>
          : <button type="button" disabled={busy || !itinerary} className={tripButtonClass} onClick={() => setConfirmOpen(true)}>Chốt lịch trình</button>)}
        <button type="button" disabled={!itinerary || busy} className={`${tripButtonClass} bg-[#205BD6] text-white`} onClick={() => window.print()}>In lịch trình</button>
      </div>
    </nav>
    {error && <div role="alert" className="no-print p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">{error}<button type="button" disabled={busy} onClick={workspace.retry} className={`${tripButtonClass} ml-2`}>Tải lại hành trình</button></div>}
    <section className={tripPanelClass}>
      <p className="text-sm font-semibold text-[#205BD6] mb-2">{trip.status === 'confirmed' ? 'Đã xác nhận' : 'Bản nháp'}{trip.is_published ? ' · Đã xuất bản' : ''}</p>
      <h1 className="text-3xl font-bold mb-4">{destinationName || trip.request.destination}</h1>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><dt className="text-[#4B5875]">Ngày bắt đầu</dt><dd>{trip.request.start_date}</dd></div>
        <div><dt className="text-[#4B5875]">Thời lượng</dt><dd>{trip.request.days} ngày</dd></div>
        <div><dt className="text-[#4B5875]">Thành viên</dt><dd>{trip.request.people} người</dd></div>
        <div><dt className="text-[#4B5875]">Ngân sách {trip.request.budget_scope === 'total' ? 'tổng' : '/ người'}</dt><dd>{money(trip.request.budget_vnd)}</dd></div>
      </dl>
    </section>
    {itinerary ? <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 no-print items-start">
        <ItineraryView itinerary={itinerary} request={trip.request} selectedDay={selectedDay} onDay={setDay} selectedPlace={selectedPlace} onPlace={setPlace} />
        <TripMap itinerary={itinerary} day={selectedDay} selectedPlace={selectedPlace} onPlace={setPlace} />
      </div>
      <div className="hidden print:block space-y-4">
        {Array.from({ length: trip.request.days }, (_, index) => <div key={index}><h2 className="text-xl font-bold">Ngày {index + 1}</h2><ItineraryView itinerary={itinerary} request={trip.request} selectedDay={index + 1} onDay={() => {}} selectedPlace={null} onPlace={() => {}} /></div>)}
      </div>
      <BudgetSummary planned={itinerary.budget} actual={budget} error={budgetError} />
    </> : <section className={tripPanelClass}><p>Chưa có lịch trình cho chuyến đi này.</p><Link className={`${tripButtonClass} mt-3`} href={`/planner?id=${encodeURIComponent(trip.id)}`}>Tạo lịch trình tại bàn làm việc</Link></section>}
    <ConfirmModal isOpen={confirmOpen} title="Chốt lịch trình này?" message="Xác nhận phương án đã lưu trên hệ thống." confirmVariant="primary"
      onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); void workspace.confirm(); }} />
  </div>;
}

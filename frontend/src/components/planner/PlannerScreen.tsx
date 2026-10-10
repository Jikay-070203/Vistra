'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import ConfirmModal from '@/components/admin/ConfirmModal';
import ItineraryView, { money, tripButtonClass, tripPanelClass } from '@/components/trip-plan/ItineraryView';
import TripMap from '@/components/trip-plan/TripMap';
import PlaceSources from './PlaceSources';
import TripPageState from './TripPageState';
import PlannerHeader, { useProvinceName } from './PlannerHeader';
import { useTripWorkspace } from './useTripWorkspace';

export default function PlannerScreen() {
  const workspace = useTripWorkspace();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#EBF1F0] text-[#0E1D4F]">
      <PlannerHeader
        trip={workspace.trip}
        hasItinerary={Boolean(workspace.itinerary)}
        hasPreview={Boolean(workspace.preview)}
        busy={workspace.busy}
        onConfirm={() => setConfirmOpen(true)}
        onPublish={() => setPublishOpen(true)}
      />

      <main className="flex-1 w-full flex flex-col">
        {!workspace.trip || workspace.loading || !workspace.isLoggedIn ? (
          <TripPageState workspace={workspace} title="Bàn làm việc hành trình" />
        ) : (
          <PlannerWorkspace key={`${workspace.trip.owner_user_id}:${workspace.trip.id}`} workspace={workspace} />
        )}
      </main>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Chốt lịch trình này?"
        message="Xác nhận phương án đã lưu trên hệ thống. Sau khi chốt, bạn có thể chia sẻ lên cộng đồng."
        confirmVariant="primary"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void workspace.confirm();
        }}
      />

      {workspace.trip && (
        <ConfirmModal
          isOpen={publishOpen}
          title={workspace.trip.is_published ? 'Hủy chia sẻ hành trình?' : 'Chia sẻ lên cộng đồng?'}
          message={
            workspace.trip.is_published
              ? 'Hành trình này sẽ được rút khỏi danh sách khám phá chung của cộng đồng VISTRA.'
              : 'Hành trình đã chốt của bạn sẽ được hiển thị trên trang Cộng đồng để các du khách khác tham khảo.'
          }
          confirmLabel={workspace.trip.is_published ? 'Xác nhận hủy chia sẻ' : 'Xác nhận chia sẻ'}
          confirmVariant={workspace.trip.is_published ? 'danger' : 'primary'}
          onCancel={() => setPublishOpen(false)}
          onConfirm={() => {
            setPublishOpen(false);
            void workspace.togglePublication();
          }}
        />
      )}
    </div>
  );
}

function PlannerWorkspace({ workspace }: { workspace: ReturnType<typeof useTripWorkspace> }) {
  const { trip, itinerary, messages, preview, busy, error } = workspace;
  const [day, setDay] = useState(1);
  const [place, setPlace] = useState<number | null>(null);
  const [text, setText] = useState('');
  const destinationName = useProvinceName(trip?.destination_id, trip?.request.destination);

  if (!trip) return null;
  const selectedDay = day <= trip.request.days ? day : 1;
  const selectedPlace = itinerary?.activities.some(item => item.day === selectedDay && item.place_id === place) ? place : null;
  const editable = trip.status === 'draft';

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col">
      {/* Mobile Context Strip (< 1024px) */}
      <div className="lg:hidden flex items-center justify-between gap-3 p-3.5 mb-4 bg-white/80 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#0E1D4F] truncate">{destinationName || trip.request.destination}</h1>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                trip.status === 'draft'
                  ? 'bg-[#205BD6]/10 text-[#205BD6] border border-[#205BD6]/20'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {trip.status === 'draft' ? 'Bản nháp' : 'Đã chốt'}
            </span>
          </div>
          <p className="text-xs text-[#4B5875]">
            {trip.request.start_date} · {trip.request.days} ngày · {trip.request.people} người
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 mb-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800">
          {error}
          <button type="button" disabled={busy} className={`${tripButtonClass} ml-2`} onClick={workspace.retry}>
            Tải lại hành trình
          </button>
        </div>
      )}

      {/* 3-Panel Workspace Layout: Col 1 (Chat), Col 2 (Itinerary), Col 3 (Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Column 1: AI Chat Assistant */}
        <section className={tripPanelClass} aria-label="Hội thoại với Vistra">
          <h2 className="text-lg font-bold mb-3">Hội thoại với Vistra</h2>
          <div className="h-[40dvh] lg:h-[50dvh] min-h-64 overflow-y-auto overscroll-contain space-y-3" aria-label="Tin nhắn" role="log" aria-live="polite">
            {messages.length === 0 && <p className="text-[#4B5875] text-sm">Gửi yêu cầu để cùng Vistra điều chỉnh lịch trình.</p>}
            {messages.map((message, index) => (
              <div key={index} className={`rounded-xl border border-[#0E1D4F]/10 p-3 ${message.role === 'user' ? 'ml-4 bg-[#205BD6]/5' : 'mr-4 bg-[#EBF1F0]/40'}`}>
                <p className="text-xs font-semibold mb-1">{message.role === 'user' ? 'Yêu cầu của bạn' : 'Vistra'}</p>
                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
              </div>
            ))}
            {busy && <p role="status" className="text-sm text-[#4B5875]">Đang xử lý yêu cầu...</p>}
          </div>
          <form className="mt-4 space-y-2" onSubmit={async (event) => { event.preventDefault(); if (await workspace.send(text)) setText(''); }}>
            <label htmlFor="planner-message" className="text-sm font-semibold">Yêu cầu điều chỉnh</label>
            <textarea
              id="planner-message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={4000}
              rows={3}
              disabled={busy || !editable || !itinerary || !!preview}
              className="w-full p-3 border border-[#0E1D4F]/15 rounded-xl text-base disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !editable || !itinerary || !text.trim() || !!preview}
              className={`${tripButtonClass} w-full bg-[#205BD6] text-white`}
            >
              Gửi yêu cầu
            </button>
          </form>
          {!editable && <p className="text-sm mt-3 text-[#4B5875]">Lịch trình đã chốt.</p>}
          {selectedPlace !== null && <PlaceSources key={`${trip.id}:${selectedPlace}`} id={selectedPlace} />}
        </section>

        {/* Column 2: Detailed Itinerary or Dedicated Empty State */}
        {itinerary ? (
          <div className="min-w-0 space-y-3">
            {preview && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4" role="status">
                <p className="font-semibold">Bản xem trước · Chưa lưu</p>
                <p className="text-sm mt-2">Thay đổi chi phí đã biết: {money(preview.known_cost_delta_vnd)}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button type="button" disabled={busy} className={tripButtonClass} onClick={workspace.savePreview}>
                    Lưu thay đổi
                  </button>
                  <button type="button" disabled={busy} className={tripButtonClass} onClick={workspace.discardPreview}>
                    Giữ lịch trình cũ
                  </button>
                </div>
              </div>
            )}
            <ItineraryView
              itinerary={itinerary}
              request={trip.request}
              selectedDay={selectedDay}
              onDay={setDay}
              selectedPlace={selectedPlace}
              onPlace={setPlace}
              busy={busy}
              onMove={editable ? workspace.move : undefined}
            />
          </div>
        ) : (
          <section className={`${tripPanelClass} space-y-4`} aria-label="Lịch trình chi tiết">
            <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10">
              <h2 className="text-lg font-bold">Lịch trình chi tiết</h2>
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                Chưa có lịch trình
              </span>
            </div>
            <p className="text-sm text-[#4B5875]">
              {typeof trip.generation_error === 'string'
                ? trip.generation_error
                : 'Hành trình chưa có chặng dừng chi tiết. Nhấn nút bên dưới để Vistra tự động sinh lịch trình.'}
            </p>
            <button
              type="button"
              disabled={busy || trip.current_version !== 0}
              className={`${tripButtonClass} bg-[#205BD6] text-white w-full`}
              onClick={workspace.generate}
            >
              {busy ? 'Đang tạo lịch trình...' : 'Tạo lịch trình từ gợi ý'}
            </button>
            {trip.recommendations && Object.keys(trip.recommendations).length > 0 && (
              <div className="pt-2 border-t border-[#0E1D4F]/10">
                <p className="text-xs font-semibold text-[#0E1D4F] mb-2">Điểm đến đề xuất:</p>
                <ul className="text-xs text-[#4B5875] space-y-1 list-disc pl-4 max-h-48 overflow-y-auto">
                  {Object.values(trip.recommendations).flat().map((item) => (
                    <li key={item.id}>{item.display_name}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Column 3: Route Map or Dedicated Empty Map Frame */}
        {itinerary ? (
          <TripMap itinerary={itinerary} day={selectedDay} selectedPlace={selectedPlace} onPlace={setPlace} />
        ) : (
          <section className={`${tripPanelClass} flex flex-col items-center justify-center min-h-[350px] text-center p-6 space-y-3`} aria-label="Bản đồ tuyến đường">
            <div className="size-12 rounded-2xl bg-[#EBF1F0] flex items-center justify-center text-[#4B5875]">
              <Icon name="map" className="size-6 text-[#205BD6]" />
            </div>
            <h3 className="font-bold text-sm text-[#0E1D4F]">Bản đồ tuyến đường</h3>
            <p className="text-xs text-[#4B5875] max-w-xs leading-relaxed">
              Bản đồ trực quan sẽ hiển thị toàn bộ điểm dừng và tuyến đường nối sau khi lịch trình được khởi tạo.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Icon from '@/components/ui/Icon';
import ItineraryView, { money, tripButtonClass, tripPanelClass } from '@/components/trip-plan/ItineraryView';
import TripMap, { getCoordinateValidActivities } from '@/components/trip-plan/TripMap';
import PlaceSources from './PlaceSources';
import PlannerDocumentDialog from './PlannerDocumentDialog';
import TripPageState from './TripPageState';
import PlannerHeader, { useProvinceName } from './PlannerHeader';
import { useTripWorkspace } from './useTripWorkspace';

const MAX_SELECTED_PLACES = 12;

function renderChatMarkdown(text: string) {
  return text.split('\n').map((line, index) => {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const content = (heading?.[1] ?? bullet?.[1] ?? line)
      .replace(/\\([#*])/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1');
    const inline = content.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
        : part
    );
    return (
      <span key={index} className={heading ? 'block mt-2 font-bold' : bullet ? 'block pl-3 before:content-["•"] before:mr-1' : 'block'}>
        {inline}
      </span>
    );
  });
}

export default function PlannerScreen() {
  const workspace = useTripWorkspace();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [documentTripId, setDocumentTripId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#EBF1F0] text-[#0E1D4F]">
      <PlannerHeader
        trip={workspace.trip}
        hasPreview={Boolean(workspace.preview)}
        busy={workspace.busy}
        onDocument={() => setDocumentTripId(workspace.trip?.id ?? null)}
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

      {workspace.trip && (
        <PlannerDocumentDialog
          open={documentTripId === workspace.trip.id}
          onClose={() => setDocumentTripId(null)}
          trip={workspace.trip}
        />
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Chốt lịch trình này?"
        message={workspace.trip?.itinerary
          ? 'Xác nhận phương án đã lưu trên hệ thống. Sau khi chốt, bạn có thể chia sẻ lên cộng đồng.'
          : 'Lịch trình chưa có chi tiết. Hệ thống sẽ kiểm tra yêu cầu chốt và báo nếu cần bổ sung thông tin.'}
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
  const { trip, itinerary, messages, preview, busy, error, confirmationResolved } = workspace;
  const [day, setDay] = useState(1);
  const [place, setPlace] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [dismissedConfirmationIndex, setDismissedConfirmationIndex] = useState<number | null>(null);
  const destinationName = useProvinceName(trip?.destination_id, trip?.request.destination);

  if (!trip) return null;
  const selectedDay = day <= trip.request.days ? day : 1;
  const selectedPlace = itinerary?.activities.some(item => item.day === selectedDay && item.place_id === place) ? place : null;
  const hasMapCoordinates = getCoordinateValidActivities(
    itinerary?.activities.filter(item => item.day === selectedDay) ?? []
  ).length > 0;
  const editable = trip.status === 'draft';
  const recommendedPlaces = Array.from(new Map([
    ...trip.recommendations.attraction,
    ...trip.recommendations.food,
    ...trip.recommendations.stay,
  ].map(place => [place.id, place])).values());
  const canAddPlaces = editable && trip.current_version === 0 && !itinerary;
  const canReplacePlaces = editable && Boolean(itinerary) && !preview;
  const selectedPlaces = recommendedPlaces.filter(item => selectedIds.includes(item.id));
  const selectedRecommendationId = selectedIds.length === 1 ? selectedIds[0] : null;
  // shortcut: PlaceDto has no image field; replace the neutral media tile when Backend confirms the recommendation image contract.
  const recommendationCards = canAddPlaces
    ? recommendedPlaces
    : canReplacePlaces && itinerary
      ? recommendedPlaces.filter(item => !itinerary.activities.some(activity => activity.place_id === item.id))
      : [];
  const confirmationSent = [...messages].reverse().some(item => item.role === 'user' &&
    /xác nhận|xac nhan/i.test(item.text));

  const toggleRecommendation = (id: number) => {
    setSelectedIds(ids => {
      if (!canAddPlaces) return ids[0] === id ? [] : [id];
      return ids.includes(id) ? ids.filter(item => item !== id) : ids.length < MAX_SELECTED_PLACES ? [...ids, id] : ids;
    });
  };

  const discardPreview = () => {
    workspace.discardPreview();
    setSelectedIds([]);
    setPlace(null);
  };

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

      {/* Keep the map column only when the selected day has valid coordinates. */}
      <div className={`grid grid-cols-1 ${hasMapCoordinates ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4 items-start`}>
        {/* Column 1: AI Chat Assistant */}
        <section className={tripPanelClass} aria-label="Hội thoại với Vistra">
          <h2 className="text-lg font-bold mb-3">Hội thoại với Vistra</h2>
          <div className="max-h-[40dvh] lg:max-h-[50dvh] min-h-32 overflow-y-auto overscroll-contain space-y-3" aria-label="Tin nhắn" role="log" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-[#4B5875] text-sm">
                {!itinerary
                  ? 'Bạn có thể tiếp tục trao đổi với Vistra hoặc chọn điểm đến gợi ý bên dưới.'
                  : 'Gửi yêu cầu để cùng Vistra điều chỉnh lịch trình.'}
              </p>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`rounded-xl border border-[#0E1D4F]/10 p-3 ${message.role === 'user' ? 'ml-4 bg-[#205BD6]/5' : 'mr-4 bg-[#EBF1F0]/40'}`}>
                <p className="text-xs font-semibold mb-1">{message.role === 'user' ? 'Yêu cầu của bạn' : 'Vistra'}</p>
                <div className="text-sm break-words">{renderChatMarkdown(message.text)}</div>
                {message.role === 'assistant' && index === messages.length - 1 && dismissedConfirmationIndex !== index && !confirmationSent && !preview && !confirmationResolved && (
                  <div className="mt-3 border-t border-amber-200 pt-3" role="group" aria-label="Xác nhận thay đổi lịch trình">
                    <p className="text-xs text-[#4B5875]">Lịch trình chưa thay đổi. Bạn muốn thực hiện yêu cầu này không?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" disabled={busy} onClick={() => {
                        const lastRequest = [...messages].reverse().find(item => item.role === 'user')?.text ?? '';
                        return void workspace.send(`Tôi xác nhận. Hãy thực hiện ngay yêu cầu thay đổi này và tạo bản nháp mới: ${lastRequest}`, false);
                      }} className={`${tripButtonClass} bg-[#205BD6] text-white`}>Xác nhận thay đổi</button>
                      <button type="button" disabled={busy} onClick={() => setDismissedConfirmationIndex(index)} className={tripButtonClass}>Bỏ qua gợi ý</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {busy && <p role="status" className="text-sm text-[#4B5875]">Đang xử lý yêu cầu...</p>}
          </div>
          {(canAddPlaces || canReplacePlaces) && (
            <section className="mt-4 border-t border-[#0E1D4F]/10 pt-4" aria-labelledby="planner-recommendations-title">
              {itinerary && <button type="button" onClick={() => setRecommendationsOpen(value => !value)} className="mb-3 flex w-full items-center justify-between rounded-lg border border-[#0E1D4F]/10 bg-[#EBF1F0]/40 px-3 py-2 text-left text-sm font-bold">
                <span>Điểm đến gợi ý</span><span aria-hidden="true">{recommendationsOpen ? '−' : '+'}</span>
              </button>}
              <div className={itinerary && !recommendationsOpen ? 'hidden' : ''}>
              <div className="mb-3">
                <h3 id="planner-recommendations-title" className="text-sm font-bold">Điểm đến gợi ý</h3>
                <p className="mt-1 text-xs text-[#4B5875]">
                  {canAddPlaces
                    ? 'Chọn tối đa 12 điểm muốn đưa vào lịch trình.'
                    : selectedPlace !== null
                      ? `Điểm dừng đang chọn: ${itinerary?.activities.find(item => item.place_id === selectedPlace)?.name ?? ''}.`
                      : 'Chọn một điểm dừng trong lịch trình, rồi chọn nơi muốn thay thế.'}
                </p>
              </div>
              {recommendationCards.length > 0 ? (
                <div className="max-h-[360px] w-full overflow-y-auto overscroll-y-contain pr-1 pb-2">
                  <div role="group" aria-label="Chọn điểm đến gợi ý" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {recommendationCards.map(item => {
                      const selected = canAddPlaces ? selectedIds.includes(item.id) : selectedRecommendationId === item.id;
                      const atLimit = canAddPlaces && !selected && selectedIds.length >= MAX_SELECTED_PLACES;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={`Chọn ${item.display_name}${selected ? ', đã chọn' : ''}`}
                          aria-pressed={selected}
                          disabled={busy || atLimit}
                          onClick={() => toggleRecommendation(item.id)}
                          className={`group relative h-32 min-w-0 overflow-hidden rounded-xl border bg-warm-paper text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border-[#205BD6] ring-2 ring-[#205BD6]/30' : 'border-[#0E1D4F]/15 hover:border-[#205BD6]/60'}`}
                        >
                          {item.image_url && <img src={item.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
                          <span aria-hidden="true" className={`absolute inset-0 grid place-items-center text-[#4B5875] ${item.image_url ? 'hidden' : ''}`}>
                            <span className="flex flex-col items-center gap-1 text-[10px]">
                              <Icon name="image" className="size-5" />
                              Ảnh chưa có
                            </span>
                          </span>
                          <span className={`absolute inset-x-0 bottom-0 line-clamp-2 bg-[#0E1D4F]/90 px-1.5 py-1 text-center text-[10px] font-semibold leading-tight text-white transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>
                            {item.display_name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-warm-paper px-3 py-2 text-xs text-[#4B5875]">Không còn điểm gợi ý có thể chọn.</p>
              )}
              {canAddPlaces && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p role="status" className="text-xs text-[#4B5875]">
                    Đã chọn {selectedIds.length}/{MAX_SELECTED_PLACES}
                    {selectedIds.length >= MAX_SELECTED_PLACES && ' · Bỏ chọn một điểm để chọn điểm khác'}
                  </p>
                  <button
                    type="button"
                    disabled={busy || selectedIds.length === 0}
                    className={`${tripButtonClass} bg-[#205BD6] text-white disabled:opacity-50`}
                    onClick={async () => {
                      const allowUnverified = selectedPlaces.some(item => item.quality_status !== 'verified' && item.quality_status !== 'schedulable');
                      if (await workspace.generate(selectedIds, allowUnverified)) setSelectedIds([]);
                    }}
                  >
                    {busy ? 'Đang tạo lịch trình...' : 'Tạo lịch trình từ điểm đã chọn'}
                  </button>
                </div>
              )}
              {canReplacePlaces && (
                <div className="mt-3 space-y-2">
                  <p role="status" className="text-xs text-[#4B5875]">
                    {selectedRecommendationId ? `Điểm thay thế: ${recommendedPlaces.find(item => item.id === selectedRecommendationId)?.display_name ?? ''}.` : 'Chọn một mini-card để làm điểm thay thế.'}
                  </p>
                  <button
                    type="button"
                    disabled={busy || !selectedRecommendationId || selectedPlace === null}
                    className={`${tripButtonClass} w-full bg-[#205BD6] text-white disabled:opacity-50`}
                    onClick={() => {
                      if (selectedRecommendationId && selectedPlace !== null) {
                        void workspace.replacePlace(selectedRecommendationId, selectedPlace);
                      }
                    }}
                  >
                    {busy ? 'Đang tạo bản xem trước...' : 'Yêu cầu xem trước'}
                  </button>
                </div>
              )}
              </div>
            </section>
          )}
          <form className="mt-4 space-y-2" onSubmit={async (event) => { event.preventDefault(); if (await workspace.send(text)) setText(''); }}>
            <div className="flex items-center justify-between">
              <label htmlFor="planner-message" className="text-sm font-semibold">Yêu cầu điều chỉnh</label>
            </div>
            <textarea
              id="planner-message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={async (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (!busy && editable && text.trim() && !preview) {
                    if (await workspace.send(text)) setText('');
                  }
                }
              }}
              maxLength={4000}
              rows={3}
              placeholder={!itinerary ? 'Mô tả chuyến đi bạn muốn Vistra hỗ trợ…' : 'Nhập yêu cầu điều chỉnh…'}
              disabled={busy || !editable || !!preview}
              className="w-full p-3 border border-[#0E1D4F]/15 rounded-xl text-base disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !editable || !text.trim() || !!preview}
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
                <p className="text-sm mt-1">Nếu vừa bỏ điểm đến, thay đổi chỉ có hiệu lực sau khi bạn chọn “Lưu thay đổi”.</p>
                <p className="text-sm mt-2">Thay đổi chi phí đã biết: {money(preview.known_cost_delta_vnd)}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button type="button" disabled={busy} className={`${tripButtonClass} bg-[#205BD6] text-white`} onClick={workspace.savePreview}>
                    Lưu thay đổi
                  </button>
                  <button type="button" disabled={busy} className={tripButtonClass} onClick={discardPreview}>
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
              onMove={editable && !preview ? workspace.move : undefined}
              onRemove={editable && !preview ? workspace.remove : undefined}
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
            <p role={trip.generation_error ? 'status' : undefined} className="text-sm text-[#4B5875]">
              {trip.generation_error
                ? 'Vistra chưa tạo được lịch trình tự động. Bạn vẫn có thể tiếp tục trao đổi trong hội thoại.'
                : recommendedPlaces.length > 0
                  ? 'Chưa có lịch trình chi tiết. Bạn có thể trao đổi với Vistra hoặc chọn điểm gợi ý trong hội thoại.'
                  : 'Chưa có lịch trình hay điểm đến gợi ý. Bạn vẫn có thể trao đổi với Vistra để tiếp tục.'}
            </p>
          </section>
        )}

        {/* Map appears only when this day's itinerary has valid coordinates. */}
        {hasMapCoordinates && itinerary && (
          <div className="min-w-0">
            <TripMap itinerary={itinerary} day={selectedDay} selectedPlace={selectedPlace} onPlace={setPlace} />
          </div>
        )}
      </div>
    </div>
  );
}

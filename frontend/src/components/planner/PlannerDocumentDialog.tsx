'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import ItineraryView, { money } from '@/components/trip-plan/ItineraryView';
import type { TripDetailDto } from '@/types/tripApi';
import { useProvinceName } from './PlannerHeader';

interface PlannerDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  trip: TripDetailDto;
}

export default function PlannerDocumentDialog({ open, onClose, trip }: PlannerDocumentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [day, setDay] = useState(1);
  const [place, setPlace] = useState<number | null>(null);
  const destinationName = useProvinceName(trip.destination_id, trip.request.destination);
  const selectedDay = day <= trip.request.days ? day : 1;
  const selectedPlace = trip.itinerary?.activities.some((item) => item.day === selectedDay && item.place_id === place) ? place : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
      previousFocus.current?.focus();
    }
    return () => {
      if (dialog.open) dialog.close();
      if (open) previousFocus.current?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      aria-labelledby="planner-document-title"
      className="fixed inset-x-4 top-20 m-0 w-[calc(100%-2rem)] max-h-[calc(100dvh-6rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[#0E1D4F]/10 bg-[#EBF1F0] p-0 text-[#0E1D4F] shadow-2xl backdrop:bg-[#0E1D4F]/40 sm:inset-x-auto sm:right-6"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#0E1D4F]/10 bg-white px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id="planner-document-title" className="text-base font-bold">Tài liệu hành trình</h2>
          <p className="truncate text-sm text-[#4B5875]">{destinationName || trip.request.destination}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng tài liệu hành trình"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[#4B5875] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] cursor-pointer"
        >
          <Icon name="close" className="size-5" />
        </button>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-[#0E1D4F]/10 bg-white p-4 text-sm sm:grid-cols-4">
          <div><dt className="text-[#4B5875]">Khởi hành</dt><dd className="font-semibold">{trip.request.start_date}</dd></div>
          <div><dt className="text-[#4B5875]">Thời lượng</dt><dd className="font-semibold">{trip.request.days} ngày</dd></div>
          <div><dt className="text-[#4B5875]">Thành viên</dt><dd className="font-semibold">{trip.request.people} người</dd></div>
          <div><dt className="text-[#4B5875]">Ngân sách</dt><dd className="font-semibold">{money(trip.request.budget_vnd)}{trip.request.budget_scope === 'per_person' ? ' / người' : ''}</dd></div>
        </dl>

        {trip.itinerary ? (
          <ItineraryView
            itinerary={trip.itinerary}
            request={trip.request}
            selectedDay={selectedDay}
            onDay={setDay}
            selectedPlace={selectedPlace}
            onPlace={setPlace}
          />
        ) : (
          <div role="status" className="rounded-2xl border border-[#0E1D4F]/10 bg-white p-5 text-sm text-[#4B5875]">
            Chưa có lịch trình chi tiết. Bạn vẫn có thể tiếp tục trao đổi hoặc chọn địa điểm gợi ý trong hội thoại.
          </div>
        )}
      </div>
    </dialog>
  );
}

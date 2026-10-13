"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { endDateFromDuration } from "@/lib/dateUtils";
import type {
  PlanActivityDto,
  PlanItineraryDto,
  PlanRequestDto,
  PlanRouteLegDto,
} from "@/types/planApi";
import { weatherIcon } from "./weatherIcons";

export const tripButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0E1D4F]/15 px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-[#EBF1F0] disabled:opacity-50 disabled:cursor-not-allowed";
export const tripPanelClass =
  "min-w-0 rounded-2xl border border-[#0E1D4F]/10 bg-white/85 p-4 sm:p-5 text-[#0E1D4F]";
export const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

const WEATHER_WINDOWS = [
  { label: "0h–5h", startHour: 0, endHour: 5, timeOfDay: "night" },
  { label: "6h–12h", startHour: 6, endHour: 12, timeOfDay: "day" },
  { label: "13h–18h", startHour: 13, endHour: 18, timeOfDay: "day" },
  { label: "19h–23h", startHour: 19, endHour: 23, timeOfDay: "night" },
] as const;

function time(value: string, timezone: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

export function dateLabel(value: string) {
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

function forecastLocalTime(value: string, timezone: string) {
  const localTimestamp = /^(\d{4}-\d{2}-\d{2})T(\d{2}):\d{2}/.exec(value);
  // Open-Meteo returns local wall times without an offset when a timezone is requested.
  if (localTimestamp && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    return { date: localTimestamp[1], hour: Number(localTimestamp[2]) };
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(date)
        .map((part) => [part.type, part.value]),
    );
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      hour: Number(parts.hour),
    };
  } catch {
    return null;
  }
}

function weatherWindows(itinerary: PlanItineraryDto, date: string | null) {
  const hourly = itinerary.weather.hourly;
  const summaries = WEATHER_WINDOWS.map((window) => ({
    ...window,
    temperatures: [] as number[],
    precipitation: [] as number[],
    count: 0,
  }));
  if (!date || !hourly) return summaries;
  try {
    new Intl.DateTimeFormat("en", { timeZone: itinerary.timezone });
  } catch {
    return summaries;
  }

  hourly.time.forEach((timestamp, index) => {
    const local = forecastLocalTime(timestamp, itinerary.timezone);
    if (!local || local.date !== date) return;
    const window = summaries.find(
      (item) => local.hour >= item.startHour && local.hour <= item.endHour,
    );
    if (!window) return;
    window.count += 1;
    const temperature = hourly.temperature_2m[index];
    const precipitation = hourly.precipitation_probability[index];
    if (typeof temperature === "number" && Number.isFinite(temperature))
      window.temperatures.push(temperature);
    if (typeof precipitation === "number" && Number.isFinite(precipitation))
      window.precipitation.push(precipitation);
  });
  return summaries;
}

function valueRange(values: number[], unit: string) {
  if (values.length === 0) return "Chưa có dữ liệu";
  const low = Math.min(...values).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  });
  const high = Math.max(...values).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  });
  return `${low}${low === high ? "" : `–${high}`} ${unit}`;
}

function validImageUrl(value: string | null | undefined) {
  const source = value?.trim();
  if (!source || source.startsWith("//")) return null;
  if (source.startsWith("/")) return source;
  if (!/^https?:\/\//i.test(source)) return null;
  try {
    const url = new URL(source);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname
      ? source
      : null;
  } catch {
    return null;
  }
}

function PlaceImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="relative mt-2 aspect-[16/9] w-full overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        unoptimized={src.startsWith("http://")}
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}

function routeLegsForDay(
  itinerary: PlanItineraryDto,
  activities: PlanActivityDto[],
  selectedDay: number,
) {
  const activityIndex = new Map(
    itinerary.activities.map((activity, index) => [activity.place_id, index]),
  );
  const dayActivityIds = new Set(
    activities.map((activity) => activity.place_id),
  );
  const byTarget = new Map<
    number,
    Array<{ leg: PlanRouteLegDto; fromName: string }>
  >();

  itinerary.route_legs
    .filter((leg) => leg.day === selectedDay)
    .forEach((leg) => {
      if (leg.from_place_id === null || !dayActivityIds.has(leg.to_place_id))
        return;
      const fromIndex = activityIndex.get(leg.from_place_id);
      const toIndex = activityIndex.get(leg.to_place_id);
      if (
        fromIndex === undefined ||
        toIndex === undefined ||
        fromIndex >= toIndex
      )
        return;
      const fromActivity = itinerary.activities[fromIndex];
      if (fromActivity.day !== selectedDay || toIndex !== fromIndex + 1) return;
      const entries = byTarget.get(leg.to_place_id) ?? [];
      entries.push({ leg, fromName: fromActivity.name });
      byTarget.set(leg.to_place_id, entries);
    });

  return byTarget;
}

export default function ItineraryView({
  itinerary,
  request,
  selectedDay,
  onDay,
  selectedPlace,
  onPlace,
  busy = false,
  onMove,
  onRemove,
  showWeatherControls = false,
}: {
  itinerary: PlanItineraryDto;
  request: PlanRequestDto;
  selectedDay: number;
  onDay: (day: number) => void;
  selectedPlace: number | null;
  onPlace: (id: number) => void;
  busy?: boolean;
  onMove?: (id: number, target: number) => void;
  onRemove?: (placeId: number) => void;
  showWeatherControls?: boolean;
}) {
  const days = Array.from({ length: request.days }, (_, index) => index + 1);
  const activities = itinerary.activities.filter(
    (item) => item.day === selectedDay,
  );
  const date = endDateFromDuration(request.start_date, selectedDay);
  const tripEndDate = endDateFromDuration(request.start_date, request.days);
  const weatherSummary = weatherWindows(itinerary, date);
  const legsByTarget = routeLegsForDay(itinerary, activities, selectedDay);
  const notesCount =
    itinerary.warnings.length +
    itinerary.activities.reduce(
      (count, activity) => count + activity.notes.length,
      0,
    );
  const notesId = `itinerary-notes-${useId()}`;
  const weatherTooltipPrefix = `itinerary-weather-${useId()}`;
  const [notesOpen, setNotesOpen] = useState(false);
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const notesButtonRef = useRef<HTMLButtonElement>(null);
  const notesCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!notesOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !notesContainerRef.current?.contains(event.target)
      )
        setNotesOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setNotesOpen(false);
      notesButtonRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [notesOpen]);

  useEffect(() => {
    if (notesOpen) notesCloseRef.current?.focus();
  }, [notesOpen]);

  const closeNotes = () => {
    setNotesOpen(false);
    notesButtonRef.current?.focus();
  };

  return (
    <section className={tripPanelClass} aria-label="Lịch trình">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            Lịch trình {onMove || onRemove ? "bản nháp" : "chi tiết"}
          </h2>
          {/* {tripEndDate && (
            <p className="mt-1 text-sm text-[#4B5875]">
              {dateLabel(request.start_date)} – {dateLabel(tripEndDate)}
            </p>
          )} */}
        </div>
        <div className="no-print flex items-start gap-2">
          {showWeatherControls && (
            <div
              role="group"
              aria-label="Dự báo thời tiết theo khung giờ"
              className="flex items-center gap-2"
            >
              {weatherSummary.map((window, index) => {
                const tooltipId = `${weatherTooltipPrefix}-${index}`;
                const tooltipPosition =
                  index === 0
                    ? "left-0"
                    : index === weatherSummary.length - 1
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2";
                return (
                  <span
                    key={window.label}
                    className="group relative inline-flex"
                  >
                    <button
                      type="button"
                      aria-label={`Dự báo ${window.label}`}
                      aria-describedby={tooltipId}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#0E1D4F]/15 text-[#205BD6] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] cursor-help"
                    >
                      <Image
                        src={`/weather/meteocons/${weatherIcon(window.temperatures, window.precipitation, window.timeOfDay)}.svg`}
                        alt=""
                        aria-hidden="true"
                        width={28}
                        height={28}
                        unoptimized
                      />
                    </button>
                    <span
                      id={tooltipId}
                      role="tooltip"
                      className={`invisible pointer-events-none absolute ${tooltipPosition} top-full z-30 mt-2 w-60 rounded-xl border border-[#0E1D4F]/15 bg-white p-3 text-left text-xs text-[#0E1D4F] opacity-0 shadow-xl group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100`}
                    >
                      <strong className="mb-1 block text-sm">
                        {window.label}
                      </strong>
                      {itinerary.weather.type === "unavailable" ? (
                        <span>
                          Chưa có dự báo:{" "}
                          {itinerary.weather.reason ||
                            "nhà cung cấp không có dữ liệu"}
                          .
                        </span>
                      ) : window.count === 0 ? (
                        <span>Không có dữ liệu trong khung giờ này.</span>
                      ) : (
                        <span className="block space-y-1">
                          <span className="block">
                            Nhiệt độ: {valueRange(window.temperatures, "°C")}
                          </span>
                          <span className="block">
                            Khả năng mưa theo giờ:{" "}
                            {valueRange(window.precipitation, "%")}
                          </span>
                        </span>
                      )}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
          <div className="relative" ref={notesContainerRef}>
            <button
              ref={notesButtonRef}
              type="button"
              aria-label={`Mở lưu ý hành trình, ${notesCount} mục`}
              aria-expanded={notesOpen}
              aria-haspopup="dialog"
              aria-controls={notesOpen ? notesId : undefined}
              onClick={() => setNotesOpen((open) => !open)}
              className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#0E1D4F]/15 text-[#0E1D4F] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] cursor-pointer"
            >
              <Icon name="notifications" className="size-5" />
              {notesCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 min-w-4 rounded-full bg-[#205BD6] px-1 text-[10px] leading-4 text-white"
                >
                  {notesCount}
                </span>
              )}
            </button>
            {notesOpen && (
              <div
                id={notesId}
                role="dialog"
                aria-label="Lưu ý hành trình"
                className="absolute right-0 top-full z-20 mt-2 max-h-[70dvh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[#0E1D4F]/15 bg-white p-4 text-sm text-[#0E1D4F] shadow-xl"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold">Lưu ý hành trình</h3>
                  <button
                    ref={notesCloseRef}
                    type="button"
                    onClick={closeNotes}
                    aria-label="Đóng lưu ý"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-[#205BD6] cursor-pointer"
                  >
                    <Icon name="close" className="size-5" />
                  </button>
                </div>
                {notesCount === 0 ? (
                  <p className="text-[#4B5875]">
                    Chưa có lưu ý cho hành trình này.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {itinerary.warnings.length > 0 && (
                      <details>
                        <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">
                          Toàn hành trình
                        </summary>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {itinerary.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {itinerary.activities
                      .filter((activity) => activity.notes.length > 0)
                      .map((activity) => (
                        <section key={activity.place_id}>
                          <details>
                            <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">
                              {activity.name}
                            </summary>
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                              {activity.notes.map((note, index) => (
                                <li key={index}>{note}</li>
                              ))}
                            </ul>
                          </details>
                        </section>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="mb-4 flex flex-wrap gap-2 no-print"
        aria-label="Chọn ngày"
      >
        {days.map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={day === selectedDay}
            onClick={() => onDay(day)}
            className={`${tripButtonClass} ${day === selectedDay ? "bg-[#205BD6] text-white" : ""}`}
          >
            Ngày {day}
          </button>
        ))}
      </div>

      {/* <section
        aria-label="Dự báo thời tiết"
        className="mb-4 rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/60 p-3 sm:p-4"
      >
        <h3 className="mb-3 font-semibold">Dự báo thời tiết</h3>
        {itinerary.weather.type === "unavailable" ? (
          <p className="text-sm text-[#4B5875]">
            Chưa có dự báo:{" "}
            {itinerary.weather.reason || "nhà cung cấp không có dữ liệu"}.
          </p>
        ) : (
          <>
            {itinerary.weather.source && (
              <p className="mb-3 text-xs text-[#4B5875]">
                Nguồn: {itinerary.weather.source}
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {weatherSummary.map((window) => (
                <article
                  key={window.label}
                  className="rounded-lg border border-[#0E1D4F]/10 bg-white p-3"
                >
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Image
                      src={`/weather/meteocons/${weatherIcon(window.temperatures, window.precipitation, window.timeOfDay)}.svg`}
                      alt=""
                      aria-hidden="true"
                      width={28}
                      height={28}
                      unoptimized
                    />
                    {window.label}
                  </h4>
                  {window.count === 0 ? (
                    <p className="mt-2 text-sm text-[#4B5875]">
                      Không có dữ liệu trong khung giờ này.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Nhiệt độ: {valueRange(window.temperatures, "°C")}</p>
                      <p>
                        Khả năng mưa theo giờ:{" "}
                        {valueRange(window.precipitation, "%")}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section> */}

      <div className="space-y-3">
        {activities.length === 0 && (
          <p className="text-[#4B5875]">Chưa có điểm dừng cho ngày này.</p>
        )}
        {activities.map((item, index) => {
          const imageUrl = validImageUrl(item.image_url);
          return (
            <div key={item.place_id}>
              {legsByTarget.get(item.place_id)?.map(({ leg, fromName }) => (
                <p
                  key={`${leg.from_place_id}-${leg.to_place_id}`}
                  className="my-2 rounded-lg bg-[#EBF1F0]/70 px-3 py-2 text-sm text-[#4B5875]"
                >
                  Di chuyển từ {fromName} đến {item.name} ·{" "}
                  {leg.distance_km.toLocaleString("vi-VN")} km ·{" "}
                  {leg.duration_min} phút
                </p>
              ))}
              <article
                draggable={!!onMove && !busy}
                onDragStart={(event) =>
                  event.dataTransfer.setData(
                    "text/plain",
                    String(item.place_id),
                  )
                }
                onDragOver={(event) => {
                  if (onMove && !busy) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!busy)
                    onMove?.(
                      Number(event.dataTransfer.getData("text/plain")),
                      item.place_id,
                    );
                }}
                className={`rounded-xl border p-3 ${selectedPlace === item.place_id ? "border-[#205BD6] bg-[#205BD6]/5" : "border-[#0E1D4F]/10"}`}
              >
                <button
                  type="button"
                  onClick={() => onPlace(item.place_id)}
                  className="min-h-11 text-left w-full cursor-pointer font-semibold text-[#0E1D4F]"
                >
                  {index + 1}. {item.name}
                </button>
                <p className="text-sm text-[#4B5875]">
                  {time(item.start_at, itinerary.timezone)} –{" "}
                  {time(item.end_at, itinerary.timezone)}
                </p>
                {imageUrl && (
                  <PlaceImage key={imageUrl} src={imageUrl} alt={item.name} />
                )}
                <p className="text-sm mt-2">
                  {item.estimated_cost
                    ? `${money(item.estimated_cost.min_vnd)} – ${money(item.estimated_cost.max_vnd)}`
                    : "Chưa có giá tham khảo"}
                </p>
                {item.reason && (
                  <p className="text-sm text-[#4B5875] mt-2">{item.reason}</p>
                )}
                {(onMove || onRemove) && (
                  <div className="flex flex-wrap gap-2 mt-2 no-print">
                    {onMove && (
                      <>
                        <button
                          type="button"
                          disabled={busy || index === 0}
                          onClick={() =>
                            onMove(
                              item.place_id,
                              activities[index - 1].place_id,
                            )
                          }
                          aria-label={`Đưa ${item.name} lên trước`}
                          className={tripButtonClass}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={busy || index === activities.length - 1}
                          onClick={() =>
                            onMove(
                              item.place_id,
                              activities[index + 1].place_id,
                            )
                          }
                          aria-label={`Đưa ${item.name} xuống sau`}
                          className={tripButtonClass}
                        >
                          ↓
                        </button>
                      </>
                    )}
                    {onRemove && (
                      <button
                        type="button"
                        disabled={busy || itinerary.activities.length <= 1}
                        onClick={() => onRemove(item.place_id)}
                        aria-label={`Xóa ${item.name} khỏi lịch trình`}
                        className={`${tripButtonClass} text-rose-700 hover:bg-rose-50`}
                      >
                        Xóa khỏi lịch trình
                      </button>
                    )}
                  </div>
                )}
                {onRemove && itinerary.activities.length <= 1 && (
                  <p className="mt-2 text-xs text-[#4B5875]">
                    Lịch trình cần giữ ít nhất một điểm dừng.
                  </p>
                )}
              </article>
            </div>
          );
        })}
      </div>

      {(itinerary.warnings.length > 0 ||
        itinerary.activities.some((activity) => activity.notes.length > 0)) && (
        <div className="hidden print:block mt-4 border-t border-slate-300 pt-3 text-sm">
          <h3 className="font-semibold">Lưu ý hành trình</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {itinerary.warnings.map((warning, index) => (
              <li key={`warning-${index}`}>{warning}</li>
            ))}
            {itinerary.activities.flatMap((activity) =>
              activity.notes.map((note, index) => (
                <li key={`${activity.place_id}-${index}`}>
                  <strong>{activity.name}:</strong> {note}
                </li>
              )),
            )}
          </ul>
        </div>
      )}
    </section>
  );
}

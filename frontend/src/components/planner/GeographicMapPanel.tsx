'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import { DayItinerary, Activity } from '@/data/mockData';
import { DemoPlan } from '@/context/DemoPlanContext';

interface GeographicMapPanelProps {
  activePlan: DemoPlan;
  currentDay: DayItinerary;
  selectedDayNumber: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  mobileTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  isCollapsedDesktop?: boolean;
  onToggleCollapseDesktop?: () => void;
}

// Slippy tile math for OpenStreetMap
function project(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n * 256;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * 256;
  return { x, y };
}

export default function GeographicMapPanel({
  activePlan,
  currentDay,
  selectedDayNumber,
  isOpenMobile,
  onCloseMobile,
  mobileTriggerRef,
  isCollapsedDesktop = false,
  onToggleCollapseDesktop,
}: GeographicMapPanelProps) {
  const [zoom, setZoom] = useState<number>(13);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [tileError, setTileError] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement>(null);

  // Filter valid activities with coordinates for the current day
  const validStops = useMemo(() => {
    let order = 1;
    return currentDay.activities
      .filter((act): act is Activity => !('isTransit' in act))
      .map((act) => {
        const hasCoords = Boolean(act.coordinates && act.coordinates.lat && act.coordinates.lng);
        const item = {
          ...act,
          stopNumber: hasCoords ? order++ : undefined,
          hasCoords,
        };
        return item;
      });
  }, [currentDay]);

  const positionedStops = useMemo(() => {
    return validStops.filter((s) => s.hasCoords && s.coordinates);
  }, [validStops]);

  const unpositionedStops = useMemo(() => {
    return validStops.filter((s) => !s.hasCoords);
  }, [validStops]);

  // Calculate center of positioned stops or default coordinates
  const center = useMemo(() => {
    if (positionedStops.length > 0) {
      const sumLat = positionedStops.reduce((acc, s) => acc + s.coordinates!.lat, 0);
      const sumLng = positionedStops.reduce((acc, s) => acc + s.coordinates!.lng, 0);
      return {
        lat: sumLat / positionedStops.length,
        lng: sumLng / positionedStops.length,
      };
    }
    // Fallback based on destination
    const isDalat = activePlan.destination.includes('Đà Lạt') || activePlan.destination.includes('Lâm Đồng');
    return isDalat ? { lat: 11.9404, lng: 108.4380 } : { lat: 22.3364, lng: 103.8438 };
  }, [positionedStops, activePlan.destination]);

  // Handle mobile Escape key and focus
  useEffect(() => {
    if (!isOpenMobile) return;
    const triggerEl = mobileTriggerRef?.current;
    const timer = setTimeout(() => {
      mobileCloseBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseMobile();
        triggerEl?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      triggerEl?.focus();
    };
  }, [isOpenMobile, onCloseMobile, mobileTriggerRef]);

  // Slippy map tile calculations
  const viewWidth = 420;
  const viewHeight = 460;
  const centerPx = project(center.lat, center.lng, zoom);

  const startTileX = Math.floor((centerPx.x - viewWidth / 2) / 256);
  const endTileX = Math.floor((centerPx.x + viewWidth / 2) / 256);
  const startTileY = Math.floor((centerPx.y - viewHeight / 2) / 256);
  const endTileY = Math.floor((centerPx.y + viewHeight / 2) / 256);

  const tiles = [];
  for (let x = startTileX; x <= endTileX; x++) {
    for (let y = startTileY; y <= endTileY; y++) {
      tiles.push({
        x,
        y,
        key: `${zoom}-${x}-${y}`,
        left: x * 256 - (centerPx.x - viewWidth / 2),
        top: y * 256 - (centerPx.y - viewHeight / 2),
      });
    }
  }

  // Calculate SVG marker coordinates and connectors
  const markerPoints = positionedStops.map((stop) => {
    const pt = project(stop.coordinates!.lat, stop.coordinates!.lng, zoom);
    return {
      id: stop.id,
      title: stop.title,
      location: stop.location,
      timeStart: stop.timeStart,
      stopNumber: stop.stopNumber,
      x: pt.x - (centerPx.x - viewWidth / 2),
      y: pt.y - (centerPx.y - viewHeight / 2),
    };
  });

  const polylinePoints = markerPoints.map((m) => `${m.x},${m.y}`).join(' ');

  const content = (
    <div className="flex flex-col h-full bg-white/95 rounded-2xl overflow-hidden relative">
      {/* Map Control Header */}
      <div className="p-3 border-b border-[#0E1D4F]/10 flex items-center justify-between bg-white/80 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#205BD6]/10 flex items-center justify-center text-[#205BD6]">
            <Icon name="explore" className="size-4" />
          </div>
          <div>
            <h3 className="font-headline-sm text-xs font-bold text-[#0E1D4F] leading-tight">
              Bản đồ địa lý thực tế (Ngày {selectedDayNumber})
            </h3>
            <p className="text-[10px] text-[#4B5875]">Tọa độ định vị OpenStreetMap</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(18, z + 1))}
            className="p-1 rounded-lg text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors border border-[#0E1D4F]/10 cursor-pointer"
            title="Phóng to bản đồ"
            aria-label="Phóng to"
          >
            <Icon name="add" className="size-3.5" />
          </button>
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(9, z - 1))}
            className="p-1 rounded-lg text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors border border-[#0E1D4F]/10 cursor-pointer"
            title="Thu nhỏ bản đồ"
            aria-label="Thu nhỏ"
          >
            <Icon name="remove" className="size-3.5" />
          </button>
          {/* Recenter */}
          <button
            type="button"
            onClick={() => setZoom(13)}
            className="p-1 rounded-lg text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors border border-[#0E1D4F]/10 cursor-pointer"
            title="Đặt lại góc nhìn trung tâm"
            aria-label="Đặt lại góc nhìn"
          >
            <Icon name="my_location" className="size-3.5" />
          </button>

          {/* Desktop collapse toggle */}
          {onToggleCollapseDesktop && (
            <button
              type="button"
              onClick={onToggleCollapseDesktop}
              className="hidden lg:flex p-1 rounded-lg text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors border border-[#0E1D4F]/10 cursor-pointer ml-1"
              title="Thu gọn bản đồ"
              aria-label="Thu gọn bản đồ"
            >
              <Icon name="chevron_right" className="size-3.5" />
            </button>
          )}

          {/* Mobile close button */}
          {isOpenMobile && (
            <button
              ref={mobileCloseBtnRef}
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors border border-[#0E1D4F]/10 cursor-pointer ml-1"
              aria-label="Đóng bản đồ"
            >
              <Icon name="close" className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Map Canvas / Slippy Tiles Area */}
      <div
        ref={mapContainerRef}
        className="relative flex-1 overflow-hidden bg-[#e5e3df] select-none min-h-[320px]"
        style={{ width: '100%' }}
      >
        {/* OpenStreetMap Slippy Tiles or Clean Offline Fallback (UX-PL-GEO-01B) */}
        {!tileError ? (
          <div className="absolute inset-0 pointer-events-none">
            {tiles.map((t) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={t.key}
                src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
                alt=""
                onError={() => setTileError(true)}
                className="absolute w-[256px] h-[256px] opacity-95 transition-opacity"
                style={{
                  left: `${t.left}px`,
                  top: `${t.top}px`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#EBF1F0]">
            <Icon name="wifi_off" className="size-8 text-[#4B5875]/50 mb-2" />
            <span className="text-xs font-semibold text-[#0E1D4F]">
              Đang hiển thị bản đồ đồ họa ngoại tuyến
            </span>
            <span className="text-[11px] text-[#4B5875] mt-1 max-w-xs">
              Các điểm dừng và thứ tự kết nối vẫn được giữ nguyên đầy đủ.
            </span>
          </div>
        )}

        {/* SVG Overlay: Stop-order Connector Lines & Markers */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="none"
        >
          {/* Connector Line (Stop order, not navigation route) */}
          {polylinePoints && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#205BD6"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              strokeLinecap="round"
              className="drop-shadow-xs transition-all duration-300"
            />
          )}

          {/* Markers */}
          {markerPoints.map((m) => {
            const isSelected = selectedActivityId === m.id;
            return (
              <g
                key={m.id}
                transform={`translate(${m.x}, ${m.y})`}
                className="cursor-pointer pointer-events-auto group"
                onClick={() => setSelectedActivityId(isSelected ? null : m.id)}
              >
                {/* Ping animation if selected */}
                {isSelected && (
                  <circle
                    r="18"
                    fill="#205BD6"
                    opacity="0.25"
                    className="animate-ping origin-center"
                  />
                )}
                {/* Marker Outer Circle */}
                <circle
                  r={isSelected ? '14' : '11'}
                  fill={isSelected ? '#0E1D4F' : '#205BD6'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all drop-shadow-md"
                />
                {/* Marker Number Text */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#ffffff"
                  fontSize={isSelected ? '11' : '10'}
                  fontWeight="bold"
                >
                  {m.stopNumber}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Stop Tooltip Popover */}
        {selectedActivityId && (
          <div className="absolute top-3 left-3 right-3 z-20 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-[#205BD6]/30 shadow-lg text-xs animate-in fade-in duration-150">
            {(() => {
              const stop = positionedStops.find((s) => s.id === selectedActivityId);
              if (!stop) return null;
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#205BD6]">
                      Điểm dừng {stop.stopNumber} ({stop.timeStart})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedActivityId(null)}
                      className="text-[#4B5875] hover:text-[#0E1D4F]"
                      aria-label="Đóng chi tiết điểm dừng"
                    >
                      <Icon name="close" className="size-3.5" />
                    </button>
                  </div>
                  <h4 className="font-semibold text-[#0E1D4F] leading-snug line-clamp-1">
                    {stop.title}
                  </h4>
                  <p className="text-[11px] text-[#4B5875] truncate flex items-center gap-1">
                    <Icon name="location_on" className="size-3 text-[#205BD6]" />
                    <span>{stop.location}</span>
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Map Attribution (OpenStreetMap Terms requirement) */}
        <div className="absolute bottom-1 right-1.5 z-10 px-1.5 py-0.5 rounded bg-white/80 backdrop-blur-xs text-[9px] text-[#4B5875]">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a>
        </div>
      </div>

      {/* Bottom Itinerary Stops Summary & Legend */}
      <div className="p-3 border-t border-[#0E1D4F]/10 bg-white/95 shrink-0 max-h-36 overflow-y-auto space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#4B5875]">
          <span>Thứ tự các điểm dừng ({positionedStops.length})</span>
          <span className="text-[#205BD6] text-[10px]">Đường đứt nét: Thứ tự chặng</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {positionedStops.map((s) => {
            const isSelected = selectedActivityId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedActivityId(isSelected ? null : s.id)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#205BD6] text-white border-[#205BD6]'
                    : 'bg-[#EBF1F0] text-[#0E1D4F] border-[#0E1D4F]/10 hover:border-[#205BD6]/40'
                }`}
              >
                <span className="font-bold">{s.stopNumber}.</span>
                <span className="truncate max-w-[120px]">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Unpositioned stops notice (UX-PL-GEO-02) */}
        {unpositionedStops.length > 0 && (
          <div className="pt-1 border-t border-[#0E1D4F]/5 text-[10px] text-[#4B5875] flex items-center gap-1">
            <Icon name="info" className="size-3 text-amber-500 shrink-0" />
            <span>
              Chưa định vị {unpositionedStops.length} điểm (di chuyển đường dài / kết thúc hành trình).
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Desktop Collapsed State
  if (isCollapsedDesktop) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs h-[calc(100vh-210px)] min-h-[480px] max-h-[820px] w-12 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapseDesktop}
          className="p-2 rounded-xl text-[#205BD6] hover:bg-[#EBF1F0] transition-colors cursor-pointer flex flex-col items-center gap-2"
          title="Mở rộng bản đồ địa lý"
          aria-label="Mở rộng bản đồ địa lý"
        >
          <Icon name="chevron_left" className="size-5" />
          <span className="text-[10px] font-bold text-[#0E1D4F] [writing-mode:vertical-rl] tracking-wider uppercase">
            Bản đồ ({positionedStops.length})
          </span>
        </button>
      </div>
    );
  }

  // Desktop View
  return (
    <>
      <aside className="hidden lg:flex flex-col lg:col-span-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs h-[calc(100vh-210px)] min-h-[480px] max-h-[820px] overflow-hidden transition-all animate-in fade-in duration-200">
        {content}
      </aside>

      {/* Mobile / Tablet Overlay Panel (UX-PL-01B) */}
      {isOpenMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bản đồ địa lý hành trình"
          className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseMobile();
            }
          }}
        >
          <div className="w-full sm:max-w-lg h-[82vh] sm:h-[650px] bg-white rounded-t-3xl sm:rounded-3xl border border-[#0E1D4F]/10 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200 safe-bottom">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

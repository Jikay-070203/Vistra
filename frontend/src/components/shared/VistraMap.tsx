'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Icon from '@/components/ui/Icon';
import styles from './VistraMap.module.css';

export interface VistraMapMarker {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  label?: string;
  description?: string;
  kind?: string;
  order?: number;
  stopNumber?: number;
  title?: string;
  category?: string;
  timeStart?: string;
  location?: string;
}

export type MapMarker = VistraMapMarker;
export type MapCoord = { lat: number; lng: number } | [number, number];

export interface VistraMapProps {
  center: MapCoord;
  zoom?: number;
  markers?: VistraMapMarker[];
  route?: MapCoord[];
  selectedMarkerId?: string | null;
  activeMarkerId?: string | null;
  onSelectMarker?: (id: string | null) => void;
  onMarkerSelect?: (marker: VistraMapMarker | null) => void;
  onMarkerClick?: (marker: VistraMapMarker) => void;
  transportMode?: string;
  interactive?: boolean;
  className?: string;
  showControls?: boolean;
  showAttribution?: boolean;
  hideSelectedCard?: boolean; // LP-UX-08: Suppress card box on map face
  suppressSelectionShadow?: boolean; // LP-UX-08: Suppress selection ping ring/shadow
  deferTiles?: boolean; // PERF-01: Defer off-screen tile rendering via IntersectionObserver
}

function parseCoord(coord: MapCoord): { lat: number; lng: number } {
  if (Array.isArray(coord)) {
    if (coord[0] > 50) {
      return { lng: coord[0], lat: coord[1] };
    } else {
      return { lat: coord[0], lng: coord[1] };
    }
  }
  return { lat: coord.lat, lng: coord.lng };
}

// Slippy map projection (Web Mercator EPSG:3857)
function project(lat: number, lng: number, zoom: number) {
  const safeLat = typeof lat === 'number' && !isNaN(lat) ? Math.min(85, Math.max(-85, lat)) : 17.55;
  const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : 106.35;
  const n = Math.pow(2, zoom);
  const x = ((safeLng + 180) / 360) * n * 256;
  const latRad = (safeLat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * 256;
  return { x, y };
}

export default function VistraMap({
  center,
  zoom: initialZoom = 13,
  markers = [],
  route,
  selectedMarkerId,
  activeMarkerId,
  onSelectMarker,
  onMarkerSelect,
  onMarkerClick,
  transportMode,
  interactive = true,
  className = '',
  showControls = true,
  showAttribution = true,
  hideSelectedCard = false,
  suppressSelectionShadow = false,
  deferTiles = true,
}: VistraMapProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [tileError, setTileError] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(!deferTiles);

  const isSelectionControlled = selectedMarkerId !== undefined || activeMarkerId !== undefined;
  const effectiveSelectedId = selectedMarkerId !== undefined
    ? selectedMarkerId
    : activeMarkerId !== undefined ? activeMarkerId : internalSelectedId;

  const containerRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const hasMovedPastThresholdRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const prevSelectedIdRef = useRef<string | null>(null);

  const DRAG_THRESHOLD = 4; // px before considering gesture an intentional pan

  const normalizedCenter = parseCoord(center);

  // PERF-01: Defer tile rendering/fetch until map is near viewport (within 200px)
  useEffect(() => {
    if (!deferTiles || isIntersecting) return;
    if (typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      let active = true;
      queueMicrotask(() => { if (active) setIsIntersecting(true); });
      return () => { active = false; };
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px 200px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [deferTiles, isIntersecting]);

  // Keep zoom state synchronized if initialZoom prop changes
  useEffect(() => {
    const frame = requestAnimationFrame(() => setZoom(initialZoom));
    return () => cancelAnimationFrame(frame);
  }, [initialZoom]);

  // Update container size on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerSize({
          width: clientWidth || 600,
          height: clientHeight || 400,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // When center prop updates, smoothly reset panOffset
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPanOffset({ x: 0, y: 0 }));
    return () => cancelAnimationFrame(frame);
  }, [normalizedCenter.lat, normalizedCenter.lng]);

  // Center coordinate in pixels + current pan offset
  const centerPx = useMemo(() => {
    const base = project(normalizedCenter.lat, normalizedCenter.lng, zoom);
    return {
      x: base.x - panOffset.x,
      y: base.y - panOffset.y,
    };
  }, [normalizedCenter.lat, normalizedCenter.lng, zoom, panOffset]);

  const viewWidth = containerSize.width || 600;
  const viewHeight = containerSize.height || 400;

  // Slippy tile calculations
  const startTileX = Math.floor((centerPx.x - viewWidth / 2) / 256);
  const endTileX = Math.floor((centerPx.x + viewWidth / 2) / 256);
  const startTileY = Math.floor((centerPx.y - viewHeight / 2) / 256);
  const endTileY = Math.floor((centerPx.y + viewHeight / 2) / 256);

  const tiles = useMemo(() => {
    const list = [];
    for (let x = startTileX; x <= endTileX; x++) {
      for (let y = startTileY; y <= endTileY; y++) {
        list.push({
          x,
          y,
          key: `${zoom}-${x}-${y}`,
          left: x * 256 - (centerPx.x - viewWidth / 2),
          top: y * 256 - (centerPx.y - viewHeight / 2),
        });
      }
    }
    return list;
  }, [startTileX, endTileX, startTileY, endTileY, zoom, centerPx.x, centerPx.y, viewWidth, viewHeight]);

  // Projected markers
  const markerPoints = useMemo(() => {
    return markers.map((m) => {
      const coord = parseCoord(m);
      const pt = project(coord.lat, coord.lng, zoom);
      return {
        ...m,
        pixelX: pt.x - (centerPx.x - viewWidth / 2),
        pixelY: pt.y - (centerPx.y - viewHeight / 2),
      };
    });
  }, [markers, zoom, centerPx.x, centerPx.y, viewWidth, viewHeight]);

  // Keep map viewport completely still on marker selection, preventing unwanted jumps or drag loops
  useEffect(() => {
    if (!effectiveSelectedId) {
      prevSelectedIdRef.current = null;
      return;
    }
    prevSelectedIdRef.current = effectiveSelectedId;
  }, [effectiveSelectedId]);

  // Route points
  const routePoints = useMemo(() => {
    const pts = route ?? [];
    if (pts.length < 2) return '';
    return pts
      .map((p) => {
        const coord = parseCoord(p);
        const pt = project(coord.lat, coord.lng, zoom);
        const px = pt.x - (centerPx.x - viewWidth / 2);
        const py = pt.y - (centerPx.y - viewHeight / 2);
        if (isNaN(px) || isNaN(py)) return '';
        return `${px},${py}`;
      })
      .filter(Boolean)
      .join(' ');
  }, [route, zoom, centerPx.x, centerPx.y, viewWidth, viewHeight]);

  // Global mouseup/touchend listener to ensure drag state never gets stuck
  useEffect(() => {
    const handleGlobalEnd = () => {
      isPointerDownRef.current = false;
      isDraggingRef.current = false;
      hasMovedPastThresholdRef.current = false;
    };
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('touchcancel', handleGlobalEnd);
    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('touchcancel', handleGlobalEnd);
    };
  }, []);

  // Intentional Drag Pan handlers with threshold separation (MAP-UX-01 / MAP-01)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive || e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest?.('button, [role="button"], a, input, select, g, [class*="cursor-pointer"], text, circle')) return;

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    hasMovedPastThresholdRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
  }, [interactive, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPointerDownRef.current || !interactive) return;
    // Guard against synthetic or button-released mouse moves
    if (e.buttons !== 1) {
      isPointerDownRef.current = false;
      isDraggingRef.current = false;
      hasMovedPastThresholdRef.current = false;
      return;
    }
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (!hasMovedPastThresholdRef.current) {
      if (dist >= DRAG_THRESHOLD) {
        hasMovedPastThresholdRef.current = true;
        isDraggingRef.current = true;
      } else {
        return;
      }
    }

    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  }, [interactive]);

  const handleMouseUp = useCallback(() => {
    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    hasMovedPastThresholdRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!interactive || e.touches.length === 0) return;
    const target = e.target as Element;
    if (target.closest?.('button, [role="button"], a, input, select, g, [class*="cursor-pointer"], text, circle')) return;

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    hasMovedPastThresholdRef.current = false;
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...panOffset };
  }, [interactive, panOffset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPointerDownRef.current || !interactive || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (!hasMovedPastThresholdRef.current) {
      if (dist >= DRAG_THRESHOLD) {
        hasMovedPastThresholdRef.current = true;
        isDraggingRef.current = true;
      } else {
        return;
      }
    }

    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  }, [interactive]);

  const handleTouchEnd = useCallback(() => {
    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    hasMovedPastThresholdRef.current = false;
  }, []);

  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(initialZoom);
  };

  const hasMapboxToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);

  return (
    <div
      ref={containerRef}
      className={`${styles.mapWrapper} ${className}`}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Bản đồ tương tác VISTRA"
    >
      {/* Interactive Drag Viewport */}
      <div
        className={styles.mapViewport}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Slippy Tiles Layer */}
        {!tileError ? (
          <div className={styles.tilesLayer}>
            {isIntersecting && tiles.map((t) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={t.key}
                src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
                alt=""
                onError={() => setTileError(true)}
                className={styles.tileImg}
                style={{
                  left: `${t.left}px`,
                  top: `${t.top}px`,
                }}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        ) : (
          <div className={styles.offlineFallback}>
            <Icon name="cloud_queue" className="size-8 text-[#4B5875]/50 mb-2" />
            <span className="text-xs font-semibold text-[#0E1D4F]">
              Đang hiển thị bản đồ đồ họa ngoại tuyến
            </span>
            <span className="text-[11px] text-[#4B5875] mt-1 max-w-xs">
              Các điểm dừng và tuyến đường vẫn được hiển thị đầy đủ.
            </span>
          </div>
        )}

        {/* SVG Route & Markers Layer */}
        <svg
          className={styles.svgLayer}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="none"
        >
          {/* Connecting Polyline Route */}
          {routePoints && (
            <polyline
              points={routePoints}
              fill="none"
              stroke={
                transportMode === 'walk'
                  ? '#08B3C6'
                  : transportMode === 'motorbike'
                  ? '#D97706'
                  : '#205BD6'
              }
              strokeWidth="3"
              strokeDasharray={
                transportMode === 'walk'
                  ? '4,4'
                  : transportMode === 'motorbike'
                  ? '8,4'
                  : transportMode === 'car'
                  ? 'none'
                  : '6,4'
              }
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm transition-all"
            />
          )}

          {/* Markers */}
          {markerPoints.map((m, idx) => {
            const isSelected = effectiveSelectedId === m.id;
            const stopLabel = m.stopNumber ?? m.order ?? idx + 1;

            const handleMarkerClick = (e: React.MouseEvent | React.KeyboardEvent) => {
              e.stopPropagation();
              // Prevent marker click if gesture was an intentional map pan
              if (isDraggingRef.current || hasMovedPastThresholdRef.current) {
                return;
              }
              // Reset any pending pointer/drag state
              isPointerDownRef.current = false;
              isDraggingRef.current = false;
              hasMovedPastThresholdRef.current = false;

              // Always trigger onMarkerClick callback
              onMarkerClick?.(m);

              // Update selection state if not already selected, without affecting panOffset
              if (effectiveSelectedId !== m.id) {
                prevSelectedIdRef.current = m.id;
                if (!isSelectionControlled) setInternalSelectedId(m.id);
                onSelectMarker?.(m.id);
                onMarkerSelect?.(m);
              }
            };

            return (
              <g
                key={m.id}
                transform={`translate(${m.pixelX}, ${m.pixelY})`}
                className="cursor-pointer pointer-events-auto"
                onClick={handleMarkerClick}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  isPointerDownRef.current = false;
                  isDraggingRef.current = false;
                  hasMovedPastThresholdRef.current = false;
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  isPointerDownRef.current = false;
                  isDraggingRef.current = false;
                  hasMovedPastThresholdRef.current = false;
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  isPointerDownRef.current = false;
                  isDraggingRef.current = false;
                  hasMovedPastThresholdRef.current = false;
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  isPointerDownRef.current = false;
                  isDraggingRef.current = false;
                  hasMovedPastThresholdRef.current = false;
                }}
                onFocus={() => {
                  isPointerDownRef.current = false;
                  isDraggingRef.current = false;
                  hasMovedPastThresholdRef.current = false;
                }}
                role="button"
                tabIndex={0}
                aria-label={m.title || m.name || `Điểm dừng ${stopLabel}`}
                onKeyDown={(e) => {
                  if (!e.repeat && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleMarkerClick(e);
                  }
                }}
              >
                <circle r="22" fill="transparent" />
                {/* Ping ring if selected */}
                {isSelected && !suppressSelectionShadow && (
                  <circle
                    r="20"
                    fill="#205BD6"
                    opacity="0.25"
                    className="animate-ping origin-center"
                  />
                )}

                {/* Marker Pin Base */}
                <circle
                  r={isSelected ? '14' : '11'}
                  fill={isSelected ? '#0E1D4F' : '#205BD6'}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className={`transition-all ${suppressSelectionShadow ? '' : 'drop-shadow-md'}`}
                />

                {/* Marker Number Text */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#ffffff"
                  fontSize={isSelected ? '11' : '10'}
                  fontWeight="bold"
                >
                  {stopLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Marker Detail Card Popover */}
        {!hideSelectedCard && effectiveSelectedId && (() => {
          const m = markerPoints.find((x) => x.id === effectiveSelectedId);
          if (!m) return null;
          const stopLabel = m.stopNumber ?? m.order;
          return (
            <div className="absolute top-3 left-3 right-14 z-30 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-[#205BD6]/30 shadow-lg text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#205BD6] flex items-center gap-1">
                  <Icon name="place" className="size-3.5 text-[#08B3C6]" />
                  <span>Điểm {stopLabel || ''} {m.timeStart ? `(${m.timeStart})` : ''}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!isSelectionControlled) setInternalSelectedId(null);
                    onSelectMarker?.(null);
                    onMarkerSelect?.(null);
                  }}
                  className="text-[#4B5875] hover:text-[#0E1D4F] p-0.5 cursor-pointer"
                  aria-label="Đóng chi tiết điểm dừng"
                >
                  <Icon name="close" className="size-3.5" />
                </button>
              </div>
              <h4 className="font-semibold text-[#0E1D4F] line-clamp-1">{m.title || m.name || m.label}</h4>
              {m.location && (
                <p className="text-[11px] text-[#4B5875] truncate mt-0.5">{m.location}</p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Map Control Buttons */}
      {showControls && (
        <div className={styles.controlsOverlay}>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(18, z + 1))}
            className={styles.controlBtn}
            title="Phóng to bản đồ"
            aria-label="Phóng to"
          >
            <Icon name="add" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(7, z - 1))}
            className={styles.controlBtn}
            title="Thu nhỏ bản đồ"
            aria-label="Thu nhỏ"
          >
            <Icon name="remove" className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className={styles.controlBtn}
            title="Đặt lại góc nhìn trung tâm"
            aria-label="Đặt lại góc nhìn"
          >
            <Icon name="my_location" className="size-4" />
          </button>
        </div>
      )}

      {/* Required Attribution */}
      {showAttribution && (
        <div className={styles.attribution}>
          {hasMapboxToken ? (
            <span>© <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer">Mapbox</a> · </span>
          ) : null}
          <span>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors</span>
        </div>
      )}
    </div>
  );
}

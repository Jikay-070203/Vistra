'use client';

import React, { useMemo } from 'react';
import styles from './final-plan-map.module.css';
import { LandingPin, LandingRouteSegment } from '../landingDemo';
import VistraMap, { MapMarker } from '@/components/shared/VistraMap';

export interface FinalPlanMapProps {
  places: LandingPin[];
  edges: LandingRouteSegment[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string | null) => void;
  onHoverPlace?: (id: string | null) => void;
  keptPlaceIds?: string[];
  isConfirmed?: boolean;
  currentStepIndex?: number;
  orderedPlaces?: LandingPin[];
  isPaused?: boolean;
}

export default function FinalPlanMap({
  places,
  selectedPlaceId,
  onSelectPlace,
  onHoverPlace,
  currentStepIndex = 0,
  orderedPlaces = [],
}: FinalPlanMapProps) {
  const currentPin = orderedPlaces[currentStepIndex] || null;

  // Convert landing pins to VistraMap MapMarker format
  const mapMarkers = useMemo<MapMarker[]>(() => {
    return places.map((place, idx) => {
      // Map qualitative 0-100 canvas coordinates into Quang Binh geo bbox
      const lng = Number((106.22 + (place.coords.x / 100) * 0.42).toFixed(4));
      const lat = Number((17.44 + (place.coords.y / 100) * 0.28).toFixed(4));

      return {
        id: place.id,
        name: place.name,
        lng,
        lat,
        order: idx + 1,
        kind: place.category,
      };
    });
  }, [places]);

  // Derive route coordinates from ordered places
  const routeCoordinates = useMemo<[number, number][]>(() => {
    return (orderedPlaces.length > 0 ? orderedPlaces : places).map((place) => {
      const lng = Number((106.22 + (place.coords.x / 100) * 0.42).toFixed(4));
      const lat = Number((17.44 + (place.coords.y / 100) * 0.28).toFixed(4));
      return [lng, lat];
    });
  }, [orderedPlaces, places]);

  // Center map on current step pin or average
  const mapCenter = useMemo<[number, number]>(() => {
    if (currentPin) {
      const lng = Number((106.22 + (currentPin.coords.x / 100) * 0.42).toFixed(4));
      const lat = Number((17.44 + (currentPin.coords.y / 100) * 0.28).toFixed(4));
      return [lng, lat];
    }
    if (mapMarkers.length > 0) {
      return [mapMarkers[0].lng, mapMarkers[0].lat];
    }
    return [106.35, 17.55];
  }, [currentPin, mapMarkers]);

  return (
    <div
      className={`${styles.mapContainer} relative rounded-2xl overflow-hidden border border-slate-200 shadow-md min-h-[340px] sm:min-h-[400px] w-full`}
      role="region"
      aria-label="Bản đồ hành trình khởi hành"
      onMouseLeave={() => onHoverPlace?.(null)}
    >
      {/* Shared VistraMap with OSM fallback */}
      <VistraMap
        markers={mapMarkers}
        route={routeCoordinates}
        center={mapCenter}
        zoom={10}
        selectedMarkerId={selectedPlaceId}
        onMarkerSelect={(marker) => onSelectPlace(marker ? marker.id : null)}
        hideSelectedCard={true}
        suppressSelectionShadow={true}
        className="w-full h-full min-h-[340px] sm:min-h-[400px]"
        interactive={true}
      />
    </div>
  );
}

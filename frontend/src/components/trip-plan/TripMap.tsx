'use client';

import VistraMap from '@/components/shared/VistraMap';
import type { PlanItineraryDto } from '@/types/planApi';
import { tripPanelClass } from './ItineraryView';

export default function TripMap({ itinerary, day, selectedPlace, onPlace }:
  { itinerary: PlanItineraryDto; day: number; selectedPlace: number | null; onPlace: (id: number) => void }) {
  const activities = itinerary.activities.filter(item => item.day === day);
  const legs = itinerary.route_legs.filter(item => item.day === day);
  const completeRoute = legs.length > 0 && legs.every(leg => leg.geometry?.type === 'LineString' && leg.geometry.coordinates.length > 1);
  const route = completeRoute ? legs.flatMap(leg => leg.geometry!.coordinates.map(([lng, lat]) => ({ lat, lng }))) : undefined;
  return <section className={tripPanelClass} aria-label="Bản đồ hành trình">
    <h2 className="text-lg font-bold mb-4">Bản đồ ngày {day}</h2>
    {activities.length > 0 ? <div className="h-[400px] lg:h-[540px] rounded-xl overflow-hidden">
      <VistraMap key={day} center={{ lat: activities[0].latitude, lng: activities[0].longitude }} zoom={12}
        markers={activities.map((item, index) => ({ id: String(item.place_id), lat: item.latitude, lng: item.longitude, name: item.name, order: index + 1 }))}
        route={route} selectedMarkerId={selectedPlace === null ? null : String(selectedPlace)} onSelectMarker={id => { if (id) onPlace(Number(id)); }}
        hideSelectedCard suppressSelectionShadow />
    </div> : <p className="text-[#4B5875]">Chưa có tọa độ điểm dừng cho ngày này.</p>}
    {!completeRoute && activities.length > 0 && <p className="mt-3 text-sm text-[#4B5875]">Chưa đủ dữ liệu hình học tuyến đường.</p>}
  </section>;
}

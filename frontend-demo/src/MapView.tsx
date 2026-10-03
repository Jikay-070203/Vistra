import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
export interface MapPoint { id: number; name: string; latitude: number; longitude: number }
const emptyLines: number[][][] = []
export default function MapView({ points, center, lines = emptyLines, selectedId, onSelect }: { points: MapPoint[]; center: [number, number]; lines?: number[][][]; selectedId?:number|null; onSelect?:(id:number)=>void }) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map|null>(null)
  const markers = useRef(new globalThis.Map<number,L.Marker>())
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect
  useEffect(() => {
    if (!container.current) return
    const map = L.map(container.current, { scrollWheelZoom: false }).setView(center, 12)
    mapRef.current = map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).addTo(map)
    const locations: L.LatLngTuple[] = []
    points.forEach((p, i) => {
      const location: L.LatLngTuple = [p.latitude, p.longitude]
      locations.push(location)
      const text = document.createElement('span'); text.textContent = p.name
      const marker = L.marker(location, { title:p.name, icon: L.divIcon({ className: 'map-pin', html: `<span>${i + 1}</span>`, iconSize: [30, 36], iconAnchor: [15, 36] }) }).bindPopup(text).addTo(map)
      marker.on('click',()=>selectRef.current?.(p.id))
      markers.current.set(p.id,marker)
    })
    lines.forEach(line => {const coords=line.map(c => [c[1], c[0]] as L.LatLngTuple); locations.push(...coords); L.polyline(coords, {color: '#16716d', weight: 4}).addTo(map)})
    if (locations.length > 1) map.fitBounds(L.latLngBounds(locations), {padding: [35, 35], maxZoom: 14})
    else if (locations.length) map.setView(locations[0], 14)
    const resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(container.current)
    return () => { resize.disconnect(); markers.current.clear(); mapRef.current=null; map.remove() }
  }, [points, center, lines])
  useEffect(()=>{if(selectedId!=null){const marker=markers.current.get(selectedId);if(marker){marker.openPopup();mapRef.current?.panTo(marker.getLatLng())}}},[selectedId,points,center,lines])
  return <div className="map-surface" ref={container} role="region" aria-label="Bản đồ địa điểm" />
}

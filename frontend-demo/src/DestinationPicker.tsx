import { Check, MapPin, RefreshCw } from 'lucide-react'
import type { Destination } from './types'

const knownDestinations = [
  { slug: 'ha-noi', display_name: 'Hà Nội' },
  { slug: 'ninh-binh', display_name: 'Ninh Bình' },
  { slug: 'tp-ho-chi-minh', display_name: 'TP. Hồ Chí Minh' },
  { slug: 'da-lat', display_name: 'Đà Lạt' },
]

export default function DestinationPicker({ destinations, value, onChange, onRetry }: {
  destinations: Destination[]
  value: string
  onChange: (slug: string) => void
  onRetry: () => void
}) {
  const choices = destinations.length ? destinations : knownDestinations
  return <fieldset className="destination-picker">
    <legend>Điểm đến</legend>
    <div className="destination-choices">
      {choices.map(destination => <label key={destination.slug} className={`destination-choice ${value === destination.slug ? 'chosen' : ''}`}>
        <input type="radio" name="destination" value={destination.slug} checked={value === destination.slug} onChange={() => onChange(destination.slug)} required />
        <MapPin size={18} aria-hidden="true" />
        <span>{destination.display_name}</span>
        {value === destination.slug && <Check size={17} aria-hidden="true" />}
      </label>)}
    </div>
    {!destinations.length && <div className="destination-loading" role="status">
      <span>Chưa nhận được dữ liệu điểm đến từ máy chủ. Kết nối lại trước khi lưu chuyến đi.</span>
      <button type="button" className="text-button" onClick={onRetry}><RefreshCw size={15} />Tải lại</button>
    </div>}
  </fieldset>
}

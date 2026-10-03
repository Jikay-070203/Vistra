import { MapPin, ArrowUpRight } from 'lucide-react'
import { kinds, qualityLabel } from './ui'
import type { Trip, Kind, Place } from './types'

export default function TripRecommendations({trip,onAdd,selectedIds,disabled=false}:{trip:Trip;onAdd:(p:Place)=>void;selectedIds:number[];disabled?:boolean}) {
  return <section aria-label="Gợi ý cho chuyến đi" className="trip-recommendations">
    <div className="section-heading"><div><h2>Gợi ý cho chuyến đi</h2><p>Ưu tiên dữ liệu đã duyệt và vị trí gần điểm đầu lịch trình; khi chưa có lịch, dùng trung tâm điểm đến.</p></div></div>
    <p className="muted">Điểm chờ kiểm chứng chỉ để tham khảo. Giá, giờ mở cửa và tình trạng phòng cần xác nhận với cơ sở; gợi ý lưu trú chưa phải đặt phòng.</p>
    {(['attraction','food','stay'] as Kind[]).map(kind => <section key={kind} aria-label={kinds[kind]}>
      <h3>{kinds[kind]}</h3>
      {trip.recommendations?.[kind]?.length ? <div className="place-grid">{trip.recommendations[kind]!.map(p => <article className="place-card" key={p.id}>
        <span className="quality">{qualityLabel(p.quality_status)}</span><h4>{p.display_name}</h4>{kind!=='stay'&&<button type="button" className="primary small" disabled={disabled||selectedIds.includes(p.id)||selectedIds.length>=(trip.itinerary?18:12)} onClick={()=>onAdd(p)}>{selectedIds.includes(p.id)?'Đã chọn':trip.itinerary?'Thêm vào lịch':'Chọn điểm muốn đến'}</button>}
        <p className="muted"><MapPin size={14}/>{p.address || 'Chưa có địa chỉ chi tiết'}</p>
        <p className="muted">{p.price_unknown ? 'Chưa có giá được kiểm chứng' : 'Xem giá và điều kiện tại cơ sở'}</p>
        {p.sources?.[0] && <a className="text-button" href={p.sources[0].source_url} target="_blank" rel="noreferrer">Xem nguồn <ArrowUpRight size={14}/></a>}
        <a className="text-button" href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=16/${p.latitude}/${p.longitude}`} target="_blank" rel="noreferrer">Bản đồ <ArrowUpRight size={14}/></a>
      </article>)}</div> : <p role="status">Chưa đủ dữ liệu có nguồn cho nhóm này tại điểm đến. Cần bổ sung dữ liệu trước khi gợi ý.</p>}
    </section>)}
  </section>
}

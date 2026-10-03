import { useEffect, useState } from 'react'
import { api } from './api'
import { kinds, Notice, Spinner, qualityLabel } from './ui'
import type { Place } from './types'

export type SelectedPlace = Pick<Place, 'id'|'display_name'|'quality_status'>

export default function PlacePicker({destination,allowUnverified,selected,onAdd,onRemove,disabled=false,max=12}: {
  destination:string;allowUnverified:boolean;selected:SelectedPlace[];
  onAdd:(place:Place)=>void;onRemove?:(id:number)=>void;disabled?:boolean;max?:number
}) {
  const [items,setItems]=useState<Place[]>([])
  const [query,setQuery]=useState('');const [kind,setKind]=useState('')
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [retry,setRetry]=useState(0)
  const [limit,setLimit]=useState(12)
  useEffect(()=>{let active=true;setLoading(true);setItems([]);setError('');setLimit(12)
    api<{items:Place[]}>(`/destinations/${encodeURIComponent(destination)}/planning-places?allow_unverified=${allowUnverified}`)
      .then(r=>{if(active)setItems(r.items)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[destination,allowUnverified,retry])
  const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
  const filtered=items.filter(p=>(!kind||p.kind===kind)&&normalize(p.display_name+' '+(p.address||'')).includes(normalize(query)))
  return <section className="place-picker" aria-label="Tự chọn địa điểm">
    <h3>Tự chọn địa điểm</h3>
    <p className="muted">Chọn điểm tham quan, quán ăn hoặc trải nghiệm. Lưu trú hiện được gợi ý riêng, chưa xếp thành điểm dừng trong lịch.</p>
    {onRemove&&selected.length>0&&<ul className="picked-places">{selected.map(p=><li key={p.id}><span>{items.find(item=>item.id===p.id)?.display_name||p.display_name}</span><button type="button" className="text-button" disabled={disabled} onClick={()=>onRemove(p.id)} aria-label={`Bỏ chọn ${p.display_name}`}>Bỏ chọn</button></li>)}</ul>}
    <div className="form-grid"><label>Tìm địa điểm<input type="search" placeholder="Tìm tên hoặc địa chỉ…" value={query} disabled={disabled} onKeyDown={e=>{if(e.key==='Enter')e.preventDefault()}} onChange={e=>{setQuery(e.target.value);setLimit(12)}}/></label>
      <label>Loại địa điểm<select value={kind} disabled={disabled} onChange={e=>{setKind(e.target.value);setLimit(12)}}><option value="">Tất cả</option>{Object.entries(kinds).filter(([k])=>k!=='stay').map(([k,label])=><option key={k} value={k}>{label}</option>)}</select></label></div>
    <p className="muted">Đã chọn {selected.length}/{max} điểm</p>
    {loading?<p role="status"><Spinner/>Đang tải địa điểm…</p>:error?<Notice error>{error}<button type="button" className="text-button" onClick={()=>setRetry(n=>n+1)}>Thử lại</button></Notice>:<>
      {!filtered.length&&<p role="status">Không có địa điểm phù hợp. Thử từ khóa khác hoặc bật chế độ tham khảo để dùng điểm chưa kiểm chứng.</p>}
      <div className="picker-results">{filtered.slice(0,limit).map(p=>{const picked=selected.some(s=>s.id===p.id);return <div key={p.id} className="picker-result"><div><strong>{p.display_name}</strong><small>{kinds[p.kind]} · {qualityLabel(p.quality_status)}</small>{p.address&&<small>{p.address}</small>}</div><button type="button" className="secondary small" disabled={disabled||picked||selected.length>=max} onClick={()=>onAdd(p)} aria-label={`Chọn ${p.display_name}`}>{picked?'Đã chọn':'Chọn'}</button></div>})}</div>
      {filtered.length>limit&&<button type="button" className="text-button" onClick={()=>setLimit(n=>n+12)}>Xem thêm ({filtered.length-limit})</button>}
    </>}
  </section>
}

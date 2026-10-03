import { useEffect, useState } from 'react'
import { CalendarDays, Plus, ArrowUpRight, Trash2, Undo2 } from 'lucide-react'
import { api, post, dateLabel } from './api'
import { Notice, Spinner } from './ui'
import type { Destination, TripSummary } from './types'
import TripDetail from './TripDetail'

export default function Trips({destinations,selectedId,onCreate,onSelect,onExplore}: {destinations:Destination[];selectedId:string|null;onSelect:(id:string|null)=>void;onCreate:()=>void;onExplore:()=>void}) {
 const [items,setItems]=useState<TripSummary[]>([])
 const [error,setError]=useState(''); const [loading,setLoading]=useState(true)
 const [deleted,setDeleted]=useState(false); const [revision,setRevision]=useState(0); const [busy,setBusy]=useState<string|null>(null)
 useEffect(()=>{let active=true;setLoading(true);setError('');api<{items:TripSummary[]}>(`/trips?limit=100&deleted=${deleted}`).then(r=>{if(active)setItems(r.items)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[selectedId,deleted,revision])
 async function changeTrip(id:string,restore:boolean) {
   setBusy(id);setError('')
   try { if(restore) await post(`/trips/${id}/restore`); else await api(`/trips/${id}`,{method:'DELETE'});setRevision(n=>n+1) }
   catch(e){setError((e as Error).message)}finally{setBusy(null)}
 }
 if(selectedId)return <TripDetail key={selectedId} id={selectedId} destinations={destinations} onBack={()=>onSelect(null)} onExplore={onExplore}/>
 return <><div className="page-heading"><div><p className="eyebrow">HÀNH TRÌNH CỦA RIÊNG BẠN</p><h1>{deleted?'Chuyến đi đã xóa':'Chuyến đi của tôi'}</h1><p>{deleted?'Khôi phục chuyến đi cùng lịch trình và chi tiêu đã lưu.':'Mọi kế hoạch, gói gọn ở một nơi.'}</p></div><button className="primary" onClick={onCreate}><Plus size={18}/>Tạo chuyến đi</button></div>
   <button className="secondary" onClick={()=>setDeleted(v=>!v)}>{deleted?<CalendarDays size={16}/>:<Trash2 size={16}/>} {deleted?'Xem chuyến đi':'Chuyến đi đã xóa'}</button>
   {error&&<Notice error>{error}<button className="text-button" onClick={()=>setRevision(n=>n+1)}>Thử lại</button></Notice>}
   {loading?<div className="loading"><Spinner/>Đang tải chuyến đi…</div>:items.length?<div className="place-grid trip-list">{items.map(t=><article className="trip-card" key={t.id}>
     <CalendarDays size={26}/><h3>{destinations.find(d=>d.id===t.destination_id)?.display_name||'Chuyến đi'}</h3><p>Tạo ngày {dateLabel(t.created_at)}</p><p>{t.current_version?'Đã có lịch trình':'Bản nháp'}</p>
     <div className="trip-card-actions">{!deleted&&<button className="text-button" onClick={()=>onSelect(t.id)}>Xem chuyến đi<ArrowUpRight size={18}/></button>}
       <button className="secondary small" disabled={busy!==null} onClick={()=>changeTrip(t.id,deleted)}>{busy===t.id?<Spinner/>:deleted?<Undo2 size={16}/>:<Trash2 size={16}/>} {deleted?'Khôi phục':'Xóa'}</button></div>
   </article>)}</div>:<div className="empty-state"><CalendarDays size={38}/><h2>{deleted?'Không có chuyến đi đã xóa':'Chuyến đi đầu tiên bắt đầu từ đây.'}</h2>{!deleted&&<button className="primary" onClick={onCreate}><Plus size={18}/>Lên kế hoạch</button>}</div>}
 </>
}

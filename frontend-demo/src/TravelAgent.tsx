import { useEffect, useState, type FormEvent } from 'react'
import { Sparkles, Check, Send, MapPin } from 'lucide-react'
import { api, post, money, dateLabel } from './api'
import { Notice, Spinner, kinds } from './ui'
import type { Trip, TripRequest, Preview, Itinerary } from './types'
import MapView from './MapView'
import PlacePicker from './PlacePicker'
import type { Place } from './types'

function useAgentStatus() {
  const [status, setStatus] = useState<'loading'|'ready'|'disabled'|'error'>('loading')
  useEffect(() => { let active = true; api<{enabled:boolean}>('/agent/status')
    .then(s => { if (active) setStatus(s.enabled ? 'ready' : 'disabled') })
    .catch(() => { if (active) setStatus('error') }); return () => { active = false } }, [])
  return status
}

function Availability({status}:{status:string}) {
  return status === 'disabled' ? <Notice>Trợ lý chưa được bật. Cấu hình GEMINI_API_KEY và GEMINI_MODEL trong .env của backend rồi khởi động lại. Bạn vẫn có thể lập lịch bằng biểu mẫu.</Notice>
    : status === 'error' ? <Notice error>Chưa kiểm tra được kết nối trợ lý. Hãy kiểm tra kết nối ứng dụng rồi mở lại.</Notice>
    : status === 'loading' ? <p role="status">Đang kiểm tra trợ lý…</p> : null
}

export function AgentDraft({onCreated}:{onCreated:(trip:Trip)=>void}) {
  const status = useAgentStatus()
  const [text,setText] = useState('')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [draft,setDraft] = useState<TripRequest|null>(null)
  const [questions,setQuestions] = useState<string[]>([])
  const [allowUnverified,setAllowUnverified] = useState(true)
  const [selectedPlaces,setSelectedPlaces] = useState<Place[]>([])
  async function submit(e:FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setDraft(null); setQuestions([]);setSelectedPlaces([])
    try { const result = await post<{draft?:TripRequest;needs_clarification?:string[]}>('/agent/parse',{text})
      setDraft(result.draft || null); setQuestions(result.needs_clarification || [])
    } catch(e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function create() {
    if (!draft) return
    setBusy(true); setError('')
    try { onCreated(await post<Trip>('/trips?generate_itinerary=true',{...draft,allow_unverified:allowUnverified,must_visit:selectedPlaces.map(p=>p.id)})) } catch(e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <section className="agent-panel" aria-label="Agent du lịch Gemini">
    <div className="agent-heading"><Sparkles size={26}/><div><p className="eyebrow">TRỢ LÝ DU LỊCH · GEMINI</p><h2>Kể ý tưởng. Cùng lên hành trình.</h2></div></div>
    <p>Cho mình biết nơi muốn đến, ngày đi, số người và ngân sách. Mình giúp phác thảo chuyến đi; bạn xem lại trước khi lưu.</p>
    <Availability status={status}/>{error && <Notice error>{error}</Notice>}
    <form onSubmit={submit} className="form"><label>Chuyến đi bạn mong muốn<textarea value={text} disabled={busy} maxLength={4000} required rows={3} placeholder="Đi Ninh Bình từ 10/10/2026, 2 ngày, 2 người, 1,5 triệu/người, ô tô, thích thiên nhiên và ăn ngon, đi thong thả." onChange={e=>{setText(e.target.value);setDraft(null)}}/></label>
      <button className="primary" disabled={busy||!text.trim()}>{busy?<Spinner/>:<Sparkles size={17}/>}Phác thảo bằng Gemini</button></form>
    {questions.length>0 && <Notice><p>Bổ sung vào yêu cầu phía trên rồi gửi lại:</p><ul>{questions.map((q,i)=><li key={i}>{q}</li>)}</ul></Notice>}
    {draft && <div className="agent-draft"><h3>Kiểm tra bản phác thảo</h3><p>{draft.destination} · {dateLabel(draft.start_date)} · {draft.days} ngày · {draft.people} người</p><p>{money(draft.budget_vnd)} {draft.budget_scope==='per_person'?'/ người':'cho cả nhóm'} · Ô tô · {draft.pace==='relaxed'?'Thong thả':draft.pace==='busy'?'Năng động':'Vừa phải'}</p><p>{draft.interests.map(i=>kinds[i]).join(' · ')}</p><p className="muted">Tạo chuyến đi và tự lập lịch với tuyến ô tô. Nếu chưa lập được lịch, chuyến đi và các gợi ý vẫn được lưu để thử lại.</p><label className="checkbox"><input type="checkbox" checked={allowUnverified} onChange={e=>{setAllowUnverified(e.target.checked);if(!e.target.checked)setSelectedPlaces(list=>list.filter(p=>p.quality_status!=='discovered'))}}/>Cho phép điểm chưa kiểm chứng và thời lượng ước tính trong lịch tham khảo.</label><PlacePicker destination={draft.destination} allowUnverified={allowUnverified} selected={selectedPlaces} onAdd={p=>setSelectedPlaces(list=>[...list,p])} onRemove={id=>setSelectedPlaces(list=>list.filter(p=>p.id!==id))} disabled={busy}/><button className="primary" disabled={busy} onClick={create}><Check size={17}/>Xác nhận & tạo chuyến đi</button></div>}
  </section>
}

export default function TravelAgent({trip,onSaved}:{trip:Trip;onSaved:(itinerary:Itinerary)=>void}) {
  const status = useAgentStatus()
  const [text,setText] = useState('')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [reply,setReply] = useState('')
  const [preview,setPreview] = useState<Preview|null>(null)
  const [trace,setTrace] = useState<{name:string;ok:boolean}[]>([])
  const [day,setDay] = useState(1)
  useEffect(()=>{setPreview(null);setReply('');setTrace([])},[trip.current_version])
  async function send(e:FormEvent) {
    e.preventDefault();setBusy(true);setError('');setPreview(null);setReply('');setTrace([])
    try { const result=await post<{reply:string;preview:Preview|null;tools_used:{name:string;ok:boolean}[]}>(`/trips/${trip.id}/agent`,{text,base_version:trip.current_version})
      setReply(result.reply);setPreview(result.preview);setTrace(result.tools_used);setDay(1)
    } catch(e) {setError((e as Error).message)} finally {setBusy(false)}
  }
  async function commit() {
    if(!preview)return;setBusy(true);setError('')
    try {onSaved(await post<Itinerary>(`/trips/${trip.id}/revisions/commit`,{base_version:preview.base_version,preview_id:preview.preview_id}));setPreview(null)}
    catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  const activities=preview?.itinerary.activities.filter(a=>a.day===day)||[]
  return <section className="agent-panel">
    <div className="agent-heading"><Sparkles size={25}/><div><p className="eyebrow">GEMINI · ĐỒNG HÀNH CÙNG BẠN</p><h2>Điều chỉnh hành trình bằng lời nói</h2></div></div>
    <p>Trợ lý đọc lịch trình, địa điểm đã duyệt, dự báo và dự toán. Mọi thay đổi được kiểm tra trước khi bạn chấp nhận.</p>
    <Availability status={status}/>{error&&<Notice error>{error}</Notice>}
    <div className="agent-suggestions">{['Giải thích các khoản chi chưa biết trong lịch này','Giảm bớt hoạt động ngày 1, giữ các điểm bắt buộc','Gợi ý đổi sang điểm trong nhà nếu có dự báo mưa'].map(s=><button className="secondary small" key={s} disabled={busy} onClick={()=>setText(s)}>{s}</button>)}</div>
    <form className="form" onSubmit={send}><label>Yêu cầu cho chuyến đi hiện tại<textarea rows={3} maxLength={4000} value={text} required disabled={busy} onChange={e=>setText(e.target.value)} placeholder="Ví dụ: ngày 2 muốn đi ít điểm hơn, dành thời gian nghỉ…"/></label><button className="primary" disabled={busy||!text.trim()}>{busy?<Spinner/>:<Send size={17}/>} {busy?'Đang kiểm tra hành trình…':'Gửi cho trợ lý'}</button></form>
    <div aria-live="polite">{trace.length>0&&<p className="muted">{trace.map(t=>`${t.name==='get_trip_context'?'Đọc dữ liệu chuyến đi':'Kiểm tra lịch đề xuất'} ${t.ok?'✓':'— cần chỉnh lại'}`).join(' · ')}</p>}{reply&&<p className="agent-reply">{reply}</p>}</div>
    {preview&&<div className="agent-preview"><h3><MapPin size={18}/>Bản xem trước · Lịch đã lưu chưa thay đổi</h3><div className="day-tabs">{Array.from({length:trip.request.days},(_,i)=><button key={i} className={day===i+1?'active':''} onClick={()=>setDay(i+1)}>Ngày {i+1}</button>)}</div>
      <div className="agent-map"><MapView points={activities.map(a=>({id:a.place_id,name:a.name,latitude:a.latitude,longitude:a.longitude}))} center={[activities[0]?.latitude||20.25,activities[0]?.longitude||105.97]} lines={preview.itinerary.route_legs.filter(l=>l.day===day&&l.geometry).map(l=>l.geometry!.coordinates)}/></div>
      <ol>{activities.map(a=><li key={a.place_id}>{a.start_at.slice(11,16)}–{a.end_at.slice(11,16)} · {a.name}</li>)}</ol>
      <p>Chênh lệch dự toán đã biết: <strong>{money(preview.known_cost_delta_vnd)}</strong></p>
      {!preview.itinerary.budget.complete&&<Notice>Còn các khoản chưa biết giá. Dự toán này chưa phải tổng chi phí.</Notice>}
      <details className="warnings"><summary>Lưu ý ({preview.itinerary.warnings.length})</summary><ul>{preview.itinerary.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></details>
      <div className="form-actions"><button className="secondary" disabled={busy} onClick={()=>setPreview(null)}>Bỏ đề xuất</button><button className="primary" disabled={busy} onClick={commit}>{busy?<Spinner/>:<Check size={17}/>}Chấp nhận & cập nhật lịch, bản đồ</button></div>
    </div>}
  </section>
}

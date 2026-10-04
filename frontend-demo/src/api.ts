export class ApiError extends Error { constructor(public status: number, message: string) { super(message); this.name = 'ApiError' } }
const messages: Record<string, string> = {
  'Invalid API key': 'Cần mã truy cập. Mở “Kết nối” để nhập API token của bạn.',
  'No reviewed schedulable places. Crawl and review data first.': 'Điểm đến chưa có địa điểm được duyệt để lập lịch.',
  'Road routing unavailable. No straight-line travel times substituted.': 'Dịch vụ tính đường đang không phản hồi. Bạn có thể thử lập lịch lại sau.',
  'Trip changed. Reload before applying this revision.': 'Lịch đã thay đổi. Hãy mở lại chuyến đi và tạo bản sửa mới.',
  'Stale base_version': 'Phiên bản lịch đã cũ. Hãy mở lại chuyến đi.',
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const timeoutController = new AbortController(); const timeout = window.setTimeout(() => timeoutController.abort(), 180000)
  try {
    const token = sessionStorage.getItem('ytyt-token')
    const response = await fetch(`/api${path}`, { ...options, signal: options.signal ?? timeoutController.signal, headers: { 'Content-Type': 'application/json', ...(token ? { 'X-API-Key': token } : {}), ...options.headers } })
    const raw = await response.text(); const contentType = response.headers.get('content-type') || ''
    let body: { detail?: unknown; [key: string]: unknown } = {}
    if (raw && contentType.includes('application/json')) { try { body = JSON.parse(raw) } catch { body = {} } }
    else if (raw) body = { detail: raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) }
    if (!response.ok) {
      const detail = body.detail; let message = typeof detail === 'string' ? messages[detail] || detail : response.statusText || `Yêu cầu thất bại (${response.status})`
      if (typeof detail === 'object' && detail !== null && 'code' in detail) { const code = String((detail as { code: unknown }).code); if (code === 'must_visit_unavailable') message = 'Một địa điểm bắt buộc chưa đủ dữ liệu để lập lịch.'; if (code === 'must_visit_cannot_fit') message = 'Chưa xếp đủ các điểm bắt buộc. Hãy tăng số ngày hoặc chọn nhịp độ khác.'; if (code === 'schedule_conflict') message = 'Thời gian di chuyển hoặc giờ mở cửa không phù hợp.' }
      throw new ApiError(response.status, message)
    }
    return (raw ? JSON.parse(raw) : {}) as T
  } catch (error) { if (error instanceof ApiError) throw error; if (error instanceof DOMException && error.name === 'AbortError') throw error; throw new Error('Chưa kết nối được máy chủ. Kiểm tra backend đang chạy rồi thử lại.') }
  finally { window.clearTimeout(timeout) }
}
export const post = <T,>(path: string, data?: unknown) => api<T>(path, { method: 'POST', ...(data !== undefined ? { body: JSON.stringify(data) } : {}) })
export const money = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
export const dateLabel = (s: string) => {
  const d = new Date(s.length === 10 ? `${s}T12:00:00+07:00` : s)
  if (isNaN(d.getTime())) return s
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

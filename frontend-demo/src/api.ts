export class ApiError extends Error { constructor(public status: number, message: string) { super(message) } }
/**
 * Railway/Vercel: set VITE_API_URL to the public backend URL.
 * Local development intentionally keeps the /api proxy from vite.config.ts.
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const messages: Record<string, string> = {
  'Invalid API key': 'Cần mã truy cập. Mở “Kết nối” để nhập API token của bạn.',
  'No reviewed schedulable places. Crawl and review data first.': 'Điểm đến chưa có địa điểm được duyệt để lập lịch. Bạn vẫn có thể lưu chuyến đi nháp.',
  'Road routing unavailable. No straight-line travel times substituted.': 'Dịch vụ tính đường đang không phản hồi. Chuyến đi đã được lưu; bạn có thể thử lập lịch lại sau.',
  'Trip changed. Reload before applying this revision.': 'Lịch đã thay đổi. Hãy mở lại chuyến đi và tạo bản sửa mới.',
  'Stale base_version': 'Phiên bản lịch đã cũ. Hãy mở lại chuyến đi.',
  'Resolve pending duplicate candidates before approving this place': 'Địa điểm này đang nghi trùng. Cần xử lý bản ghi trùng trước khi duyệt.',
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 180000)
  try {
    const token = sessionStorage.getItem('ytyt-token')
    // The backend exposes /health, /trips, ... directly. Local Vite uses /api
    // only as a proxy prefix; Railway must be called without that prefix.
    const requestUrl = API_BASE_URL ? `${API_BASE_URL}${path}` : `/api${path}`
    const response = await fetch(requestUrl, { ...options, signal: options.signal ?? controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { 'X-API-Key': token } : {}), ...options.headers } })
    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : { detail: (await response.text().catch(() => '')).trim() || response.statusText }
    if (!response.ok) {
      const detail = body.detail
      let message = typeof detail === 'string' ? messages[detail] || detail : 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường.'
      if (detail?.code === 'must_visit_unavailable') message = 'Một điểm bắt buộc chưa đủ dữ liệu để lập lịch.'
      if (detail?.code === 'must_visit_cannot_fit') message = 'Chưa xếp đủ các điểm bắt buộc. Hãy tăng số ngày hoặc chọn nhịp độ khác.'
      if (detail?.code === 'schedule_conflict') message = 'Giờ bạn chọn không đủ thời gian di chuyển hoặc nằm ngoài giờ mở cửa.'
      throw new ApiError(response.status, message)
    }
    return body as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Yêu cầu quá thời gian chờ. Vui lòng mở lại chuyến đi để kiểm tra trước khi thử lại.')
    throw new Error('Chưa kết nối được máy chủ. Kiểm tra backend đang chạy rồi thử lại.')
  } finally { window.clearTimeout(timeout) }
}
export const post = <T,>(path: string, data?: unknown) => api<T>(path, { method: 'POST', ...(data !== undefined ? {body: JSON.stringify(data)} : {}) })
export const money = (n: number) => new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND', maximumFractionDigits: 0}).format(n)
export const dateLabel = (s: string) => new Date(s.length === 10 ? `${s}T12:00:00+07:00` : s).toLocaleDateString('vi-VN')

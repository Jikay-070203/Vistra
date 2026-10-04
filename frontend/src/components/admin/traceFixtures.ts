export interface TraceLog {
  id: string;
  timestamp: string;
  traceType: string;
  latencyMs: number;
  confidence: number;
  status: 'SUCCESS' | 'WARNING' | 'LATENCY_SPIKE';
  context: string;
  details: {
    inputSummary: string;
    retrievedSources: string[];
    decisionImpact?: string;
  };
}

export const LATENCY_SPIKE_THRESHOLD_MS = 2500; // Common threshold for AI latency spikes (ADM-OV-03B)

export const MOCK_TRACE_LOGS: TraceLog[] = [
  {
    id: 'TRC-98214',
    timestamp: '30/09/2026 20:15:42',
    traceType: 'VisualDNA_Extraction',
    latencyMs: 840,
    confidence: 96,
    status: 'SUCCESS',
    context: 'Phân tích 3 ảnh moodboard sương mù Sa Pa & bản Tả Van',
    details: {
      inputSummary: 'Ảnh phong cảnh núi rừng, sương sớm, nhà gỗ cổ kính',
      retrievedSources: ['Sa Pa vi khí hậu Th11', 'Bản đồ địa hình thung lũng Mường Hoa'],
      decisionImpact: 'Ưu tiên các cung săn mây sáng sớm (05:30 - 07:00), loại bỏ điểm trekking dốc trơn khi mưa',
    },
  },
  {
    id: 'TRC-98213',
    timestamp: '30/09/2026 20:12:10',
    traceType: 'RealityCheck_Verification',
    latencyMs: 1420,
    confidence: 89,
    status: 'SUCCESS',
    context: 'Đối chiếu Kỳ vọng vs Thực tế đèo Ô Quy Hồ & Fansipan',
    details: {
      inputSummary: 'Kỳ vọng biển mây cô độc không bóng người lúc hoàng hôn',
      retrievedSources: ['Cơ sở dữ liệu mật độ khách Sa Pa Q4/2025', 'Trạm khí tượng Lào Cai'],
      decisionImpact: 'Gắn cảnh báo đông đúc sau 16:30 và gợi ý khung giờ 05:30 sáng vắng vẻ',
    },
  },
  {
    id: 'TRC-98212',
    timestamp: '30/09/2026 19:48:05',
    traceType: 'Constraint_Solving',
    latencyMs: 3120,
    confidence: 78,
    status: 'LATENCY_SPIKE',
    context: 'Tối ưu hóa ngân sách 7.4M & cung đường di chuyển xe limousine',
    details: {
      inputSummary: 'Ràng buộc: 2 người lớn, 4 ngày 3 đêm, limousine khứ hồi từ Hà Nội',
      retrievedSources: ['Bảng giá vé cao tốc Nội Bài - Lào Cai', 'Báo giá đối tác Eco-Lodge'],
      decisionImpact: 'Tìm thấy phương án cân bằng ngân sách 7.4M/người nhưng thời gian giải ma trận mất 3.12s',
    },
  },
  {
    id: 'TRC-98211',
    timestamp: '30/09/2026 19:30:22',
    traceType: 'Itinerary_Refinement',
    latencyMs: 1150,
    confidence: 94,
    status: 'SUCCESS',
    context: 'Thêm điểm dừng uống cafe săn mây vào Ngày 2 theo yêu cầu chat',
    details: {
      inputSummary: 'User: "Thêm một quán cafe săn mây nhìn xuống thung lũng vào chiều Ngày 2"',
      retrievedSources: ['Danh mục quán cafe bản Tả Van có view góc rộng'],
      decisionImpact: 'Chèn Cafe Ban Mai (14:30), tự động dời thời gian dạo bản xuống 16:00',
    },
  },
  {
    id: 'TRC-98210',
    timestamp: '30/09/2026 18:55:19',
    traceType: 'Microclimate_Retrieval',
    latencyMs: 2200,
    confidence: 72,
    status: 'WARNING',
    context: 'Dự báo vi khí hậu Đà Lạt gặp vùng dữ liệu giao thoa không khí lạnh',
    details: {
      inputSummary: 'Dự báo mưa phùn chiều hồ Tuyền Lâm cuối tháng 10',
      retrievedSources: ['Dữ liệu trạm khí tượng Đà Lạt 2024-2025'],
      decisionImpact: 'Hệ thống hạ độ tin cậy thời tiết từ 90% xuống 72%, bổ sung phương án bảo lưu trong nhà',
    },
  },
  {
    id: 'TRC-98209',
    timestamp: '30/09/2026 18:14:02',
    traceType: 'Explicit_Confirm_Integrity',
    latencyMs: 310,
    confidence: 100,
    status: 'SUCCESS',
    context: 'Xác thực hành động chốt lịch trình từ modal xác nhận tường minh',
    details: {
      inputSummary: 'User nhấn nút "Xác nhận chốt kế hoạch" trong modal /planner',
      retrievedSources: ['State store: conversation-sapa-01'],
      decisionImpact: 'Khóa trạng thái confirmed, cấp dấu tích xanh chính thức, ghi nhận vào /my-trips',
    },
  },
];

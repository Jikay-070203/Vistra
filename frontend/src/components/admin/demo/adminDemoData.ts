export interface AdminMockUser {
  id: string;
  fullName: string;
  email: string;
  role: 'traveler' | 'staff' | 'admin';
  status: 'active' | 'suspended';
  tripsCount: number;
  joinedAt: string;
  lastActive: string;
}

export interface AdminMockTransaction {
  id: string;
  orderCode: string;
  userName: string;
  email: string;
  planTitle: string;
  tier: 'Cơ bản' | 'Nâng cao' | 'Chuyên sâu';
  amountVnd: number;
  date: string;
  status: 'success' | 'pending' | 'refunded';
  paymentMethod: 'VNPAY' | 'Momo' | 'Chuyển khoản';
}

export interface AdminMockPlanTrend {
  month: string;
  created: number;
  confirmed: number;
}

export const ADMIN_MOCK_PLAN_TRENDS: AdminMockPlanTrend[] = [
  { month: 'T05/2026', created: 48, confirmed: 28 },
  { month: 'T06/2026', created: 64, confirmed: 42 },
  { month: 'T07/2026', created: 85, confirmed: 56 },
  { month: 'T08/2026', created: 112, confirmed: 74 },
  { month: 'T09/2026', created: 138, confirmed: 91 },
  { month: 'T10/2026', created: 165, confirmed: 110 },
];

export const ADMIN_MOCK_PLAN_STATUS_DISTRIBUTION = [
  { label: 'Bản nháp đang trao đổi', count: 142, color: '#205BD6', percentage: 51 },
  { label: 'Hành trình đã chốt', count: 89, color: '#10B981', percentage: 32 },
  { label: 'Đã chia sẻ cộng đồng', count: 45, color: '#08B3C6', percentage: 17 },
];

export const ADMIN_MOCK_USERS: AdminMockUser[] = [
  { id: 'usr-001', fullName: 'Nguyễn Văn An', email: 'an.nguyen@vistra.vn', role: 'admin', status: 'active', tripsCount: 14, joinedAt: '2026-01-15', lastActive: '2026-10-08 09:20' },
  { id: 'usr-002', fullName: 'Trần Thị Mai', email: 'mai.tran@gmail.com', role: 'traveler', status: 'active', tripsCount: 6, joinedAt: '2026-03-22', lastActive: '2026-10-08 08:45' },
  { id: 'usr-003', fullName: 'Lê Hoàng Nam', email: 'nam.le@gmail.com', role: 'traveler', status: 'active', tripsCount: 3, joinedAt: '2026-04-10', lastActive: '2026-10-07 18:30' },
  { id: 'usr-004', fullName: 'Phạm Minh Đức', email: 'duc.pham@vistra.vn', role: 'staff', status: 'active', tripsCount: 9, joinedAt: '2026-02-01', lastActive: '2026-10-08 10:05' },
  { id: 'usr-005', fullName: 'Vũ Thị Hương', email: 'huong.vu@gmail.com', role: 'traveler', status: 'active', tripsCount: 2, joinedAt: '2026-05-18', lastActive: '2026-10-06 14:15' },
  { id: 'usr-006', fullName: 'Hoàng Quốc Bảo', email: 'bao.hoang@gmail.com', role: 'traveler', status: 'suspended', tripsCount: 1, joinedAt: '2026-06-04', lastActive: '2026-09-25 11:00' },
  { id: 'usr-007', fullName: 'Đỗ Thùy Linh', email: 'linh.do@gmail.com', role: 'traveler', status: 'active', tripsCount: 5, joinedAt: '2026-06-20', lastActive: '2026-10-07 21:10' },
  { id: 'usr-008', fullName: 'Bùi Anh Tuấn', email: 'tuan.bui@gmail.com', role: 'traveler', status: 'active', tripsCount: 4, joinedAt: '2026-07-12', lastActive: '2026-10-08 07:15' },
  { id: 'usr-009', fullName: 'Ngô Mỹ Duyên', email: 'duyen.ngo@vistra.vn', role: 'staff', status: 'active', tripsCount: 7, joinedAt: '2026-03-10', lastActive: '2026-10-08 09:50' },
  { id: 'usr-010', fullName: 'Đặng Hữu Phúc', email: 'phuc.dang@gmail.com', role: 'traveler', status: 'active', tripsCount: 2, joinedAt: '2026-08-05', lastActive: '2026-10-05 16:40' },
  { id: 'usr-011', fullName: 'Trịnh Cẩm Tú', email: 'tu.trinh@gmail.com', role: 'traveler', status: 'active', tripsCount: 8, joinedAt: '2026-08-22', lastActive: '2026-10-07 19:25' },
  { id: 'usr-012', fullName: 'Lý Kiến Quốc', email: 'quoc.ly@gmail.com', role: 'traveler', status: 'active', tripsCount: 1, joinedAt: '2026-09-14', lastActive: '2026-10-04 10:10' },
];

export const ADMIN_MOCK_REVENUE: AdminMockTransaction[] = [
  { id: 'tx-101', orderCode: 'ORD-2026-8801', userName: 'Trần Thị Mai', email: 'mai.tran@gmail.com', planTitle: 'Đà Lạt sương sớm & Hồ Tuyền Lâm', tier: 'Nâng cao', amountVnd: 450000, date: '2026-10-07 14:20', status: 'success', paymentMethod: 'VNPAY' },
  { id: 'tx-102', orderCode: 'ORD-2026-8802', userName: 'Lê Hoàng Nam', email: 'nam.le@gmail.com', planTitle: 'Khám phá hang động Quảng Bình', tier: 'Chuyên sâu', amountVnd: 850000, date: '2026-10-07 09:15', status: 'success', paymentMethod: 'Momo' },
  { id: 'tx-103', orderCode: 'ORD-2026-8803', userName: 'Vũ Thị Hương', email: 'huong.vu@gmail.com', planTitle: 'Ninh Bình di sản Tràng An', tier: 'Cơ bản', amountVnd: 250000, date: '2026-10-06 16:45', status: 'success', paymentMethod: 'VNPAY' },
  { id: 'tx-104', orderCode: 'ORD-2026-8804', userName: 'Đỗ Thùy Linh', email: 'linh.do@gmail.com', planTitle: 'Huế hoài niệm & Lăng tẩm cổ kính', tier: 'Nâng cao', amountVnd: 450000, date: '2026-10-05 11:30', status: 'success', paymentMethod: 'Chuyển khoản' },
  { id: 'tx-105', orderCode: 'ORD-2026-8805', userName: 'Bùi Anh Tuấn', email: 'tuan.bui@gmail.com', planTitle: 'Hội An phố cổ & Rừng dừa Bảy Mẫu', tier: 'Chuyên sâu', amountVnd: 850000, date: '2026-10-04 19:10', status: 'success', paymentMethod: 'Momo' },
  { id: 'tx-106', orderCode: 'ORD-2026-8806', userName: 'Đặng Hữu Phúc', email: 'phuc.dang@gmail.com', planTitle: 'Đà Lạt săn mây đồi chè Cầu Đất', tier: 'Cơ bản', amountVnd: 250000, date: '2026-10-03 10:05', status: 'pending', paymentMethod: 'VNPAY' },
  { id: 'tx-107', orderCode: 'ORD-2026-8807', userName: 'Trịnh Cẩm Tú', email: 'tu.trinh@gmail.com', planTitle: 'Tây Bắc mùa lúa chín Mù Cang Chải', tier: 'Chuyên sâu', amountVnd: 850000, date: '2026-10-02 15:25', status: 'success', paymentMethod: 'Chuyển khoản' },
  { id: 'tx-108', orderCode: 'ORD-2026-8808', userName: 'Lý Kiến Quốc', email: 'quoc.ly@gmail.com', planTitle: 'Quy Nhơn biển xanh & Kỳ Co', tier: 'Nâng cao', amountVnd: 450000, date: '2026-10-01 08:50', status: 'refunded', paymentMethod: 'Momo' },
];

export const ADMIN_MOCK_REVENUE_METRICS = {
  totalRevenueVnd: 148500000,
  monthlyRevenueVnd: 38500000,
  averageOrderValueVnd: 512000,
  growthRatePct: 24.5,
  tierDistribution: [
    { label: 'Gói Chuyên sâu', count: 48, percentage: 38, revenueVnd: 40800000, color: '#205BD6' },
    { label: 'Gói Nâng cao', count: 65, percentage: 42, revenueVnd: 29250000, color: '#08B3C6' },
    { label: 'Gói Cơ bản', count: 82, percentage: 20, revenueVnd: 20500000, color: '#10B981' },
  ],
};

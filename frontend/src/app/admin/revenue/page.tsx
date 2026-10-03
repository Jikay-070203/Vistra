import React from 'react';
import AdminRevenueScreen from '@/components/admin/AdminRevenueScreen';

export const metadata = {
  title: 'Theo dõi Doanh thu & Gói Dịch vụ | VISTRA Operator',
  description: 'Phân tích số liệu doanh thu MRR, ARPU và tỷ lệ nâng cấp thành viên trên VISTRA.',
};

export default function AdminRevenuePage() {
  return <AdminRevenueScreen />;
}

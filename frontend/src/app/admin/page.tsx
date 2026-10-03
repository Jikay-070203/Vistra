import React from 'react';
import AdminOverviewScreen from '@/components/admin/AdminOverviewScreen';

export const metadata = {
  title: 'Tổng quan Vận hành & Giám sát Hệ thống | VISTRA Operator',
  description: 'Tổng hợp chỉ số người dùng, giờ cao điểm tạo lịch trình, doanh thu và hòm thư phản hồi trên VISTRA.',
};

export default function AdminPage() {
  return <AdminOverviewScreen />;
}

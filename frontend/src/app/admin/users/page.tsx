import React from 'react';
import AdminUsersScreen from '@/components/admin/AdminUsersScreen';

export const metadata = {
  title: 'Quản lý Người dùng & Thành viên | VISTRA Operator',
  description: 'Tra cứu danh sách tài khoản, gói dịch vụ và mức độ tương tác của du khách trên VISTRA.',
};

export default function AdminUsersPage() {
  return <AdminUsersScreen />;
}

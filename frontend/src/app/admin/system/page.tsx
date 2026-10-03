import React from 'react';
import AdminSystemScreen from '@/components/admin/AdminSystemScreen';

export const metadata = {
  title: 'Hạ tầng Agent AI & Quản trị Dữ liệu | VISTRA Operator',
  description: 'Giám sát vi khí hậu RAG, trace logs, golden dataset, an toàn prompt injection và quản trị cấu trúc thực thể.',
};

export default function AdminSystemPage() {
  return <AdminSystemScreen />;
}

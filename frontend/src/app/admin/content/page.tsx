import { Metadata } from 'next';
import AdminContentScreen from '@/components/admin/content/AdminContentScreen';

export const metadata: Metadata = {
  title: 'Quản trị Nội dung & Danh mục | VISTRA Admin',
  description: 'Quản lý điểm đến intro, kế hoạch hero carousel và danh mục dị ứng.',
};

export default function AdminContentPage() {
  return <AdminContentScreen />;
}

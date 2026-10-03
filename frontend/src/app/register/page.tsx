import React from 'react';
import RegisterScreen from '@/components/auth/RegisterScreen';

export const metadata = {
  title: 'Đăng ký tài khoản | VISTRA',
  description: 'Tạo tài khoản du khách mới tại VISTRA để đồng kiến tạo lịch trình du lịch thông minh cùng AI.',
};

export default function RegisterPage() {
  return <RegisterScreen />;
}

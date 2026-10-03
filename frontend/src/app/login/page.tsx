import React from 'react';
import LoginScreen from '@/components/auth/LoginScreen';

export const metadata = {
  title: 'Đăng nhập | VISTRA',
  description: 'Đăng nhập vào hệ thống VISTRA để quản lý hành trình và sở thích du lịch cá nhân hóa.',
};

export default function LoginPage() {
  return <LoginScreen />;
}

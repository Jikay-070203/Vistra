'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login as loginApi } from '@/services/authService';
import { setAuthState } from '@/lib/userAuth';
import { getSafeAdminRedirect } from '@/lib/adminAuth';
import { ApiClientError } from '@/services/apiClient';

export function useLoginController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  const isSafeNext = Boolean(
    nextParam &&
    nextParam.startsWith('/') &&
    !nextParam.startsWith('//') &&
    !nextParam.startsWith('/\\')
  );

  const redirectNotice = isSafeNext
    ? nextParam?.startsWith('/create-trip')
      ? 'Vui lòng đăng nhập để tiếp tục khởi tạo và lưu trữ kế hoạch chuyến đi của bạn.'
      : nextParam?.startsWith('/planner')
        ? 'Vui lòng đăng nhập để truy cập và quản lý lịch trình chuyến đi của bạn.'
        : 'Vui lòng đăng nhập để tiếp tục thao tác và lưu trữ dữ liệu của bạn trên VISTRA.'
    : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email đã đăng ký.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Định dạng email không hợp lệ (ví dụ: traveler@vistra.vn).';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu cần tối thiểu 6 ký tự.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    setFeedbackMessage(null);

    try {
      const result = await loginApi({ email: email.trim(), password });
      const auth = result.data;

      // Store real authenticated session
      setAuthState(auth);

      if (auth.user.role === 'admin') {
        setFeedbackMessage('Xác thực quản trị viên thành công. Đang chuyển hướng...');
        const target = nextParam && nextParam.startsWith('/admin') ? getSafeAdminRedirect(nextParam) : '/admin';
        router.push(target);
        return;
      }

      // Traveler / Staff login
      const welcomeMsg = auth.user.role === 'staff'
        ? 'Đăng nhập nhân viên thành công. Đang chuyển hướng...'
        : 'Đăng nhập thành công. Đang chuyển hướng...';
      setFeedbackMessage(welcomeMsg);
      let target = '/community';
      if (nextParam && !nextParam.startsWith('/admin') && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
        target = nextParam;
      }
      setTimeout(() => {
        router.push(target);
      }, 300);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.httpStatus === 401) {
          setErrors({ email: 'Địa chỉ email hoặc mật khẩu không chính xác.' });
        } else if (error.httpStatus === 403) {
          setErrors({ email: 'Tài khoản của bạn đã bị vô hiệu hóa hoặc không có quyền truy cập.' });
        } else if (error.errorType === 'network_error') {
          setErrors({ email: 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra mạng.' });
        } else {
          setErrors({ email: error.message || 'Đăng nhập không thành công. Vui lòng thử lại.' });
        }
      } else {
        const message = error instanceof Error ? error.message : 'Đăng nhập không thành công.';
        setErrors({ email: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    errors,
    setErrors,
    feedbackMessage,
    setFeedbackMessage,
    handleLoginSubmit,
    isSafeNext,
    redirectNotice,
  };
}

'use client';

import React, { useState } from 'react';

export function useLoginController() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setFeedbackMessage(
        'Chế độ demo UI: Đã xác thực form thành công! Hệ thống không lưu trữ hay gửi thông tin thật lên server.'
      );
    }
  };

  const handleProviderClick = (provider: 'Google' | 'Facebook') => {
    setFeedbackMessage(
      `Đăng nhập bằng ${provider} đang ở chế độ mô phỏng giao diện (Demo-only). Chưa tích hợp OAuth provider thực tế.`
    );
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    errors,
    setErrors,
    feedbackMessage,
    setFeedbackMessage,
    handleLoginSubmit,
    handleProviderClick,
  };
}

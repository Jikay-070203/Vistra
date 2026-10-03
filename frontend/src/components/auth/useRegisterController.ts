'use client';

import React, { useState } from 'react';

export function useRegisterController() {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    dateOfBirth?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const validate = () => {
    const newErrors: {
      fullName?: string;
      dateOfBirth?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      agreeTerms?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên đầy đủ.';
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh.';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email đăng ký.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ (ví dụ: traveler@vistra.vn).';
    }

    if (!password) {
      newErrors.password = 'Vui lòng tạo mật khẩu.';
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu cần tối thiểu 8 ký tự.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'Bạn cần đồng ý với các điều khoản dịch vụ.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setFeedbackMessage(
        'Đăng ký demo thành công! Form đã được kiểm tra tính hợp lệ cục bộ. Bạn có thể chuyển sang trang Đăng nhập.'
      );
    }
  };

  const handleProviderClick = (provider: 'Google' | 'Facebook') => {
    setFeedbackMessage(
      `Đăng ký qua ${provider} đang ở chế độ giao diện mô phỏng (Demo). Không có tài khoản thực tế nào được tạo.`
    );
  };

  return {
    fullName,
    setFullName,
    dateOfBirth,
    setDateOfBirth,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    agreeTerms,
    setAgreeTerms,
    errors,
    setErrors,
    feedbackMessage,
    setFeedbackMessage,
    handleRegisterSubmit,
    handleProviderClick,
  };
}

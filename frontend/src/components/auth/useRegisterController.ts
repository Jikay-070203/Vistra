'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appConfig } from '@/config/appConfig';
import { register as registerApi, logout as logoutApi } from '@/services/authService';
import { ApiClientError } from '@/services/apiClient';

export function useRegisterController() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    dateOfBirth?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const allowedSuffix = appConfig.auth.emailAllowedSuffix;

  // Live password validation
  const passwordCriteria = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_]/.test(password),
  };
  const isPasswordValid =
    passwordCriteria.hasMinLength &&
    passwordCriteria.hasUppercase &&
    passwordCriteria.hasLowercase &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSpecial;

  // Live email validation
  const emailTrimmed = email.trim();
  const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const isEmailSuffixValid = emailTrimmed.toLowerCase().endsWith(allowedSuffix.toLowerCase());
  const isEmailValid = isEmailFormatValid && isEmailSuffixValid;

  const emailFeedback = React.useMemo(() => {
    if (!emailTrimmed) return null;
    if (!isEmailFormatValid) {
      return { isValid: false, message: 'Định dạng email chưa hợp lệ (ví dụ: traveler@gmail.com)' };
    }
    if (!isEmailSuffixValid) {
      return { isValid: false, message: `Email yêu cầu có đuôi ${allowedSuffix}` };
    }
    return { isValid: true, message: `Địa chỉ email hợp lệ (${allowedSuffix})` };
  }, [emailTrimmed, isEmailFormatValid, isEmailSuffixValid, allowedSuffix]);

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

    if (!emailTrimmed) {
      newErrors.email = 'Vui lòng nhập email đăng ký.';
    } else if (!isEmailFormatValid) {
      newErrors.email = 'Định dạng email không hợp lệ (ví dụ: traveler@gmail.com).';
    } else if (!isEmailSuffixValid) {
      newErrors.email = `Hệ thống yêu cầu địa chỉ email có đuôi ${allowedSuffix} (ví dụ: traveler${allowedSuffix}).`;
    }

    if (!password) {
      newErrors.password = 'Vui lòng tạo mật khẩu.';
    } else if (!isPasswordValid) {
      newErrors.password =
        'Mật khẩu cần tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'Bạn cần đồng ý với các điều khoản dịch vụ và chính sách bảo mật.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    setFeedbackMessage(null);

    try {
      await registerApi({
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth || null,
        email: emailTrimmed,
        password,
        acceptedTermsVersion: agreeTerms ? 'v1.0' : undefined,
      });

      // Confirm revocation of auto-session to maintain clean register -> login flow per specification
      let isRevoked = false;
      try {
        const revokeRes = await logoutApi();
        if (revokeRes.data?.success) {
          isRevoked = true;
        }
      } catch {
        isRevoked = false;
      }

      if (isRevoked) {
        setFeedbackMessage(
          'Đăng ký tài khoản thành công! Vui lòng đăng nhập với thông tin vừa tạo.'
        );
        setTimeout(() => {
          router.push('/login');
        }, 1200);
      } else {
        // Auto-session could not be revoked or is still active on backend
        setFeedbackMessage(
          'Tài khoản đã được tạo. Chưa xác nhận được việc kết thúc phiên đăng ký; vui lòng kiểm tra trạng thái đăng nhập.'
        );
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.httpStatus === 409) {
          setErrors({ email: 'Địa chỉ email này đã được sử dụng trong hệ thống.' });
        } else if (error.errorType === 'network_error') {
          setErrors({ email: 'Không thể kết nối máy chủ xác thực. Vui lòng kiểm tra mạng.' });
        } else {
          setErrors({ email: error.message || 'Đăng ký không thành công. Vui lòng thử lại.' });
        }
      } else {
        const message = error instanceof Error ? error.message : 'Đăng ký không thành công.';
        setErrors({ email: message });
      }
    } finally {
      setIsLoading(false);
    }
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
    showConfirmPassword,
    setShowConfirmPassword,
    agreeTerms,
    setAgreeTerms,
    errors,
    setErrors,
    feedbackMessage,
    setFeedbackMessage,
    handleRegisterSubmit,
    allowedSuffix,
    passwordCriteria,
    isPasswordValid,
    emailFeedback,
    isEmailValid,
    isLoading,
  };
}

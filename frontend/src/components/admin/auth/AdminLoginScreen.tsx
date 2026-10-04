'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { loginAdmin } from '@/services/adminAuthService';
import { getSafeAdminRedirect } from '@/lib/adminAuth';

export default function AdminLoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email quản trị viên.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu quản trị viên.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginAdmin({
        email: email.trim(),
        password,
      });

      if (!result.success) {
        setErrorMessage(result.message || 'Xác thực không thành công.');
        setIsSubmitting(false);
        return;
      }

      // Determine safe redirect destination
      const safeRedirect = getSafeAdminRedirect(nextParam);
      router.push(safeRedirect);
      router.refresh();
    } catch {
      setErrorMessage('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EBF1F0] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-6 sm:p-8 shadow-[0_8px_30px_rgba(14,29,79,0.06)] space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0E1D4F] text-white mb-2 shadow-xs">
            <Icon name="admin_panel_settings" className="size-6 text-[#08B3C6]" />
          </div>
          <div>
            <span className="font-label-caps text-[11px] text-[#205BD6] uppercase font-bold tracking-wider block">
              VISTRA OPERATOR WORKBENCH
            </span>
            <h1 className="font-headline-sm text-2xl font-bold text-[#0E1D4F] mt-1">
              Đăng nhập Quản trị
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5875]">
            Hệ thống điều hành và giám sát dịch vụ VISTRA
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[#ba1a1a]/10 border border-[#ba1a1a]/25 text-xs text-[#ba1a1a] flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <Icon name="error" className="size-4 shrink-0 text-[#ba1a1a] mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
            >
              Email Quản trị viên <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="admin@vistra.vn"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border ${
                fieldErrors.email
                  ? 'border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]'
                  : 'border-[#0E1D4F]/15 focus:border-[#205BD6]'
              } text-[#0E1D4F] placeholder:text-[#4B5875]/50 focus:outline-none transition-all disabled:bg-[#EBF1F0]/50 disabled:cursor-not-allowed`}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'admin-email-error' : undefined}
            />
            {fieldErrors.email && (
              <p
                id="admin-email-error"
                className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1 font-medium"
              >
                <Icon name="error" className="size-3.5" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
            >
              Mật khẩu <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isSubmitting}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="Nhập mật khẩu quản trị viên"
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl bg-white border ${
                  fieldErrors.password
                    ? 'border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]'
                    : 'border-[#0E1D4F]/15 focus:border-[#205BD6]'
                } text-[#0E1D4F] placeholder:text-[#4B5875]/50 focus:outline-none transition-all disabled:bg-[#EBF1F0]/50 disabled:cursor-not-allowed`}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'admin-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5875] hover:text-[#0E1D4F] p-1 cursor-pointer disabled:cursor-not-allowed"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="size-4" />
              </button>
            </div>
            {fieldErrors.password && (
              <p
                id="admin-password-error"
                className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1 font-medium"
              >
                <Icon name="error" className="size-3.5" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#205BD6] hover:bg-[#1847a8] disabled:bg-[#205BD6]/60 text-white font-semibold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(32,91,214,0.25)] active:scale-[0.98] cursor-pointer disabled:cursor-wait mt-3 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Icon name="sync" className="size-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <Icon name="login" className="size-4" />
                <span>Đăng nhập Quản trị</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Home Link */}
        <div className="text-center pt-2 border-t border-[#0E1D4F]/10">
          <Link
            href="/"
            className="text-xs text-[#4B5875] hover:text-[#205BD6] transition-colors inline-flex items-center gap-1"
          >
            <Icon name="arrow_back" className="size-3.5" />
            <span>Quay lại trang chủ VISTRA</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useLoginController } from './useLoginController';

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    errors,
    setErrors,
    isLoading,
    feedbackMessage,
    handleLoginSubmit,
  } = useLoginController();

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-10 sm:py-16 flex items-center justify-center min-h-[calc(100vh-76px-300px)]">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-6 sm:p-8 shadow-[0_8px_30px_rgba(14,29,79,0.06)] space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#08B3C6]/15 border border-[#08B3C6]/30 text-[#08B3C6] mb-2 shadow-2xs">
            <Icon name="lock" className="size-6" />
          </div>
          <h1 className="font-headline-sm text-2xl font-bold text-[#0E1D4F]">
            Đăng nhập tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5875]">
            Cổng xác thực hợp nhất dành cho Du khách và Quản trị viên VISTRA
          </p>
        </div>

        {/* Unified Notice Banner */}
        <div className="p-3 bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10 flex items-start gap-2.5 text-xs text-[#4B5875]">
          <Icon name="info" className="size-4 text-[#205BD6] shrink-0 mt-0.5" />
          <span>
            Hệ thống tự động điều hướng theo quyền hạn tài khoản tương ứng sau khi xác thực hợp lệ.
          </span>
        </div>

        {/* Feedback alert */}
        {feedbackMessage && (
          <div className="p-3 rounded-xl bg-[#205BD6]/10 border border-[#205BD6]/30 text-xs text-[#0739A8] leading-relaxed flex items-start gap-2">
            <Icon name="check_circle" className="size-4 shrink-0 text-[#205BD6] mt-0.5" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
            >
              Email đăng nhập <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="traveler@vistra.vn"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border ${
                  errors.email ? 'border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]' : 'border-[#0E1D4F]/15'
                } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none focus:border-[#205BD6] transition-all`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1">
                <Icon name="error" className="size-3.5" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Password field with toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
              >
                Mật khẩu <span className="text-[#ba1a1a]">*</span>
              </label>
              <button
                type="button"
                disabled
                title="Backend chưa hỗ trợ khôi phục mật khẩu"
                className="text-[11px] text-[#205BD6] hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Nhập mật khẩu của bạn"
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl bg-white border ${
                  errors.password ? 'border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]' : 'border-[#0E1D4F]/15'
                } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none focus:border-[#205BD6] transition-all`}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5875] hover:text-[#0E1D4F] p-1 cursor-pointer"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="size-4" />
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1">
                <Icon name="error" className="size-3.5" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#205BD6] hover:bg-[#1847a8] disabled:bg-[#4B5875]/50 text-white font-semibold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(32,91,214,0.25)] active:scale-[0.98] cursor-pointer mt-2 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#0E1D4F]/10 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-[#4B5875] font-label-caps uppercase shrink-0">
            Hoặc tiếp tục với
          </span>
        </div>

        {/* OAuth Provider Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            title="Backend chưa cấu hình Google OAuth"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#0E1D4F]/15 bg-white hover:bg-[#EBF1F0] text-xs font-semibold text-[#0E1D4F] transition-all cursor-pointer"
          >
            <span className="font-bold text-[#205BD6]">G</span>
            <span>Google</span>
          </button>
          <button
            type="button"
            disabled
            title="Backend chưa cấu hình Facebook OAuth"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#0E1D4F]/15 bg-white hover:bg-[#EBF1F0] text-xs font-semibold text-[#0E1D4F] transition-all cursor-pointer"
          >
            <span className="font-bold text-[#205BD6]">f</span>
            <span>Facebook</span>
          </button>
        </div>

        <p className="text-xs text-[#4B5875]">Đăng nhập Google/Facebook và khôi phục mật khẩu chưa khả dụng từ backend.</p>

        {/* Footer Nav Link */}
        <div className="text-center pt-2 text-xs text-[#4B5875]">
          <span>Chưa có tài khoản VISTRA? </span>
          <Link href="/register" className="text-[#205BD6] font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

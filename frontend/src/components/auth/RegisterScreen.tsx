'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useRegisterController } from './useRegisterController';

export default function RegisterScreen() {
  const {
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
    handleRegisterSubmit,
    isLoading,
    allowedSuffix,
    passwordCriteria,
    isPasswordValid,
    emailFeedback,
  } = useRegisterController();

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-10 sm:py-16 flex items-center justify-center min-h-[calc(100vh-76px-300px)]">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-6 sm:p-8 shadow-[0_8px_30px_rgba(14,29,79,0.06)] space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#08B3C6]/15 border border-[#08B3C6]/30 text-[#08B3C6] mb-2 shadow-2xs">
            <Icon name="person_add" className="size-6" />
          </div>
          <h1 className="font-headline-sm text-2xl font-bold text-[#0E1D4F]">
            Đăng ký tài khoản du khách
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5875]">
            Bắt đầu hành trình đồng kiến tạo với hệ thống AI đa tác nhân
          </p>
        </div>

        {/* Demo Notice */}
        <div className="p-3 bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10 flex items-start gap-2.5 text-xs text-[#4B5875]">
          <Icon name="info" className="size-4 text-[#205BD6] shrink-0 mt-0.5" />
          <span>
            Tài khoản được đăng ký và lưu trên hệ thống VISTRA.
          </span>
        </div>

        {/* Feedback message */}
        {feedbackMessage && (
          <div className="p-3 rounded-xl bg-[#205BD6]/10 border border-[#205BD6]/30 text-xs text-[#0739A8] leading-relaxed flex items-start gap-2">
            <Icon name="check_circle" className="size-4 shrink-0 text-[#205BD6] mt-0.5" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-fullname"
              className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
            >
              Họ và tên <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              id="reg-fullname"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Nguyễn Văn An"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border ${
                errors.fullName ? 'border-[#ba1a1a]' : 'border-[#0E1D4F]/15'
              } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none focus:border-[#205BD6] transition-all`}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'reg-fullname-error' : undefined}
            />
            {errors.fullName && (
              <p id="reg-fullname-error" className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1">
                <Icon name="error" className="size-3.5" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* Date of Birth & Email Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reg-dob"
                className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
              >
                Ngày sinh <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="reg-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border ${
                  errors.dateOfBirth ? 'border-[#ba1a1a]' : 'border-[#0E1D4F]/15'
                } text-[#0E1D4F] focus:outline-none focus:border-[#205BD6] transition-all`}
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'reg-dob-error' : undefined}
              />
              {errors.dateOfBirth && (
                <p id="reg-dob-error" className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1">
                  <Icon name="error" className="size-3.5" />
                  <span>{errors.dateOfBirth}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-email"
                className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
              >
                Email <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder={`traveler${allowedSuffix}`}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border ${
                  errors.email
                    ? 'border-[#ba1a1a]'
                    : emailFeedback && !emailFeedback.isValid
                    ? 'border-amber-400'
                    : emailFeedback && emailFeedback.isValid
                    ? 'border-emerald-500'
                    : 'border-[#0E1D4F]/15'
                } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none focus:border-[#205BD6] transition-all`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'reg-email-error' : emailFeedback ? 'reg-email-hint' : undefined}
              />
              {errors.email ? (
                <p id="reg-email-error" className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1">
                  <Icon name="error" className="size-3.5" />
                  <span>{errors.email}</span>
                </p>
              ) : emailFeedback ? (
                <p
                  id="reg-email-hint"
                  className={`text-[11px] flex items-center gap-1 mt-1 ${
                    emailFeedback.isValid ? 'text-emerald-600 font-medium' : 'text-amber-600'
                  }`}
                >
                  <Icon name={emailFeedback.isValid ? 'check_circle' : 'info'} className="size-3.5" />
                  <span>{emailFeedback.message}</span>
                </p>
              ) : (
                <p className="text-[11px] text-[#4B5875]/70 mt-0.5">
                  Định dạng yêu cầu: địa chỉ kết thúc bằng <strong>{allowedSuffix}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reg-password"
                className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
              >
                Mật khẩu <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`w-full pl-3.5 pr-9 py-2.5 text-sm rounded-xl bg-white border ${
                    errors.password
                      ? 'border-[#ba1a1a]'
                      : password && isPasswordValid
                      ? 'border-emerald-500'
                      : 'border-[#0E1D4F]/15'
                  } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none focus:border-[#205BD6] transition-all`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'reg-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5875] hover:text-[#0E1D4F] p-1 cursor-pointer"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="size-4" />
                </button>
              </div>
              {errors.password && (
                <p id="reg-password-error" className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1">
                  <Icon name="error" className="size-3.5" />
                  <span>{errors.password}</span>
                </p>
              )}
              {/* Real-time Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="p-2.5 bg-[#0E1D4F]/[0.03] rounded-lg border border-[#0E1D4F]/10 space-y-1 mt-1.5 text-[11px]">
                  <p className="font-semibold text-[#0E1D4F] text-[10px] uppercase tracking-wider mb-1">
                    Tiêu chí bảo mật:
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <span className={`flex items-center gap-1 ${passwordCriteria.hasMinLength ? 'text-emerald-600 font-medium' : 'text-[#4B5875]'}`}>
                      <Icon name={passwordCriteria.hasMinLength ? 'check' : 'radio_button_unchecked'} className="size-3" />
                      Tối thiểu 8 ký tự
                    </span>
                    <span className={`flex items-center gap-1 ${passwordCriteria.hasUppercase ? 'text-emerald-600 font-medium' : 'text-[#4B5875]'}`}>
                      <Icon name={passwordCriteria.hasUppercase ? 'check' : 'radio_button_unchecked'} className="size-3" />
                      1 chữ cái viết hoa
                    </span>
                    <span className={`flex items-center gap-1 ${passwordCriteria.hasLowercase ? 'text-emerald-600 font-medium' : 'text-[#4B5875]'}`}>
                      <Icon name={passwordCriteria.hasLowercase ? 'check' : 'radio_button_unchecked'} className="size-3" />
                      1 chữ cái thường
                    </span>
                    <span className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? 'text-emerald-600 font-medium' : 'text-[#4B5875]'}`}>
                      <Icon name={passwordCriteria.hasNumber ? 'check' : 'radio_button_unchecked'} className="size-3" />
                      1 chữ số (0-9)
                    </span>
                    <span className={`col-span-2 flex items-center gap-1 ${passwordCriteria.hasSpecial ? 'text-emerald-600 font-medium' : 'text-[#4B5875]'}`}>
                      <Icon name={passwordCriteria.hasSpecial ? 'check' : 'radio_button_unchecked'} className="size-3" />
                      1 ký tự đặc biệt (!@#$%...)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]"
              >
                Xác nhận lại <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Nhập lại mật khẩu"
                  className={`w-full pl-3.5 pr-9 py-2.5 text-sm rounded-xl bg-white border ${
                    errors.confirmPassword ? 'border-[#ba1a1a]' : 'border-[#0E1D4F]/15'
                  } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none focus:border-[#205BD6] transition-all`}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5875] hover:text-[#0E1D4F] p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} className="size-4" />
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="reg-confirm-error" className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1">
                  <Icon name="error" className="size-3.5" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="space-y-1 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#4B5875]">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: undefined }));
                }}
                className="mt-0.5 w-4 h-4 rounded text-[#205BD6] accent-[#205BD6] cursor-pointer"
              />
              <span>
                Tôi đồng ý với các <span className="text-[#205BD6] underline">Điều khoản dịch vụ</span> và <span className="text-[#205BD6] underline">Chính sách bảo mật</span> của Vistra.
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-xs text-[#ba1a1a] flex items-center gap-1 pl-6">
                <Icon name="error" className="size-3.5" />
                <span>{errors.agreeTerms}</span>
              </p>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#205BD6] hover:bg-[#1847a8] text-white font-semibold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(32,91,214,0.25)] active:scale-[0.98] cursor-pointer mt-2"
          >
            {isLoading ? 'Đang đăng ký…' : 'Tạo tài khoản'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#0E1D4F]/10 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-[#4B5875] font-label-caps uppercase shrink-0">
            Hoặc đăng ký nhanh bằng
          </span>
        </div>

        {/* OAuth Providers */}
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

        <p className="text-xs text-[#4B5875]">Đăng ký Google/Facebook chưa khả dụng từ backend.</p>

        {/* Navigation link to login */}
        <div className="text-center pt-2 text-xs text-[#4B5875]">
          <span>Đã có tài khoản VISTRA? </span>
          <Link href="/login" className="text-[#205BD6] font-semibold hover:underline">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
  );
}

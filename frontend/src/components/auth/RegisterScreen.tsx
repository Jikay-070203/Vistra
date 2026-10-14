'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useRegisterController } from './useRegisterController';

function AccessibleFieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return <span id={id} className="sr-only">{message}</span>;
}

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
    isPasswordValid,
    emailFeedback,
  } = useRegisterController();
  const [errorPopupDismissed, setErrorPopupDismissed] = useState(false);
  const validationErrors = [
    { id: 'reg-fullname', label: 'Họ và tên', message: errors.fullName },
    { id: 'reg-dob', label: 'Ngày sinh', message: errors.dateOfBirth },
    { id: 'reg-email', label: 'Email', message: errors.email },
    { id: 'reg-password', label: 'Mật khẩu', message: errors.password },
    { id: 'reg-confirm-password', label: 'Xác nhận lại mật khẩu', message: errors.confirmPassword },
    { id: 'reg-terms', label: 'Điều khoản', message: errors.agreeTerms },
  ].filter((error): error is { id: string; label: string; message: string } => Boolean(error.message));

  return (
    <>
    <div className="mx-auto grid min-h-[calc(100vh-76px-300px)] w-full max-w-[1240px] grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-8 lg:px-12 lg:py-12">
      <aside className="relative hidden min-h-[620px] overflow-hidden rounded-[1.75rem] bg-[#0E1D4F] lg:block">
        <Image
          src="/landing/hero-inspiration.jpg"
          alt="Lối đi bên hồ giữa rừng thông"
          fill
          sizes="(max-width: 1280px) 36vw, 460px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1D4F]/90 via-[#0E1D4F]/15 to-[#0E1D4F]/10" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <p className="font-label-caps text-xs font-bold uppercase tracking-[0.16em] text-[#E7AD2E]">Tài khoản du khách</p>
          <h2 className="mt-3 max-w-sm font-headline-lg text-3xl font-bold leading-tight">Tạo tài khoản VISTRA</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">Chuẩn bị họ tên, ngày sinh, email và mật khẩu.</p>
        </div>
      </aside>
      <div className="mx-auto w-full max-w-[800px] space-y-6 rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 shadow-[0_12px_36px_rgba(14,29,79,0.07)] sm:p-8 lg:mx-0 lg:max-w-none">
        {/* Header */}
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="mb-2 inline-flex size-11 items-center justify-center rounded-xl border border-[#08B3C6]/30 bg-[#EBF1F0] text-[#0E1D4F]">
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
        <div className="flex items-start gap-2.5 rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0] p-3 text-sm text-[#4B5875]">
          <Icon name="info" className="size-4 text-[#205BD6] shrink-0 mt-0.5" />
          <span>
            Tài khoản được đăng ký và lưu trên hệ thống VISTRA.
          </span>
        </div>

        {/* Feedback message */}
        {feedbackMessage && (
          <div role="status" className="flex items-start gap-2 rounded-xl border border-[#205BD6]/30 bg-[#EBF1F0] p-3 text-sm leading-relaxed text-[#0E1D4F]">
            <Icon name="check_circle" className="size-4 shrink-0 text-[#205BD6] mt-0.5" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form
          onSubmit={(event) => {
            setErrorPopupDismissed(false);
            void handleRegisterSubmit(event);
          }}
          className="space-y-5"
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              className={`min-h-11 w-full rounded-lg border bg-white px-3.5 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]/40 ${
                errors.fullName ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]' : 'border-[#0E1D4F]/15'
              } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none ${errors.fullName ? '' : 'focus:border-[#205BD6]'} transition-all`}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'reg-fullname-error' : undefined}
            />
            <AccessibleFieldError id="reg-fullname-error" message={errors.fullName} />
          </div>

          {/* Date of birth and email */}
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
              className={`min-h-11 w-full rounded-lg border bg-white px-3.5 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]/40 ${
                  errors.dateOfBirth ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]' : 'border-[#0E1D4F]/15'
                } text-[#0E1D4F] focus:outline-none ${errors.dateOfBirth ? '' : 'focus:border-[#205BD6]'} transition-all`}
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'reg-dob-error' : undefined}
              />
              <AccessibleFieldError id="reg-dob-error" message={errors.dateOfBirth} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
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
              className={`min-h-11 w-full rounded-lg border bg-white px-3.5 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]/40 ${
                  errors.email
                    ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]'
                    : emailFeedback && !emailFeedback.isValid
                    ? 'border-amber-400'
                    : emailFeedback && emailFeedback.isValid
                    ? 'border-emerald-500'
                    : 'border-[#0E1D4F]/15'
                } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none ${errors.email ? '' : 'focus:border-[#205BD6]'} transition-all`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'reg-email-error' : emailFeedback ? 'reg-email-hint' : undefined}
              />
              {errors.email ? (
                <AccessibleFieldError id="reg-email-error" message={errors.email} />
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
                  className={`min-h-11 w-full rounded-lg border bg-white py-3 pl-3.5 pr-12 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]/40 ${
                    errors.password
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]'
                      : password && isPasswordValid
                      ? 'border-emerald-500'
                      : 'border-[#0E1D4F]/15'
                  } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none ${errors.password ? '' : 'focus:border-[#205BD6]'} transition-all`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'reg-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-[#4B5875] hover:bg-[#EBF1F0] hover:text-[#0E1D4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="size-4" />
                </button>
              </div>
              <AccessibleFieldError id="reg-password-error" message={errors.password} />
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
                  className={`min-h-11 w-full rounded-lg border bg-white py-3 pl-3.5 pr-12 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]/40 ${
                    errors.confirmPassword ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]' : 'border-[#0E1D4F]/15'
                  } text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus:outline-none ${errors.confirmPassword ? '' : 'focus:border-[#205BD6]'} transition-all`}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-[#4B5875] hover:bg-[#EBF1F0] hover:text-[#0E1D4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} className="size-4" />
                </button>
              </div>
              <AccessibleFieldError id="reg-confirm-error" message={errors.confirmPassword} />
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="space-y-1 pt-1">
            <label className="flex min-h-11 items-start gap-2.5 cursor-pointer select-none text-sm text-[#4B5875]">
              <input
                id="reg-terms"
                type="checkbox"
                checked={agreeTerms}
                aria-invalid={!!errors.agreeTerms}
                aria-describedby={errors.agreeTerms ? 'reg-terms-error' : undefined}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: undefined }));
                }}
                className={`mt-0.5 w-4 h-4 rounded text-[#205BD6] accent-[#205BD6] cursor-pointer ${errors.agreeTerms ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : ''}`}
              />
              <span>
                Tôi đồng ý với các <span className="text-[#205BD6] underline">Điều khoản dịch vụ</span> và <span className="text-[#205BD6] underline">Chính sách bảo mật</span> của Vistra.
              </span>
            </label>
            <div className="pl-6">
              <AccessibleFieldError id="reg-terms-error" message={errors.agreeTerms} />
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 min-h-12 w-full rounded-lg bg-[#205BD6] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Đang đăng ký…' : 'Tạo tài khoản'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#0E1D4F]/10 w-full"></div>
          <span className="bg-warm-surface px-3 text-xs font-label-caps uppercase text-[#4B5875] shrink-0">
            Hoặc đăng ký nhanh bằng
          </span>
        </div>

        {/* OAuth Providers */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            title="Backend chưa cấu hình Google OAuth"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#0E1D4F]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0E1D4F] opacity-55 disabled:cursor-not-allowed"
          >
            <span className="font-bold text-[#205BD6]">G</span>
            <span>Google</span>
          </button>
          <button
            type="button"
            disabled
            title="Backend chưa cấu hình Facebook OAuth"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#0E1D4F]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0E1D4F] opacity-55 disabled:cursor-not-allowed"
          >
            <span className="font-bold text-[#205BD6]">f</span>
            <span>Facebook</span>
          </button>
        </div>

        

        {/* Navigation link to login */}
        <div className="text-center pt-2 text-xs text-[#4B5875]">
          <span>Đã có tài khoản VISTRA? </span>
          <Link href="/login" className="text-[#205BD6] font-semibold hover:underline">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
    {validationErrors.length > 0 && !errorPopupDismissed && (
      <div className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-[100] mx-auto w-auto max-w-lg sm:inset-x-auto sm:left-auto sm:right-4 sm:mx-0 sm:w-[min(28rem,calc(100vw-2rem))]">
        <div
          role="alert"
          aria-live="assertive"
          className="max-h-[min(36svh,18rem)] overflow-y-auto rounded-xl border border-rose-200 bg-warm-surface p-4 text-[#0E1D4F] shadow-xl"
        >
          <div className="flex items-start gap-3">
            <Icon name="error" className="mt-0.5 size-5 shrink-0 text-[#ba1a1a]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#ba1a1a]">Vui lòng kiểm tra các mục sau</p>
              <ul className="mt-2 space-y-1.5">
                {validationErrors.map((error) => (
                  <li key={error.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const field = document.getElementById(error.id);
                        field?.focus();
                        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="min-h-11 w-full rounded-md text-left text-xs leading-relaxed text-[#4B5875] underline decoration-rose-300 underline-offset-2 hover:text-[#0E1D4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
                    >
                      <span className="font-semibold">{error.label}:</span> {error.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setErrorPopupDismissed(true)}
              aria-label="Đóng thông báo lỗi"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[#4B5875] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
            >
              <Icon name="close" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

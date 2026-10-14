'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useLoginController } from './useLoginController';
import ComingSoonModal from './ComingSoonModal';

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
    redirectNotice,
  } = useLoginController();
  const [comingSoonOpen, setComingSoonOpen] = React.useState(false);
  const [comingSoonTitle, setComingSoonTitle] = React.useState('Tính năng đang phát triển');
  const actionTriggerRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!comingSoonOpen) actionTriggerRef.current?.focus();
  }, [comingSoonOpen]);

  const handleUnavailableAction = (title: string, trigger: HTMLButtonElement) => {
    actionTriggerRef.current = trigger;
    setComingSoonTitle(title);
    setComingSoonOpen(true);
  };
  const closeComingSoon = React.useCallback(() => setComingSoonOpen(false), []);

  return (
    <div className="mx-auto grid min-h-[calc(100vh-76px-300px)] w-full max-w-[1180px] grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[5fr_7fr] lg:gap-[5%] lg:px-12 lg:py-16">
      <aside className="relative hidden min-h-[560px] overflow-hidden rounded-[1.75rem] bg-[#0E1D4F] lg:block">
        <Image
          src="/landing/hero-inspiration.jpg"
          alt="Lối đi bên hồ giữa rừng thông"
          fill
          priority
          sizes="(max-width: 1280px) 40vw, 520px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1D4F]/90 via-[#0E1D4F]/10 to-[#0E1D4F]/10" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white xl:p-10">
          <p className="font-label-caps text-xs font-bold uppercase tracking-[0.16em] text-[#E7AD2E]">Tài khoản du khách</p>
          <h2 className="mt-3 max-w-sm font-headline-lg text-3xl font-bold leading-tight xl:text-4xl">Tiếp tục lên kế hoạch theo cách của bạn.</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">Đăng nhập để quản lý hành trình và sở thích du lịch cá nhân hóa.</p>
        </div>
      </aside>

      <div className="mx-auto w-full max-w-[470px] space-y-6 rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 shadow-[0_12px_36px_rgba(14,29,79,0.07)] sm:p-8 lg:justify-self-center">
        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="mb-2 inline-flex size-11 items-center justify-center rounded-xl border border-[#08B3C6]/30 bg-[#EBF1F0] text-[#0E1D4F]">
            <Icon name="lock" className="size-6" />
          </div>
          <h1 className="font-headline-sm text-2xl font-bold text-[#0E1D4F] sm:text-3xl">
            Đăng nhập tài khoản
          </h1>
          <p className="text-sm text-[#4B5875]">Trở lại VISTRA để tiếp tục thao tác.</p>
        </div>

        {/* Redirect notice when redirected from protected action */}
        {redirectNotice && (
          <div role="status" className="flex items-start gap-2.5 rounded-xl border border-[#205BD6]/25 bg-[#EBF1F0] p-3.5 text-sm leading-relaxed text-[#0E1D4F]">
            <Icon name="info" className="size-4 shrink-0 text-[#205BD6] mt-0.5" />
            <span>{redirectNotice}</span>
          </div>
        )}

        {/* Feedback alert */}
        {feedbackMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-[#205BD6]/30 bg-[#EBF1F0] p-3 text-sm leading-relaxed text-[#0E1D4F]">
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
              className="block text-xs font-label-caps font-bold uppercase text-[#0E1D4F]"
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
                className={`min-h-11 w-full rounded-lg border bg-white px-3.5 py-3 text-sm text-[#0E1D4F] placeholder:text-[#4B5875]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]/40 ${errors.email ? 'border-[#ba1a1a] focus-visible:ring-[#ba1a1a]' : 'border-[#0E1D4F]/20 focus:border-[#205BD6]'} transition-colors`}
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
                className="block text-xs font-label-caps font-bold uppercase text-[#0E1D4F]"
              >
                Mật khẩu <span className="text-[#ba1a1a]">*</span>
              </label>
              <button
                type="button"
                onClick={(event) => handleUnavailableAction('Khôi phục mật khẩu', event.currentTarget)}
                className="inline-flex min-h-11 items-center text-xs font-semibold text-[#205BD6] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
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
                className={`min-h-11 w-full rounded-lg border bg-white py-3 pl-3.5 pr-12 text-sm text-[#0E1D4F] placeholder:text-[#4B5875]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]/40 ${errors.password ? 'border-[#ba1a1a] focus-visible:ring-[#ba1a1a]' : 'border-[#0E1D4F]/20 focus:border-[#205BD6]'} transition-colors`}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-[#4B5875] hover:bg-[#EBF1F0] hover:text-[#0E1D4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
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
            className="mt-2 min-h-12 w-full rounded-lg bg-[#205BD6] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:bg-[#4B5875]/50"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#0E1D4F]/10 w-full"></div>
        </div>

        {/* OAuth Provider Buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        </div>

        {/* Footer Nav Link */}
        <div className="text-center pt-2 text-xs text-[#4B5875]">
          <span>Chưa có tài khoản VISTRA? </span>
          <Link href="/register" className="text-[#205BD6] font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
      <ComingSoonModal
        isOpen={comingSoonOpen}
        onClose={closeComingSoon}
        title={comingSoonTitle}
      />
    </div>
  );
}

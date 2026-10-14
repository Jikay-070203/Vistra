'use client';

import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { useUserAuth } from '@/lib/userAuth';
import { ProfileTabType, ProfileFormData } from './useProfileController';

interface ProfileHeaderProps {
  formData: ProfileFormData;
  avatarUrl: string | null;
  joinedAt: string | null;
  totalPlansCount: number | string;
  confirmedPlansCount: number | string;
  publishedPlansCount: number | string;
  activeTab: ProfileTabType;
  onSelectTab: (tab: ProfileTabType) => void;
}

export default function ProfileHeader({
  formData,
  avatarUrl,
  joinedAt,
  totalPlansCount,
  confirmedPlansCount,
  publishedPlansCount,
  activeTab,
  onSelectTab,
}: ProfileHeaderProps) {
  const { isLoggedIn } = useUserAuth();

  const formattedJoinedAt = joinedAt
    ? (() => {
        try {
          const d = new Date(joinedAt);
          if (isNaN(d.getTime())) return joinedAt;
          return `Tháng ${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch {
          return joinedAt;
        }
      })()
    : 'Chưa cập nhật';

  const userInitials = formData.fullName
    ? formData.fullName.trim().slice(0, 2).toUpperCase()
    : 'VS';

  return (
    <>
      {/* Top Breadcrumb & Tag */}
      <div className="mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#08B3C6]"></span>
        <span className="font-label-caps text-xs text-[#08B3C6] uppercase tracking-widest font-bold">
          HỒ SƠ DU KHÁCH &amp; QUẢN LÝ TÀI KHOẢN
        </span>
      </div>

      {/* Header Profile Identity Card */}
      <div className="mb-7 rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {isLoggedIn && (
              <div className="relative">
                {avatarUrl ? (
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-[#0E1D4F]/10 sm:size-24">
                    <Image
                      src={avatarUrl}
                      alt={formData.fullName || 'Ảnh đại diện người dùng'}
                      fill
                      sizes="(max-width: 640px) 80px, 96px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0] text-2xl font-bold text-[#0E1D4F] sm:size-24 sm:text-3xl"
                    aria-label="Chưa có ảnh đại diện"
                  >
                    {userInitials}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
                  {formData.fullName || (isLoggedIn ? 'Tài khoản thành viên' : 'Khách vãng lai')}
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#08B3C6]/15 text-[#08B3C6] text-xs font-bold border border-[#08B3C6]/30">
                  {isLoggedIn ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
                </span>
              </div>
              <p className="text-sm text-[#4B5875] mt-1">{formData.email || 'Chưa có email'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#4B5875]">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="location_on" className="size-4 text-[#08B3C6]" aria-hidden="true" />
                  Xuất phát:{' '}
                  <strong className="text-[#0E1D4F]">
                    {formData.defaultOrigin || 'Chưa thiết lập'}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar_month" className="size-4 text-[#08B3C6]" aria-hidden="true" />
                  Tham gia từ:{' '}
                  <strong className="text-[#0E1D4F]">{formattedJoinedAt}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/60 p-2 sm:flex sm:items-center sm:gap-3 sm:p-3">
            <div className="min-w-0 px-1 py-2 text-center sm:min-w-[108px] sm:px-3">
              <div className="text-xl font-bold text-[#0E1D4F] sm:text-2xl">{totalPlansCount}</div>
              <div className="mt-1 text-xs leading-tight text-[#4B5875]">
                Tổng hành trình
              </div>
            </div>
            <div className="hidden h-8 w-px bg-[#0E1D4F]/10 sm:block"></div>
            <div className="min-w-0 px-1 py-2 text-center sm:min-w-[108px] sm:px-3">
              <div className="text-xl font-bold text-[#0E1D4F] sm:text-2xl">{confirmedPlansCount}</div>
              <div className="mt-1 text-xs leading-tight text-[#4B5875]">
                Đã chốt
              </div>
            </div>
            <div className="hidden h-8 w-px bg-[#0E1D4F]/10 sm:block"></div>
            <div className="min-w-0 px-1 py-2 text-center sm:min-w-[108px] sm:px-3">
              <div className="text-xl font-bold text-[#0E1D4F] sm:text-2xl">{publishedPlansCount}</div>
              <div className="mt-1 text-xs leading-tight text-[#4B5875]">
                Đã chia sẻ
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Các mục hồ sơ" className="-mx-5 mt-6 flex items-center gap-2 overflow-x-auto border-t border-[#0E1D4F]/10 px-5 pt-4 sm:-mx-7 sm:px-7">
          <button
            type="button"
            id="profile-tab-info"
            aria-controls="profile-tabpanel"
            onClick={() => onSelectTab('info')}
            aria-current={activeTab === 'info' ? 'page' : undefined}
            className={`min-h-11 shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] ${
              activeTab === 'info'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            id="profile-tab-dna"
            aria-controls="profile-tabpanel"
            onClick={() => onSelectTab('dna')}
            aria-current={activeTab === 'dna' ? 'page' : undefined}
            className={`min-h-11 shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] ${
              activeTab === 'dna'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Hồ sơ Travel DNA
          </button>
          <button
            type="button"
            id="profile-tab-subscription"
            aria-controls="profile-tabpanel"
            onClick={() => onSelectTab('subscription')}
            aria-current={activeTab === 'subscription' ? 'page' : undefined}
            className={`min-h-11 shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] ${
              activeTab === 'subscription'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Gói dịch vụ &amp; Hạn mức
          </button>
          <button
            type="button"
            id="profile-tab-activity"
            aria-controls="profile-tabpanel"
            onClick={() => onSelectTab('activity')}
            aria-current={activeTab === 'activity' ? 'page' : undefined}
            className={`min-h-11 shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] ${
              activeTab === 'activity'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Nhật ký hành trình
          </button>
          <button
            type="button"
            id="profile-tab-feedback"
            aria-controls="profile-tabpanel"
            onClick={() => onSelectTab('feedback')}
            aria-current={activeTab === 'feedback' ? 'page' : undefined}
            className={`min-h-11 shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] ${
              activeTab === 'feedback'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Phản hồi của tôi
          </button>
        </nav>
      </div>
    </>
  );
}

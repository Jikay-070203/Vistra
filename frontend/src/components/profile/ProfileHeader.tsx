'use client';

import React from 'react';
import { ProfileTabType, ProfileFormData } from './useProfileController';

interface ProfileHeaderProps {
  formData: ProfileFormData;
  totalPlansCount: number;
  confirmedPlansCount: number;
  publishedPlansCount: number;
  activeTab: ProfileTabType;
  onSelectTab: (tab: ProfileTabType) => void;
}

export default function ProfileHeader({
  formData,
  totalPlansCount,
  confirmedPlansCount,
  publishedPlansCount,
  activeTab,
  onSelectTab,
}: ProfileHeaderProps) {
  return (
    <>
      {/* Top Breadcrumb & Tag */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#08B3C6]"></span>
        <span className="font-label-caps text-xs text-[#08B3C6] uppercase tracking-widest font-bold">
          HỒ SƠ DU KHÁCH &amp; QUẢN LÝ TÀI KHOẢN
        </span>
      </div>

      {/* Header Profile Identity Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#205BD6] to-[#08B3C6] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md">
                VS
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]" title="Đang hoạt động">
                ✓
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
                  {formData.fullName}
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#08B3C6]/15 text-[#08B3C6] text-xs font-bold border border-[#08B3C6]/30">
                  Pro Explorer Demo
                </span>
              </div>
              <p className="text-sm text-[#4B5875] mt-1">{formData.email}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#4B5875] mt-2">
                <span>📍 Xuất phát: <strong className="text-[#0E1D4F]">{formData.defaultOrigin}</strong></span>
                <span>•</span>
                <span>🗓 Tham gia từ: <strong className="text-[#0E1D4F]">Tháng 08/2026</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 bg-[#EBF1F0]/60 p-4 rounded-2xl border border-[#0E1D4F]/5">
            <div className="text-center px-3">
              <div className="text-2xl font-bold text-[#0E1D4F]">{totalPlansCount}</div>
              <div className="text-xs text-[#4B5875] mt-0.5">Tổng hành trình</div>
            </div>
            <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
            <div className="text-center px-3">
              <div className="text-2xl font-bold text-emerald-600">{confirmedPlansCount}</div>
              <div className="text-xs text-[#4B5875] mt-0.5">Đã chốt lịch</div>
            </div>
            <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
            <div className="text-center px-3">
              <div className="text-2xl font-bold text-[#205BD6]">{publishedPlansCount}</div>
              <div className="text-xs text-[#4B5875] mt-0.5">Đã chia sẻ</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-[#0E1D4F]/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => onSelectTab('info')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'info'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('dna')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'dna'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Hồ sơ Travel DNA
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('subscription')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'subscription'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Gói dịch vụ &amp; Hạn mức (Demo)
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('activity')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Nhật ký hành trình
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('feedback')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-[#205BD6] text-white shadow-sm'
                : 'text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#0E1D4F]/5'
            }`}
          >
            Phản hồi của tôi
          </button>
        </div>
      </div>
    </>
  );
}

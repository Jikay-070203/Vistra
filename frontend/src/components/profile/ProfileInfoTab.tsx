'use client';

import React from 'react';
import Link from 'next/link';
import { ProfileFormData } from './useProfileController';

interface ProfileInfoTabProps {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  savedSuccess: boolean;
  setSavedSuccess: (val: boolean) => void;
  saveError: string | null;
  isSaving: boolean;
  isLoading: boolean;
  handleSave: (e: React.FormEvent) => void;
  isLoggedIn: boolean;
  hasLoadedProfile: boolean;
  onRetry: () => void;
}

export default function ProfileInfoTab({
  formData,
  setFormData,
  savedSuccess,
  setSavedSuccess,
  saveError,
  isSaving,
  isLoading,
  handleSave,
  isLoggedIn,
  hasLoadedProfile,
  onRetry,
}: ProfileInfoTabProps) {
  if (!isLoggedIn) return (
    <div className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-8 text-center text-sm text-[#4B5875]">
      <p>Đăng nhập để xem và cập nhật hồ sơ của bạn.</p>
      <Link href="/login" className="inline-block mt-3 font-semibold text-[#205BD6] underline">Đăng nhập</Link>
    </div>
  );
  return (
    <>
      {/* Loading Notification */}
      {isLoading && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-3 animate-fade-in" role="status">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></span>
          <span>Đang tải thông tin hồ sơ từ máy chủ...</span>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-sm animate-fade-in" role="alert">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
              !
            </span>
            <span>
              <strong>Lỗi:</strong> {saveError}
            </span>
          </div>
          {!hasLoadedProfile && <button type="button" onClick={onRetry} disabled={isLoading} className="px-4 py-3 rounded-xl font-semibold underline disabled:opacity-50">Thử lại</button>}
        </div>
      )}

      {/* Success Notification */}
      {savedSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-fade-in" role="status">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
              ✓
            </span>
            <span>
              <strong>Cập nhật thành công!</strong>{' '}
              Thông tin hồ sơ đã được lưu đồng bộ với máy chủ.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Info Form & Preferences */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-7">
        <div className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 sm:p-7 lg:col-span-2">
          <h2 className="font-headline-sm text-xl text-[#0E1D4F] font-bold mb-1">
            Thông tin liên hệ & Điểm xuất phát
          </h2>
          <p className="text-xs text-[#4B5875] mb-6">
            VISTRA sử dụng điểm xuất phát mặc định để tự động tính toán phương thức di chuyển tối ưu cho mọi lịch trình mới.
          </p>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="profile-full-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0E1D4F]">
                  Họ và tên
                </label>
                <input
                  id="profile-full-name"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={isLoading || isSaving || !hasLoadedProfile}
                  className="w-full px-4 py-3 rounded-xl border border-[#0E1D4F]/15 bg-[#EBF1F0]/20 text-[#0E1D4F] text-sm focus:outline-none focus:ring-2 focus:ring-[#205BD6]/40 focus:border-[#205BD6] disabled:opacity-60"
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0E1D4F]">
                  Địa chỉ email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading || isSaving || !hasLoadedProfile}
                  className="w-full px-4 py-3 rounded-xl border border-[#0E1D4F]/15 bg-[#EBF1F0]/20 text-[#0E1D4F] text-sm focus:outline-none focus:ring-2 focus:ring-[#205BD6]/40 focus:border-[#205BD6] disabled:opacity-60"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="profile-phone" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0E1D4F]">
                  Số điện thoại
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isLoading || isSaving || !hasLoadedProfile}
                  className="w-full px-4 py-3 rounded-xl border border-[#0E1D4F]/15 bg-[#EBF1F0]/20 text-[#0E1D4F] text-sm focus:outline-none focus:ring-2 focus:ring-[#205BD6]/40 focus:border-[#205BD6] disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="profile-origin" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0E1D4F]">
                  Điểm xuất phát mặc định
                </label>
                <input
                  id="profile-origin"
                  type="text"
                  value={formData.defaultOrigin}
                  onChange={(e) => setFormData({ ...formData, defaultOrigin: e.target.value })}
                  disabled={isLoading || isSaving || !hasLoadedProfile}
                  className="w-full px-4 py-3 rounded-xl border border-[#0E1D4F]/15 bg-[#EBF1F0]/20 text-[#0E1D4F] text-sm focus:outline-none focus:ring-2 focus:ring-[#205BD6]/40 focus:border-[#205BD6] disabled:opacity-60"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-bio" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0E1D4F]">
                Tiểu sử & Phong cách di chuyển cá nhân
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={isLoading || isSaving || !hasLoadedProfile}
                className="w-full px-4 py-3 rounded-xl border border-[#0E1D4F]/15 bg-[#EBF1F0]/20 text-[#0E1D4F] text-sm focus:outline-none focus:ring-2 focus:ring-[#205BD6]/40 focus:border-[#205BD6] disabled:opacity-60"
              />
            </div>

            <div className="pt-4 border-t border-[#0E1D4F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-[#4B5875]">
                Dữ liệu được lưu và đồng bộ trực tiếp với máy chủ.
              </span>
              <button
                type="submit"
                disabled={isSaving || isLoading || !hasLoadedProfile}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#205BD6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Side Preference Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 sm:p-7">
          <div>
            <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold mb-2">
              Tùy chọn trải nghiệm mặc định
            </h3>
            <p className="text-xs text-[#4B5875] mb-5">
              Các tiêu chí này được AI Agent đối chiếu khi tạo mới lịch trình tại /create-trip.
            </p>

            <div className="space-y-4">
              <div className="rounded-lg border border-[#0E1D4F]/10 bg-[#EBF1F0]/50 p-3.5">
                <div className="text-xs font-bold text-[#0E1D4F] mb-1">Nhịp độ hành trình:</div>
                <div className="text-xs text-[#205BD6] font-semibold">{formData.preferredPace || 'Chưa thiết lập'}</div>
              </div>

              <div className="rounded-lg border border-[#0E1D4F]/10 bg-[#EBF1F0]/50 p-3.5">
                <div className="text-xs font-bold text-[#0E1D4F] mb-1">Gu lưu trú:</div>
                <div className="text-xs text-[#205BD6] font-semibold">{formData.preferredStay || 'Chưa thiết lập'}</div>
              </div>

              <div className="rounded-lg border border-[#0E1D4F]/10 bg-[#EBF1F0]/50 p-3.5">
                <div className="text-xs font-bold text-[#0E1D4F] mb-1">Khẩu vị trải nghiệm:</div>
                <div className="text-xs text-[#205BD6] font-semibold">{formData.dietaryPreference || 'Chưa thiết lập'}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-[#EBF1F0]/50 border border-[#0E1D4F]/10 text-[#4B5875] text-xs">
            <span className="font-bold text-[#0E1D4F]">Đồng bộ hồ sơ:</span> Các tiêu chí trên được liên kết trực tiếp với dữ liệu hồ sơ du khách.
          </div>
        </div>
      </div>
    </>
  );
}

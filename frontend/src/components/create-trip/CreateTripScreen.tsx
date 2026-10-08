'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { useCreateTripController } from './useCreateTripController';
import BudgetRangeField from '@/components/shared/BudgetRangeField';
import VistraSelect from '@/components/shared/VistraSelect';
import type { FitnessLevelOption, MoodPhoto } from './types';

const FITNESS_OPTIONS: FitnessLevelOption[] = [
  { level: 1, label: 'Rất nhẹ nhàng', distance: '< 3 km/ngày', desc: 'Nghỉ dưỡng thư thái, ngắm cảnh yên tĩnh' },
  { level: 2, label: 'Nhẹ nhàng', distance: '3 - 6 km/ngày', desc: 'Dạo phố, tham quan các điểm du lịch tiêu chuẩn' },
  { level: 3, label: 'Vừa phải', distance: '6 - 10 km/ngày', desc: 'Đi bộ linh hoạt, khám phá đa dạng cảnh quan' },
  { level: 4, label: 'Năng động', distance: '10 - 15 km/ngày', desc: 'Leo dốc nhẹ, nhiều hoạt động ngoài trời' },
  { level: 5, label: 'Thử thách', distance: '> 15 km/ngày', desc: 'Trekking địa hình đồi dốc, vận động cường độ cao' },
];

const COMMON_ALLERGIES = [
  'Hải sản',
  'Đậu phộng / Lạc',
  'Sữa & Chế phẩm',
  'Trứng',
  'Gluten / Lúa mì',
  'Đậu nành',
  'Ăn chay (Vegetarian)',
  'Kiêng cay',
];

export default function CreateTripScreen() {
  const form = useCreateTripController();
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [showAddPhoto, setShowAddPhoto] = useState(false);

  const fieldClass = 'w-full rounded-xl border border-[#0E1D4F]/15 bg-white p-3 text-sm focus:outline-none focus:border-[#205BD6]';

  const handleAddCustomPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    const newPhoto: MoodPhoto = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Ảnh cảm hứng du khách',
      tags: ['Tự chọn'],
    };
    form.addCustomPhoto(newPhoto);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setShowAddPhoto(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-12">
      {/* Top Header */}
      <div className="mb-8 pb-6 border-b border-[#0E1D4F]/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#205BD6]"></span>
          <span className="font-label-caps text-xs text-[#205BD6] uppercase tracking-widest font-bold">
            KHỞI TẠO Ý TƯỞNG HÀNH TRÌNH
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0E1D4F] tracking-tight">
          Tạo kế hoạch cá nhân
        </h1>
        <p className="text-sm sm:text-base text-[#4B5875] mt-2 max-w-2xl leading-relaxed">
          Phác thảo chuyến đi theo mong muốn riêng của bạn. VISTRA kết nối điểm đến, thời gian và gợi ý lịch trình phù hợp nhất.
        </p>
      </div>

      {!form.isLoaded ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#205BD6]/30 border-t-[#205BD6] rounded-full animate-spin mb-3" />
          <p className="text-sm text-[#4B5875]" role="status">Đang kiểm tra phiên làm việc…</p>
        </div>
      ) : !form.isLoggedIn ? (
        <div className="p-8 text-center bg-white/80 rounded-2xl border border-[#0E1D4F]/10">
          <p className="text-base text-[#0E1D4F] font-semibold mb-2">Bạn cần đăng nhập để khởi tạo chuyến đi.</p>
          <p className="text-sm text-[#4B5875] mb-4">Đang chuyển hướng tới trang đăng nhập...</p>
          <Link
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#205BD6] text-white rounded-xl font-medium text-sm"
            href="/login?next=/create-trip"
          >
            Đăng nhập ngay
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Main Form Left Column (7 cols) */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.submit();
            }}
            className="lg:col-span-7 space-y-7 rounded-2xl border border-[#0E1D4F]/10 bg-white/85 backdrop-blur-md p-5 sm:p-8 shadow-xs"
          >
            <fieldset disabled={form.isSubmitting || Boolean(form.created)} className="space-y-6">
              {/* 1. Destination */}
              <div className="space-y-1.5">
                <VistraSelect
                  label="TỈNH / THÀNH PHỐ ĐẾN"
                  value={form.destination}
                  onChange={form.setDestination}
                  options={form.catalog.map((item) => ({ value: item.slug, label: item.name }))}
                  disabled={form.catalogLoading || Boolean(form.catalogError)}
                  placeholder={form.catalogLoading ? 'Đang tải danh mục tỉnh thành…' : 'Chọn tỉnh thành đến'}
                />
                {form.catalogError && (
                  <p role="alert" className="text-xs text-rose-600 mt-1">
                    {form.catalogError}{' '}
                    <button type="button" className="underline font-semibold" onClick={form.retryCatalog}>
                      Thử lại
                    </button>
                  </p>
                )}
                {!form.catalogLoading && !form.catalogError && form.catalog.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">Backend chưa có danh mục tỉnh để tạo chuyến đi.</p>
                )}
              </div>

              {/* 2. Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="create-start-date" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
                    NGÀY BẮT ĐẦU
                  </label>
                  <input
                    id="create-start-date"
                    className={fieldClass}
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(event) => form.setStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="create-end-date" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
                    NGÀY KẾT THÚC
                  </label>
                  <input
                    id="create-end-date"
                    className={fieldClass}
                    type="date"
                    required
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(event) => form.setEndDate(event.target.value)}
                  />
                </div>
              </div>

              {/* 3. Group Size & Pace (CREATE-02: Travelers input before budget) */}
              <div className="grid gap-4 sm:grid-cols-2 items-end">
                <div className="space-y-1.5">
                  <label htmlFor="create-people" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
                    SỐ NGƯỜI THAM GIA
                  </label>
                  <input
                    id="create-people"
                    className={fieldClass}
                    type="number"
                    required
                    min={1}
                    max={50}
                    step={1}
                    value={form.people}
                    onChange={(event) => form.setPeople(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <VistraSelect
                    label="NHỊP ĐỘ CHUYẾN ĐI"
                    value={form.pace}
                    onChange={(val) => form.setPace(val as typeof form.pace)}
                    options={[
                      { value: 'relaxed', label: 'Thư thái (ít di chuyển, nghỉ ngơi)' },
                      { value: 'normal', label: 'Cân bằng (tiêu chuẩn VISTRA)' },
                      { value: 'busy', label: 'Năng động (nhiều điểm đến)' },
                    ]}
                  />
                </div>
              </div>

              {/* 4. Budget Range */}
              <div className="space-y-1.5 pt-1">
                <BudgetRangeField
                  label="NGÂN SÁCH TỔNG DỰ KIẾN (VNĐ)"
                  value={form.budget}
                  onChange={form.setBudget}
                  travelerCount={form.people}
                />
                <p className="text-[11px] text-[#4B5875] mt-1">
                  API hiện nhận mức ngân sách tối đa làm giới hạn tổng chi phí cho toàn đoàn. Tuyến đường hỗ trợ di chuyển bằng ô tô.
                </p>
              </div>

              {/* 5. Prompt Notes (Unsent to BE / Local Context) */}
              <div className="space-y-1.5 pt-2 border-t border-[#0E1D4F]/10">
                <div className="flex items-center justify-between">
                  <label htmlFor="create-notes" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
                    GHI CHÚ Ý TƯỞNG &amp; MONG MUỐN RIÊNG
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Chưa gửi API
                  </span>
                </div>
                <textarea
                  id="create-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => form.setNotes(e.target.value)}
                  placeholder="Ví dụ: Thích quán cà phê view đồi, muốn ăn thử bánh ướt lòng gà, ưu tiên chụp ảnh lúc hoàng hôn..."
                  className="w-full rounded-xl border border-[#0E1D4F]/15 bg-white p-3 text-sm focus:outline-none focus:border-[#205BD6]"
                />
              </div>

              {/* 6. Fitness Level (5 levels - CREATE-04) */}
              <div className="space-y-2.5 pt-2 border-t border-[#0E1D4F]/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
                    MỨC ĐỘ THỂ LỰC PHÙ HỢP
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Chưa gửi API
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {FITNESS_OPTIONS.map((item) => (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => form.setFitnessLevel(item.level)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        form.fitnessLevel === item.level
                          ? 'border-[#205BD6] bg-[#205BD6]/10 ring-1 ring-[#205BD6]'
                          : 'border-[#0E1D4F]/10 bg-white hover:bg-[#EBF1F0]'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-bold text-[#0E1D4F]">{item.label}</span>
                        <span className="block text-[10px] text-[#205BD6] font-medium mt-0.5">{item.distance}</span>
                      </div>
                      <span className="block text-[10px] text-[#4B5875] mt-1.5 line-clamp-2">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Dietary & Allergies (Multi-select - CREATE-03) */}
              <div className="space-y-2.5 pt-2 border-t border-[#0E1D4F]/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
                    DỊ ỨNG &amp; YÊU CẦU ẨM THỰC
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Chưa gửi API
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGIES.map((item) => {
                    const isSelected = form.selectedAllergies.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => form.toggleAllergy(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#205BD6] text-white border-[#205BD6]'
                            : 'bg-white text-[#4B5875] border-[#0E1D4F]/15 hover:border-[#0E1D4F]/30'
                        }`}
                      >
                        {isSelected && <Icon name="check" className="size-3.5" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#0E1D4F]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[#4B5875]">
                  Chỉ gọi gửi thông tin khi bạn nhấn xác nhận nút dưới đây.
                </p>
                <button
                  type="submit"
                  disabled={form.catalogLoading || Boolean(form.catalogError) || !form.destination || form.isSubmitting}
                  className="w-full sm:w-auto min-h-12 rounded-xl bg-[#205BD6] hover:bg-[#0739A8] px-8 py-3.5 font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {form.isSubmitting ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang tạo chuyến đi…</span>
                    </>
                  ) : (
                    <>
                      <Icon name="auto_awesome" className="size-5" />
                      <span>Tạo chuyến đi</span>
                    </>
                  )}
                </button>
              </div>
            </fieldset>

            {form.error && (
              <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <Icon name="error" className="size-4 text-rose-600 shrink-0" />
                <span>{form.error}</span>
              </div>
            )}

            {form.created && (
              <div role="status" className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="size-5 text-emerald-600 shrink-0" />
                  <strong className="text-sm">Hành trình đã được khởi tạo thành công!</strong>
                </div>
                {form.created.generationError && (
                  <p className="text-amber-800">
                    Chưa sinh được chi tiết chặng: {typeof form.created.generationError === 'string' ? form.created.generationError : JSON.stringify(form.created.generationError)}
                  </p>
                )}
                <div>
                  <Link
                    className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-[#205BD6] hover:bg-[#0739A8] px-6 py-2.5 text-white font-semibold shadow-xs"
                    href={`/planner?id=${encodeURIComponent(form.created.id)}`}
                  >
                    <span>Mở bàn làm việc lịch trình</span>
                    <Icon name="arrow_forward" className="size-4" />
                  </Link>
                </div>
              </div>
            )}
          </form>

          {/* Right Column Aside: Moodboard & DNA (5 cols) */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Moodboard Photo Composer (CREATE-01) */}
            <div className="rounded-2xl border border-[#0E1D4F]/10 bg-white/85 backdrop-blur-md p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10">
                <div className="flex items-center gap-2">
                  <Icon name="photo_camera" className="size-4 text-[#205BD6]" />
                  <h2 className="text-base font-bold text-[#0E1D4F]">Bảng ảnh cảm hứng (Moodboard)</h2>
                </div>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Chưa gửi API
                </span>
              </div>

              <p className="text-xs text-[#4B5875] leading-relaxed">
                Đính kèm các bức ảnh thể hiện phong cách chuyến đi bạn mong đợi. Nhấp ảnh để xem chi tiết hoặc xóa nhanh.
              </p>

              {/* Photo Horizontal Scroll / Grid */}
              <div className="grid grid-cols-2 gap-3">
                {form.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl border border-[#0E1D4F]/15 overflow-hidden bg-slate-100 aspect-4/3 flex flex-col justify-end"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                    
                    {/* Delete Button (min 44px touch area) */}
                    <button
                      type="button"
                      onClick={() => form.removePhoto(photo.id)}
                      className="absolute top-1 right-1 size-9 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                      aria-label={`Xóa ảnh ${photo.caption}`}
                      title="Xóa ảnh khỏi moodboard"
                    >
                      <Icon name="close" className="size-4" />
                    </button>

                    {/* View Preview Button */}
                    <button
                      type="button"
                      onClick={() => form.setSelectedPhotoForModal(photo)}
                      className="absolute inset-0 w-full h-full cursor-pointer z-0"
                      aria-label={`Xem ảnh lớn ${photo.caption}`}
                    />

                    {/* Caption Overlay */}
                    <div className="relative p-2 text-white z-10 pointer-events-none">
                      <p className="text-[11px] font-semibold truncate drop-shadow-sm">{photo.caption}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Photo Controls */}
              {showAddPhoto ? (
                <div className="p-3 bg-[#EBF1F0] rounded-xl space-y-2.5">
                  <input
                    type="url"
                    placeholder="Nhập liên kết ảnh (https://...)"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white rounded-lg border border-[#0E1D4F]/10"
                  />
                  <input
                    type="text"
                    placeholder="Ghi chú ảnh (tuỳ chọn)"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white rounded-lg border border-[#0E1D4F]/10"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddCustomPhoto}
                      className="px-3 py-1.5 bg-[#205BD6] text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Thêm ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPhoto(false)}
                      className="px-3 py-1.5 text-xs text-[#4B5875] hover:underline cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddPhoto(true)}
                  className="w-full py-2.5 border border-dashed border-[#0E1D4F]/25 hover:border-[#205BD6] hover:bg-[#205BD6]/5 rounded-xl text-xs font-semibold text-[#205BD6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Icon name="add_photo_alternate" className="size-4" />
                  <span>Thêm ảnh cảm hứng</span>
                </button>
              )}
            </div>

            {/* Travel DNA Preview (CREATE-05) */}
            <div className="rounded-2xl border border-[#0E1D4F]/10 bg-white/85 backdrop-blur-md p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10">
                <div className="flex items-center gap-2">
                  <Icon name="fingerprint" className="size-4 text-[#205BD6]" />
                  <h2 className="text-base font-bold text-[#0E1D4F]">Định hình Travel DNA</h2>
                </div>
                <button
                  type="button"
                  onClick={form.resetTravelDna}
                  className="text-[11px] text-[#205BD6] hover:underline cursor-pointer"
                >
                  Đặt lại mặc định
                </button>
              </div>

              <p className="text-xs text-[#4B5875]">
                Tinh chỉnh xu hướng du lịch để VISTRA tối ưu hóa lịch trình phù hợp cá tính của bạn.
              </p>

              <div className="space-y-4">
                {/* 1. Exploration */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[#0E1D4F]">
                    <span>Khám phá mạo hiểm</span>
                    <span>Nghỉ ngơi thư thái</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.travelDna.exploration}
                    onChange={(e) => form.setTravelDna({ ...form.travelDna, exploration: Number(e.target.value) })}
                    className="w-full accent-[#205BD6] cursor-pointer"
                  />
                </div>

                {/* 2. Nature vs Culture */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[#0E1D4F]">
                    <span>Thiên nhiên cảnh quan</span>
                    <span>Văn hóa &amp; Lịch sử</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.travelDna.natureCulture}
                    onChange={(e) => form.setTravelDna({ ...form.travelDna, natureCulture: Number(e.target.value) })}
                    className="w-full accent-[#205BD6] cursor-pointer"
                  />
                </div>

                {/* 3. Pace */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[#0E1D4F]">
                    <span>Thư thả chậm rãi</span>
                    <span>Năng động dày đặc</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.travelDna.pace}
                    onChange={(e) => form.setTravelDna({ ...form.travelDna, pace: Number(e.target.value) })}
                    className="w-full accent-[#205BD6] cursor-pointer"
                  />
                </div>

                {/* 4. Cuisine */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[#0E1D4F]">
                    <span>Ẩm thực truyền thống</span>
                    <span>Trải nghiệm mới lạ</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.travelDna.cuisine}
                    onChange={(e) => form.setTravelDna({ ...form.travelDna, cuisine: Number(e.target.value) })}
                    className="w-full accent-[#205BD6] cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#EBF1F0]/70 rounded-xl text-[11px] text-[#4B5875] flex items-center gap-1.5 border border-[#0E1D4F]/5">
                <Icon name="info" className="size-3.5 text-[#205BD6] shrink-0" />
                <span>Travel DNA hiện được lưu trữ tại phiên làm việc máy khách, sẽ tự động đồng bộ khi API mở rộng.</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Full Photo Preview Modal */}
      {form.selectedPhotoForModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-photo-caption"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#0E1D4F]/10">
              <h3 id="modal-photo-caption" className="font-bold text-sm text-[#0E1D4F]">
                {form.selectedPhotoForModal.caption}
              </h3>
              <button
                type="button"
                onClick={() => form.setSelectedPhotoForModal(null)}
                className="size-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-[#4B5875] cursor-pointer"
                aria-label="Đóng xem ảnh"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>
            <div className="relative aspect-16/10 w-full bg-slate-900">
              <Image
                src={form.selectedPhotoForModal.url}
                alt={form.selectedPhotoForModal.caption}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

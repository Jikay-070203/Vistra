'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { useCreateTripController } from './useCreateTripController';
import BudgetRangeField from '@/components/shared/BudgetRangeField';
import VistraSelect from '@/components/shared/VistraSelect';
import CreateTripComposer from './CreateTripComposer';
import TravelDnaPanel from './TravelDnaPanel';
import Toast from '@/components/shared/Toast';
import type { LocalImageAttachment } from './types';

interface AllergySelectProps {
  selected: string[];
  options: string[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onToggle: (value: string) => void;
  disabled?: boolean;
}

function AllergySelect({ selected, options, loading = false, error = null, onRetry, onToggle, disabled = false }: AllergySelectProps) {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState('');
  const allOptions = [...options, ...customOptions];
  const listId = `${id}-list`;

  useEffect(() => {
    if (disabled || !open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    listRef.current?.focus();
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [disabled, open]);

  const addCustomValue = () => {
    const value = customValue.trim();
    if (!value || disabled) return;
    const existing = allOptions.find((option) => option.toLocaleLowerCase() === value.toLocaleLowerCase());
    const selectedValue = existing ?? value;
    if (!existing) setCustomOptions((current) => [...current, value]);
    if (!selected.some((item) => item.toLocaleLowerCase() === selectedValue.toLocaleLowerCase())) {
      onToggle(selectedValue);
    }
    setCustomValue('');
  };

  return (
    <div
      ref={wrapperRef}
      className="relative flex flex-col gap-1.5"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <label htmlFor={`${id}-trigger`} className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F] tracking-wide">
        DỊ ỨNG &amp; YÊU CẦU ẨM THỰC
      </label>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-controls={listId}
        disabled={disabled || loading}
        onClick={() => setOpen((value) => !value)}
        className={`w-full h-11 min-h-11 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : open ? 'bg-[#EBF1F0] border-[#205BD6] ring-1 ring-[#205BD6]/20' : 'bg-[#EBF1F0] hover:bg-[#E4ECEB] border-[#0E1D4F]/10'} text-[#0E1D4F] focus-visible:outline-2 focus-visible:outline-[#205BD6]`}
      >
        <span className={`min-w-0 truncate ${selected.length ? 'font-semibold text-[#0E1D4F]' : 'text-[#4B5875]/70'}`}>
          {loading ? 'Đang tải danh mục dị ứng…' : selected.length ? `${selected.length} lựa chọn đã chọn` : 'Chọn dị ứng hoặc yêu cầu ẩm thực'}
        </span>
        <Icon name="expand_more" className={`size-4 text-[#4B5875] shrink-0 transition-transform ${open ? 'rotate-180 text-[#205BD6]' : ''}`} />
      </button>

      {error && (
        <div className="absolute left-0 top-full z-40 mt-1 flex w-max max-w-[min(90vw,24rem)] items-start gap-2 rounded-lg border border-rose-200 bg-white p-3 text-xs text-rose-700 shadow-lg" role="alert">
          <span className="min-w-0 flex-1">{error}</span>
          {onRetry && (
            <button type="button" onClick={onRetry} className="shrink-0 underline font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-[#205BD6]">
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* CT-08: Selected summary chip strip is hidden in closed state; selection is reflected inside open dropdown list */}

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-multiselectable="true"
          className="absolute left-0 top-full z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-[#0E1D4F]/15 bg-white p-2 shadow-lg space-y-1 animate-in fade-in duration-150"
        >
          {loading && (
            <div className="p-3 text-center text-xs text-[#4B5875]">Đang tải lựa chọn dị ứng…</div>
          )}
          {!loading && allOptions.length === 0 && !error && (
            <div className="p-3 text-center text-xs text-[#4B5875]">Chưa có danh mục dị ứng từ máy chủ.</div>
          )}
          {allOptions.map((item) => {
            const isSelected = selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onToggle(item)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${isSelected ? 'bg-[#205BD6]/10 text-[#205BD6] font-semibold' : 'hover:bg-[#EBF1F0] text-[#0E1D4F]'}`}
              >
                <span>{item}</span>
                {isSelected && <Icon name="check" className="size-4 text-[#205BD6]" />}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#0E1D4F]/10 flex gap-2">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomValue();
                }
              }}
              placeholder="Thêm yêu cầu khác..."
              className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#0E1D4F]/15 bg-white focus:outline-none focus:border-[#205BD6]"
            />
            <button
              type="button"
              onClick={addCustomValue}
              className="px-3 py-1.5 text-xs bg-[#205BD6] text-white rounded-lg font-medium hover:bg-[#0739A8] cursor-pointer"
            >
              Thêm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateTripScreen() {
  const router = useRouter();
  const form = useCreateTripController();
  const setPreviewAttachment = form.setPreviewAttachment;
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const modalCloseBtnRef = useRef<HTMLButtonElement>(null);
  const fieldClass = 'w-full rounded-xl border border-[#0E1D4F]/15 bg-white p-3 text-sm focus:outline-none focus:border-[#205BD6]';

  // Auto-redirect to planner when trip is created successfully
  useEffect(() => {
    const createdTripId = form.created?.id;
    if (!createdTripId) return;
    const timer = setTimeout(() => {
      router.push(`/planner?trip_id=${encodeURIComponent(createdTripId)}`);
    }, 1200);
    return () => clearTimeout(timer);
  }, [form.created, router]);

  const handleOpenPreview = (att: LocalImageAttachment, triggerElement?: HTMLElement) => {
    if (triggerElement) {
      lastTriggerRef.current = triggerElement;
    }
    form.setPreviewAttachment(att);
  };

  const handleClosePreview = useCallback(() => {
    setPreviewAttachment(null);
    // Return keyboard focus to the trigger element that opened the preview
    setTimeout(() => {
      lastTriggerRef.current?.focus();
    }, 0);
  }, [setPreviewAttachment]);

  // Focus the close button when preview modal opens
  useEffect(() => {
    if (form.previewAttachment) {
      modalCloseBtnRef.current?.focus();
    }
  }, [form.previewAttachment]);

  // Handle global Escape key for modal
  useEffect(() => {
    if (!form.previewAttachment) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClosePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form.previewAttachment, handleClosePreview]);

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
            onSubmit={(event) => event.preventDefault()}
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

              {/* 3. Group Size, Pace & Allergy Preferences */}
              <div className="grid items-end gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="create-people" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
                    SỐ NGƯỜI THAM GIA
                  </label>
                  <input
                    id="create-people"
                    className={`${fieldClass} h-11 py-2.5`}
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
                    triggerClassName="h-11"
                    options={[
                      { value: 'relaxed', label: 'Thư thái', description: 'Mức vận động nhẹ, di chuyển ngắn và có nhiều thời gian nghỉ.' },
                      { value: 'normal', label: 'Cân bằng', description: 'Mức vận động vừa phải, xen kẽ tham quan và nghỉ ngơi.' },
                      { value: 'busy', label: 'Năng động', description: 'Mức vận động cao, nhiều điểm và hoạt động; cần sức bền tốt.' },
                    ]}
                  />
                </div>
                <AllergySelect
                  selected={form.selectedAllergies}
                  options={form.allergyOptions}
                  loading={form.allergyLoading}
                  error={form.allergyError}
                  onRetry={form.retryAllergies}
                  onToggle={form.toggleAllergy}
                  disabled={form.isSubmitting || Boolean(form.created)}
                />
              </div>
              {form.selectedAllergies.length > 0 && (
                <p className="text-xs text-amber-700">Chưa hỗ trợ lưu dị ứng cho chuyến đi. Bỏ chọn để tiếp tục.</p>
              )}

              {/* 4. Budget Range */}
              <div className="space-y-1.5 pt-1">
                <BudgetRangeField
                  label="NGÂN SÁCH TỔNG DỰ KIẾN (VNĐ)"
                  value={form.budget}
                  onChange={form.setBudget}
                  travelerCount={form.people}
                />
                <p className="text-[11px] text-[#4B5875] mt-1">
                  Mức tối đa là ngân sách dự kiến cho cả nhóm. Lịch trình hiện dự kiến di chuyển bằng ô tô.
                </p>
                {form.budget.min !== form.budget.max && (
                  <p className="text-xs text-amber-700">Hiện chỉ lưu được một mức ngân sách tổng. Đặt tối thiểu bằng tối đa để tiếp tục.</p>
                )}
              </div>

              {/* 5. Integrated Prompt & Image Composer (CTUI-01) */}
              <CreateTripComposer
                notes={form.notes}
                onNotesChange={form.setNotes}
                attachments={form.attachments}
                onAddFiles={form.addImageFiles}
                onRemoveImage={form.removeImage}
                onRetryImage={form.retryImageUpload}
                onPreviewImage={handleOpenPreview}
                disabled={form.isSubmitting || Boolean(form.created)}
              />

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#0E1D4F]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[#4B5875]">
                  Chỉ gọi gửi thông tin khi bạn nhấn xác nhận nút bên dưới.
                </p>
                <button
                  type="button"
                  onClick={() => void form.submit()}
                  disabled={form.catalogLoading || Boolean(form.catalogError) || !form.destination || form.isSubmitting}
                  className="w-full sm:w-auto min-h-12 rounded-xl bg-[#205BD6] hover:bg-[#0739A8] px-8 py-3.5 font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]"
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
                <p className="text-emerald-800 flex items-center gap-2">
                  <span className="size-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                  <span>Đang tự động chuyển hướng tới bàn làm việc lịch trình…</span>
                </p>
                {form.created.generationError && (
                  <p className="text-amber-800">
                    Chưa sinh được chi tiết chặng: {typeof form.created.generationError === 'string' ? form.created.generationError : JSON.stringify(form.created.generationError)}
                  </p>
                )}
              </div>
            )}
          </form>

          <aside className="lg:col-span-5 space-y-6">
            <TravelDnaPanel
              metrics={form.travelDna}
              status={form.dnaStatus}
              error={form.dnaError}
              onChange={form.changeTravelDnaMetric}
              onReset={form.resetTravelDna}
            />
          </aside>
        </div>
      )}

      {/* Full Photo Preview Modal with object-contain (CTUI-01 / CTUI-03) */}
      {form.previewAttachment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-preview-title"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={handleClosePreview}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#0E1D4F]/10 shrink-0">
              <h3 id="modal-preview-title" className="font-bold text-sm text-[#0E1D4F] truncate pr-4">
                {form.previewAttachment.name}
              </h3>
              <button
                ref={modalCloseBtnRef}
                type="button"
                onClick={handleClosePreview}
                className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-slate-100 flex items-center justify-center text-[#4B5875] hover:text-[#0E1D4F] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]"
                aria-label="Đóng xem ảnh"
                title="Đóng xem ảnh (Esc)"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>
            <div className="relative w-full h-[60vh] max-h-[700px] bg-slate-950 flex items-center justify-center p-2">
              <Image
                src={form.previewAttachment.previewUrl}
                alt={form.previewAttachment.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
      <Toast message={form.toastMessage} onClose={form.clearToast} variant="error" />
    </div>
  );
}

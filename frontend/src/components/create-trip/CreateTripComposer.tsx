'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import type { LocalImageAttachment } from './types';

interface CreateTripComposerProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  attachments: LocalImageAttachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveImage: (id: string) => void;
  onRetryImage: (id: string) => void;
  onPreviewImage: (attachment: LocalImageAttachment, triggerElement?: HTMLElement) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export default function CreateTripComposer({
  notes,
  onNotesChange,
  attachments,
  onAddFiles,
  onRemoveImage,
  onRetryImage,
  onPreviewImage,
  onSubmit,
  disabled = false,
}: CreateTripComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      // Reset input value so selecting the same file again triggers change
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const imageFiles = Array.from(e.clipboardData.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        e.preventDefault();
        onAddFiles(imageFiles);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits the trip; Shift+Enter keeps the normal multiline behavior.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) onSubmit?.();
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-[#0E1D4F]/10 scroll-mt-24">
      <div className="flex items-center justify-between">
        <label htmlFor="create-notes" className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F]">
          Ý TƯỞNG, MONG MUỐN &amp; ĐÍNH KÈM ẢNH CẢM HỨNG
        </label>
      </div>

      <div className="rounded-2xl border border-[#0E1D4F]/15 bg-white p-3.5 sm:p-4.5 shadow-xs focus-within:border-[#205BD6] focus-within:ring-2 focus-within:ring-[#205BD6]/15 transition-all space-y-3">
        {/* Attachment Thumbnail Strip */}
        {attachments.length > 0 && (
          <div className="space-y-1.5 pb-2.5 border-b border-[#0E1D4F]/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0E1D4F]">
                Ảnh đính kèm ({attachments.length}):
              </span>
              <span className="text-[10px] text-[#4B5875]">
                Nhấp ảnh để phóng to · tối đa 3 ảnh
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group relative size-18 sm:size-20 rounded-xl overflow-hidden border border-[#0E1D4F]/15 bg-slate-100 shadow-2xs shrink-0"
                >
                  <Image
                    src={att.previewUrl}
                    alt={att.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
                  {att.uploadStatus === 'uploading' && (
                    <span role="status" className="absolute inset-x-0 bottom-0 z-10 bg-black/70 px-1 py-1 text-center text-[9px] font-semibold text-white">Đang tải…</span>
                  )}
                  
                  {(att.uploadStatus === 'failed' || att.analysisError) && (
                    <div role="alert" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-0.5 bg-rose-950/85 px-1 text-center text-[9px] font-semibold text-white">
                      <span>{att.analysisError ? 'Ảnh bị từ chối' : 'Lỗi tải ảnh'}</span>
                      <span className="max-h-7 overflow-hidden leading-tight" title={att.analysisError || att.uploadError}>{att.analysisError || att.uploadError}</span>
                      <button type="button" disabled={disabled} onClick={() => onRetryImage(att.id)} className="min-h-11 rounded px-2 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-white" aria-label={`Thử lại ảnh ${att.name}`}>Thử lại</button>
                    </div>
                  )}

                  {/* Trigger button for full preview */}
                  <button
                    type="button"
                    onClick={(e) => onPreviewImage(att, e.currentTarget)}
                    className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6] z-1"
                    aria-label={`Xem ảnh lớn: ${att.name}`}
                    title="Nhấp để xem ảnh đầy đủ"
                  />

                  {/* Delete button positioned top-right with z-10 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(att.id);
                    }}
                    className="absolute top-1 right-1 z-10 size-7 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={`Xóa ảnh ${att.name}`}
                    title={`Xóa ảnh ${att.name}`}
                  >
                    <Icon name="close" className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-line Composer Textarea */}
        <textarea
          id="create-notes"
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Ví dụ: Thích quán cà phê view đồi thông, muốn ăn thử bánh ướt lòng gà, ưu tiên chụp ảnh lúc hoàng hôn... Bạn cũng có thể dán (Paste) ảnh trực tiếp vào đây."
          className="w-full bg-transparent p-0 text-sm text-[#0E1D4F] placeholder:text-[#4B5875]/70 focus:outline-none resize-y min-h-[72px]"
          disabled={disabled}
        />

        {/* Toolbar & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#0E1D4F]/10">
          {/* Hidden File Picker */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            multiple
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            disabled={disabled}
          />

          {/* Attach Button with WCAG >= 44x44px touch area */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-semibold text-[#205BD6] hover:bg-[#205BD6]/10 border border-[#205BD6]/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Đính kèm ảnh cảm hứng cho chuyến đi"
              title="Chọn ảnh từ thiết bị"
            >
              <Icon name="add_photo_alternate" className="size-4 shrink-0" />
              <span>Đính kèm ảnh</span>
            </button>
            <span className="hidden sm:inline text-[11px] text-[#4B5875]">
              Hỗ trợ JPG/JPEG, PNG · tối đa 5 MB mỗi ảnh · dán ảnh trực tiếp
            </span>
          </div>

          {attachments.length > 0 && (
            <span className="text-[11px] font-semibold text-[#205BD6] bg-[#205BD6]/10 px-2.5 py-1 rounded-lg">
              {attachments.length} ảnh đã chọn
            </span>
          )}
        </div>
      </div>

      </div>
  );
}

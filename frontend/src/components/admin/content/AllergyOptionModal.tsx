'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import { AllergyOption } from '@/types/content';

interface AllergyOptionModalProps {
  isOpen: boolean;
  editingAllergy: AllergyOption | null;
  existingAllergies: AllergyOption[];
  onClose: () => void;
  onSaveSingle: (allergy: { id?: string; label: string; active?: boolean }) => Promise<void>;
  onSaveBulk: (items: string[]) => Promise<{
    succeeded: string[];
    failed: { label: string; error: string }[];
  }>;
}

export type AllergyInputMode = 'single' | 'bulk';

interface BulkParsedItem {
  id: string;
  original: string;
  cleaned: string;
  status: 'valid' | 'duplicate_in_input' | 'duplicate_in_cms' | 'empty';
  errorMessage?: string;
}

export default function AllergyOptionModal(props: AllergyOptionModalProps) {
  if (!props.isOpen || !props.editingAllergy) return null;
  return <AllergyOptionModalInner {...props} editingAllergy={props.editingAllergy} />;
}

function AllergyOptionModalInner({
  editingAllergy,
  existingAllergies,
  onClose,
  onSaveSingle,
  onSaveBulk,
}: Omit<AllergyOptionModalProps, 'isOpen'> & { editingAllergy: AllergyOption }) {
  const isExisting = useMemo(() => {
    return existingAllergies.some((a) => a.id === editingAllergy.id);
  }, [editingAllergy, existingAllergies]);

  const [mode, setMode] = useState<AllergyInputMode>('single');
  const [singleLabel, setSingleLabel] = useState(() => editingAllergy.label || '');
  const [singleActive, setSingleActive] = useState(() => editingAllergy.active ?? true);
  const [bulkText, setBulkText] = useState('');

  // Bulk editable parsed items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  // Progress and state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [failedItems, setFailedItems] = useState<{ label: string; error: string }[]>([]);

  // Mode switch without losing entered data
  const handleSwitchMode = (nextMode: AllergyInputMode) => {
    if (nextMode === mode) return;
    if (nextMode === 'bulk' && singleLabel.trim() && !bulkText.trim()) {
      setBulkText(singleLabel.trim());
    } else if (nextMode === 'single' && !singleLabel.trim() && bulkText.trim()) {
      const firstLine = bulkText.split('\n').map((s) => s.trim()).filter(Boolean)[0];
      if (firstLine) {
        setSingleLabel(firstLine);
      }
    }
    setMode(nextMode);
    setSaveError(null);
  };

  // Derive bulk items directly without useEffect
  const bulkItems = useMemo<BulkParsedItem[]>(() => {
    const lines = bulkText.split('\n');
    const seenInInput = new Set<string>();
    const existingCmsLabels = new Set(
      existingAllergies.map((a) => a.label.trim().toLowerCase())
    );

    return lines.map((line, idx) => {
      const cleaned = line.trim().replace(/\s+/g, ' ');
      if (!cleaned) {
        return {
          id: `line-${idx}`,
          original: line,
          cleaned: '',
          status: 'empty',
        };
      }

      const lower = cleaned.toLowerCase();
      if (seenInInput.has(lower)) {
        return {
          id: `line-${idx}`,
          original: line,
          cleaned,
          status: 'duplicate_in_input',
          errorMessage: 'Trùng lặp trong danh sách nhập',
        };
      }
      seenInInput.add(lower);

      if (existingCmsLabels.has(lower)) {
        return {
          id: `line-${idx}`,
          original: line,
          cleaned,
          status: 'duplicate_in_cms',
          errorMessage: 'Đã tồn tại trong danh mục CMS',
        };
      }

      return {
        id: `line-${idx}`,
        original: line,
        cleaned,
        status: 'valid',
      };
    });
  }, [bulkText, existingAllergies]);

  // Single item validation
  const singleNormalized = useMemo(
    () => singleLabel.trim().replace(/\s+/g, ' '),
    [singleLabel]
  );

  const singleValidationError = useMemo(() => {
    if (!singleNormalized) return 'Vui lòng nhập tên mục dị ứng.';
    const duplicate = existingAllergies.find(
      (a) =>
        a.label.trim().toLowerCase() === singleNormalized.toLowerCase() &&
        (!isExisting || a.id !== editingAllergy.id)
    );
    if (duplicate) {
      return `Mục "${duplicate.label}" đã tồn tại trong danh mục CMS.`;
    }
    return null;
  }, [singleNormalized, existingAllergies, isExisting, editingAllergy]);

  // Bulk stats
  const validBulkItems = useMemo(
    () => bulkItems.filter((i) => i.status === 'valid'),
    [bulkItems]
  );
  const duplicateBulkCount = useMemo(
    () =>
      bulkItems.filter(
        (i) => i.status === 'duplicate_in_input' || i.status === 'duplicate_in_cms'
      ).length,
    [bulkItems]
  );

  // Remove a line from bulkText
  const handleRemoveBulkItem = (idToRemove: string) => {
    const item = bulkItems.find((b) => b.id === idToRemove);
    if (!item) return;
    const lines = bulkText.split('\n');
    const index = bulkItems.findIndex((b) => b.id === idToRemove);
    if (index >= 0 && index < lines.length) {
      lines.splice(index, 1);
      setBulkText(lines.join('\n'));
    }
  };

  // Edit item inline
  const handleStartEditItem = (item: BulkParsedItem) => {
    setEditingItemId(item.id);
    setEditingItemText(item.cleaned);
  };

  const handleSaveEditItem = (id: string) => {
    const index = bulkItems.findIndex((b) => b.id === id);
    if (index >= 0) {
      const lines = bulkText.split('\n');
      lines[index] = editingItemText.trim();
      setBulkText(lines.join('\n'));
    }
    setEditingItemId(null);
  };

  // Submit single
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (singleValidationError || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSaveError(null);
      await onSaveSingle({
        id: editingAllergy.id,
        label: singleNormalized,
        active: singleActive,
      });
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Không thể lưu mục dị ứng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit bulk
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validBulkItems.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSaveError(null);
      setFailedItems([]);
      setSubmitProgress(`Đang lưu 0/${validBulkItems.length} mục...`);

      const itemsToSave = validBulkItems.map((b) => b.cleaned);
      const result = await onSaveBulk(itemsToSave);

      if (result.failed.length === 0) {
        // All succeeded
        onClose();
      } else {
        // Partial or total failure
        setFailedItems(result.failed);
        // Keep failed items in bulkText so user can retry
        setBulkText(result.failed.map((f) => f.label).join('\n'));
        setSaveError(
          `Đã lưu thành công ${result.succeeded.length}/${itemsToSave.length} mục. Còn ${result.failed.length} mục gặp lỗi khi gửi máy chủ.`
        );
      }
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu danh sách mục dị ứng.'
      );
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="allergy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1D4F]/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-warm-surface max-w-xl w-full rounded-3xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="p-5 bg-warm-paper border-b border-[#0E1D4F]/10 flex items-center justify-between">
          <div>
            <h3 id="allergy-modal-title" className="font-bold text-base text-[#0E1D4F]">
              {isExisting
                ? `Cập nhật mục: ${editingAllergy.label}`
                : 'Thêm mục Dị ứng & Ăn kiêng'}
            </h3>
            <p className="text-xs text-[#4B5875] mt-0.5">
              Admin CMS • Thao tác lưu trực tiếp vào danh mục quản trị
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="size-11 shrink-0 rounded-full hover:bg-warm-paper flex items-center justify-center text-[#4B5875] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Mode Selector (Only when creating new item, or allow view toggle) */}
        {!isExisting && (
          <div className="px-6 pt-4 pb-2 border-b border-[#0E1D4F]/10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#4B5875] mr-2">Phương thức:</span>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSwitchMode('single')}
              className={`min-h-11 px-3 py-2 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6] ${
                mode === 'single'
                  ? 'bg-[#205BD6] text-white shadow-xs'
                  : 'bg-warm-paper text-[#4B5875] hover:bg-warm-paper'
              }`}
            >
              Thêm một mục
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSwitchMode('bulk')}
              className={`min-h-11 px-3 py-2 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6] ${
                mode === 'bulk'
                  ? 'bg-[#205BD6] text-white shadow-xs'
                  : 'bg-warm-paper text-[#4B5875] hover:bg-warm-paper'
              }`}
            >
              Nhập nhiều mục (Bulk)
            </button>
          </div>
        )}

        {/* Error / Alert banner */}
        {saveError && (
          <div
            role="alert"
            className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2"
          >
            <Icon name="error" size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{saveError}</p>
              {failedItems.length > 0 && (
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] text-red-600">
                  {failedItems.map((f, i) => (
                    <li key={i}>
                      <strong>{f.label}:</strong> {f.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="min-h-0 p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {mode === 'single' ? (
            /* SINGLE MODE */
            <form id="single-allergy-form" onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="allergy-label-input"
                  className="block font-semibold text-[#4B5875] mb-1"
                >
                  Tên mục kiêng cử / dị ứng <span className="text-red-500">*</span>
                </label>
                <input
                  id="allergy-label-input"
                  type="text"
                  value={singleLabel}
                  onChange={(e) => {
                    setSingleLabel(e.target.value);
                    setSaveError(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-[#0E1D4F] ${
                    singleValidationError && singleLabel.trim()
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-[#0E1D4F]/10 focus:border-[#205BD6]'
                  }`}
                  placeholder="Ví dụ: Hải sản & Tôm cua"
                  autoFocus
                />
                {singleValidationError && singleLabel.trim() ? (
                  <p className="text-[11px] text-red-600 mt-1 font-medium flex items-center gap-1">
                    <Icon name="info" size={12} />
                    {singleValidationError}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#4B5875] mt-1">
                    Khoảng trắng thừa sẽ được tự động chuẩn hóa khi lưu.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="single-active-toggle"
                  checked={singleActive}
                  onChange={(e) => setSingleActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[#0E1D4F]/10 text-[#205BD6] focus:ring-[#205BD6]"
                />
                <label
                  htmlFor="single-active-toggle"
                  className="text-xs font-semibold text-[#4B5875] cursor-pointer"
                >
                  Kích hoạt ngay trong danh mục
                </label>
              </div>

            </form>
          ) : (
            /* BULK MODE */
            <form id="bulk-allergy-form" onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="bulk-allergy-textarea"
                    className="block font-semibold text-[#4B5875]"
                  >
                    Danh sách mục dị ứng (Mỗi dòng một mục)
                  </label>
                  <span className="text-[11px] text-[#4B5875] font-medium">
                    {validBulkItems.length} mục hợp lệ
                  </span>
                </div>
                <textarea
                  id="bulk-allergy-textarea"
                  rows={5}
                  value={bulkText}
                  onChange={(e) => {
                    setBulkText(e.target.value);
                    setSaveError(null);
                  }}
                  placeholder={
                    'Hải sản & Giáp xác\nĐậu phộng & Hạt cây\nSữa & Sản phẩm từ sữa\nĂn chay thuần (Vegan)'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#0E1D4F]/10 text-[#0E1D4F] font-mono text-xs focus:border-[#205BD6]"
                />
                <p className="text-[11px] text-[#4B5875] mt-1">
                  Mỗi dòng sẽ trở thành một mục riêng. Các dòng trống, khoảng trắng thừa hoặc
                  mục trùng lặp sẽ được tự động lọc.
                </p>
              </div>

              {/* Live Preview List */}
              {bulkItems.some((b) => b.status !== 'empty') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0E1D4F]">
                      Bản xem trước dữ liệu nhập ({bulkItems.filter((b) => b.status !== 'empty').length})
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      {duplicateBulkCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                          {duplicateBulkCount} trùng
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        {validBulkItems.length} sẵn sàng
                      </span>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-[#0E1D4F]/10 bg-warm-paper divide-y divide-[#0E1D4F]/10">
                    {bulkItems
                      .filter((b) => b.status !== 'empty')
                      .map((item) => (
                        <div
                          key={item.id}
                          className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {item.status === 'valid' ? (
                              <span
                                className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                                title="Hợp lệ"
                              />
                            ) : (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                                title={item.errorMessage}
                              />
                            )}

                            {editingItemId === item.id ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input
                                  type="text"
                                  value={editingItemText}
                                  onChange={(e) => setEditingItemText(e.target.value)}
                                  className="px-2 py-0.5 text-xs rounded border border-[#0E1D4F]/10 w-full"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditItem(item.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Lưu"
                                >
                                  <Icon name="check" size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="truncate flex-1">
                                <span
                                  className={`font-semibold ${
                                    item.status === 'valid'
                                      ? 'text-[#0E1D4F]'
                                      : 'text-[#4B5875] line-through'
                                  }`}
                                >
                                  {item.cleaned}
                                </span>
                                {item.errorMessage && (
                                  <span className="ml-2 text-[10px] text-amber-600 font-normal">
                                    ({item.errorMessage})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {editingItemId !== item.id && (
                              <button
                                type="button"
                                onClick={() => handleStartEditItem(item)}
                                className="p-1 text-[#4B5875] hover:text-[#0E1D4F] rounded hover:bg-warm-paper"
                                title="Chỉnh sửa dòng này"
                              >
                                <Icon name="edit" size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveBulkItem(item.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Xóa khỏi danh sách"
                            >
                              <Icon name="close" size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                <p className="font-semibold flex items-center gap-1">
                  <Icon name="info" size={14} />
                  Quy trình gửi dữ liệu
                </p>
                <p className="mt-0.5">
                  Hệ thống sẽ thực hiện gọi API CMS tuần tự cho từng mục hợp lệ. Nếu có mục gặp sự
                  cố kết nối, các mục đã lưu thành công sẽ được giữ nguyên và cho phép thử lại
                  các mục chưa lưu mà không sinh bản ghi trùng.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-warm-paper border-t border-[#0E1D4F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-[#205BD6] font-semibold flex items-center gap-1">
            <Icon name="cloud_upload" size={14} />
            <span>
              {submitProgress
                ? submitProgress
                : mode === 'single'
                ? 'Lưu vào danh mục Admin CMS'
                : `Chuẩn bị lưu ${validBulkItems.length} mục`}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="min-h-11 px-4 py-2 rounded-xl border border-[#0E1D4F]/10 text-[#4B5875] font-semibold hover:bg-warm-paper disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]"
            >
              Hủy
            </button>

            {mode === 'single' ? (
              <button
                type="submit"
                form="single-allergy-form"
                disabled={isSubmitting || Boolean(singleValidationError)}
                className="min-h-11 px-4 py-2 rounded-xl bg-[#205BD6] text-white font-semibold hover:bg-[#1847a8] disabled:opacity-50 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6] focus-visible:ring-offset-2"
              >
                {isSubmitting
                  ? 'Đang lưu...'
                  : isExisting
                  ? 'Cập nhật mục'
                  : 'Lưu mục dị ứng'}
              </button>
            ) : (
              <button
                type="submit"
                form="bulk-allergy-form"
                disabled={isSubmitting || validBulkItems.length === 0}
                className="min-h-11 px-4 py-2 rounded-xl bg-[#205BD6] text-white font-semibold hover:bg-[#1847a8] disabled:opacity-50 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6] focus-visible:ring-offset-2"
              >
                {isSubmitting
                  ? 'Đang lưu hàng loạt...'
                  : `Xác nhận lưu ${validBulkItems.length} mục`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

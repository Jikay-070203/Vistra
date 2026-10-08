'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';
import { useUserAuth } from '@/lib/userAuth';
import Link from 'next/link';

const useIdentityEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function FeedbackLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const { addTicket } = useFeedback();
  const { user, isLoggedIn } = useUserAuth();
  const identity = isLoggedIn ? user?.id ?? 'guest' : 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const submissionGeneration = useRef(0);
  const [previousIdentity, setPreviousIdentity] = useState(identity);
  if (previousIdentity !== identity) {
    setPreviousIdentity(identity);
    setSubmittedTicketId(null);
    setSubmitError(null);
    setSubject('');
    setDescription('');
    setIsSubmitting(false);
  }

  // Hidden on landing page, auth routes, and admin pages
  const isExcluded =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin') ||
    pathname.includes('login') ||
    pathname.includes('register');

  const handleResetAndClose = () => {
    submissionGeneration.current += 1;
    setIsSubmitting(false);
    setIsOpen(false);
    setSubmittedTicketId(null);
    setSubmitError(null);
    setSubject('');
    setDescription('');
    toggleBtnRef.current?.focus();
  };

  useIdentityEffect(() => () => { submissionGeneration.current += 1; }, [identity]);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isExcluded) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || isSubmitting) return;
    const generation = ++submissionGeneration.current;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      // Creation only subject/description/route; do not claim unsupported category/severity
      const newTicket = await addTicket({
        subject: subject.trim(),
        description: description.trim(),
        routeOrigin: pathname || '/',
      });

      if (submissionGeneration.current === generation) setSubmittedTicketId(newTicket.id);
    } catch (err: unknown) {
      // Mutation failure visible; form text retained
      if (submissionGeneration.current === generation) setSubmitError(
        err instanceof Error ? err.message : 'Không thể gửi phản hồi. Vui lòng thử lại sau.'
      );
    } finally {
      if (submissionGeneration.current === generation) setIsSubmitting(false);
    }
  };

  const handleGoToProfile = () => {
    handleResetAndClose();
    router.push('/profile?tab=feedback');
  };

  return (
    <>
      {/* Floating Trigger Button:
          Compact icon circle by default; expands label on hover or keyboard focus;
          contextually positioned so it never overlaps chat composer on /planner or comparison bar on /destinations */}
      <div
        className={`fixed z-40 print:hidden transition-all duration-200 ${
          pathname === '/planner'
            ? 'bottom-24 right-4 sm:bottom-6 sm:right-6'
            : pathname === '/destinations'
            ? 'bottom-20 right-4 sm:bottom-6 sm:right-6'
            : 'bottom-6 right-4 sm:right-6'
        }`}
      >
        <button
          ref={toggleBtnRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center justify-center h-12 w-12 hover:w-auto focus-visible:w-auto p-3 bg-[#0E1D4F] hover:bg-[#205BD6] focus-visible:bg-[#205BD6] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/20 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#205BD6]"
          aria-label="Phản hồi & Báo lỗi"
          title="Phản hồi & Báo lỗi"
        >
          <Icon name="feedback" className="size-5 text-white shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2.5 group-focus-visible:max-w-xs group-focus-visible:opacity-100 group-focus-visible:ml-2.5 text-xs font-semibold tracking-wide transition-all duration-300">
            Phản hồi & Báo lỗi
          </span>
        </button>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleResetAndClose();
          }}
        >
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <div>
                <span className="font-label-caps text-[11px] uppercase tracking-wider text-[#205BD6] font-bold block">
                  ĐÓNG GÓP Ý KIẾN TRẢI NGHIỆM
                </span>
                <h3 className="font-headline-md text-lg text-[#0E1D4F] font-bold">
                  {submittedTicketId ? 'Gửi phản hồi thành công' : 'Gửi phản hồi & Báo lỗi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] transition-colors border border-[#0E1D4F]/10 cursor-pointer"
                aria-label="Đóng hộp thoại"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              {!isLoggedIn ? (
                <div className="text-center text-sm text-[#4B5875] py-6">
                  <p>Đăng nhập để gửi phản hồi và theo dõi câu trả lời.</p>
                  <Link href="/login" className="inline-block mt-3 px-4 py-3 text-[#205BD6] font-semibold underline">Đăng nhập</Link>
                </div>
              ) : submittedTicketId ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#08B3C6]/15 text-[#08B3C6] flex items-center justify-center mx-auto">
                    <Icon name="check_circle" className="size-8" />
                  </div>
                  <h4 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
                    Cảm ơn bạn đã đóng góp cho VISTRA!
                  </h4>
                  <p className="text-sm text-[#4B5875] max-w-sm mx-auto leading-relaxed">
                    Hồ sơ phản hồi của bạn đã được ghi nhận với mã{' '}
                    <strong className="text-[#205BD6] font-mono">{submittedTicketId}</strong>.
                    Đội ngũ VISTRA sẽ tiếp nhận, phân loại và phản hồi sớm nhất.
                  </p>

                  <div className="p-4 rounded-xl bg-[#EBF1F0] text-xs text-left space-y-1.5 border border-[#0E1D4F]/10 max-w-sm mx-auto">
                    <div className="flex justify-between">
                      <span className="text-[#4B5875]">Mã hồ sơ:</span>
                      <span className="font-mono font-bold text-[#0E1D4F]">{submittedTicketId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4B5875]">Tiêu đề:</span>
                      <span className="font-medium text-[#0E1D4F] truncate max-w-[200px]">{subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4B5875]">Trang phát sinh:</span>
                      <span className="font-mono text-[#0E1D4F] truncate max-w-[200px]">{pathname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4B5875]">Trạng thái:</span>
                      <span className="font-semibold text-amber-700">Chờ phân loại (unassigned)</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleGoToProfile}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#205BD6] text-white font-semibold text-xs hover:bg-[#1847a8] transition-colors cursor-pointer shadow-xs"
                    >
                      Xem trong Hồ sơ của tôi
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAndClose}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F] font-semibold text-xs hover:bg-[#EBF1F0] transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-xs text-[#4B5875] flex items-center gap-1.5 bg-[#EBF1F0] p-2.5 rounded-xl border border-[#0E1D4F]/10">
                    <Icon name="info" className="size-4 text-[#205BD6] shrink-0" />
                    <span>Trang ghi nhận tự động: <code className="font-mono text-[#0E1D4F] font-bold">{pathname}</code></span>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2" role="alert">
                      <Icon name="error" className="size-4 shrink-0 text-red-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Subject Input */}
                  <div>
                    <label htmlFor="feedback-subject-input" className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                      Tiêu đề vấn đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="feedback-subject-input"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="VD: Không đổi được thứ tự các điểm dừng tại Ngày 2..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] focus:ring-1 focus:ring-[#205BD6] text-[#0E1D4F]"
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <label htmlFor="feedback-description-input" className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                      Nội dung chi tiết <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="feedback-description-input"
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả cụ thể hành vi bất thường hoặc đề xuất mong muốn..."
                      className="w-full text-xs p-3.5 rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] focus:ring-1 focus:ring-[#205BD6] text-[#0E1D4F] resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#0E1D4F]/10">
                    <button
                      type="button"
                      onClick={handleResetAndClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5875] hover:text-[#0E1D4F] hover:bg-[#EBF1F0] transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !subject.trim() || !description.trim()}
                      className="px-5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Icon
                        name={isSubmitting ? 'sync' : 'send'}
                        className={`size-3.5 ${isSubmitting ? 'animate-spin' : ''}`}
                      />
                      <span>{isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

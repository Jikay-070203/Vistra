'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';
import { FeedbackCategory, TicketSeverity } from '@/types/feedback';

export default function FeedbackLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const { addTicket } = useFeedback();

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('Vấn đề giao diện (UX)');
  const [severity, setSeverity] = useState<TicketSeverity>('Trung bình');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [userName, setUserName] = useState('Du khách VISTRA');
  const [userEmail, setUserEmail] = useState('traveler@vistra.vn');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // Hidden on landing page, auth routes, and admin pages
  const isExcluded =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin') ||
    pathname.includes('login') ||
    pathname.includes('register');

  if (isExcluded) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const newTicket = addTicket({
      subject: subject.trim(),
      description: description.trim(),
      userName: userName.trim() || 'Du khách VISTRA',
      userEmail: userEmail.trim() || 'traveler@vistra.vn',
      routeOrigin: pathname,
      category,
      severity,
    });

    setSubmittedTicketId(newTicket.id);
  };

  const handleResetAndClose = () => {
    setIsOpen(false);
    setSubmittedTicketId(null);
    setSubject('');
    setDescription('');
  };

  const handleGoToProfile = () => {
    handleResetAndClose();
    router.push('/profile?tab=feedback');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#0E1D4F] hover:bg-[#205BD6] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border border-white/20 active:scale-95"
          aria-label="Mở hộp thoại đóng góp ý kiến & phản hồi"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Icon name="rate_review" className="size-4 text-white" />
          </div>
          <span className="text-xs font-semibold tracking-wide pr-1">Phản hồi & Báo lỗi</span>
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
              {submittedTicketId ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#08B3C6]/15 text-[#08B3C6] flex items-center justify-center mx-auto">
                    <Icon name="check_circle" className="size-8" />
                  </div>
                  <h4 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
                    Cảm ơn bạn đã đóng góp cho VISTRA!
                  </h4>
                  <p className="text-sm text-[#4B5875] max-w-sm mx-auto leading-relaxed">
                    Hồ sơ phản hồi của bạn đã được ghi nhận với mã{' '}
                    <strong className="text-[#205BD6] font-mono">{submittedTicketId}</strong>. Đội ngũ vận hành sẽ kiểm tra và phản hồi sớm nhất.
                  </p>

                  <div className="p-4 rounded-xl bg-[#EBF1F0] text-xs text-left space-y-1.5 border border-[#0E1D4F]/10 max-w-sm mx-auto">
                    <div className="flex justify-between">
                      <span className="text-[#4B5875]">Mã hồ sơ:</span>
                      <span className="font-mono font-bold text-[#0E1D4F]">{submittedTicketId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4B5875]">Trang phát sinh:</span>
                      <span className="font-mono text-[#0E1D4F] truncate max-w-[200px]">{pathname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4B5875]">Danh mục:</span>
                      <span className="font-medium text-[#0E1D4F]">{category}</span>
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

                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                      Danh mục phản hồi <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          'Vấn đề giao diện (UX)',
                          'Lỗi logic hành trình',
                          'Chức năng chưa hoạt động',
                          'Đề xuất cải tiến',
                        ] as FeedbackCategory[]
                      ).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`text-left text-xs p-2.5 rounded-xl border transition-all cursor-pointer ${
                            category === cat
                              ? 'bg-[#205BD6]/10 border-[#205BD6] text-[#205BD6] font-bold'
                              : 'bg-white border-[#0E1D4F]/15 text-[#4B5875] hover:bg-[#EBF1F0]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                      Mức độ ưu tiên / ảnh hưởng
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng'] as TicketSeverity[]).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSeverity(sev)}
                          className={`text-center text-xs py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                            severity === sev
                              ? 'bg-[#0E1D4F] text-white border-[#0E1D4F] font-bold'
                              : 'bg-white border-[#0E1D4F]/15 text-[#4B5875] hover:bg-[#EBF1F0]'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                      Tiêu đề vấn đề <span className="text-red-500">*</span>
                    </label>
                    <input
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
                    <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                      Nội dung chi tiết <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả cụ thể hành vi bất thường hoặc đề xuất mong muốn..."
                      className="w-full text-xs p-3.5 rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] focus:ring-1 focus:ring-[#205BD6] text-[#0E1D4F] resize-none"
                    />
                  </div>

                  {/* Optional User Info */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-[#4B5875] mb-1">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] text-[#0E1D4F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#4B5875] mb-1">
                        Email liên hệ
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] text-[#0E1D4F]"
                      />
                    </div>
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
                      disabled={!subject.trim() || !description.trim()}
                      className="px-5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Icon name="send" className="size-3.5" />
                      <span>Gửi phản hồi</span>
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

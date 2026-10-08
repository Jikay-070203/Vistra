'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';
import { FeedbackTicket } from '@/types/feedback';
import { useUserAuth } from '@/lib/userAuth';

const useIdentityEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ProfileFeedbackTab() {
  const { user } = useUserAuth();
  const identity = user?.id ?? null;
  const { tickets, loading, error, page, pageSize, total, totalPages, rateStaffAnswer, loadTickets } =
    useFeedback();
  const [requestedPage, setRequestedPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ratingInput, setRatingInput] = useState<{ [ticketId: string]: number }>({});
  const [commentInput, setCommentInput] = useState<{ [ticketId: string]: string }>({});
  const [ratedSuccessId, setRatedSuccessId] = useState<string | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const ratingGeneration = useRef(0);
  const [previousIdentity, setPreviousIdentity] = useState(identity);
  if (previousIdentity !== identity) {
    setPreviousIdentity(identity);
    setRequestedPage(1);
    setSelectedTicketId(null);
    setRatingInput({});
    setCommentInput({});
    setRatedSuccessId(null);
    setRateError(null);
    setIsSubmittingRating(false);
  }
  useIdentityEffect(() => () => { ratingGeneration.current += 1; }, [identity]);

  const REQUESTED_PAGE_SIZE = 10;
  // Consume server page and pageSize metadata; handle clamped responses gracefully
  const activePage = page > 0 ? page : requestedPage;
  const effectivePageSize = pageSize > 0 ? pageSize : REQUESTED_PAGE_SIZE;

  useEffect(() => {
    loadTickets({ page: requestedPage, pageSize: REQUESTED_PAGE_SIZE, isAdmin: false }).catch(() => {});
  }, [requestedPage, loadTickets]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, Math.max(1, totalPages)));
    setRequestedPage(clamped);
  };

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return tickets[0] || null;
    return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  const handleRateSubmit = async (ticketId: string) => {
    if (isSubmittingRating) return;
    const generation = ++ratingGeneration.current;
    const star = ratingInput[ticketId] || 5;
    const comment = commentInput[ticketId] || '';
    try {
      setIsSubmittingRating(true);
      setRateError(null);
      await rateStaffAnswer(ticketId, star, comment);
      if (ratingGeneration.current !== generation) return;
      setRatedSuccessId(ticketId);
      setTimeout(() => {
        if (ratingGeneration.current === generation) setRatedSuccessId(null);
      }, 3000);
    } catch (err: unknown) {
      if (ratingGeneration.current === generation) setRateError(err instanceof Error ? err.message : 'Không thể gửi đánh giá.');
    } finally {
      if (ratingGeneration.current === generation) setIsSubmittingRating(false);
    }
  };

  const getStatusBadge = (status: FeedbackTicket['status']) => {
    switch (status) {
      case 'unassigned':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            Chờ phân loại
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#205BD6] border border-blue-200">
            Đang xử lý
          </span>
        );
      case 'answered':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã có phản hồi
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Đã hoàn tất
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
            Đã đóng
          </span>
        );
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity?: FeedbackTicket['severity']) => {
    switch (severity) {
      case 'critical':
      case 'Nghiêm trọng':
        return (
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
            Nghiêm trọng
          </span>
        );
      case 'high':
      case 'Cao':
        return (
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
            Cao
          </span>
        );
      case 'medium':
      case 'Trung bình':
        return (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            Trung bình
          </span>
        );
      case 'low':
      case 'Thấp':
        return (
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
            Thấp
          </span>
        );
      default:
        // Unknown or null severity must show unclassified or omit, NOT Thấp!
        return null;
    }
  };

  const getCategoryLabel = (category?: FeedbackTicket['category']) => {
    switch (category) {
      case 'ux_issue':
      case 'Vấn đề giao diện (UX)':
        return 'Vấn đề giao diện (UX)';
      case 'logic_issue':
      case 'Lỗi logic hành trình':
        return 'Lỗi logic hành trình';
      case 'function_issue':
      case 'Chức năng chưa hoạt động':
        return 'Chức năng chưa hoạt động';
      case 'improvement_suggestion':
      case 'Đề xuất cải tiến':
        return 'Đề xuất cải tiến';
      default:
        return category || '';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#0E1D4F]/10 mb-6">
        <div>
          <h2 className="font-headline-sm text-xl text-[#0E1D4F] font-bold">
            Hồ sơ Phản hồi &amp; Đóng góp Trải nghiệm
          </h2>
          <p className="text-xs text-[#4B5875] mt-1">
            Theo dõi tiến độ giải quyết các thắc mắc, báo lỗi giao diện và đánh giá câu trả lời từ đội ngũ kỹ sư VISTRA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-[#205BD6]/10 text-[#205BD6] text-xs font-bold border border-[#205BD6]/20">
            {loading ? 'Đang tải...' : error ? 'Không thể tải' : `${total} Phiếu phản hồi`}
          </span>
        </div>
      </div>

      {loading && tickets.length === 0 ? (
        <div className="text-center py-16 text-[#4B5875]" role="status" aria-live="polite">
          <Icon name="sync" className="size-8 mx-auto text-[#205BD6] animate-spin mb-3" />
          <p className="font-semibold text-sm text-[#0E1D4F]">Đang tải danh sách phản hồi...</p>
          <p className="text-xs text-[#4B5875] mt-1">Hệ thống đang kết nối với máy chủ để lấy dữ liệu mới nhất.</p>
        </div>
      ) : error ? (
        <div
          className="text-center py-12 px-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3"
          role="alert"
        >
          <Icon name="error" className="size-8 mx-auto text-red-600 mb-1" />
          <p className="font-semibold text-sm">{error}</p>
          <p className="text-xs text-red-600">Đã xảy ra lỗi khi tải danh sách phản hồi từ máy chủ.</p>
          <button
            type="button"
            onClick={() => loadTickets({ page: activePage, pageSize: effectivePageSize, isAdmin: false })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
            aria-label="Thử lại tải danh sách phản hồi"
          >
            <Icon name="refresh" className="size-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-[#4B5875]">
          <Icon name="feedback" className="size-12 mx-auto text-[#4B5875]/40 mb-3" />
          <p className="font-semibold text-sm">Bạn chưa gửi phản hồi nào</p>
          <p className="text-xs mt-1">Nhấp vào nút &quot;Phản hồi &amp; Báo lỗi&quot; ở góc phải màn hình để gửi ý kiến đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Ticket List (5 cols) */}
          <div className="lg:col-span-5 space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {tickets.map((ticket) => {
              const isSelected = ticket.id === selectedTicket?.id;
              const hasReplies = ticket.staffReplies && ticket.staffReplies.length > 0;

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTicketId(ticket.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Xem phản hồi ${ticket.id}: ${ticket.subject}`}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6] ${
                    isSelected
                      ? 'border-[#205BD6] bg-[#205BD6]/5 shadow-sm'
                      : 'border-[#0E1D4F]/10 bg-white hover:bg-[#EBF1F0]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-[#0E1D4F]">{ticket.id}</span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <h4 className="font-headline-xs text-sm font-bold text-[#0E1D4F] line-clamp-1">
                    {ticket.subject}
                  </h4>
                  <p className="text-xs text-[#4B5875] line-clamp-2 mt-1">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[#0E1D4F]/5 text-[11px] text-[#4B5875]">
                    <span>{ticket.createdAt}</span>
                    <div className="flex items-center gap-1.5">
                      {hasReplies && (
                        <span className="text-[#08B3C6] font-semibold flex items-center gap-0.5">
                          <Icon name="chat" className="size-3" />
                          <span>{ticket.staffReplies.length}</span>
                        </span>
                      )}
                      {ticket.userAnswerRating && (
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">
                          ★ {ticket.userAnswerRating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls using returned pageSize and server metadata */}
            {totalPages > 1 && (
              <div className="pt-3 border-t border-[#0E1D4F]/10 flex items-center justify-between text-xs text-[#4B5875]">
                <span>{total} phiếu</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activePage <= 1 || loading}
                    onClick={() => handlePageChange(activePage - 1)}
                    className="px-2.5 py-1 rounded-lg border border-[#0E1D4F]/15 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] font-semibold text-[#0E1D4F] cursor-pointer"
                    aria-label="Trang trước"
                  >
                    Trước
                  </button>
                  <span className="font-semibold text-[#0E1D4F]">
                    {activePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={activePage >= totalPages || loading}
                    onClick={() => handlePageChange(activePage + 1)}
                    className="px-2.5 py-1 rounded-lg border border-[#0E1D4F]/15 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] font-semibold text-[#0E1D4F] cursor-pointer"
                    aria-label="Trang sau"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Detail & Staff Replies (7 cols) */}
          {selectedTicket ? (
            <div className="lg:col-span-7 bg-[#EBF1F0]/30 rounded-2xl p-6 border border-[#0E1D4F]/10 space-y-6">
              {/* Detail Header */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#205BD6] bg-white px-2.5 py-1 rounded-lg border border-[#0E1D4F]/10">
                      {selectedTicket.id}
                    </span>
                    {selectedTicket.category && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#0E1D4F]/10 text-[#0E1D4F] font-medium">
                        {getCategoryLabel(selectedTicket.category)}
                      </span>
                    )}
                    {getSeverityBadge(selectedTicket.severity)}
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>

                <h3 className="font-headline-sm text-lg font-bold text-[#0E1D4F] mt-2">
                  {selectedTicket.subject}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#4B5875] mt-1">
                  <span>Gửi lúc: {selectedTicket.createdAt}</span>
                  {selectedTicket.routeOrigin && (
                    <>
                      <span>•</span>
                      <span>Tại trang: <code className="font-mono text-[#0E1D4F]">{selectedTicket.routeOrigin}</code></span>
                    </>
                  )}
                </div>
              </div>

              {/* User Original Message */}
              <div className="bg-white p-4 rounded-xl border border-[#0E1D4F]/10 text-xs leading-relaxed space-y-2">
                <div className="font-semibold text-[#0E1D4F] flex items-center gap-1.5">
                  <Icon name="person" className="size-4 text-[#205BD6]" />
                  <span>Nội dung phản ánh từ bạn:</span>
                </div>
                <p className="text-[#4B5875] whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Staff Replies Stream */}
              <div className="space-y-4">
                <h4 className="font-headline-xs text-xs uppercase font-bold text-[#0E1D4F] tracking-wider flex items-center gap-2">
                  <Icon name="forum" className="size-4 text-[#08B3C6]" />
                  <span>Phản hồi từ Đội ngũ Vận hành &amp; Kỹ thuật ({selectedTicket.staffReplies?.length || 0})</span>
                </h4>

                {(!selectedTicket.staffReplies || selectedTicket.staffReplies.length === 0) ? (
                  <div className="p-4 rounded-xl bg-white/60 border border-dashed border-[#0E1D4F]/15 text-center text-xs text-[#4B5875]">
                    Đội ngũ đang phân tích trường hợp này. Bạn sẽ nhận được câu trả lời chi tiết ngay tại đây khi có cập nhật.
                  </div>
                ) : (
                  selectedTicket.staffReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className="bg-white p-5 rounded-2xl border border-[#08B3C6]/30 shadow-xs space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[#0E1D4F]/5 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#08B3C6]/20 text-[#08B3C6] flex items-center justify-center font-bold text-xs">
                            <Icon name="support_agent" className="size-4 text-[#08B3C6]" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#0E1D4F]">
                              {reply.senderName || reply.senderRole || 'Bộ phận hỗ trợ'}
                            </span>
                            {reply.senderName && reply.senderRole && (
                              <span className="text-[11px] text-[#4B5875] ml-1.5 font-medium">({reply.senderRole})</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-[#4B5875]">{reply.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#0E1D4F] leading-relaxed whitespace-pre-wrap pt-1">
                        {reply.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Answer Rating Form if replied */}
              {selectedTicket.staffReplies && selectedTicket.staffReplies.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-[#0E1D4F]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-[#0E1D4F]">
                      Đánh giá câu trả lời của chuyên viên hỗ trợ
                    </h5>
                    {selectedTicket.userAnswerRating && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Icon name="check" className="size-4" />
                        Đã đánh giá ({selectedTicket.userAnswerRating}/5 sao)
                      </span>
                    )}
                  </div>

                  {ratedSuccessId === selectedTicket.id && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                      <Icon name="check_circle" className="size-4" />
                      <span>Cảm ơn bạn! Đánh giá đã được ghi nhận vào hệ thống chất lượng dịch vụ.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#4B5875]">Mức độ hài lòng:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const current =
                          ratingInput[selectedTicket.id] ||
                          selectedTicket.userAnswerRating ||
                          5;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setRatingInput({
                                ...ratingInput,
                                [selectedTicket.id]: star,
                              })
                            }
                            className="text-lg transition-transform hover:scale-125 cursor-pointer text-amber-400"
                            aria-label={`${star} sao`}
                          >
                            {star <= current ? '★' : '☆'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Ý kiến bổ sung (nếu có)..."
                      value={
                        commentInput[selectedTicket.id] !== undefined
                          ? commentInput[selectedTicket.id]
                          : selectedTicket.ratingFeedback || ''
                      }
                      onChange={(e) =>
                        setCommentInput({
                          ...commentInput,
                          [selectedTicket.id]: e.target.value,
                        })
                      }
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] text-[#0E1D4F]"
                    />
                    {rateError && (
                      <p className="text-xs text-red-600 font-semibold">{rateError}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={isSubmittingRating}
                        onClick={() => handleRateSubmit(selectedTicket.id)}
                        className="px-4 py-2 bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        {isSubmittingRating ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

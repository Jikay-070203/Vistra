'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';
import { FeedbackTicket } from '@/types/feedback';

export default function ProfileFeedbackTab() {
  const { tickets, rateStaffAnswer } = useFeedback();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets.length > 0 ? tickets[0].id : null
  );
  const [ratingInput, setRatingInput] = useState<{ [ticketId: string]: number }>({});
  const [commentInput, setCommentInput] = useState<{ [ticketId: string]: string }>({});
  const [ratedSuccessId, setRatedSuccessId] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleRateSubmit = (ticketId: string) => {
    const star = ratingInput[ticketId] || 5;
    const comment = commentInput[ticketId] || '';
    rateStaffAnswer(ticketId, star, comment);
    setRatedSuccessId(ticketId);
    setTimeout(() => setRatedSuccessId(null), 3000);
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
        return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">Nghiêm trọng</span>;
      case 'high':
      case 'Cao':
        return <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">Cao</span>;
      case 'medium':
      case 'Trung bình':
        return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Trung bình</span>;
      case 'low':
      case 'Thấp':
      default:
        return <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">Thấp</span>;
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
            {tickets.length} Phiếu phản hồi
          </span>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 text-[#4B5875]">
          <Icon name="feedback" className="size-12 mx-auto text-[#4B5875]/40 mb-3" />
          <p className="font-semibold text-sm">Bạn chưa gửi phản hồi nào</p>
          <p className="text-xs mt-1">Nhấp vào nút &quot;Phản hồi &amp; Báo lỗi&quot; ở góc phải màn hình để gửi ý kiến đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Ticket List (4 cols) */}
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
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
                            VQ
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#0E1D4F]">{reply.senderName}</span>
                            <span className="text-[11px] text-[#4B5875] ml-1.5 font-medium">({reply.senderRole})</span>
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
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRateSubmit(selectedTicket.id)}
                        className="px-4 py-2 bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Gửi đánh giá
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

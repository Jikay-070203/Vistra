'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';
import { FeedbackCategory, TicketSeverity, TicketStatus, FeedbackTicket } from '@/types/feedback';
import type { FeedbackStatus } from '@/types/feedbackApi';

// Helpers to format categories and severities cleanly
export function formatFeedbackCategory(cat?: FeedbackCategory): string {
  if (!cat) return 'Chưa phân loại';
  switch (cat) {
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
      return String(cat);
  }
}

export function formatTicketSeverity(sev?: TicketSeverity): string {
  if (!sev) return 'Chưa gán';
  switch (sev) {
    case 'low':
    case 'Thấp':
      return 'Thấp';
    case 'medium':
    case 'Trung bình':
      return 'Trung bình';
    case 'high':
    case 'Cao':
      return 'Cao';
    case 'critical':
    case 'Nghiêm trọng':
      return 'Nghiêm trọng';
    default:
      // Unknown or null severity must show unclassified or omit, NOT Thấp!
      return 'Chưa gán';
  }
}

export function formatTicketStatus(status: TicketStatus): string {
  switch (status) {
    case 'unassigned':
      return 'Chưa phân loại';
    case 'in_progress':
      return 'Đang xử lý';
    case 'answered':
      return 'Đã trả lời';
    case 'resolved':
      return 'Đã giải quyết';
    case 'closed':
      return 'Đã đóng';
  }
}

interface TicketDetailInspectorProps {
  ticket: FeedbackTicket;
  onUpdateClassification: (
    id: string,
    category: FeedbackCategory,
    severity: TicketSeverity
  ) => Promise<void>;
  onUpdateStatus: (id: string, status: TicketStatus) => Promise<void>;
  onSendReply: (
    ticketId: string,
    replyText: string
  ) => Promise<{ statusUpdateError?: string } | void>;
}

function TicketDetailInspector({
  ticket,
  onUpdateClassification,
  onUpdateStatus,
  onSendReply,
}: TicketDetailInspectorProps) {
  // Classification popover dialog state
  const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<FeedbackCategory>(
    ticket.category || 'Vấn đề giao diện (UX)'
  );
  const [editSeverity, setEditSeverity] = useState<TicketSeverity>(
    ticket.severity || 'Trung bình'
  );
  const [isUpdatingClassification, setIsUpdatingClassification] = useState(false);
  const [classificationError, setClassificationError] = useState<string | null>(null);

  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Status selector state using proper state ownership without synchronous prop-sync effect
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const currentStatus = pendingStatus ?? ticket.status;

  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Handle outside click & Escape to dismiss popover
  useEffect(() => {
    if (!isClassificationModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsClassificationModalOpen(false);
        triggerButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(e.target as Node)
      ) {
        setIsClassificationModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClassificationModalOpen]);

  const handleOpenClassification = () => {
    setEditCategory(ticket.category || 'Vấn đề giao diện (UX)');
    setEditSeverity(ticket.severity || 'Trung bình');
    setClassificationError(null);
    setIsClassificationModalOpen((prev) => !prev);
  };

  const handleSaveClassification = async () => {
    setIsUpdatingClassification(true);
    setClassificationError(null);
    try {
      await onUpdateClassification(ticket.id, editCategory, editSeverity);
      setIsClassificationModalOpen(false);
      triggerButtonRef.current?.focus();
    } catch (err: unknown) {
      setClassificationError(
        err instanceof Error ? err.message : 'Không thể cập nhật phân loại phiếu.'
      );
    } finally {
      setIsUpdatingClassification(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setPendingStatus(newStatus);
    try {
      await onUpdateStatus(ticket.id, newStatus);
    } finally {
      setPendingStatus(null);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    setReplyError(null);
    try {
      const result = await onSendReply(ticket.id, replyText.trim());
      // Reply succeeded on server: clear reply text so it cannot be duplicated on retry
      setReplyText('');
      if (result && result.statusUpdateError) {
        setReplyError(
          `Đã gửi câu trả lời thành công, nhưng cập nhật trạng thái thất bại: ${result.statusUpdateError}. Vui lòng đổi trạng thái thủ công.`
        );
      }
    } catch (err: unknown) {
      // Complete reply failure: retain replyText so operator does not lose typed response!
      setReplyError(err instanceof Error ? err.message : 'Không thể gửi câu trả lời.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-6 print:w-full print:p-0 print:border-none print:shadow-none">
      {/* Header of Inspector */}
      <div className="border-b border-[#0E1D4F]/10 pb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-bold text-[#205BD6] bg-[#205BD6]/10 px-3 py-1 rounded-xl">
              {ticket.id}
            </span>

            {/* Compact Classification Trigger with Anchored Popover */}
            <div className="relative inline-block print:hidden">
              <button
                ref={triggerButtonRef}
                type="button"
                onClick={handleOpenClassification}
                aria-expanded={isClassificationModalOpen}
                aria-haspopup="dialog"
                aria-label="Mở menu phân loại và mức độ nghiêm trọng"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EBF1F0] hover:bg-white text-[#0E1D4F] border border-[#0E1D4F]/10 text-xs font-medium transition-colors cursor-pointer group"
                title="Nhấn để thay đổi phân loại"
              >
                <span className="font-semibold text-[#205BD6]">
                  {formatFeedbackCategory(ticket.category)}
                </span>
                <span>·</span>
                <span className="text-[#4B5875]">
                  {formatTicketSeverity(ticket.severity)}
                </span>
                <Icon name="edit" className="size-3 text-[#4B5875] group-hover:text-[#205BD6]" />
              </button>

              {/* Anchored Popover */}
              {isClassificationModalOpen && (
                <div
                  ref={popoverRef}
                  role="dialog"
                  aria-modal="false"
                  aria-label="Phân loại phiếu"
                  className="absolute top-full left-0 mt-2 z-50 w-80 bg-white rounded-2xl shadow-xl border border-[#0E1D4F]/15 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between border-b border-[#0E1D4F]/10 pb-2">
                    <h4 className="font-bold text-xs text-[#0E1D4F] flex items-center gap-1.5">
                      <Icon name="tune" className="size-3.5 text-[#205BD6]" />
                      <span>Phân loại {ticket.id}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsClassificationModalOpen(false);
                        triggerButtonRef.current?.focus();
                      }}
                      className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#4B5875]"
                    >
                      <Icon name="close" className="size-3.5" />
                    </button>
                  </div>

                  {classificationError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium" role="alert">
                      {classificationError}
                    </div>
                  )}

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#4B5875] mb-1">
                        Loại vấn đề
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as FeedbackCategory)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
                      >
                        <option value="Vấn đề giao diện (UX)">Vấn đề giao diện (UX)</option>
                        <option value="Lỗi logic hành trình">Lỗi logic hành trình</option>
                        <option value="Chức năng chưa hoạt động">Chức năng chưa hoạt động</option>
                        <option value="Đề xuất cải tiến">Đề xuất cải tiến</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#4B5875] mb-1">
                        Mức độ nghiêm trọng
                      </label>
                      <select
                        value={editSeverity}
                        onChange={(e) => setEditSeverity(e.target.value as TicketSeverity)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
                      >
                        <option value="Thấp">Thấp (Tiểu tiết)</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Cao">Cao</option>
                        <option value="Nghiêm trọng">Nghiêm trọng (Chặn luồng)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-[#0E1D4F]/10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsClassificationModalOpen(false);
                        triggerButtonRef.current?.focus();
                      }}
                      className="px-3 py-1 rounded-lg border border-[#0E1D4F]/15 text-[#4B5875] hover:bg-gray-100 text-[11px] font-semibold"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingClassification}
                      onClick={handleSaveClassification}
                      className="px-3 py-1 rounded-lg bg-[#205BD6] text-white hover:bg-[#1847a8] disabled:opacity-50 text-[11px] font-semibold"
                    >
                      {isUpdatingClassification ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action: Status selector, Origin and PDF Export Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 print:hidden">
              <label htmlFor="feedback-status-select" className="text-xs font-semibold text-[#4B5875] sr-only sm:not-sr-only">
                Trạng thái:
              </label>
              <select
                id="feedback-status-select"
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                aria-label="Cập nhật trạng thái tiến độ xử lý phiếu"
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/15 text-[#0E1D4F] cursor-pointer focus:outline-none focus:border-[#205BD6]"
              >
                <option value="unassigned">Chờ phân loại</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="answered">Đã trả lời</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="closed" disabled>Đã đóng (Hệ thống chưa hỗ trợ)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0E1D4F] border border-[#0E1D4F]/15 text-xs font-semibold shadow-xs transition-colors cursor-pointer print:hidden"
              title="Xuất file PDF hoặc In phiếu phản hồi này"
            >
              <Icon name="print" size={14} className="text-[#205BD6]" />
              <span>In / Lưu PDF</span>
            </button>
            <div className="text-xs text-[#4B5875]">
              Nguồn: <code className="font-mono font-bold text-[#0E1D4F]">{ticket.routeOrigin || '/'}</code>
            </div>
          </div>
        </div>

        <h2 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
          {ticket.subject}
        </h2>

        {/* Sender Identity: Keep unavailable sender identity absent, don't invent email/name */}
        <div className="text-xs text-[#4B5875] flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Icon name="person" className="size-3.5 text-[#205BD6]" />
            <span>
              {ticket.userName || ticket.userEmail ? (
                <>
                  Người gửi: <strong>{ticket.userName || ticket.userEmail}</strong>
                  {ticket.userName && ticket.userEmail ? ` (${ticket.userEmail})` : ''}
                </>
              ) : (
                <span className="text-[#4B5875] italic">Thông tin người gửi không khả dụng</span>
              )}
            </span>
          </div>
          <span>Gửi lúc: {ticket.createdAt}</span>
        </div>
      </div>

      {/* Original Problem Statement */}
      <div className="p-4 rounded-2xl bg-[#EBF1F0]/40 border border-[#0E1D4F]/10 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5875] block">
          Nội dung du khách gửi lên:
        </span>
        <p className="text-xs text-[#0E1D4F] leading-relaxed whitespace-pre-wrap">
          {ticket.description}
        </p>
      </div>

      {/* Dedicated Status Progress Section */}
      <div className="p-4 rounded-2xl bg-white border border-[#0E1D4F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-[#0E1D4F] block">
            Trạng thái tiến độ xử lý
          </span>
          <span className="text-[11px] text-[#4B5875]">
            Đổi trạng thái theo hành động rõ ràng. Trả lời sẽ tự chuyển sang &ldquo;Đã trả lời&rdquo;.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
            aria-label="Chọn trạng thái tiến độ xử lý"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/15 text-[#0E1D4F] cursor-pointer"
          >
            <option value="unassigned">Chờ phân loại</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="answered">Đã trả lời</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed" disabled>Đã đóng (Hệ thống chưa hỗ trợ)</option>
          </select>
        </div>
      </div>

      {/* Staff Reply Stream */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0E1D4F] flex items-center gap-1.5">
          <Icon name="forum" className="size-4 text-[#08B3C6]" />
          <span>Nhật ký trao đổi &amp; Trả lời ({ticket.staffReplies?.length || 0})</span>
        </span>

        {ticket.staffReplies && ticket.staffReplies.length > 0 ? (
          ticket.staffReplies.map((reply) => (
            <div key={reply.id} className="p-4 rounded-2xl bg-[#EBF1F0]/50 border border-[#0E1D4F]/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#0E1D4F]">
                  {reply.senderName || reply.senderRole || 'Bộ phận hỗ trợ'}
                  {reply.senderName && reply.senderRole ? ` (${reply.senderRole})` : ''}
                </span>
                <span className="text-[#4B5875]">{reply.timestamp}</span>
              </div>
              <p className="text-xs text-[#0E1D4F] leading-relaxed whitespace-pre-wrap">
                {reply.message}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4 rounded-xl bg-white border border-dashed border-[#0E1D4F]/15 text-center text-xs text-[#4B5875]">
            Chưa có câu trả lời nào từ kỹ sư cho phiếu này.
          </div>
        )}
      </div>

      {/* Traveler Rating Display if any */}
      {ticket.userAnswerRating && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <Icon name="star" className="size-4 text-amber-500" />
              Du khách đã chấm điểm câu trả lời:
            </span>
            <span className="font-bold text-amber-600 text-sm">
              {ticket.userAnswerRating} / 5.0 Sao
            </span>
          </div>
          {ticket.ratingFeedback && (
            <p className="text-amber-800 italic pt-1">
              &ldquo;{ticket.ratingFeedback}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Reply Composer Form (print:hidden) */}
      <form onSubmit={handleReplySubmit} className="space-y-3 pt-2 print:hidden">
        <label htmlFor="staff-reply-textarea" className="block text-xs font-bold text-[#0E1D4F]">
          Gửi phản hồi chính thức cho du khách (Sẽ tự chuyển sang &ldquo;Đã trả lời&rdquo;)
        </label>
        <textarea
          id="staff-reply-textarea"
          required
          rows={3}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Nhập nội dung giải đáp kỹ thuật, hướng dẫn hoặc xác nhận đã sửa lỗi..."
          className="w-full text-xs p-3.5 rounded-2xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] focus:ring-1 focus:ring-[#205BD6] text-[#0E1D4F] resize-none"
        />

        {replyError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2" role="alert">
            <Icon name="error" className="size-4 shrink-0 text-red-600" />
            <span>{replyError}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!replyText.trim() || isSubmittingReply}
            className="px-5 py-2.5 bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Icon
              name={isSubmittingReply ? 'sync' : 'send'}
              className={`size-3.5 ${isSubmittingReply ? 'animate-spin' : ''}`}
            />
            <span>{isSubmittingReply ? 'Đang gửi...' : 'Gửi câu trả lời'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminFeedbackScreen() {
  const {
    tickets,
    counts,
    countsLoading,
    countsError,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    updateTicketClassification,
    addStaffReply,
    loadTickets,
  } = useFeedback();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [requestedPage, setRequestedPage] = useState(1);
  const REQUESTED_PAGE_SIZE = 5;

  // Active page and effective page size derived from authoritative server metadata; handle clamped responses
  const activePage = page > 0 ? page : requestedPage;
  const effectivePageSize = pageSize > 0 ? pageSize : REQUESTED_PAGE_SIZE;

  // Debounce search input to avoid flooding server requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setRequestedPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Server pagination and supported filters query (pass only supported q and status)
  useEffect(() => {
    const validStatus =
      statusFilter !== 'all' &&
      ['unassigned', 'in_progress', 'answered', 'resolved'].includes(statusFilter)
        ? (statusFilter as FeedbackStatus)
        : undefined;

    loadTickets({
      page: requestedPage,
      pageSize: REQUESTED_PAGE_SIZE,
      isAdmin: true,
      q: searchQuery.trim() || undefined,
      status: validStatus,
    }).catch(() => {});
  }, [requestedPage, searchQuery, statusFilter, loadTickets]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, Math.max(1, totalPages)));
    setRequestedPage(clamped);
  };

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return tickets[0] || null;
    return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  const ratedTickets = tickets.filter(
    (t) => t.userAnswerRating !== undefined && t.userAnswerRating !== null
  );
  const avgRating =
    ratedTickets.length > 0
      ? (
          ratedTickets.reduce((acc, t) => acc + (t.userAnswerRating || 0), 0) /
          ratedTickets.length
        ).toFixed(1)
      : null;

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8 print:p-0 print:m-0 print:max-w-none print:space-y-0">
      {/* Action Notification */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0E1D4F] text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4" role="status">
          <Icon name="check_circle" className="size-5 text-[#08B3C6]" />
          <span className="text-xs font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* Action Error Notification */}
      {actionError && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-red-600 text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4" role="alert">
          <Icon name="error" className="size-5 text-white" />
          <span className="text-xs font-semibold">{actionError}</span>
        </div>
      )}

      {/* Top Banner (print:hidden) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Hòm thư Phản hồi &amp; Đóng góp Trải nghiệm
          </h1>
        </div>

        {/* Quick Metrics from Global Backend Counts (authoritative only, never fall back to tickets subset) */}
        <div className="flex flex-wrap items-center gap-4 bg-[#EBF1F0]/50 p-4 rounded-2xl border border-[#0E1D4F]/5">
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-[#0E1D4F]">
              {counts ? counts.total : countsLoading ? '—' : '—'}
            </div>
            <div className="text-[11px] text-[#4B5875]">Tổng phản hồi</div>
          </div>
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div
              className={`text-2xl font-bold ${
                counts && counts.unassigned > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {counts ? counts.unassigned : countsLoading ? '—' : '—'}
            </div>
            <div className="text-[11px] text-[#4B5875]">Chờ phân loại</div>
          </div>
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-[#205BD6]">
              {counts ? counts.inProgress : countsLoading ? '—' : '—'}
            </div>
            <div className="text-[11px] text-[#4B5875]">Đang xử lý</div>
          </div>
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-emerald-600">
              {counts ? counts.answeredOrResolved : countsLoading ? '—' : '—'}
            </div>
            <div className="text-[11px] text-[#4B5875]">Đã phản hồi</div>
          </div>
          {avgRating && (
            <>
              <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-amber-500">★ {avgRating}</div>
                <div className="text-[11px] text-[#4B5875]">Điểm hài lòng (trang này)</div>
              </div>
            </>
          )}
        </div>
      </div>

      {countsError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center gap-2 print:hidden" role="alert">
          <Icon name="warning" className="size-4 text-amber-600 shrink-0" />
          <span>Số liệu thống kê chưa khả dụng: {countsError}</span>
        </div>
      )}

      {/* Main 2-Column Split View: Tickets Queue (5 cols) & Work Item Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block">
        {/* Left: Tickets Queue List with Embedded Search & Filter (print:hidden) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#0E1D4F]/10 shadow-sm space-y-4 print:hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10 text-xs font-bold text-[#0E1D4F]">
            <span>Hòm thư phản hồi ({total})</span>
            <span className="text-[#4B5875] font-normal">Trang {activePage} / {Math.max(1, totalPages)}</span>
          </div>

          {/* Search & Filter Controls: Pass only supported q and status to server */}
          <div className="space-y-2.5 pb-2 border-b border-[#0E1D4F]/10">
            <div className="relative">
              <Icon name="search" className="size-4 text-[#4B5875] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm mã FB, từ khóa phản hồi..."
                aria-label="Tìm kiếm mã hoặc nội dung phản hồi"
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6] text-[#0E1D4F]"
              />
            </div>

            <div>
              <label htmlFor="admin-filter-status" className="sr-only">Lọc theo trạng thái</label>
              <select
                id="admin-filter-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setRequestedPage(1);
                }}
                aria-label="Lọc theo trạng thái phiếu"
                className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="unassigned">Chờ phân loại</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="answered">Đã trả lời</option>
                <option value="resolved">Đã giải quyết</option>
              </select>
            </div>
          </div>

          {/* Ticket Items List: Loading / Error / Empty / List */}
          {loading && tickets.length === 0 ? (
            <div className="py-12 text-center text-[#4B5875] text-xs space-y-2" role="status" aria-live="polite">
              <Icon name="sync" className="size-6 text-[#205BD6] animate-spin mx-auto" />
              <p>Đang tải danh sách phản hồi...</p>
            </div>
          ) : error ? (
            <div className="py-8 px-4 text-center text-xs rounded-2xl bg-red-50 border border-red-200 text-red-700 space-y-2" role="alert">
              <Icon name="error" className="size-6 text-red-600 mx-auto" />
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => {
                  const validStatus =
                    statusFilter !== 'all' &&
                    ['unassigned', 'in_progress', 'answered', 'resolved'].includes(statusFilter)
                      ? (statusFilter as FeedbackStatus)
                      : undefined;
                  loadTickets({
                    page: activePage,
                    pageSize: effectivePageSize,
                    isAdmin: true,
                    q: searchQuery.trim() || undefined,
                    status: validStatus,
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 cursor-pointer inline-flex items-center gap-1"
                aria-label="Thử lại tải danh sách phản hồi"
              >
                <Icon name="refresh" className="size-3" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-[#4B5875] text-xs">
              <Icon name="inbox" className="size-8 text-[#4B5875]/50 mx-auto mb-2" />
              <p>Không có phản hồi nào phù hợp với bộ lọc.</p>
              {(searchInput || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setStatusFilter('all');
                    setRequestedPage(1);
                  }}
                  className="mt-2 text-[#205BD6] underline text-xs cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicket?.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedTicketId(ticket.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`Xem phản hồi ${ticket.id}: ${ticket.subject}`}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6] ${
                      isSelected
                        ? 'border-[#205BD6] bg-[#205BD6]/5 shadow-xs'
                        : 'border-[#0E1D4F]/10 bg-white hover:bg-[#EBF1F0]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0E1D4F]">{ticket.id}</span>
                        {ticket.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#0E1D4F]/5 text-[#4B5875] font-medium">
                            {formatFeedbackCategory(ticket.category)}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ticket.status === 'unassigned'
                            ? 'bg-amber-100 text-amber-800'
                            : ticket.status === 'in_progress'
                            ? 'bg-blue-100 text-[#205BD6]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {formatTicketStatus(ticket.status)}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-[#0E1D4F] line-clamp-1">{ticket.subject}</h3>
                    <p className="text-[11px] text-[#4B5875] line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[#0E1D4F]/5 text-[10px] text-[#4B5875]">
                      <span>{ticket.userName ? `${ticket.userName} · ` : ''}{ticket.createdAt}</span>
                      {ticket.userAnswerRating && (
                        <span className="text-amber-500 font-bold">★ {ticket.userAnswerRating} sao</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tickets Server Pagination Bar */}
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

        {/* Right: Ticket Detail & Operator Response Center (7 cols) */}
        {selectedTicket ? (
          <TicketDetailInspector
            key={`${selectedTicket.id}-${selectedTicket.category}-${selectedTicket.severity}-${selectedTicket.status}`}
            ticket={selectedTicket}
            onUpdateClassification={async (id, cat, sev) => {
              try {
                // Send category and severity without fabricating status
                await updateTicketClassification(id, cat, sev, undefined);
                setActionNotice('Đã cập nhật phân loại vấn đề.');
                setTimeout(() => setActionNotice(null), 3000);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Không thể cập nhật phân loại.';
                setActionError(msg);
                setTimeout(() => setActionError(null), 3500);
                throw err;
              }
            }}
            onUpdateStatus={async (id, stat) => {
              try {
                // Send status-only using existing classifyFeedback optional DTO, passing undefined for category and severity
                await updateTicketClassification(id, undefined, undefined, stat);
                setActionNotice(`Đã chuyển trạng thái sang "${formatTicketStatus(stat)}".`);
                setTimeout(() => setActionNotice(null), 3000);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.';
                setActionError(msg);
                setTimeout(() => setActionError(null), 3500);
                throw err;
              }
            }}
            onSendReply={async (ticketId, text) => {
              try {
                const result = await addStaffReply(ticketId, text, 'answered');
                if (result.statusUpdateError) {
                  setActionNotice('Đã gửi phản hồi thành công (cập nhật trạng thái tự động thất bại).');
                } else {
                  setActionNotice('Đã gửi phản hồi và chuyển trạng thái sang "Đã trả lời"!');
                }
                setTimeout(() => setActionNotice(null), 3500);
                return result;
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Không thể gửi phản hồi.';
                setActionError(msg);
                setTimeout(() => setActionError(null), 3500);
                throw err;
              }
            }}
          />
        ) : (
          <div className="lg:col-span-7 bg-white rounded-3xl p-12 border border-[#0E1D4F]/10 shadow-sm text-center text-[#4B5875] space-y-2">
            <Icon name="mark_email_read" className="size-10 text-[#4B5875]/40 mx-auto" />
            <h3 className="font-bold text-sm text-[#0E1D4F]">Chưa chọn phản hồi nào</h3>
            <p className="text-xs max-w-sm mx-auto">
              Vui lòng chọn một phiếu phản hồi từ danh sách bên trái để kiểm tra chi tiết, phân loại và gửi câu trả lời.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

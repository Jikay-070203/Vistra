'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';
import { FeedbackCategory, TicketSeverity, TicketStatus, FeedbackTicket } from '@/types/feedback';

// Helpers to format categories and severities cleanly (FIX-10)
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
      return String(sev);
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
  ) => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onSendReply: (ticketId: string, replyText: string) => void;
}

function TicketDetailInspector({
  ticket,
  onUpdateClassification,
  onUpdateStatus,
  onSendReply,
}: TicketDetailInspectorProps) {
  // Classification popover dialog state (ADM-FB-02A, ADM-FB-02B)
  const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<FeedbackCategory>(
    ticket.category || 'Vấn đề giao diện (UX)'
  );
  const [editSeverity, setEditSeverity] = useState<TicketSeverity>(
    ticket.severity || 'Trung bình'
  );

  // Status selector state (ADM-FB-02C)
  const [statusValue, setStatusValue] = useState<TicketStatus>(ticket.status);
  const [replyText, setReplyText] = useState('');

  const handleOpenClassification = () => {
    setEditCategory(ticket.category || 'Vấn đề giao diện (UX)');
    setEditSeverity(ticket.severity || 'Trung bình');
    setIsClassificationModalOpen(true);
  };

  const handleSaveClassification = () => {
    onUpdateClassification(ticket.id, editCategory, editSeverity);
    setIsClassificationModalOpen(false);
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    setStatusValue(newStatus);
    onUpdateStatus(ticket.id, newStatus);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendReply(ticket.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-6">
      {/* Header of Inspector (ADM-FB-02A: Compact trigger beside ID) */}
      <div className="border-b border-[#0E1D4F]/10 pb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-bold text-[#205BD6] bg-[#205BD6]/10 px-3 py-1 rounded-xl">
              {ticket.id}
            </span>

            {/* Compact Classification Trigger (ADM-FB-02A) */}
            <button
              type="button"
              onClick={handleOpenClassification}
              aria-label="Mở hộp thoại chỉnh sửa phân loại và mức độ nghiêm trọng"
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
          </div>

          <div className="text-xs text-[#4B5875]">
            Nguồn: <code className="font-mono font-bold text-[#0E1D4F]">{ticket.routeOrigin || '/'}</code>
          </div>
        </div>

        <h2 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
          {ticket.subject}
        </h2>

        <div className="text-xs text-[#4B5875] flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Icon name="person" className="size-3.5 text-[#205BD6]" />
            <span>Người gửi: <strong>{ticket.userName}</strong> ({ticket.userEmail})</span>
          </div>
          <span>Gửi lúc: {ticket.createdAt}</span>
        </div>
      </div>

      {/* Classification Popover/Dialog (ADM-FB-02B) */}
      {isClassificationModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsClassificationModalOpen(false);
          }}
        >
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#0E1D4F]/10 pb-3">
              <h4 className="font-bold text-sm text-[#0E1D4F] flex items-center gap-1.5">
                <Icon name="tune" className="size-4 text-[#205BD6]" />
                <span>Phân loại Ticket {ticket.id}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsClassificationModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#4B5875]"
              >
                <Icon name="close" className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5875] mb-1">
                  Loại vấn đề
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as FeedbackCategory)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
                >
                  <option value="Vấn đề giao diện (UX)">Vấn đề giao diện (UX)</option>
                  <option value="Lỗi logic hành trình">Lỗi logic hành trình</option>
                  <option value="Chức năng chưa hoạt động">Chức năng chưa hoạt động</option>
                  <option value="Đề xuất cải tiến">Đề xuất cải tiến</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5875] mb-1">
                  Mức độ nghiêm trọng (Do kỹ thuật đánh giá)
                </label>
                <select
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value as TicketSeverity)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
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
                onClick={() => setIsClassificationModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#0E1D4F]/15 text-[#4B5875] hover:bg-gray-100 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveClassification}
                className="px-4 py-1.5 rounded-xl bg-[#205BD6] text-white hover:bg-[#1847a8] text-xs font-semibold"
              >
                Lưu phân loại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original Problem Statement */}
      <div className="p-4 rounded-2xl bg-[#EBF1F0]/40 border border-[#0E1D4F]/10 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5875] block">
          Nội dung du khách gửi lên:
        </span>
        <p className="text-xs text-[#0E1D4F] leading-relaxed whitespace-pre-wrap">
          {ticket.description}
        </p>
      </div>

      {/* Dedicated Status Progress Section (ADM-FB-02C) */}
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
            value={statusValue}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/15 text-[#0E1D4F] cursor-pointer"
          >
            <option value="unassigned">Chờ phân loại</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="answered">Đã trả lời</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed">Đã đóng</option>
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
                  {reply.senderName} ({reply.senderRole})
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

      {/* Reply Composer Form */}
      <form onSubmit={handleReplySubmit} className="space-y-3 pt-2">
        <label className="block text-xs font-bold text-[#0E1D4F]">
          Gửi phản hồi chính thức cho du khách (Sẽ tự chuyển sang &ldquo;Đã trả lời&rdquo;)
        </label>
        <textarea
          required
          rows={3}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Nhập nội dung giải đáp kỹ thuật, hướng dẫn hoặc xác nhận đã sửa lỗi..."
          className="w-full text-xs p-3.5 rounded-2xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] focus:ring-1 focus:ring-[#205BD6] text-[#0E1D4F] resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!replyText.trim()}
            className="px-5 py-2.5 bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Icon name="send" className="size-3.5" />
            <span>Gửi câu trả lời</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminFeedbackScreen() {
  const { tickets, updateTicketClassification, addStaffReply } = useFeedback();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets.length > 0 ? tickets[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Tickets list pagination (ADM-FB-01B, ADM-LIST-01)
  const [currentPage, setCurrentPage] = useState(1);
  const TICKETS_PER_PAGE = 5;

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || t.status === statusFilter;

      // Category matching supporting both raw enum and display string (FIX-10)
      const formatted = formatFeedbackCategory(t.category);
      const matchCategory =
        categoryFilter === 'all' ||
        t.category === categoryFilter ||
        formatted === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter]);

  // Handle filter changes (resets page and clears selected ticket if filtered out) (ADM-FB-01B)
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (st: string) => {
    setStatusFilter(st);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (cat: string) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  };

  // If selected ticket is no longer in filtered list, clear selection (ADM-FB-01B)
  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return filteredTickets.find((t) => t.id === selectedTicketId) || null;
  }, [filteredTickets, selectedTicketId]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / TICKETS_PER_PAGE));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * TICKETS_PER_PAGE;
    return filteredTickets.slice(start, start + TICKETS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  const unassignedCount = tickets.filter((t) => t.status === 'unassigned').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const answeredCount = tickets.filter((t) => t.status === 'answered' || t.status === 'resolved').length;

  const ratedTickets = tickets.filter((t) => t.userAnswerRating !== undefined);
  const avgRating =
    ratedTickets.length > 0
      ? (
          ratedTickets.reduce((acc, t) => acc + (t.userAnswerRating || 0), 0) /
          ratedTickets.length
        ).toFixed(1)
      : null;

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Action Notification */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0E1D4F] text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Icon name="check_circle" className="size-5 text-[#08B3C6]" />
          <span className="text-xs font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              TRUNG TÂM TIẾP NHẬN PHẢN HỒI &amp; BÁO LỖI
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0E1D4F]/10 text-[#0E1D4F] font-semibold">
              TRIAGE
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Hòm thư Phản hồi &amp; Đóng góp Trải nghiệm
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-2xl leading-relaxed">
            Phân loại lỗi giao diện, sai sót logic hành trình, cập nhật mức độ ưu tiên và gửi câu trả lời trực tiếp cho du khách.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-4 bg-[#EBF1F0]/50 p-4 rounded-2xl border border-[#0E1D4F]/5">
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-[#0E1D4F]">{tickets.length}</div>
            <div className="text-[11px] text-[#4B5875]">Tổng phản hồi</div>
          </div>
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div className={`text-2xl font-bold ${unassignedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {unassignedCount}
            </div>
            <div className="text-[11px] text-[#4B5875]">Chờ phân loại</div>
          </div>
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-[#205BD6]">{inProgressCount}</div>
            <div className="text-[11px] text-[#4B5875]">Đang xử lý</div>
          </div>
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-emerald-600">{answeredCount}</div>
            <div className="text-[11px] text-[#4B5875]">Đã phản hồi</div>
          </div>
          {avgRating && (
            <>
              <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-amber-500">★ {avgRating}</div>
                <div className="text-[11px] text-[#4B5875]">Điểm hài lòng</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Split View: Tickets Queue (5 cols) & Work Item Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tickets Queue List with Embedded Search & Filter (5 cols) (ADM-FB-01A) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10 text-xs font-bold text-[#0E1D4F]">
            <span>Hòm thư phản hồi ({filteredTickets.length})</span>
            <span className="text-[#4B5875] font-normal">Trang {currentPage} / {totalPages}</span>
          </div>

          {/* Search & Filter Controls EMBEDDED inside List Header (ADM-FB-01A) */}
          <div className="space-y-2.5 pb-2 border-b border-[#0E1D4F]/10">
            <div className="relative">
              <Icon name="search" className="size-4 text-[#4B5875] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm mã FB, tên du khách, từ khóa..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6] text-[#0E1D4F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="unassigned">Chờ phân loại</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="answered">Đã trả lời</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="closed">Đã đóng</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="Vấn đề giao diện (UX)">Vấn đề giao diện (UX)</option>
                <option value="Lỗi logic hành trình">Lỗi logic hành trình</option>
                <option value="Chức năng chưa hoạt động">Chức năng chưa hoạt động</option>
                <option value="Đề xuất cải tiến">Đề xuất cải tiến</option>
              </select>
            </div>
          </div>

          {/* Ticket Items List */}
          {paginatedTickets.length === 0 ? (
            <div className="py-12 text-center text-[#4B5875] text-xs">
              <Icon name="inbox" className="size-8 text-[#4B5875]/50 mx-auto mb-2" />
              <p>Không có phản hồi nào phù hợp với bộ lọc.</p>
              {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setCurrentPage(1);
                  }}
                  className="mt-2 text-[#205BD6] underline text-xs cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicket?.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
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
                      <span>{ticket.userName} · {ticket.createdAt}</span>
                      {ticket.userAnswerRating && (
                        <span className="text-amber-500 font-bold">★ {ticket.userAnswerRating} sao</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tickets Pagination Bar (ADM-FB-01B) */}
          {totalPages > 1 && (
            <div className="pt-3 border-t border-[#0E1D4F]/10 flex items-center justify-between text-xs text-[#4B5875]">
              <span>{filteredTickets.length} phiếu</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-[#0E1D4F]/15 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] font-semibold text-[#0E1D4F] cursor-pointer"
                >
                  Trước
                </button>
                <span className="font-semibold text-[#0E1D4F]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-[#0E1D4F]/15 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] font-semibold text-[#0E1D4F] cursor-pointer"
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
            onUpdateClassification={(id, cat, sev) => {
              updateTicketClassification(id, cat, sev);
              setActionNotice('Đã cập nhật phân loại vấn đề.');
              setTimeout(() => setActionNotice(null), 3000);
            }}
            onUpdateStatus={(id, stat) => {
              updateTicketClassification(
                id,
                selectedTicket.category || 'Vấn đề giao diện (UX)',
                selectedTicket.severity || 'Trung bình',
                stat
              );
              setActionNotice(`Đã chuyển trạng thái sang "${formatTicketStatus(stat)}".`);
              setTimeout(() => setActionNotice(null), 3000);
            }}
            onSendReply={(ticketId, text) => {
              addStaffReply(ticketId, text, 'answered');
              setActionNotice('Đã gửi phản hồi và chuyển trạng thái sang "Đã trả lời"!');
              setTimeout(() => setActionNotice(null), 3500);
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

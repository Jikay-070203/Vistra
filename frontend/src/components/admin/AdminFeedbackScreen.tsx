'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import { useFeedback } from '@/context/FeedbackContext';
import { FeedbackCategory, TicketSeverity, TicketStatus, FeedbackTicket } from '@/types/feedback';

interface TicketDetailInspectorProps {
  ticket: FeedbackTicket;
  onUpdateClassification: (
    id: string,
    category: FeedbackCategory,
    severity: TicketSeverity,
    status?: TicketStatus
  ) => void;
  onSendReply: (ticketId: string, replyText: string) => void;
}

function TicketDetailInspector({
  ticket,
  onUpdateClassification,
  onSendReply,
}: TicketDetailInspectorProps) {
  const [editCategory, setEditCategory] = useState<FeedbackCategory>(
    ticket.category || 'Vấn đề giao diện (UX)'
  );
  const [editSeverity, setEditSeverity] = useState<TicketSeverity>(
    ticket.severity || 'Trung bình'
  );
  const [editStatus, setEditStatus] = useState<TicketStatus>(ticket.status);
  const [replyText, setReplyText] = useState('');

  const handleApply = () => {
    onUpdateClassification(ticket.id, editCategory, editSeverity, editStatus);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendReply(ticket.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-6">
      {/* Header of Inspector */}
      <div className="border-b border-[#0E1D4F]/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-[#205BD6] bg-[#205BD6]/10 px-3 py-1 rounded-xl">
              {ticket.id}
            </span>
            <span className="text-xs text-[#4B5875]">Gửi lúc: {ticket.createdAt}</span>
          </div>
          <div className="text-xs text-[#4B5875]">
            Trang xuất phát: <code className="font-mono font-bold text-[#0E1D4F]">{ticket.routeOrigin}</code>
          </div>
        </div>
        <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
          {ticket.subject}
        </h3>
        <div className="text-xs text-[#4B5875] mt-1 flex items-center gap-2">
          <Icon name="person" className="size-3.5 text-[#205BD6]" />
          <span>Người gửi: <strong>{ticket.userName}</strong> ({ticket.userEmail})</span>
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

      {/* Classification & Triage Controls */}
      <div className="p-5 rounded-2xl bg-white border border-[#0E1D4F]/15 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0E1D4F] flex items-center gap-1.5">
            <Icon name="tune" className="size-4 text-[#205BD6]" />
            <span>Phân loại &amp; Gán mức độ ưu tiên kỹ thuật</span>
          </span>
          <button
            type="button"
            onClick={handleApply}
            className="px-3.5 py-1.5 bg-[#0E1D4F] hover:bg-[#205BD6] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Lưu phân loại
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#4B5875] mb-1">
              Danh mục vấn đề
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as FeedbackCategory)}
              className="w-full text-xs px-2.5 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
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
              className="w-full text-xs px-2.5 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
            >
              <option value="Thấp">Thấp (Tiểu tiết)</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Cao">Cao</option>
              <option value="Nghiêm trọng">Nghiêm trọng (Chặn luồng)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#4B5875] mb-1">
              Trạng thái tiến độ
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
              className="w-full text-xs px-2.5 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
            >
              <option value="unassigned">Chờ phân loại</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="answered">Đã trả lời</option>
              <option value="resolved">Đã hoàn tất</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
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
          Gửi phản hồi chính thức cho du khách
        </label>
        <textarea
          required
          rows={4}
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

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchCategory =
        categoryFilter === 'all' || t.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter]);

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
      : '4.8';

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
              LIVE CONTEXT
            </span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Hòm thư Phản hồi &amp; Đóng góp Trải nghiệm
          </h2>
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
            <div className="text-2xl font-bold text-amber-600">{unassignedCount}</div>
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
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-amber-500">★ {avgRating}</div>
            <div className="text-[11px] text-[#4B5875]">Điểm hài lòng</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Icon name="search" className="size-4 text-[#4B5875] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã FB, tên du khách, từ khóa..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] text-[#0E1D4F]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#4B5875]">
            <span>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unassigned">Chờ phân loại</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="answered">Đã trả lời</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#4B5875]">
            <span>Danh mục:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="Vấn đề giao diện (UX)">Vấn đề giao diện (UX)</option>
              <option value="Lỗi logic hành trình">Lỗi logic hành trình</option>
              <option value="Chức năng chưa hoạt động">Chức năng chưa hoạt động</option>
              <option value="Đề xuất cải tiến">Đề xuất cải tiến</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split View: Tickets Queue (5 cols) & Work Item Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tickets Queue List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#0E1D4F]/10 shadow-sm space-y-3 max-h-[780px] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10 text-xs font-bold text-[#0E1D4F]">
            <span>Danh sách phiếu phản hồi ({filteredTickets.length})</span>
            <span className="text-[#4B5875] font-normal">Sắp xếp: Mới nhất trước</span>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="py-16 text-center text-[#4B5875] text-xs">
              Không có phản hồi nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
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
                          {ticket.category}
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
                      {ticket.status === 'unassigned'
                        ? 'Chưa phân loại'
                        : ticket.status === 'in_progress'
                        ? 'Đang xử lý'
                        : 'Đã trả lời'}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-[#0E1D4F] line-clamp-1">{ticket.subject}</h4>
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
            })
          )}
        </div>

        {/* Right: Ticket Detail & Operator Response Center (7 cols) */}
        {selectedTicket ? (
          <TicketDetailInspector
            key={selectedTicket.id}
            ticket={selectedTicket}
            onUpdateClassification={(id, cat, sev, stat) => {
              updateTicketClassification(id, cat, sev, stat);
              setActionNotice('Đã cập nhật phân loại & trạng thái hồ sơ.');
              setTimeout(() => setActionNotice(null), 3000);
            }}
            onSendReply={(ticketId, text) => {
              addStaffReply(ticketId, text, 'answered');
              setActionNotice('Đã gửi phản hồi chính thức cho du khách!');
              setTimeout(() => setActionNotice(null), 3500);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

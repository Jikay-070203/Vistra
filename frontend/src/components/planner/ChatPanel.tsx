'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';

interface ChatPanelProps {
  activePlan: DemoPlan;
  showSources: boolean;
  mobileTab: 'chat' | 'itinerary' | 'sources';
  inputText: string;
  onInputChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const BRAINSTORM_STEPS = [
  {
    step: 1,
    title: 'Giải mã tín hiệu & Thẩm mỹ',
    summary: 'Phân tích gu du lịch qua moodboard ảnh và các ràng buộc về ngày đi, ngân sách.',
  },
  {
    step: 2,
    title: 'Đối chiếu vi khí hậu & Tránh đông',
    summary: 'Rà soát dữ liệu mây sớm, sương mù và khung giờ nắng ấm để xếp giờ xuất phát.',
  },
  {
    step: 3,
    title: 'Tối ưu độ dốc & Cung đường',
    summary: 'Sắp xếp thứ tự các điểm dừng liền mạch, tránh quay đầu hoặc leo dốc gắt liên tục.',
  },
  {
    step: 4,
    title: 'Tinh chỉnh ẩm thực & Thể lực',
    summary: 'Bố trí trạm nghỉ dưỡng phù hợp cho từng thành viên trong đoàn (người già, trẻ nhỏ).',
  },
];

const QUICK_PROMPTS = [
  'Đổi bữa sáng Ngày 2 sang phở gà đồi và thêm điểm nghỉ trưa cho người lớn tuổi',
  'Dời giờ săn mây đèo Ô Quy Hồ lên 05:15 sáng',
  'Chuyển nhịp độ Ngày 2 sang Thư thái để thong thả dạo bộ',
  'Thêm trạm cà phê ngắm hoàng hôn thung lũng Mường Hoa',
];

export default function ChatPanel({
  activePlan,
  showSources,
  mobileTab,
  inputText,
  onInputChange,
  onKeyDown,
  onSendMessage,
  messagesEndRef,
}: ChatPanelProps) {
  const [showBrainstorm, setShowBrainstorm] = useState(false);

  const handleQuickPromptClick = (prompt: string) => {
    onInputChange(prompt);
  };

  return (
    <section
      className={`${
        showSources ? 'lg:col-span-4' : 'lg:col-span-5'
      } ${
        mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
      } bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs flex-col h-[calc(100vh-210px)] min-h-[480px] max-h-[820px] overflow-hidden transition-all`}
    >
      {/* Panel Header */}
      <div className="p-3.5 border-b border-[#0E1D4F]/10 flex items-center justify-between bg-white/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#08B3C6]/15 border border-[#08B3C6]/30 flex items-center justify-center text-[#08B3C6] shrink-0">
            <Icon name="psychology" className="size-4" />
          </div>
          <div>
            <h2 className="font-headline-sm text-sm font-bold text-[#0E1D4F]">
              Hội thoại cùng Vistra Atelier
            </h2>
            <p className="text-[11px] text-[#4B5875]">Hội thoại biến đổi trực tiếp lịch trình</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowBrainstorm(!showBrainstorm)}
          className="text-[10px] font-label-caps bg-[#EBF1F0] hover:bg-[#205BD6]/10 text-[#205BD6] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Xem các bước suy luận phân tích của AI"
        >
          <Icon name="insights" className="size-3.5" />
          <span>{showBrainstorm ? 'Ẩn phân tích AI' : '4 bước phân tích AI'}</span>
        </button>
      </div>

      {/* Brainstorm Step Summaries Accordion (UX-06 / F08) */}
      {showBrainstorm && (
        <div className="p-3 bg-[#EBF1F0]/70 border-b border-[#0E1D4F]/10 space-y-2 animate-in fade-in duration-200">
          <span className="text-[10px] font-label-caps uppercase font-bold text-[#205BD6] block">
            Tiến trình đồng kiến tạo hành trình (User-facing brainstorm summary)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BRAINSTORM_STEPS.map((s) => (
              <div
                key={s.step}
                className="bg-white/90 p-2.5 rounded-xl border border-[#0E1D4F]/10 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-1.5 font-bold text-[#0E1D4F] mb-0.5">
                  <span className="w-4 h-4 rounded-full bg-[#205BD6] text-white flex items-center justify-center text-[10px] shrink-0">
                    {s.step}
                  </span>
                  <span className="truncate">{s.title}</span>
                </div>
                <p className="text-[11px] text-[#4B5875] leading-relaxed line-clamp-2">
                  {s.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {activePlan.chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-[#4B5875] px-1 font-label-md">
                <span>{isUser ? 'Bạn' : 'Vistra Intelligence'}</span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-[#205BD6] text-white rounded-br-xs'
                    : 'bg-[#EBF1F0] text-[#0E1D4F] border border-[#0E1D4F]/10 rounded-bl-xs'
                }`}
              >
                <p>{msg.text}</p>

                {/* Display affected change note if any */}
                {msg.affectedChange && (
                  <div className="mt-2 pt-2 border-t border-[#0E1D4F]/10 text-[11px] font-semibold text-[#205BD6] flex items-center gap-1">
                    <Icon name="auto_fix_high" className="size-3.5 shrink-0" />
                    <span>Lịch trình đã cập nhật: {msg.affectedChange}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions Chips (F02) */}
      <div className="px-3 pt-2 pb-1 bg-white/70 border-t border-[#0E1D4F]/5">
        <span className="text-[10px] text-[#4B5875] font-semibold block mb-1">
          Gợi ý tùy biến lịch trình:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPromptClick(p)}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-[#EBF1F0] hover:bg-[#205BD6]/10 text-[#0E1D4F] hover:text-[#205BD6] border border-[#0E1D4F]/10 transition-colors cursor-pointer text-left"
              title="Điền nhanh vào ô soạn thảo"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Composer Input Area */}
      <form onSubmit={onSendMessage} className="p-3 border-t border-[#0E1D4F]/10 bg-white/80 space-y-2">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Gõ yêu cầu: 'Đổi bữa sáng phở gà đồi & thêm nghỉ trưa cho người lớn tuổi'..."
            rows={2}
            className="w-full p-2.5 pr-12 text-xs sm:text-sm rounded-xl bg-[#EBF1F0] text-[#0E1D4F] placeholder:text-[#4B5875]/60 border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6] resize-none leading-relaxed"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 bottom-3 p-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all shadow-xs cursor-pointer"
            title="Gửi tin nhắn (Enter)"
            aria-label="Gửi tin nhắn"
          >
            <Icon name="send" className="size-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#4B5875] px-1">
          <span>Nhấn <strong>Enter</strong> để gửi, <strong>Shift + Enter</strong> xuống dòng</span>
          <span className="text-[#205BD6] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Tự động đồng bộ
          </span>
        </div>
      </form>
    </section>
  );
}

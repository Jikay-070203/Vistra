'use client';

import React from 'react';

export default function BenchmarkPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
      {/* Group 1: Visual Travel DNA & Retrieval Quality */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#0E1D4F]/10 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#08B3C6]"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#08B3C6]">
                NHÓM TÍN HIỆU 01
              </span>
            </div>
            <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
              Visual Travel DNA &amp; Retrieval Quality
            </h3>
          </div>
          <span className="text-xs font-bold bg-[#EBF1F0] px-3 py-1 rounded-full text-[#0E1D4F]">
            Độ tin cậy: 93.8%
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#0E1D4F]">Đồng bộ thị giác Moodboard (CLIP Cosine Similarity)</span>
              <span className="text-[#205BD6]">94.6%</span>
            </div>
            <div className="w-full bg-[#EBF1F0] h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#205BD6] to-[#08B3C6] h-full rounded-full w-[94.6%]"></div>
            </div>
            <p className="text-[11px] text-[#4B5875] mt-1">Đo lường mức độ tương đồng giữa ảnh cảm hứng và điểm đến được gợi ý.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#0E1D4F]">Khớp vi khí hậu &amp; Thời điểm vàng (Microclimate Grounding)</span>
              <span className="text-[#08B3C6]">91.2%</span>
            </div>
            <div className="w-full bg-[#EBF1F0] h-2 rounded-full overflow-hidden">
              <div className="bg-[#08B3C6] h-full rounded-full w-[91.2%]"></div>
            </div>
            <p className="text-[11px] text-[#4B5875] mt-1">Tỷ lệ chính xác khi khuyến nghị khung giờ bình minh/săn mây theo dữ liệu lịch sử.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#0E1D4F]">Thỏa mãn ràng buộc địa lý &amp; Di chuyển (Geo-routing Solver)</span>
              <span className="text-[#205BD6]">96.8%</span>
            </div>
            <div className="w-full bg-[#EBF1F0] h-2 rounded-full overflow-hidden">
              <div className="bg-[#205BD6] h-full rounded-full w-[96.8%]"></div>
            </div>
            <p className="text-[11px] text-[#4B5875] mt-1">Không tạo cung đường ziczac hoặc thời gian di chuyển vượt ngưỡng chịu tải của ngày.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#0E1D4F]">Kiểm chứng thực địa Kỳ vọng vs Thực tế (Reality Check Accuracy)</span>
              <span className="text-emerald-600">88.4%</span>
            </div>
            <div className="w-full bg-[#EBF1F0] h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[88.4%]"></div>
            </div>
            <p className="text-[11px] text-[#4B5875] mt-1">Độ chính xác trong việc chỉ rõ góc chụp bị khuất, mùa cạn nước hoặc sương tan sớm.</p>
          </div>
        </div>
      </div>

      {/* Group 2: Automated Metrics & LLM-as-a-Judge */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#0E1D4F]/10 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#205BD6]"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#205BD6]">
                NHÓM TÍN HIỆU 02
              </span>
            </div>
            <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
              Automated Metrics &amp; LLM-as-a-Judge
            </h3>
          </div>
          <span className="text-xs font-bold bg-[#EBF1F0] px-3 py-1 rounded-full text-[#0E1D4F]">
            Đánh giá tự động: Đạt
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#0E1D4F]">Tính mạch lạc &amp; Nhịp độ hành trình (Pace Coherence)</span>
              <span className="text-[#205BD6]">93.1%</span>
            </div>
            <div className="w-full bg-[#EBF1F0] h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#205BD6] to-[#08B3C6] h-full rounded-full w-[93.1%]"></div>
            </div>
            <p className="text-[11px] text-[#4B5875] mt-1">LLM trọng tài đánh giá khoảng nghỉ ngơi, thời gian ăn uống và tính khả thi thực tế.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#0E1D4F]">Tỷ lệ ảo giác địa danh (Hallucination Rate)</span>
              <span className="text-emerald-600 font-bold">&lt; 0.4%</span>
            </div>
            <div className="w-full bg-[#EBF1F0] h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[2%]"></div>
            </div>
            <p className="text-[11px] text-[#4B5875] mt-1">Hệ thống chặn tạo điểm đến hoặc thông tin khách sạn không có trong tri thức kiểm chứng.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#0E1D4F]">Tính toàn vẹn Xác nhận tường minh (Explicit Confirm Integrity)</span>
              <span className="text-emerald-600">100%</span>
            </div>
            <div className="w-full bg-[#EBF1F0] h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[100%]"></div>
            </div>
            <p className="text-[11px] text-[#4B5875] mt-1">Không tự động chốt kế hoạch qua chat; bắt buộc người dùng bấm xác nhận tường minh.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#0E1D4F]">Duy trì ý định người dùng sau điều chỉnh (Intent Retention)</span>
              <span className="text-[#205BD6]">95.2%</span>
            </div>
            <div className="w-full bg-[#EBF1F0] h-2 rounded-full overflow-hidden">
              <div className="bg-[#205BD6] h-full rounded-full w-[95.2%]"></div>
            </div>
            <p className="text-[11px] text-[#4B5875] mt-1">Bảo toàn điểm khởi hành, số người và trần ngân sách khi chat bổ sung hoạt động.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { MOCK_COST_BREAKDOWN } from '@/data/mockData';
import { DemoPlan } from '@/context/DemoPlanContext';

interface CostSummaryProps {
  activePlan: DemoPlan;
}

export default function CostSummary({ activePlan }: CostSummaryProps) {
  return (
    <aside className="lg:col-span-4 flex flex-col gap-6">
      {/* Module 1: Suggested Transport & Estimates (UX-09 / F04) */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#0E1D4F]">
          <Icon name="directions_car" className="size-5 text-[#205BD6]" />
          <h3 className="font-label-caps text-xs uppercase font-bold">
            GỢI Ý PHƯƠNG TIỆN DI CHUYỂN
          </h3>
        </div>
        <div className="p-3.5 bg-[#EBF1F0] rounded-xl space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#4B5875]">Phương tiện phù hợp:</span>
            <strong className="text-[#0E1D4F]">Xe du lịch 7–9 chỗ / Limousine</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4B5875]">Thời gian ước tính:</span>
            <strong className="text-[#0E1D4F]">~4.5 – 5.5 giờ di chuyển</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4B5875]">Đặc thù cung đường:</span>
            <strong className="text-[#0E1D4F]">Cao tốc kết hợp đường đèo dốc</strong>
          </div>
          <div className="flex justify-between pt-1 border-t border-[#0E1D4F]/10">
            <span className="text-[#4B5875]">Xuất phát từ:</span>
            <span className="text-[#0E1D4F] font-semibold text-right">{activePlan.origin}</span>
          </div>
        </div>
        <p className="text-[11px] text-[#4B5875] italic leading-tight">
          * Lưu ý: Đây là khuyến nghị phương tiện tối ưu địa hình. Du khách tự chủ động liên hệ đặt xe với đơn vị vận tải.
        </p>
      </div>

      {/* Module 2: Weather & Outfit Guide */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#0E1D4F]">
          <Icon name="thermostat" className="size-5 text-[#08B3C6]" />
          <h3 className="font-label-caps text-xs uppercase font-bold">
            KHÍ HẬU &amp; TRANG PHỤC KHUYÊN DÙNG
          </h3>
        </div>
        <div className="space-y-2 text-xs text-[#4B5875]">
          <div className="p-3 bg-[#EBF1F0] rounded-xl">
            <strong className="text-[#0E1D4F] block text-sm">11°C – 18°C (Se lạnh chớm đông)</strong>
            <p className="mt-1 leading-relaxed">
              Sương sớm nghịch nhiệt nhiều gió buốt tại đèo Ô Quy Hồ và đỉnh Fansipan.
            </p>
          </div>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-[#205BD6] font-bold">✓</span>
              <span>Áo ấm nhiều lớp dễ cởi khi đi bộ dốc bản làng.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#205BD6] font-bold">✓</span>
              <span>Áo khoác gió có mũ chống thấm ẩm sương mù.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#205BD6] font-bold">✓</span>
              <span>Giày đi bộ đế cao su gai chống trơn trượt trên lối đá lát suối.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Module 3: Budget Transparency Breakdown */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0E1D4F]">
            <Icon name="receipt_long" className="size-5 text-[#205BD6]" />
            <h3 className="font-label-caps text-xs uppercase font-bold">
              MINH BẠCH CHI PHÍ
            </h3>
          </div>
          <span className="text-xs font-bold text-[#0E1D4F]">{activePlan.budget}</span>
        </div>

        <div className="space-y-2 text-xs">
          {MOCK_COST_BREAKDOWN.map((item) => (
            <div key={item.category} className="p-2.5 bg-[#EBF1F0] rounded-xl">
              <div className="flex justify-between font-semibold text-[#0E1D4F]">
                <span>{item.category}</span>
                <span>{item.amount}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#4B5875] mt-0.5">
                <span>{item.detail}</span>
                <span>{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module 4: Cultural & Local Tips */}
      <div className="bg-[#EBF1F0] rounded-2xl border border-[#0E1D4F]/10 p-5 space-y-2 text-xs text-[#4B5875]">
        <span className="font-label-caps text-xs text-[#205BD6] font-bold uppercase flex items-center gap-1.5">
          <Icon name="info" className="size-4" />
          <span>LƯU Ý THỰC ĐỊA BẢN LÀNG</span>
        </span>
        <p className="leading-relaxed">
          Nên đổi trước tiền mặt tại trung tâm trước khi vào bản vì sóng yếu không chuyển khoản được. Mang theo bình nước giữ nhiệt để uống trà ấm dọc đường.
        </p>
      </div>
    </aside>
  );
}

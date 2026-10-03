'use client';

import React from 'react';

export default function ProfileSubscriptionTab() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Plan Card */}
        <div className="bg-gradient-to-br from-[#0E1D4F] to-[#1A3175] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#08B3C6]">
                GÓI HIỆN TẠI
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Đang kích hoạt
              </span>
            </div>
            <h3 className="font-headline-sm text-2xl font-bold mb-2">
              VISTRA Pro Explorer
            </h3>
            <p className="text-xs text-white/70 mb-6">
              Quyền truy cập không giới hạn AI Travel Intelligence, kiểm chứng thực địa vi khí hậu và xuất PDF/lịch trình chuyên nghiệp.
            </p>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Hạn mức tháng này:</span>
                <strong className="text-white">12 / 20 Chuyến đi</strong>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-[#08B3C6] h-full rounded-full w-[60%]"></div>
              </div>
              <div className="text-[11px] text-white/60 text-right">Tự động làm mới: 01/11/2026</div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <span className="text-xs text-white/60 block mb-3">Chế độ Demo (Không thu phí thật)</span>
            <button
              type="button"
              onClick={() => alert('Demo notice: Nâng cấp gói là tính năng mô phỏng.')}
              className="w-full py-3 rounded-full bg-[#08B3C6] hover:bg-[#08B3C6]/90 text-[#0E1D4F] font-bold text-sm transition-all cursor-pointer"
            >
              Nâng cấp gói Doanh nghiệp
            </button>
          </div>
        </div>

        {/* Simulated Invoices */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm">
          <h3 className="font-headline-sm text-xl text-[#0E1D4F] font-bold mb-1">
            Lịch sử thanh toán &amp; Hóa đơn mô phỏng
          </h3>
          <p className="text-xs text-[#4B5875] mb-6">
            Các bản ghi giả lập minh họa khả năng quản lý thanh toán trong tương lai. Không có giao dịch thẻ thực tế nào được thực hiện.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0E1D4F]">
              <thead className="bg-[#EBF1F0]/60 border-b border-[#0E1D4F]/10 text-[#4B5875] font-label-caps uppercase">
                <tr>
                  <th className="py-3 px-4">Mã hóa đơn</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4">Gói dịch vụ</th>
                  <th className="py-3 px-4">Số tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0E1D4F]/5">
                <tr>
                  <td className="py-3.5 px-4 font-mono font-bold">INV-2026-0901</td>
                  <td className="py-3.5 px-4 text-[#4B5875]">01/09/2026</td>
                  <td className="py-3.5 px-4 font-semibold">Pro Explorer (1 Tháng)</td>
                  <td className="py-3.5 px-4 font-bold text-[#0E1D4F]">299.000 VND</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      Thành công
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert('Demo notice: Tải biên lai là mô phỏng.')}
                      className="text-[#205BD6] hover:underline font-bold cursor-pointer"
                    >
                      Tải PDF
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-mono font-bold">INV-2026-0801</td>
                  <td className="py-3.5 px-4 text-[#4B5875]">01/08/2026</td>
                  <td className="py-3.5 px-4 font-semibold">Pro Explorer (1 Tháng)</td>
                  <td className="py-3.5 px-4 font-bold text-[#0E1D4F]">299.000 VND</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      Thành công
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert('Demo notice: Tải biên lai là mô phỏng.')}
                      className="text-[#205BD6] hover:underline font-bold cursor-pointer"
                    >
                      Tải PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-xs text-[#4B5875] flex items-center justify-between">
        <span>
          🔒 <strong>Chính sách minh bạch Demo:</strong> VISTRA hiện vận hành dưới dạng bản trình diễn giao diện thử nghiệm nội bộ. Mọi số liệu gói, hóa đơn và thẻ thanh toán là dữ liệu mẫu phục vụ mục đích đánh giá trải nghiệm người dùng.
        </span>
      </div>
    </div>
  );
}

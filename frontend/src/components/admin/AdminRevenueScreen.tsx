'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

interface Transaction {
  id: string;
  userName: string;
  userEmail: string;
  packageType: string;
  amount: string;
  paymentMethod: string;
  date: string;
  status: 'completed' | 'processing' | 'refunded';
}

const MONTHLY_REVENUE = [
  { month: 'T11/25', amount: 8.5 },
  { month: 'T12/25', amount: 11.2 },
  { month: 'T01/26', amount: 14.8 },
  { month: 'T02/26', amount: 16.5 },
  { month: 'T03/26', amount: 19.2 },
  { month: 'T04/26', amount: 22.0 },
  { month: 'T05/26', amount: 25.4 },
  { month: 'T06/26', amount: 29.8 },
  { month: 'T07/26', amount: 34.0 },
  { month: 'T08/26', amount: 38.5 },
  { month: 'T09/26', amount: 41.2 },
  { month: 'T10/26', amount: 42.6, isCurrent: true },
];

const RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-9081',
    userName: 'Vũ Song Toàn',
    userEmail: 'toan.vu@vistra-travel.vn',
    packageType: 'Pro Explorer (Gói 1 Năm)',
    amount: '4.990.000 ₫',
    paymentMethod: 'VNPAY QR',
    date: '02/10/2026 14:15',
    status: 'completed',
  },
  {
    id: 'TXN-9080',
    userName: 'Lê Hoàng Nam',
    userEmail: 'nam.le@saigon-escapes.com',
    packageType: 'Enterprise Agency (Tháng)',
    amount: '1.990.000 ₫',
    paymentMethod: 'Chuyển khoản Vietcombank',
    date: '02/10/2026 11:30',
    status: 'completed',
  },
  {
    id: 'TXN-9079',
    userName: 'Phạm Thu Trang',
    userEmail: 'thutrang.dalat@gmail.com',
    packageType: 'Pro Explorer (Tháng)',
    amount: '499.000 ₫',
    paymentMethod: 'Ví MoMo',
    date: '01/10/2026 21:05',
    status: 'completed',
  },
  {
    id: 'TXN-9078',
    userName: 'Trần Quốc Bảo',
    userEmail: 'bao.tran@hanoitourist.vn',
    packageType: 'Enterprise Agency (Tháng)',
    amount: '1.990.000 ₫',
    paymentMethod: 'Thẻ Quốc tế (Visa)',
    date: '01/10/2026 18:45',
    status: 'completed',
  },
  {
    id: 'TXN-9077',
    userName: 'Đỗ Hà My',
    userEmail: 'hamy.do@travelblogger.me',
    packageType: 'Pro Explorer (Gói 1 Năm)',
    amount: '4.990.000 ₫',
    paymentMethod: 'VNPAY QR',
    date: '30/09/2026 16:20',
    status: 'completed',
  },
  {
    id: 'TXN-9076',
    userName: 'Bùi Đức Trọng',
    userEmail: 'trong.bui@viettraveler.vn',
    packageType: 'Pro Explorer (Tháng)',
    amount: '499.000 ₫',
    paymentMethod: 'Ví MoMo',
    date: '29/09/2026 09:10',
    status: 'completed',
  },
  {
    id: 'TXN-9075',
    userName: 'Ngô Thanh Tùng',
    userEmail: 'tung.ngo@techtrek.io',
    packageType: 'Gói Tokens AI Mở rộng (50 lượt)',
    amount: '150.000 ₫',
    paymentMethod: 'VNPAY QR',
    date: '28/09/2026 22:30',
    status: 'completed',
  },
];

export default function AdminRevenueScreen() {
  const [filterPeriod, setFilterPeriod] = useState<'12m' | '6m' | '30d'>('12m');

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              TÀI CHÍNH &amp; KINH DOANH SAAS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0E1D4F]/10 text-[#0E1D4F] font-semibold">
              MÔ PHỎNG NGHIỆP VỤ SANDBOX
            </span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Theo dõi Doanh thu &amp; Gói Dịch vụ AI
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-2xl leading-relaxed">
            Phân tích số liệu doanh thu định kỳ tháng (MRR), doanh thu lũy kế, cơ cấu đóng góp từ các gói Pro Explorer và Agency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['12m', '6m', '30d'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setFilterPeriod(period)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterPeriod === period
                  ? 'bg-[#205BD6] text-white shadow-xs'
                  : 'bg-white border border-[#0E1D4F]/15 text-[#4B5875] hover:bg-[#EBF1F0]'
              }`}
            >
              {period === '12m' ? '12 Tháng qua' : period === '6m' ? '6 Tháng qua' : '30 Ngày qua'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#4B5875]">Tổng doanh thu lũy kế</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Icon name="payments" className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0E1D4F]">248.5 tr ₫</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
            <Icon name="trending_up" className="size-3.5" />
            <span>+24.2% so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#4B5875]">MRR (Doanh thu tháng này)</span>
            <div className="w-8 h-8 rounded-xl bg-[#205BD6]/10 text-[#205BD6] flex items-center justify-center">
              <Icon name="account_balance_wallet" className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#205BD6]">42.6 tr ₫</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
            <Icon name="trending_up" className="size-3.5" />
            <span>+15.8% mục tiêu Q4</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#4B5875]">ARPU (TB / Người dùng)</span>
            <div className="w-8 h-8 rounded-xl bg-[#08B3C6]/10 text-[#08B3C6] flex items-center justify-center">
              <Icon name="query_stats" className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0E1D4F]">87.500 ₫</div>
          <div className="text-xs text-[#4B5875] mt-1">
            Tính trên 2,840 tài khoản
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#4B5875]">Tỷ lệ chuyển đổi trả phí</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Icon name="auto_graph" className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600">8.6%</div>
          <div className="text-xs text-[#4B5875] mt-1">
            Free sang Pro &amp; Enterprise
          </div>
        </div>
      </div>

      {/* 12-Month Revenue Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0E1D4F]/10 pb-4">
            <div>
              <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                Biểu đồ Doanh thu Định kỳ Hàng tháng (Triệu VNĐ)
              </h3>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Giai đoạn từ Tháng 11/2025 đến Tháng 10/2026.
              </p>
            </div>
            <span className="text-xs text-[#4B5875] bg-[#EBF1F0] px-3 py-1 rounded-xl">
              Đơn vị: Triệu VNĐ
            </span>
          </div>

          <div className="pt-4">
            <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 px-1">
              {MONTHLY_REVENUE.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.amount / 45) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 px-2 py-0.5 rounded bg-[#0E1D4F] text-white text-[10px] whitespace-nowrap pointer-events-none z-10">
                      {item.amount} tr ₫
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        item.isCurrent
                          ? 'bg-gradient-to-t from-emerald-600 to-[#08B3C6] shadow-sm'
                          : 'bg-gradient-to-t from-[#205BD6] to-[#08B3C6]/60 hover:opacity-100'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                    <span className="text-[10px] text-[#4B5875] font-mono">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Package Revenue Share (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
            Cơ cấu Doanh thu theo Gói
          </h3>
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#205BD6]/5 border border-[#205BD6]/20 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#0E1D4F]">Gói Pro Explorer Cá nhân</span>
                <span className="font-bold text-[#205BD6]">65%</span>
              </div>
              <div className="text-[11px] text-[#4B5875]">161.5 triệu ₫ (412 thành viên)</div>
              <div className="w-full bg-[#0E1D4F]/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#205BD6] h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#08B3C6]/5 border border-[#08B3C6]/20 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#0E1D4F]">Gói Enterprise Agency</span>
                <span className="font-bold text-[#08B3C6]">25%</span>
              </div>
              <div className="text-[11px] text-[#4B5875]">62.1 triệu ₫ (86 công ty du lịch)</div>
              <div className="w-full bg-[#0E1D4F]/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#08B3C6] h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#0E1D4F]">Tiện ích AI Credits &amp; Token</span>
                <span className="font-bold text-amber-600">10%</span>
              </div>
              <div className="text-[11px] text-[#4B5875]">24.9 triệu ₫ (Mua gói lẻ bổ sung)</div>
              <div className="w-full bg-[#0E1D4F]/10 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-[#0E1D4F]/10 shadow-sm overflow-hidden space-y-4 p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0E1D4F]/10 pb-4">
          <div>
            <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
              Nhật ký Giao dịch Nâng cấp Gần đây
            </h3>
            <p className="text-xs text-[#4B5875] mt-0.5">
              Tất cả thanh toán được xử lý tự động qua cổng tích hợp (Mô phỏng sandbox).
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 self-start sm:self-auto">
            100% Giao dịch bảo mật
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EBF1F0] text-[#0E1D4F] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã GD</th>
                <th className="py-3 px-4">Du khách</th>
                <th className="py-3 px-4">Gói dịch vụ</th>
                <th className="py-3 px-4">Số tiền</th>
                <th className="py-3 px-4">Cổng thanh toán</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1D4F]/5">
              {RECENT_TRANSACTIONS.map((txn) => (
                <tr key={txn.id} className="hover:bg-[#EBF1F0]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#0E1D4F]">{txn.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0E1D4F]">{txn.userName}</div>
                    <div className="text-[11px] text-[#4B5875]">{txn.userEmail}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#205BD6]">{txn.packageType}</td>
                  <td className="py-3 px-4 font-bold text-[#0E1D4F]">{txn.amount}</td>
                  <td className="py-3 px-4 text-[#4B5875]">{txn.paymentMethod}</td>
                  <td className="py-3 px-4 text-[#4B5875]">{txn.date}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Thành công</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

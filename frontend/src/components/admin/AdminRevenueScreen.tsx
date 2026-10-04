'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import { appConfig } from '@/config/appConfig';

interface Transaction {
  id: string;
  userName: string;
  userEmail: string;
  packageType: string;
  amount: string;
  amountNum: number;
  paymentMethod: string;
  date: string;
  status: 'completed' | 'processing' | 'refunded';
}

const ALL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-9081',
    userName: 'Vũ Song Toàn',
    userEmail: 'toan.vu@vistra-travel.vn',
    packageType: 'Pro Explorer (Gói 1 Năm)',
    amount: '4.990.000 ₫',
    amountNum: 4990000,
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
    amountNum: 1990000,
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
    amountNum: 499000,
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
    amountNum: 1990000,
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
    amountNum: 4990000,
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
    amountNum: 499000,
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
    amountNum: 150000,
    paymentMethod: 'VNPAY QR',
    date: '28/09/2026 22:30',
    status: 'completed',
  },
  {
    id: 'TXN-9074',
    userName: 'Nguyễn Thị Minh An',
    userEmail: 'minhan.nguyen@gmail.com',
    packageType: 'Pro Explorer (Tháng)',
    amount: '499.000 ₫',
    amountNum: 499000,
    paymentMethod: 'VNPAY QR',
    date: '27/09/2026 15:40',
    status: 'completed',
  },
  {
    id: 'TXN-9073',
    userName: 'Đặng Mai Phương',
    userEmail: 'phuong.dang@outlook.com',
    packageType: 'Gói Tokens AI Mở rộng (100 lượt)',
    amount: '290.000 ₫',
    amountNum: 290000,
    paymentMethod: 'Ví MoMo',
    date: '26/09/2026 10:15',
    status: 'completed',
  },
];

// 12-Month dataset
const MONTHLY_DATA = [
  { label: 'T11/25', span: '01/11 - 30/11/2025', amount: 8.5 },
  { label: 'T12/25', span: '01/12 - 31/12/2025', amount: 11.2 },
  { label: 'T01/26', span: '01/01 - 31/01/2026', amount: 14.8 },
  { label: 'T02/26', span: '01/02 - 28/02/2026', amount: 16.5 },
  { label: 'T03/26', span: '01/03 - 31/03/2026', amount: 19.2 },
  { label: 'T04/26', span: '01/04 - 30/04/2026', amount: 22.0 },
  { label: 'T05/26', span: '01/05 - 31/05/2026', amount: 25.4 },
  { label: 'T06/26', span: '01/06 - 30/06/2026', amount: 29.8 },
  { label: 'T07/26', span: '01/07 - 31/07/2026', amount: 34.0 },
  { label: 'T08/26', span: '01/08 - 31/08/2026', amount: 38.5 },
  { label: 'T09/26', span: '01/09 - 30/09/2026', amount: 41.2 },
  { label: 'T10/26*', span: '01/10 - 03/10/2026', amount: 42.6, isCurrent: true },
];

// 6-Month dataset (Weekly aggregation sample)
const WEEKLY_DATA = [
  { label: 'T5-W1', span: '01/05 - 07/05/2026', amount: 5.8 },
  { label: 'T5-W3', span: '15/05 - 21/05/2026', amount: 6.4 },
  { label: 'T6-W1', span: '01/06 - 07/06/2026', amount: 7.1 },
  { label: 'T6-W3', span: '15/06 - 21/06/2026', amount: 7.9 },
  { label: 'T7-W1', span: '01/07 - 07/07/2026', amount: 8.2 },
  { label: 'T7-W3', span: '15/07 - 21/07/2026', amount: 8.8 },
  { label: 'T8-W1', span: '01/08 - 07/08/2026', amount: 9.4 },
  { label: 'T8-W3', span: '15/08 - 21/08/2026', amount: 9.8 },
  { label: 'T9-W1', span: '01/09 - 07/09/2026', amount: 10.2 },
  { label: 'T9-W3', span: '15/09 - 21/09/2026', amount: 10.5 },
  { label: 'T10-W1', span: '01/10 - 03/10/2026', amount: 11.2, isCurrent: true },
];

// 30-Day dataset (Daily sample)
const DAILY_DATA = [
  { label: '04/09', span: '04/09/2026', amount: 1.2 },
  { label: '07/09', span: '07/09/2026', amount: 1.5 },
  { label: '10/09', span: '10/09/2026', amount: 1.3 },
  { label: '13/09', span: '13/09/2026', amount: 1.6 },
  { label: '16/09', span: '16/09/2026', amount: 1.8 },
  { label: '19/09', span: '19/09/2026', amount: 1.4 },
  { label: '22/09', span: '22/09/2026', amount: 1.7 },
  { label: '25/09', span: '25/09/2026', amount: 1.9 },
  { label: '28/09', span: '28/09/2026', amount: 2.1 },
  { label: '01/10', span: '01/10/2026', amount: 2.4 },
  { label: '03/10', span: '03/10/2026', amount: 2.5, isCurrent: true },
];

export default function AdminRevenueScreen() {
  const [filterPeriod, setFilterPeriod] = useState<'12m' | '6m' | '30d' | 'custom'>('12m');
  const [customStart, setCustomStart] = useState<string>('2026-09-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-10-03');
  const [appliedCustom, setAppliedCustom] = useState<{ start: string; end: string } | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  // Pagination for transactions table (ADM-LIST-01)
  const [txnPage, setTxnPage] = useState(1);
  const TXN_PAGE_SIZE = 5;

  // Determine active granularity based on appConfig (ADM-REV-01B)
  const { chartData, granularityLabel, unitLabel, totalPeriodRevenue } = useMemo(() => {
    let days = 365;

    if (filterPeriod === '30d') {
      days = 30;
    } else if (filterPeriod === '6m') {
      days = 180;
    } else if (filterPeriod === '12m') {
      days = 365;
    } else if (filterPeriod === 'custom' && appliedCustom) {
      const d1 = new Date(appliedCustom.start).getTime();
      const d2 = new Date(appliedCustom.end).getTime();
      days = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    }

    if (days <= appConfig.revenueGranularity.dailyMaxDays) {
      const sum = DAILY_DATA.reduce((acc, d) => acc + d.amount, 0);
      return {
        chartData: DAILY_DATA,
        granularityLabel: 'Theo ngày (Daily)',
        unitLabel: 'Triệu VNĐ / Ngày',
        totalPeriodRevenue: sum.toFixed(1),
      };
    } else if (days <= appConfig.revenueGranularity.weeklyMaxDays) {
      const sum = WEEKLY_DATA.reduce((acc, d) => acc + d.amount, 0);
      return {
        chartData: WEEKLY_DATA,
        granularityLabel: 'Theo tuần (Weekly)',
        unitLabel: 'Triệu VNĐ / Tuần',
        totalPeriodRevenue: sum.toFixed(1),
      };
    } else {
      const sum = MONTHLY_DATA.reduce((acc, d) => acc + d.amount, 0);
      return {
        chartData: MONTHLY_DATA,
        granularityLabel: 'Theo tháng (Monthly)',
        unitLabel: 'Triệu VNĐ / Tháng',
        totalPeriodRevenue: sum.toFixed(1),
      };
    }
  }, [filterPeriod, appliedCustom]);

  const maxChartVal = Math.max(...chartData.map((d) => d.amount));

  // Handle custom date apply
  const handleApplyCustomDates = () => {
    if (!customStart || !customEnd) {
      setDateWarning('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      setDateWarning('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }
    setDateWarning(null);
    setAppliedCustom({ start: customStart, end: customEnd });
    setFilterPeriod('custom');
  };

  const handleResetDates = () => {
    setFilterPeriod('12m');
    setAppliedCustom(null);
    setDateWarning(null);
  };

  // Transaction pagination
  const totalTxnPages = Math.ceil(ALL_TRANSACTIONS.length / TXN_PAGE_SIZE);
  const paginatedTransactions = ALL_TRANSACTIONS.slice(
    (txnPage - 1) * TXN_PAGE_SIZE,
    txnPage * TXN_PAGE_SIZE
  );

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
              ANALYTICS
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Theo dõi Doanh thu &amp; Gói Dịch vụ AI
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-2xl leading-relaxed">
            Phân tích số liệu doanh thu định kỳ tháng (MRR), doanh thu lũy kế, cơ cấu đóng góp từ các gói Pro Explorer và Agency.
          </p>
        </div>

        {/* Date Filter Controls (ADM-REV-01A) */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {(['12m', '6m', '30d'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  setFilterPeriod(period);
                  setAppliedCustom(null);
                  setDateWarning(null);
                }}
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

          {/* Custom Date Inputs (ADM-REV-01A) */}
          <div className="flex items-center gap-2 bg-[#EBF1F0]/50 p-2 rounded-xl border border-[#0E1D4F]/10 text-xs">
            <span className="text-[#4B5875] text-[11px]">Từ:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white px-2 py-1 rounded-lg border border-[#0E1D4F]/15 text-[#0E1D4F] text-xs"
            />
            <span className="text-[#4B5875] text-[11px]">Đến:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white px-2 py-1 rounded-lg border border-[#0E1D4F]/15 text-[#0E1D4F] text-xs"
            />
            <button
              type="button"
              onClick={handleApplyCustomDates}
              className="px-2.5 py-1 bg-[#205BD6] text-white font-semibold rounded-lg hover:bg-[#1847a8] transition-colors cursor-pointer"
            >
              Lọc
            </button>
            {appliedCustom && (
              <button
                type="button"
                onClick={handleResetDates}
                className="text-[11px] text-[#205BD6] hover:underline cursor-pointer"
              >
                Đặt lại
              </button>
            )}
          </div>
          {dateWarning && (
            <span className="text-[11px] text-red-500 font-medium">{dateWarning}</span>
          )}
        </div>
      </div>

      {/* 4 Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#4B5875]">Doanh thu trong kỳ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Icon name="payments" className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0E1D4F]">
            {totalPeriodRevenue} tr ₫
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
            <Icon name="trending_up" className="size-3.5" />
            <span>Kỳ: {granularityLabel}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#4B5875]">MRR (Tháng 10/2026)</span>
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

      {/* Adaptive Revenue Chart & Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Adaptive Chart (7 cols) (ADM-REV-01B, FIX-02) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#0E1D4F]/10 pb-4">
            <div>
              <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                Biểu đồ Doanh thu Định kỳ ({granularityLabel})
              </h3>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Mức hạt thích ứng: {granularityLabel} · Đơn vị: {unitLabel}
              </p>
            </div>
            <span className="text-xs text-[#205BD6] font-semibold bg-[#205BD6]/10 px-3 py-1 rounded-xl">
              {unitLabel}
            </span>
          </div>

          <div className="pt-2">
            <div className="h-52 flex items-end justify-between gap-1.5 sm:gap-2 px-1" aria-label="Biểu đồ doanh thu">
              {chartData.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.amount / maxChartVal) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 px-2.5 py-1 rounded-xl bg-[#0E1D4F] text-white text-[10px] whitespace-nowrap pointer-events-none z-20 shadow-md flex flex-col gap-0.5">
                      <strong className="text-emerald-400">{item.amount} triệu ₫</strong>
                      <span className="text-[9px] text-gray-300">{item.span}</span>
                    </div>

                    <div className="w-full h-40 flex items-end justify-center">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          item.isCurrent
                            ? 'bg-gradient-to-t from-emerald-600 to-[#08B3C6] shadow-sm'
                            : 'bg-gradient-to-t from-[#205BD6] to-[#08B3C6]/60 hover:opacity-100'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-mono ${item.isCurrent ? 'font-bold text-[#205BD6]' : 'text-[#4B5875]'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#0E1D4F]/10 flex items-center justify-between text-xs text-[#4B5875]">
            <span>Tổng cộng chu kỳ hiển thị: <strong className="text-[#0E1D4F]">{totalPeriodRevenue} tr ₫</strong></span>
            <span className="text-[11px] text-[#4B5875] italic">* Di chuột để xem chi tiết khoảng ngày</span>
          </div>
        </div>

        {/* Package Revenue Share Donut with Leader Lines (5 cols) (ADM-REV-02A) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="border-b border-[#0E1D4F]/10 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                Cơ cấu Doanh thu theo Gói
              </h3>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Tỷ trọng đóng góp từ các gói dịch vụ AI
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600">248.5 tr ₫</span>
          </div>

          {/* SVG Donut Chart with Leader Lines (ADM-REV-02A) */}
          <div className="py-2 flex items-center justify-center">
            <svg viewBox="0 0 280 180" className="w-full max-w-[280px] h-[180px]" aria-label="Biểu đồ donut cơ cấu doanh thu">
              {/* Donut Segments (circumference = 314.16 for r=50) */}
              {/* Pro Explorer: 65% = 204.2 */}
              <circle
                cx="140"
                cy="90"
                r="50"
                fill="transparent"
                stroke="#205BD6"
                strokeWidth="24"
                strokeDasharray="204.2 314.16"
                strokeDashoffset="78.5"
                className="transition-all"
              />
              {/* Enterprise Agency: 25% = 78.5 */}
              <circle
                cx="140"
                cy="90"
                r="50"
                fill="transparent"
                stroke="#08B3C6"
                strokeWidth="24"
                strokeDasharray="78.5 314.16"
                strokeDashoffset="-125.7"
                className="transition-all"
              />
              {/* AI Credits & Tokens: 10% = 31.4 */}
              <circle
                cx="140"
                cy="90"
                r="50"
                fill="transparent"
                stroke="#F59E0B"
                strokeWidth="24"
                strokeDasharray="31.4 314.16"
                strokeDashoffset="-204.2"
                className="transition-all"
              />

              {/* Center Revenue Total */}
              <text x="140" y="86" textAnchor="middle" className="text-xs font-bold fill-[#0E1D4F]">
                248.5 tr
              </text>
              <text x="140" y="102" textAnchor="middle" className="text-[10px] fill-[#4B5875]">
                Doanh thu
              </text>

              {/* Leader Line for Pro Explorer (Left) */}
              <polyline points="90,85 45,85 20,85" fill="none" stroke="#205BD6" strokeWidth="1.2" />
              <text x="18" y="80" textAnchor="start" className="text-[9px] font-bold fill-[#205BD6]">
                Pro: 65% (161.5M)
              </text>

              {/* Leader Line for Enterprise (Top Right) */}
              <polyline points="175,55 215,40 250,40" fill="none" stroke="#08B3C6" strokeWidth="1.2" />
              <text x="252" y="38" textAnchor="end" className="text-[9px] font-bold fill-[#08B3C6]">
                Agency: 25% (62.1M)
              </text>

              {/* Leader Line for AI Credits (Bottom Right) */}
              <polyline points="175,125 210,145 250,145" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
              <text x="252" y="157" textAnchor="end" className="text-[9px] font-bold fill-[#D97706]">
                Tokens: 10% (24.9M)
              </text>
            </svg>
          </div>

          {/* Breakdown Summary Chips */}
          <div className="grid grid-cols-3 gap-2 bg-[#EBF1F0]/60 p-3 rounded-2xl border border-[#0E1D4F]/10 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-[#205BD6]">
                <span className="w-2 h-2 rounded-full bg-[#205BD6]"></span>
                <span>Pro Explorer</span>
              </div>
              <div className="text-sm font-bold text-[#0E1D4F] mt-0.5">161.5 tr ₫</div>
              <div className="text-[10px] text-[#4B5875]">65% tổng thu</div>
            </div>
            <div className="border-x border-[#0E1D4F]/10">
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-[#08B3C6]">
                <span className="w-2 h-2 rounded-full bg-[#08B3C6]"></span>
                <span>Agency</span>
              </div>
              <div className="text-sm font-bold text-[#08B3C6] mt-0.5">62.1 tr ₫</div>
              <div className="text-[10px] text-[#4B5875]">25% tổng thu</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Tokens</span>
              </div>
              <div className="text-sm font-bold text-amber-700 mt-0.5">24.9 tr ₫</div>
              <div className="text-[10px] text-[#4B5875]">10% tổng thu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table with Pagination (ADM-LIST-01) */}
      <div className="bg-white rounded-3xl border border-[#0E1D4F]/10 shadow-sm overflow-hidden p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0E1D4F]/10 pb-4">
          <div>
            <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
              Nhật ký Giao dịch Nâng cấp Gần đây
            </h3>
            <p className="text-xs text-[#4B5875] mt-0.5">
              Tất cả thanh toán được xử lý tự động qua cổng tích hợp.
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
              {paginatedTransactions.map((txn) => (
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

        {/* Transaction Pagination (ADM-LIST-01) */}
        <div className="pt-4 border-t border-[#0E1D4F]/10 flex items-center justify-between text-xs text-[#4B5875]">
          <div>
            Hiển thị {paginatedTransactions.length} / {ALL_TRANSACTIONS.length} giao dịch
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={txnPage <= 1}
              onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#0E1D4F]/15 font-semibold text-[#0E1D4F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] cursor-pointer"
            >
              Trước
            </button>
            <span className="font-semibold text-[#0E1D4F]">
              Trang {txnPage} / {totalTxnPages}
            </span>
            <button
              type="button"
              disabled={txnPage >= totalTxnPages}
              onClick={() => setTxnPage((p) => Math.min(totalTxnPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#0E1D4F]/15 font-semibold text-[#0E1D4F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

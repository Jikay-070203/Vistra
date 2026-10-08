'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import MockBadge from './demo/MockBadge';
import { ADMIN_MOCK_REVENUE, ADMIN_MOCK_REVENUE_METRICS } from './demo/adminDemoData';

export default function AdminRevenueScreen() {
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredTransactions = useMemo(() => {
    return ADMIN_MOCK_REVENUE.filter((item) => {
      const matchSearch =
        item.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        item.userName.toLowerCase().includes(search.toLowerCase()) ||
        item.planTitle.toLowerCase().includes(search.toLowerCase());
      const matchTier = filterTier === 'all' || item.tier === filterTier;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchTier && matchStatus;
    });
  }, [search, filterTier, filterStatus]);

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <header className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Doanh thu &amp; Thống kê Giao dịch
          </h1>
          <p className="text-sm text-[#4B5875] mt-1">
            Báo cáo tổng hợp luồng doanh thu, các gói đăng ký dịch vụ và lịch sử thanh toán thành công.
          </p>
        </div>
        <MockBadge />
      </header>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs space-y-1">
          <span className="text-xs text-[#4B5875] font-semibold">Tổng doanh thu tích lũy</span>
          <p className="text-2xl font-bold text-[#0E1D4F]">
            {formatVnd(ADMIN_MOCK_REVENUE_METRICS.totalRevenueVnd)}
          </p>
          <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
            +{ADMIN_MOCK_REVENUE_METRICS.growthRatePct}% so với tháng trước
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs space-y-1">
          <span className="text-xs text-[#4B5875] font-semibold">Doanh thu tháng 10/2026</span>
          <p className="text-2xl font-bold text-[#205BD6]">
            {formatVnd(ADMIN_MOCK_REVENUE_METRICS.monthlyRevenueVnd)}
          </p>
          <span className="text-[10px] text-[#4B5875]">Đạt 96% chỉ tiêu tháng</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs space-y-1">
          <span className="text-xs text-[#4B5875] font-semibold">Giá trị trung bình / đơn</span>
          <p className="text-2xl font-bold text-[#08B3C6]">
            {formatVnd(ADMIN_MOCK_REVENUE_METRICS.averageOrderValueVnd)}
          </p>
          <span className="text-[10px] text-[#4B5875]">Tính trên gói trả phí</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs space-y-1">
          <span className="text-xs text-[#4B5875] font-semibold">Tổng giao dịch ghi nhận</span>
          <p className="text-2xl font-bold text-[#0E1D4F]">195 đơn</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Tỷ lệ thành công 98.2%</span>
        </div>
      </div>

      {/* Tier Distribution Breakdown */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#0E1D4F]/10">
          <h2 className="text-lg font-bold text-[#0E1D4F] flex items-center gap-2">
            <Icon name="donut_large" className="size-5 text-[#205BD6]" />
            <span>Phân bố Doanh thu theo Gói Kế hoạch</span>
          </h2>
          <MockBadge size="sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ADMIN_MOCK_REVENUE_METRICS.tierDistribution.map((tier) => (
            <div key={tier.label} className="p-4 bg-[#EBF1F0]/40 rounded-2xl border border-[#0E1D4F]/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0E1D4F] flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span>{tier.label}</span>
                </span>
                <span className="text-xs font-bold text-[#205BD6]">{tier.percentage}%</span>
              </div>
              <p className="text-lg font-bold text-[#0E1D4F]">{formatVnd(tier.revenueVnd)}</p>
              <span className="block text-[11px] text-[#4B5875]">{tier.count} lượt đăng ký</span>
              <div className="w-full h-1.5 rounded-full bg-[#EBF1F0] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${tier.percentage}%`, backgroundColor: tier.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transactions Table */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0E1D4F]">Lịch sử Giao dịch gần nhất</h2>
            <p className="text-xs text-[#4B5875] mt-0.5">Danh sách đơn hàng và trạng thái cổng thanh toán.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#4B5875]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mã đơn hoặc khách..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10"
              />
            </div>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="text-xs px-3 py-1.5 bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10 text-[#0E1D4F]"
            >
              <option value="all">Tất cả gói</option>
              <option value="Cơ bản">Cơ bản</option>
              <option value="Nâng cao">Nâng cao</option>
              <option value="Chuyên sâu">Chuyên sâu</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-3 py-1.5 bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10 text-[#0E1D4F]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="pending">Chờ xử lý</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#0E1D4F]/10">
          <table className="w-full text-xs text-left text-[#4B5875]">
            <thead className="bg-[#EBF1F0]/70 text-[#0E1D4F] font-bold uppercase tracking-wider text-[11px] border-b border-[#0E1D4F]/10">
              <tr>
                <th className="p-3.5">Mã đơn</th>
                <th className="p-3.5">Khách hàng</th>
                <th className="p-3.5">Hành trình</th>
                <th className="p-3.5">Gói dịch vụ</th>
                <th className="p-3.5 text-right">Số tiền</th>
                <th className="p-3.5">Cổng thanh toán</th>
                <th className="p-3.5">Thời gian</th>
                <th className="p-3.5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1D4F]/5">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#EBF1F0]/40 transition-colors">
                  <td className="p-3.5 font-mono text-[10px] font-semibold text-[#0E1D4F]">{tx.orderCode}</td>
                  <td className="p-3.5">
                    <strong className="block text-[#0E1D4F]">{tx.userName}</strong>
                    <span className="text-[10px] text-[#4B5875]">{tx.email}</span>
                  </td>
                  <td className="p-3.5 max-w-[200px] truncate font-medium text-[#0E1D4F]">{tx.planTitle}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                      {tx.tier}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-[#0E1D4F]">{formatVnd(tx.amountVnd)}</td>
                  <td className="p-3.5">{tx.paymentMethod}</td>
                  <td className="p-3.5 text-[11px]">{tx.date}</td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        tx.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.status === 'success' ? 'Thành công' : tx.status === 'pending' ? 'Chờ thanh toán' : 'Đã hoàn'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { DemoPlan } from '@/context/DemoPlanContext';

interface ProfileActivityTabProps {
  plans: DemoPlan[];
}

export default function ProfileActivityTab({ plans }: ProfileActivityTabProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#0E1D4F]/10">
        <div>
          <h2 className="font-headline-sm text-xl text-[#0E1D4F] font-bold">
            Lịch sử hoạt động gần đây
          </h2>
          <p className="text-xs text-[#4B5875]">
            Các hành trình đã tạo và trạng thái gắn với phiên làm việc của tài khoản.
          </p>
        </div>
        <Link
          href="/my-trips"
          className="px-5 py-2 rounded-full bg-[#0E1D4F] text-white text-xs font-bold hover:bg-[#205BD6] transition-all"
        >
          Xem tất cả tại Chuyến đi của tôi →
        </Link>
      </div>

      <div className="space-y-4">
        {plans.slice(0, 5).map((plan) => (
          <div
            key={plan.id}
            className="p-4 rounded-2xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    plan.status === 'confirmed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {plan.status === 'confirmed' ? '✓ Đã chốt chính thức' : '✎ Bản nháp chưa chốt'}
                </span>
                <span className="text-xs text-[#4B5875]">• Cập nhật: {plan.lastUpdated}</span>
              </div>
              <h4 className="text-base font-bold text-[#0E1D4F]">{plan.title}</h4>
              <p className="text-xs text-[#4B5875] mt-0.5">
                📍 {plan.destination} | Xuất phát: {plan.origin} | {plan.duration}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/trip-plan?id=${plan.id}`}
                className="px-4 py-2 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F] text-xs font-bold hover:bg-[#205BD6] hover:text-white transition-all"
              >
                Xem toàn văn
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { appConfig } from '@/config/appConfig';
import Icon from '@/components/ui/Icon';
import { getSystemHealth, HealthServiceError } from '@/services/systemService';
import type { HealthCheckState } from '@/types/system';

export default function AdminKpiSummary() {
  const [healthState, setHealthState] = useState<HealthCheckState>({
    status: 'idle',
  });

  const handleCheckHealth = async (customUrl?: string) => {
    if (healthState.status === 'loading') return;

    setHealthState({
      status: 'loading',
    });

    const checkedAt = new Date().toLocaleTimeString('vi-VN', { hour12: false });

    try {
      const result = await getSystemHealth(customUrl);
      setHealthState({
        status: 'success',
        data: result.data,
        httpStatus: result.httpStatus,
        endpoint: result.endpoint,
        checkedAt,
      });
    } catch (err: unknown) {
      if (err instanceof HealthServiceError) {
        setHealthState({
          status: 'error',
          errorMessage: err.message,
          httpStatus: err.httpStatus,
          endpoint: err.endpoint,
          errorType: err.errorType,
          checkedAt,
        });
      } else {
        setHealthState({
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Lỗi không xác định khi gọi API.',
          checkedAt,
          errorType: 'network_cors',
        });
      }
    }
  };

  return (
    <>
      {/* Top Breadcrumb & Tag */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#205BD6]"></span>
        <span className="font-label-caps text-xs text-[#205BD6] uppercase tracking-widest font-bold">
          QUẢN TRỊ HỆ THỐNG &amp; ĐÁNH GIÁ CHẤT LƯỢNG MÔ HÌNH AI
        </span>
      </div>

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#0E1D4F]/10 mb-8">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl text-[#0E1D4F] tracking-tight font-bold">
            Trung tâm Giám sát AI &amp; Vận hành Thử nghiệm
          </h1>
          <p className="font-body-md text-sm sm:text-base text-[#4B5875] mt-2">
            Theo dõi sức khỏe các agent điều phối, độ trễ vi khí hậu RAG, chỉ số đánh giá LLM-as-a-Judge và nhật ký thực thi lịch trình.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ thống Thử nghiệm: Sẵn sàng
          </span>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#4B5875] uppercase tracking-wider block mb-2">
              Người dùng trải nghiệm
            </span>
            <div className="text-3xl font-bold text-[#0E1D4F]">1.240</div>
            <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <span>↑ 18%</span>
              <span className="text-[#4B5875] font-normal">so với tuần trước</span>
            </div>
            <span className="text-[11px] text-[#4B5875]/80 block mt-3 pt-2 border-t border-[#0E1D4F]/5">
              Đo lường chu kỳ tháng 10
            </span>
          </div>

          {/* Vùng tích hợp kiểm tra API Health (GET /health) */}
          <div className="mt-5 pt-4 border-t border-[#0E1D4F]/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#205BD6]" aria-hidden="true" />
                <span className="text-xs font-bold text-[#0E1D4F] uppercase tracking-wider">
                  Trạng thái API
                </span>
              </div>
              <button
                type="button"
                id="btn-check-api-health"
                onClick={() => handleCheckHealth()}
                disabled={healthState.status === 'loading'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#205BD6] text-white hover:bg-[#1a4ab0] disabled:opacity-60 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-[#205BD6] focus:ring-offset-1 cursor-pointer shadow-2xs active:scale-98"
                aria-label="Kiểm tra kết nối API Health"
              >
                <Icon
                  name="sync"
                  className={`size-3.5 ${healthState.status === 'loading' ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{healthState.status === 'loading' ? 'Đang kiểm tra...' : 'Kiểm tra'}</span>
              </button>
            </div>

            {/* Khu vực hiển thị kết quả kiểm tra API với aria-live cho Screen Reader */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="rounded-2xl transition-all duration-200"
            >
              {healthState.status === 'idle' && (
                <div className="bg-[#EBF1F0]/70 border border-[#0E1D4F]/10 rounded-2xl p-3 text-[#4B5875] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-xs text-[#0E1D4F]">Chưa kiểm tra</span>
                  </div>
                  <span className="text-[11px] text-[#4B5875]">Bấm nút để gọi GET /health</span>
                </div>
              )}

              {healthState.status === 'loading' && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 text-blue-900 flex items-center gap-2.5 animate-pulse">
                  <Icon name="sync" className="size-4 animate-spin text-[#205BD6] shrink-0" aria-hidden="true" />
                  <div className="text-xs">
                    <div className="font-bold text-[#0E1D4F]">Đang kiểm tra kết nối backend...</div>
                    <div className="text-[11px] text-[#4B5875] font-mono mt-0.5">
                      Gửi GET /health tới backend
                    </div>
                  </div>
                </div>
              )}

              {healthState.status === 'success' && (
                <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-3 text-emerald-950 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <Icon name="check_circle" className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>Kết nối thành công (HTTP {healthState.httpStatus})</span>
                    </div>
                    {healthState.checkedAt && (
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {healthState.checkedAt}
                      </span>
                    )}
                  </div>
                  <div className="bg-white/80 rounded-xl p-2 border border-emerald-200/60 text-[11px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#4B5875]">status:</span>
                      <strong className="text-emerald-700">{healthState.data?.status ?? 'ok'}</strong>
                    </div>
                    {healthState.data?.version && (
                      <div className="flex justify-between">
                        <span className="text-[#4B5875]">version:</span>
                        <strong className="text-[#0E1D4F]">{String(healthState.data.version)}</strong>
                      </div>
                    )}
                    {healthState.endpoint && (
                      <div className="text-[10px] text-[#4B5875] truncate pt-1 border-t border-emerald-100">
                        Endpoint: <code>{healthState.endpoint}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {healthState.status === 'error' && (
                <div className="bg-red-50/90 border border-red-300 rounded-2xl p-3 text-red-950 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-red-800">
                      <Icon name="error" className="size-4 text-red-600 shrink-0" aria-hidden="true" />
                      <span>
                        {healthState.errorType === 'missing_url'
                          ? 'Thiếu cấu hình URL'
                          : healthState.errorType === 'network_cors'
                          ? 'Lỗi kết nối / CORS'
                          : healthState.httpStatus
                          ? `Lỗi HTTP ${healthState.httpStatus}`
                          : 'Lỗi kiểm tra API'}
                      </span>
                    </div>
                    {healthState.checkedAt && (
                      <span className="text-[10px] text-red-700 font-mono">
                        {healthState.checkedAt}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-red-900 leading-relaxed font-medium">
                    {healthState.errorMessage}
                  </p>
                  {healthState.endpoint && (
                    <div className="text-[10px] text-red-700/80 font-mono truncate pt-1 border-t border-red-200/60">
                      Endpoint: {healthState.endpoint}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
          <span className="text-xs font-bold text-[#4B5875] uppercase tracking-wider block mb-2">
            Tỷ lệ khớp ý định thực tế
          </span>
          <div className="text-3xl font-bold text-[#205BD6]">
            {appConfig.hero.planAcceptanceRate.value}
          </div>
          <div className="text-xs text-[#4B5875] mt-2">
            {appConfig.hero.planAcceptanceRate.subtext}
          </div>
          <span className="text-[11px] text-[#4B5875]/80 block mt-3 pt-2 border-t border-[#0E1D4F]/5">
            Đánh giá logic hành trình
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
          <span className="text-xs font-bold text-[#4B5875] uppercase tracking-wider block mb-2">
            Tối ưu thời gian lập kế hoạch
          </span>
          <div className="text-3xl font-bold text-[#08B3C6]">
            {appConfig.hero.planningTimeOptimization.value}
          </div>
          <div className="text-xs text-[#4B5875] mt-2">
            {appConfig.hero.planningTimeOptimization.subtext}
          </div>
          <span className="text-[11px] text-[#4B5875]/80 block mt-3 pt-2 border-t border-[#0E1D4F]/5">
            So sánh quy trình đối chứng
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#0E1D4F]/10 shadow-sm">
          <span className="text-xs font-bold text-[#4B5875] uppercase tracking-wider block mb-2">
            Độ trễ điều phối AI (P95)
          </span>
          <div className="text-3xl font-bold text-[#0E1D4F]">1.42s</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">
            ✓ Trong ngưỡng SLA &lt; 2.0s
          </div>
          <span className="text-[11px] text-[#4B5875]/80 block mt-3 pt-2 border-t border-[#0E1D4F]/5">
            RAG vi khí hậu &amp; giải ràng buộc
          </span>
        </div>
      </div>
    </>
  );
}

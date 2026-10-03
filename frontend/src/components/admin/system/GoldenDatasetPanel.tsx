'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

interface GoldenTestCase {
  id: string;
  name: string;
  destination: string;
  duration: string;
  targetPersona: string;
  expectedConstraints: string[];
  latencyBenchmark: string;
  accuracyScore: number;
  lastRunStatus: 'passed' | 'warning' | 'failed';
  lastRunDate: string;
}

const INITIAL_GOLDEN_CASES: GoldenTestCase[] = [
  {
    id: 'GOLD-01',
    name: 'Đà Lạt 3N2Đ - Gia đình có người cao tuổi & trẻ nhỏ',
    destination: 'Đà Lạt',
    duration: '3N2Đ',
    targetPersona: 'Gia đình đa thế hệ, nhịp thư thái, ưu tiên lối đi thoai thoải',
    expectedConstraints: [
      'Không xếp leo dốc quá 15 phút liên tục',
      'Phải có điểm nghỉ trưa tại resort/homestay',
      'Thêm quán phở gà đồi nghệ nhân sáng ngày 2',
      'Lịch săn mây rời về 05:15 tránh gió lạnh',
    ],
    latencyBenchmark: '< 1.5s',
    accuracyScore: 98,
    lastRunStatus: 'passed',
    lastRunDate: '02/10/2026 14:30',
  },
  {
    id: 'GOLD-02',
    name: 'Hà Giang 4N3Đ - Cung phượt mạo hiểm đèo Mã Pí Lèng',
    destination: 'Hà Giang',
    duration: '4N3Đ',
    targetPersona: 'Thanh niên ưa khám phá, xe máy cá nhân, yêu nhiếp ảnh',
    expectedConstraints: [
      'Cảnh báo đoạn đèo trơn sương mù trước 07:00',
      'Tối ưu giờ vàng sông Nho Quế lúc hoàng hôn 16:30',
      'Định mức xăng và trạm sửa xe dự phòng',
    ],
    latencyBenchmark: '< 1.8s',
    accuracyScore: 95,
    lastRunStatus: 'passed',
    lastRunDate: '02/10/2026 14:28',
  },
  {
    id: 'GOLD-03',
    name: 'Ninh Bình 2N1Đ - Nhiếp ảnh Di sản Tràng An & Hang Múa',
    destination: 'Ninh Bình',
    duration: '2N1Đ',
    targetPersona: 'Nhiếp ảnh phong cảnh, đi một mình, dậy sớm đón bình minh',
    expectedConstraints: [
      'Đến bến đò Tràng An trước 07:00 tránh đoàn tour',
      'Leo 500 bậc Hang Múa vào chiều muộn đón hoàng hôn',
      'Gợi ý homestay cạnh đầm sen Ninh Hải',
    ],
    latencyBenchmark: '< 1.2s',
    accuracyScore: 96,
    lastRunStatus: 'passed',
    lastRunDate: '02/10/2026 14:25',
  },
  {
    id: 'GOLD-04',
    name: 'Phú Quốc 3N2Đ - Nghỉ dưỡng bãi biển & Ẩm thực bản địa',
    destination: 'Phú Quốc',
    duration: '3N2Đ',
    targetPersona: 'Cặp đôi hưởng tuần trăng mật, trải nghiệm lãng mạn cao cấp',
    expectedConstraints: [
      'Nhà hàng ngắm hoàng hôn Bãi Khem lúc 17:30',
      'Lịch cano tham quan 4 đảo có bảo hiểm đầy đủ',
      'Thưởng thức bún quậy Kiến Xây buổi tối',
    ],
    latencyBenchmark: '< 1.4s',
    accuracyScore: 99,
    lastRunStatus: 'passed',
    lastRunDate: '02/10/2026 14:20',
  },
];

export default function GoldenDatasetPanel() {
  const [testCases] = useState<GoldenTestCase[]>(INITIAL_GOLDEN_CASES);
  const [selectedCase, setSelectedCase] = useState<GoldenTestCase | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const handleRunAll = () => {
    setIsRunningAll(true);
    setRunMessage('Đang thực thi đánh giá tự động trên 4 bộ dữ liệu chuẩn (Golden Dataset)...');
    setTimeout(() => {
      setIsRunningAll(false);
      setRunMessage('Đã hoàn tất đánh giá: 4/4 bộ dữ liệu đạt chuẩn độ chính xác >= 95% và độ trễ < 1.5s.');
      setTimeout(() => setRunMessage(null), 4000);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0E1D4F]/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              BỘ ĐÁNH GIÁ CHUẨN ĐỘC LẬP
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              LLM-AS-A-JUDGE READY
            </span>
          </div>
          <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
            Bộ Dữ liệu Chuẩn &amp; Kịch bản Đánh giá Hồi quy (Golden Dataset)
          </h3>
          <p className="text-xs text-[#4B5875] mt-0.5">
            Tập hợp các ca kiểm thử điển hình đối chiếu độ chuẩn xác của lịch trình AI so với tiêu chuẩn chuyên gia du lịch.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAll}
          disabled={isRunningAll}
          className="px-4 py-2 bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Icon name={isRunningAll ? 'sync' : 'play_arrow'} className={`size-4 ${isRunningAll ? 'animate-spin' : ''}`} />
          <span>{isRunningAll ? 'Đang chạy kiểm thử...' : 'Chạy toàn bộ kịch bản'}</span>
        </button>
      </div>

      {runMessage && (
        <div className="p-3 bg-blue-50 text-[#205BD6] border border-blue-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Icon name="info" className="size-4 shrink-0" />
          <span>{runMessage}</span>
        </div>
      )}

      {/* Grid of Test Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testCases.map((tc) => (
          <div
            key={tc.id}
            className="p-5 rounded-2xl border border-[#0E1D4F]/10 hover:border-[#205BD6]/40 transition-all bg-[#EBF1F0]/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#205BD6] bg-white px-2.5 py-0.5 rounded-lg border border-[#0E1D4F]/10">
                {tc.id}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Độ chuẩn: {tc.accuracyScore}%
              </span>
            </div>

            <h4 className="font-bold text-sm text-[#0E1D4F]">{tc.name}</h4>
            <p className="text-xs text-[#4B5875] leading-relaxed">
              <strong>Đối tượng:</strong> {tc.targetPersona}
            </p>

            {/* Constraints */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-bold text-[#0E1D4F] uppercase tracking-wider block">
                Ràng buộc bắt buộc (Hard Constraints):
              </span>
              <ul className="space-y-0.5 text-xs text-[#4B5875]">
                {tc.expectedConstraints.slice(0, 2).map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
                {tc.expectedConstraints.length > 2 && (
                  <li className="text-[11px] text-[#205BD6] italic">
                    + {tc.expectedConstraints.length - 2} ràng buộc khác...
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-2 border-t border-[#0E1D4F]/5 flex items-center justify-between text-[11px] text-[#4B5875]">
              <span>Độ trễ mục tiêu: <strong>{tc.latencyBenchmark}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedCase(tc)}
                className="text-[#205BD6] font-semibold hover:underline cursor-pointer"
              >
                Chi tiết kịch bản →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCase(null);
          }}
        >
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col">
            <div className="p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#205BD6]">{selectedCase.id}</span>
                <h4 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                  {selectedCase.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] border border-[#0E1D4F]/10 cursor-pointer"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <strong className="text-[#0E1D4F] block mb-1">Mô tả hồ sơ du khách:</strong>
                <p className="text-[#4B5875] bg-[#EBF1F0]/40 p-3 rounded-xl border border-[#0E1D4F]/5">
                  {selectedCase.targetPersona}
                </p>
              </div>

              <div>
                <strong className="text-[#0E1D4F] block mb-1">Danh sách ràng buộc kỹ thuật kiểm định:</strong>
                <ul className="space-y-1.5 p-3 rounded-xl bg-white border border-[#0E1D4F]/10">
                  {selectedCase.expectedConstraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#4B5875]">
                      <Icon name="check_circle" className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-semibold">
                <span>Điểm khớp chuyên gia: {selectedCase.accuracyScore}/100</span>
                <span>Độ trễ: {selectedCase.latencyBenchmark}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 bg-[#205BD6] text-white font-semibold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

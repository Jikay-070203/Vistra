'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { DemoPlan } from '@/context/DemoPlanContext';

interface ConfirmPlanDialogProps {
  isOpen: boolean;
  activePlan: DemoPlan;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmPlanDialog({
  isOpen,
  activePlan,
  onClose,
  onConfirm,
}: ConfirmPlanDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-[#0E1D4F]/10 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-caps text-xs text-[#205BD6] font-bold uppercase tracking-wider">
              XÁC NHẬN CHÍNH THỨC
            </span>
            <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold mt-1">
              Chốt bản nháp hành trình này?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#EBF1F0] hover:bg-gray-200 flex items-center justify-center text-[#4B5875]"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>

        <p className="text-xs text-[#4B5875] leading-relaxed">
          Khi bạn bấm xác nhận, bản nháp <strong>&ldquo;{activePlan.title}&rdquo;</strong> sẽ được chuyển thành hồ sơ chính thức và lưu vào danh mục <strong>Chuyến đi của tôi</strong>. Bạn có thể mở xem chi tiết lịch trình, in ấn hoặc xuất PDF bất cứ lúc nào.
        </p>

        <div className="p-3 bg-[#EBF1F0] rounded-xl text-xs space-y-1 text-[#0E1D4F]">
          <div className="flex justify-between">
            <span>Điểm đến:</span>
            <strong>{activePlan.destination}</strong>
          </div>
          <div className="flex justify-between">
            <span>Xuất phát:</span>
            <strong>{activePlan.origin}</strong>
          </div>
          <div className="flex justify-between">
            <span>Thời lượng:</span>
            <strong>{activePlan.duration}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-[#EBF1F0] hover:bg-gray-200 text-[#0E1D4F] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tiếp tục chỉnh sửa
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Chốt phương án &amp; Lưu vào Chuyến đi
          </button>
        </div>
      </div>
    </div>
  );
}

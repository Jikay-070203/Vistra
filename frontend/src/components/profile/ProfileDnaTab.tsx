'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { MOCK_TRAVEL_DNA } from '@/data/mockData';

export default function ProfileDnaTab() {
  const [dnaMetrics, setDnaMetrics] = useState(MOCK_TRAVEL_DNA);
  const [pacePreference, setPacePreference] = useState<'slow' | 'balanced' | 'fast'>('slow');
  const [sceneryFocus, setSceneryFocus] = useState<'nature' | 'heritage' | 'urban'>('nature');
  const [cuisinePriority, setCuisinePriority] = useState<number>(85);
  const [saveToast, setSaveToast] = useState(false);

  const signalSources = [
    {
      id: 'chat',
      title: '1. Hội thoại & Tinh chỉnh Planner',
      weight: '40% trọng số',
      icon: 'chat_bubble',
      color: 'text-[#205BD6]',
      bg: 'bg-[#205BD6]/10',
      description: 'Ghi nhận các yêu cầu như "thêm quán phở gà đồi", "dành thời gian cho người lớn tuổi nghỉ trưa", "săn mây sớm 05:15".',
      signalsCount: '18 tương tác đã ghi nhận',
    },
    {
      id: 'explicit',
      title: '2. Sở thích cấu hình chủ động',
      weight: '35% trọng số',
      icon: 'tune',
      color: 'text-[#08B3C6]',
      bg: 'bg-[#08B3C6]/10',
      description: 'Lựa chọn phong cách du lịch thư thái, loại hình lưu trú homestay bản địa và các ghi chú sức khỏe ăn uống.',
      signalsCount: '6 tiêu chí đã thiết lập',
    },
    {
      id: 'moodboard',
      title: '3. Moodboard & Ảnh cảm hứng',
      weight: '25% trọng số',
      icon: 'photo_library',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      description: 'Phân tích bảng màu Serene Editorial Voyage từ các bức ảnh cảnh quan, đồi thông, ánh sáng bình minh bạn đã tải lên.',
      signalsCount: '12 hình ảnh phân tích',
    },
  ];

  const handleUpdatePreference = (index: number, newScore: number) => {
    const updated = [...dnaMetrics];
    updated[index] = {
      ...updated[index],
      score: newScore,
      rating: newScore >= 80 ? 'Rất cao' : newScore >= 60 ? 'Ưu tiên' : 'Vừa phải',
    };
    setDnaMetrics(updated);
  };

  const handleSavePreferences = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0E1D4F] text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Icon name="check_circle" className="size-5 text-[#08B3C6]" />
          <span className="text-xs font-semibold">Đã cập nhật trọng số Travel DNA thành công! Các gợi ý hành trình tiếp theo sẽ được cá nhân hóa theo thông số mới.</span>
        </div>
      )}

      {/* Main DNA Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#0E1D4F]/10 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-[#205BD6]/10 text-[#205BD6] text-xs font-bold uppercase tracking-wider">
                Thuật toán Travel DNA v2.4
              </span>
              <span className="text-xs text-[#4B5875]">Cập nhật 15 phút trước</span>
            </div>
            <h2 className="font-headline-sm text-2xl text-[#0E1D4F] font-bold">
              Bản đồ Travel DNA &amp; Nguồn Tín hiệu Đa thể thức
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-3xl leading-relaxed">
              Travel DNA của bạn không phải là một nhãn cố định mà là mô hình động học liên tục học hỏi từ 3 kênh tín hiệu: hội thoại Planner, thiết lập chủ động và ảnh thị giác moodboard.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shrink-0">
              <Icon name="verified" className="size-4 text-emerald-600" />
              <span>Độ khớp tổng thể: 94%</span>
            </span>
          </div>
        </div>

        {/* 3 Multimodal Signal Sources Section (F14 requirement) */}
        <div className="mb-8">
          <h3 className="text-xs font-label-caps uppercase tracking-wider font-bold text-[#0E1D4F] mb-4 flex items-center gap-2">
            <Icon name="hub" className="size-4 text-[#205BD6]" />
            <span>3 Kênh tín hiệu định hình DNA của bạn</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signalSources.map((source) => (
              <div
                key={source.id}
                className="p-5 rounded-2xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/30 hover:border-[#205BD6]/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl ${source.bg} ${source.color} flex items-center justify-center`}>
                      <Icon name={source.icon} className="size-4" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#0E1D4F]/10 text-[#0E1D4F]">
                      {source.weight}
                    </span>
                  </div>
                  <h4 className="font-headline-xs text-sm font-bold text-[#0E1D4F]">
                    {source.title}
                  </h4>
                  <p className="text-xs text-[#4B5875] mt-1.5 leading-relaxed">
                    {source.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#0E1D4F]/5 text-[11px] font-semibold text-[#205BD6] flex items-center gap-1">
                  <Icon name="check" className="size-3.5" />
                  <span>{source.signalsCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DNA Metrics with Interactive Tuning */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-label-caps uppercase tracking-wider font-bold text-[#0E1D4F] flex items-center gap-2">
              <Icon name="equalizer" className="size-4 text-[#205BD6]" />
              <span>Chỉ số DNA hiện tại &amp; Tùy chỉnh trực tiếp</span>
            </h3>
            <span className="text-xs text-[#4B5875]">Kéo thanh trượt để điều chỉnh mức ưu tiên</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dnaMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-[#0E1D4F]/10 bg-white hover:border-[#205BD6]/40 transition-all shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0E1D4F]">{metric.label}</span>
                  <span className="text-xs font-bold text-[#205BD6] bg-[#205BD6]/10 px-2 py-0.5 rounded-lg border border-[#205BD6]/20">
                    {metric.score}%
                  </span>
                </div>

                <div className="w-full bg-[#0E1D4F]/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#205BD6] to-[#08B3C6] h-full rounded-full transition-all duration-300"
                    style={{ width: `${metric.score}%` }}
                  ></div>
                </div>

                {/* Interactive Slider to Tune */}
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={metric.score}
                    onChange={(e) => handleUpdatePreference(idx, parseInt(e.target.value, 10))}
                    className="w-full accent-[#205BD6] cursor-pointer"
                    aria-label={`Chỉnh sửa mức độ ${metric.label}`}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#4B5875] pt-1 border-t border-[#0E1D4F]/5">
                  <span>Mức độ định hình:</span>
                  <span className="font-semibold text-[#0E1D4F]">{metric.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Travel Behavior Override Form */}
        <div className="mt-8 pt-6 border-t border-[#0E1D4F]/10 bg-[#EBF1F0]/40 p-6 rounded-2xl border border-[#0E1D4F]/5">
          <h4 className="font-headline-sm text-sm font-bold text-[#0E1D4F] mb-3 flex items-center gap-2">
            <Icon name="tune" className="size-4 text-[#205BD6]" />
            <span>Thiết lập ghi đè nhanh cho các chuyến đi tới</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                Nhịp điệu di chuyển
              </label>
              <select
                value={pacePreference}
                onChange={(e) => setPacePreference(e.target.value as 'slow' | 'balanced' | 'fast')}
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F]"
              >
                <option value="slow">Thư thái (1–2 điểm/ngày)</option>
                <option value="balanced">Cân bằng (2–3 điểm/ngày)</option>
                <option value="fast">Khám phá tối đa (4–5 điểm/ngày)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                Trọng tâm cảnh quan
              </label>
              <select
                value={sceneryFocus}
                onChange={(e) => setSceneryFocus(e.target.value as 'nature' | 'heritage' | 'urban')}
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F]"
              >
                <option value="nature">Đồi núi &amp; Thiên nhiên tĩnh lặng</option>
                <option value="heritage">Văn hóa &amp; Di sản bản địa</option>
                <option value="urban">Kiến trúc &amp; Đời sống phố thị</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1D4F] mb-1.5">
                Ưu tiên ẩm thực đặc sản ({cuisinePriority}%)
              </label>
              <input
                type="range"
                min="40"
                max="100"
                value={cuisinePriority}
                onChange={(e) => setCuisinePriority(parseInt(e.target.value, 10))}
                className="w-full accent-[#205BD6] cursor-pointer mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-5 py-2.5 bg-[#205BD6] hover:bg-[#1847a8] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Icon name="save" className="size-4" />
              <span>Áp dụng cập nhật Travel DNA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { Destination } from '@/data/mockData';

interface DestinationCardProps {
  dest: Destination;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleCompare: (id: string) => void;
  onToggleDetails: (id: string) => void;
  onSelectDestination: (destName: string) => void;
}

export default function DestinationCard({
  dest,
  index,
  isSelected,
  isExpanded,
  onToggleCompare,
  onToggleDetails,
  onSelectDestination,
}: DestinationCardProps) {
  return (
    <article
      className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 shadow-xs hover:shadow-md transition-all overflow-hidden"
    >
      {/* Card Hero Photo Header */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden">
        <Image
          src={dest.coverImage}
          alt={dest.name}
          fill
          sizes="(max-width: 640px) 100vw, 100vw"
          priority={index < 2}
          loading={index < 2 ? 'eager' : 'lazy'}
          className="object-cover transform hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1D4F]/90 via-[#0E1D4F]/30 to-black/20"></div>

        {/* Match Score Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-md bg-white/95 backdrop-blur-xs text-[#0E1D4F] font-label-caps text-xs font-bold shadow-xs">
            Độ hợp thị giác: {dest.visualMatch}%
          </span>
          <span className="px-3 py-1 rounded-md bg-white/95 backdrop-blur-xs text-[#0E1D4F] font-label-caps text-xs font-bold shadow-xs">
            Hợp ngân sách: {dest.budgetMatch}%
          </span>
          <span className="px-3 py-1 rounded-md bg-[#205BD6] text-white font-label-caps text-xs font-bold shadow-xs">
            Hợp mùa: {dest.seasonMatch}%
          </span>
        </div>

        {/* Destination Title & Estimated Cost */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
          <div>
            <p className="font-label-caps text-xs text-[#08B3C6] tracking-widest uppercase font-semibold">
              {dest.region}, {dest.country}
            </p>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              {dest.name}
            </h2>
          </div>
          <div className="text-right">
            <span className="font-label-caps text-[11px] text-[#EBF1F0]/80 uppercase block">
              Ước tính tổng chi phí (Demo)
            </span>
            <span className="font-headline-sm text-xl sm:text-2xl font-bold text-white">
              {dest.estimatedCost}
            </span>
            <span className="font-label-md text-xs text-[#EBF1F0] block">
              / {dest.duration}
            </span>
          </div>
        </div>
      </div>

      {/* Card Summary Body */}
      <div className="p-6 space-y-5">
        {/* Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10">
          <div>
            <span className="block font-label-caps text-[11px] text-[#4B5875] uppercase font-bold">
              Di chuyển
            </span>
            <span className="font-label-lg text-xs sm:text-sm text-[#0E1D4F] font-medium flex items-center gap-1.5 mt-0.5">
              <Icon name={dest.transport.icon} className="size-4 text-[#205BD6]" />
              <span>{dest.transport.level} ({dest.transport.description})</span>
            </span>
          </div>
          <div>
            <span className="block font-label-caps text-[11px] text-[#4B5875] uppercase font-bold">
              Thời điểm vàng
            </span>
            <span className="font-label-lg text-xs sm:text-sm text-[#0E1D4F] font-medium flex items-center gap-1.5 mt-0.5">
              <Icon name="calendar_month" className="size-4 text-[#08B3C6]" />
              <span>{dest.goldenHour}</span>
            </span>
          </div>
          <div>
            <span className="block font-label-caps text-[11px] text-[#4B5875] uppercase font-bold">
              Bầu không khí
            </span>
            <span className="font-label-lg text-xs sm:text-sm text-[#0E1D4F] font-medium flex items-center gap-1.5 mt-0.5">
              <Icon name={dest.vibe.icon} className="size-4 text-[#205BD6]" />
              <span>{dest.vibe.title}</span>
            </span>
          </div>
        </div>

        {/* Rationale */}
        <p className="font-body-md text-xs sm:text-sm text-[#4B5875] leading-relaxed">
          <strong className="text-[#0E1D4F] font-bold">Lý do phù hợp: </strong>
          {dest.rationale}
        </p>

        {/* Card Action Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#0E1D4F]/10">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleCompare(dest.id)}
              className="w-4 h-4 rounded text-[#205BD6] accent-[#205BD6] cursor-pointer"
            />
            <span className="font-label-md text-xs text-[#0E1D4F] font-semibold">
              Đưa vào so sánh song song
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleDetails(dest.id)}
              className="px-4 py-2 rounded-xl bg-[#EBF1F0] hover:bg-white text-[#0E1D4F] font-label-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-[#0E1D4F]/10 cursor-pointer"
            >
              <span>{isExpanded ? 'Thu gọn hồ sơ' : 'Xem hồ sơ thực địa'}</span>
              <Icon name="keyboard_arrow_down" className={`size-[18px] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onSelectDestination(dest.name)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] text-white font-label-lg text-xs font-semibold transition-all active:scale-[0.98] shadow-xs cursor-pointer"
            >
              <span>Lên kế hoạch ở đây</span>
              <Icon name="arrow_forward" className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDABLE INTELLIGENCE DOSSIER SECTION */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 bg-[#EBF1F0]/50 border-t border-[#0E1D4F]/10 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-xs font-label-caps text-[#205BD6] font-bold uppercase tracking-wider">
            <Icon name="verified_user" className="size-4" />
            <span>HỒ SƠ TÌNH BÁO DU LỊCH &amp; KIỂM CHỨNG THỰC ĐỊA</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module 1: Best Moment & Crowd */}
            <div className="bg-white rounded-xl border border-[#0E1D4F]/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-sm text-sm text-[#0E1D4F] font-bold flex items-center gap-2">
                  <Icon name="wb_twilight" className="size-[18px] text-[#205BD6]" />
                  <span>Thời điểm lý tưởng nhất</span>
                </h4>
                <span className="text-xs text-[#08B3C6] font-semibold bg-[#08B3C6]/15 px-2 py-0.5 rounded">
                  Khuyên dùng
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#EBF1F0] rounded-xl">
                  <span className="text-[#4B5875] block text-[11px] font-label-caps font-bold">Khung giờ săn cảnh:</span>
                  <strong className="text-[#0E1D4F] text-sm">{dest.bestMoments.peakHours}</strong>
                  <p className="text-[11px] text-[#4B5875] mt-0.5">{dest.bestMoments.sunDirection}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-[#EBF1F0] rounded-xl">
                    <span className="text-[11px] text-[#4B5875] block font-label-caps">Phù hợp thời tiết:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-white h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#205BD6] h-full rounded-full"
                          style={{ width: `${dest.bestMoments.weatherSuitability}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-xs text-[#0E1D4F]">
                        {dest.bestMoments.weatherSuitability}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#EBF1F0] rounded-xl">
                    <span className="text-[11px] text-[#4B5875] block font-label-caps">Mật độ du khách:</span>
                    <span className="font-bold text-xs text-[#0E1D4F] block mt-1">
                      {dest.bestMoments.crowdLevel}
                    </span>
                  </div>
                </div>

                {/* Forecast Trend Bars */}
                <div className="pt-2">
                  <span className="text-[11px] font-label-caps text-[#4B5875] block mb-1">
                    Dự báo chỉ số thuận lợi theo từng ngày (Demo):
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {dest.bestMoments.dailyForecast.map((fc) => (
                      <div key={fc.day} className="p-2 bg-[#EBF1F0] rounded-lg">
                        <span className="block text-[10px] text-[#4B5875]">{fc.day}</span>
                        <strong className="block text-xs text-[#0E1D4F] mt-0.5">{fc.score}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Module 2: Reality Check */}
            <div className="bg-white rounded-xl border border-[#0E1D4F]/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-sm text-sm text-[#0E1D4F] font-bold flex items-center gap-2">
                  <Icon name="verified" className="size-[18px] text-[#08B3C6]" />
                  <span>Kiểm chứng thực tế (Kỳ vọng vs Thực tế)</span>
                </h4>
                <span className="text-xs font-bold text-[#205BD6] bg-[#205BD6]/10 px-2 py-0.5 rounded">
                  Độ tin cậy: {dest.realityCheck.confidence}%
                </span>
              </div>

              {/* Side by side photos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="h-28 rounded-xl overflow-hidden relative border border-[#0E1D4F]/10">
                    <Image
                      src={dest.realityCheck.expectationImage}
                      alt="Kỳ vọng"
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      loading="lazy"
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-label-caps px-1.5 py-0.5 rounded z-10">
                      Kỳ vọng
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B5875] leading-tight">
                    {dest.realityCheck.expectationDesc}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-28 rounded-xl overflow-hidden relative border border-[#0E1D4F]/10">
                    <Image
                      src={dest.realityCheck.realityImage}
                      alt="Thực tế"
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      loading="lazy"
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-[#205BD6] text-white text-[9px] font-label-caps px-1.5 py-0.5 rounded font-semibold z-10">
                      Thực tế mùa đi
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B5875] leading-tight">
                    {dest.realityCheck.realityDesc}
                  </p>
                </div>
              </div>

              {/* Things to know bullet points */}
              <div className="p-3 bg-[#EBF1F0] rounded-xl space-y-1.5 text-xs text-[#4B5875]">
                <span className="font-label-caps text-[10px] text-[#0E1D4F] font-bold block uppercase">
                  Lưu ý quan trọng trên thực địa:
                </span>
                {dest.realityCheck.keyPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-[#205BD6] font-bold">•</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

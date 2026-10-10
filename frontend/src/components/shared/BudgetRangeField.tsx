"use client";

import React, { useState } from "react";

export interface BudgetRange {
  min: number;
  max: number;
}

export interface BudgetRangeFieldProps {
  value: BudgetRange;
  onChange: (nextRange: BudgetRange) => void;
  minLimit?: number;
  maxLimit?: number;
  step?: number;
  travelerCount?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const DEFAULT_BUDGET_MIN = 1_000_000;
export const DEFAULT_BUDGET_MAX = 500_000_000;
export const DEFAULT_BUDGET_STEP = 500_000;

export function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export function parseVndInput(str: string): number {
  const digits = str.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export default function BudgetRangeField({
  value,
  onChange,
  minLimit = DEFAULT_BUDGET_MIN,
  maxLimit = DEFAULT_BUDGET_MAX,
  step = DEFAULT_BUDGET_STEP,
  travelerCount,
  label,
  className = "",
  disabled = false,
}: BudgetRangeFieldProps) {
  const currentMin = Math.max(minLimit, Math.min(value.min, maxLimit));
  const currentMax = Math.max(minLimit, Math.min(value.max, maxLimit));

  const [minText, setMinText] = useState(currentMin.toLocaleString("vi-VN"));
  const [maxText, setMaxText] = useState(currentMax.toLocaleString("vi-VN"));
  const [prevMin, setPrevMin] = useState(currentMin);
  const [prevMax, setPrevMax] = useState(currentMax);

  if (prevMin !== currentMin) {
    setPrevMin(currentMin);
    setMinText(currentMin.toLocaleString("vi-VN"));
  }

  if (prevMax !== currentMax) {
    setPrevMax(currentMax);
    setMaxText(currentMax.toLocaleString("vi-VN"));
  }

  const rangeSpan = Math.max(1, maxLimit - minLimit);
  const leftPercent = Math.max(
    0,
    Math.min(100, ((currentMin - minLimit) / rangeSpan) * 100),
  );
  const rightPercent = Math.max(
    0,
    Math.min(100, 100 - ((currentMax - minLimit) / rangeSpan) * 100),
  );

  const handleSliderMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = Number(e.target.value);
    const validMin = Math.min(nextVal, currentMax);
    onChange({ min: validMin, max: currentMax });
  };

  const handleSliderMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = Number(e.target.value);
    const validMax = Math.max(nextVal, currentMin);
    onChange({ min: currentMin, max: validMax });
  };

  const handleMinInputBlur = () => {
    const parsed = parseVndInput(minText);
    let clamped = Math.max(minLimit, Math.min(parsed, maxLimit));
    if (clamped > currentMax) {
      clamped = currentMax;
    }
    setMinText(clamped.toLocaleString("vi-VN"));
    onChange({ min: clamped, max: currentMax });
  };

  const handleMaxInputBlur = () => {
    const parsed = parseVndInput(maxText);
    let clamped = Math.max(minLimit, Math.min(parsed, maxLimit));
    if (clamped < currentMin) {
      clamped = currentMin;
    }
    setMaxText(clamped.toLocaleString("vi-VN"));
    onChange({ min: currentMin, max: clamped });
  };

  const hasTravelerCount =
    typeof travelerCount === "number" && travelerCount > 0;
  const perPersonEstimate = hasTravelerCount
    ? Math.round(currentMax / Math.max(1, travelerCount))
    : 0;

  return (
    <div className={`space-y-3.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold text-[#0E1D4F] uppercase tracking-wide">
            {label}
          </label>
          {/* <span className="text-[11px] font-bold text-[#0E1D4F] bg-[#EBF1F0] px-2.5 py-1 rounded-md border border-[#0E1D4F]/10">
            {formatVnd(currentMin)} — {formatVnd(currentMax)}
          </span> */}
        </div>
      )}

      {/* Row 1: Full-width two-thumb range slider */}
      <div className="bg-[#EBF1F0]/40 p-3.5 rounded-xl border border-[#0E1D4F]/10 space-y-2.5">
        <div className="relative w-full h-6 flex items-center select-none">
          {/* Base Track */}
          <div className="absolute w-full h-2 rounded-full bg-[#0E1D4F]/10" />
          {/* Active Fill Track */}
          <div
            className="absolute h-2 rounded-full bg-[#205BD6]"
            style={{ left: `${leftPercent}%`, right: `${rightPercent}%` }}
          />
          {/* Min Slider Thumb */}
          <input
            type="range"
            min={minLimit}
            max={maxLimit}
            step={step}
            value={currentMin}
            disabled={disabled}
            aria-label="Ngân sách tối thiểu"
            aria-valuemin={minLimit}
            aria-valuemax={maxLimit}
            aria-valuenow={currentMin}
            aria-valuetext={formatVnd(currentMin)}
            onChange={handleSliderMinChange}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer z-20 focus-visible:outline-2 focus-visible:outline-[#205BD6] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#205BD6] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#205BD6] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
          />
          {/* Max Slider Thumb */}
          <input
            type="range"
            min={minLimit}
            max={maxLimit}
            step={step}
            value={currentMax}
            disabled={disabled}
            aria-label="Ngân sách tối đa"
            aria-valuemin={minLimit}
            aria-valuemax={maxLimit}
            aria-valuenow={currentMax}
            aria-valuetext={formatVnd(currentMax)}
            onChange={handleSliderMaxChange}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer z-30 focus-visible:outline-2 focus-visible:outline-[#205BD6] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#205BD6] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#205BD6] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
          />
        </div>

        <div className="flex justify-between text-[11px] text-[#4B5875] font-medium pt-0.5">
          <span>{formatVnd(minLimit)}</span>
          <span className="hidden sm:inline text-[#4B5875]/80">
            Bước nhảy {formatVnd(step)}
          </span>
          <span>{formatVnd(maxLimit)}</span>
        </div>

        {/* Row 2: Editable Min, Editable Max, and optional per-person estimate */}
        <div className="pt-2 border-t border-[#0E1D4F]/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-[#0E1D4F] mb-1">
              Tối thiểu (VND)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                disabled={disabled}
                value={minText}
                aria-label="Ngân sách tối thiểu nhập tay"
                onChange={(e) => setMinText(e.target.value)}
                onBlur={handleMinInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleMinInputBlur();
                }}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#0E1D4F]/15 text-xs font-semibold text-[#0E1D4F] focus-visible:outline-2 focus-visible:outline-[#205BD6]"
                placeholder="1.000.000"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#4B5875] pointer-events-none font-medium">
                đ
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#0E1D4F] mb-1">
              Tối đa (VND)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                disabled={disabled}
                value={maxText}
                aria-label="Ngân sách tối đa nhập tay"
                onChange={(e) => setMaxText(e.target.value)}
                onBlur={handleMaxInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleMaxInputBlur();
                }}
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#0E1D4F]/15 text-xs font-semibold text-[#0E1D4F] focus-visible:outline-2 focus-visible:outline-[#205BD6]"
                placeholder="500.000.000"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#4B5875] pointer-events-none font-medium">
                đ
              </span>
            </div>
          </div>

          {hasTravelerCount && (
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-[11px] font-semibold text-[#0E1D4F] mb-1">
                Ước tính / người ({travelerCount} thành viên)
              </label>
              <input
                type="text"
                readOnly
                aria-label="Ngân sách ước tính mỗi người"
                value={`~${perPersonEstimate.toLocaleString("vi-VN")} đ/người`}
                className="w-full px-3 py-1.5 bg-[#EBF1F0] rounded-lg border border-[#0E1D4F]/10 text-xs font-semibold text-[#205BD6] select-all cursor-default"
                title="Công thức: Ngân sách tối đa chia cho số người tham gia (Max / số người)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

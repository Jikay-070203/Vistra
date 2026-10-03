'use client';

import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { MoodPhoto } from './types';

interface MoodboardSectionProps {
  photos: MoodPhoto[];
  onAddPhoto: () => void;
  onRemovePhoto: (id: string) => void;
}

export default function MoodboardSection({
  photos,
  onAddPhoto,
  onRemovePhoto,
}: MoodboardSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
          Bộ sưu tập ảnh cảm hứng ({photos.length} ảnh)
        </h2>
        <span className="text-xs text-[#4B5875] bg-white/70 px-2.5 py-1 rounded-lg border border-[#0E1D4F]/10 font-label-md">
          Giải mã 9 chiều vector thẩm mỹ
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white/85 backdrop-blur-md rounded-2xl border border-[#0E1D4F]/10 p-3 shadow-xs flex flex-col justify-between group hover:border-[#205BD6]/50 transition-all"
          >
            <div className="relative h-44 rounded-xl overflow-hidden mb-3">
              <Image
                src={photo.url}
                alt={photo.caption}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                loading="lazy"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <button
                type="button"
                onClick={() => onRemovePhoto(photo.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-[#ba1a1a] text-white text-xs transition-colors cursor-pointer"
                title="Gỡ ảnh này"
                aria-label={`Gỡ ảnh ${photo.caption}`}
              >
                <Icon name="close" className="size-4" />
              </button>
            </div>
            <div className="space-y-1.5 px-1">
              <p className="font-body-sm text-xs font-semibold text-[#0E1D4F]">
                {photo.caption}
              </p>
              <div className="flex flex-wrap gap-1">
                {photo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-label-caps bg-[#EBF1F0] text-[#0E1D4F] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Add Photo Button Tile */}
        <button
          type="button"
          onClick={onAddPhoto}
          className="rounded-2xl border-2 border-dashed border-[#0E1D4F]/20 hover:border-[#205BD6] bg-white/40 hover:bg-white/70 transition-all p-6 flex flex-col items-center justify-center text-center min-h-[220px] group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#205BD6] shadow-xs group-hover:scale-110 transition-transform mb-3 border border-[#0E1D4F]/10">
            <Icon name="add_photo_alternate" className="size-5" />
          </div>
          <span className="font-label-lg text-sm text-[#0E1D4F] font-bold">
            + Thêm ảnh cảm hứng
          </span>
          <span className="text-xs text-[#4B5875] mt-1 max-w-[200px]">
            (Kho ảnh tư liệu thực địa tuyển chọn)
          </span>
        </button>
      </div>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { MOCK_DESTINATIONS } from '@/data/mockData';

interface SchemaEntity {
  name: string;
  tableName: string;
  description: string;
  fieldsCount: number;
  relations: string[];
  fields: { name: string; type: string; isPrimary?: boolean; isForeign?: boolean }[];
}

const SCHEMAS: SchemaEntity[] = [
  {
    name: 'Điểm đến & Danh mục',
    tableName: 'destinations',
    description: 'Bản đồ dữ liệu các điểm đến, tỷ lệ khớp thị giác DNA và thông số giờ vàng.',
    fieldsCount: 8,
    relations: ['plans.destinationId', 'trace_logs.destinationContext'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'name', type: 'string' },
      { name: 'region', type: 'string' },
      { name: 'duration', type: 'string' },
      { name: 'estimatedCost', type: 'string' },
      { name: 'visualMatch', type: 'number' },
      { name: 'budgetMatch', type: 'number' },
      { name: 'goldenHour', type: 'string' },
    ],
  },
  {
    name: 'Kế hoạch Hành trình',
    tableName: 'plans',
    description: 'Hồ sơ lịch trình do du khách tạo hoặc lưu từ cộng đồng.',
    fieldsCount: 10,
    relations: ['users.id', 'itinerary_days.planId'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'userId', type: 'string', isForeign: true },
      { name: 'title', type: 'string' },
      { name: 'destination', type: 'string' },
      { name: 'status', type: "'draft' | 'confirmed'" },
      { name: 'isPublished', type: 'boolean' },
      { name: 'duration', type: 'string' },
      { name: 'budget', type: 'string' },
      { name: 'createdAt', type: 'timestamp' },
    ],
  },
  {
    name: 'Ngày lịch trình & Chặng',
    tableName: 'itinerary_days',
    description: 'Cấu trúc các ngày trong chuyến đi và lịch trình chi tiết.',
    fieldsCount: 5,
    relations: ['plans.id', 'activities.dayId'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'planId', type: 'string', isForeign: true },
      { name: 'dayNumber', type: 'number' },
      { name: 'title', type: 'string' },
      { name: 'theme', type: 'string' },
    ],
  },
  {
    name: 'Hoạt động & Điểm dừng',
    tableName: 'activities',
    description: 'Chi tiết từng điểm đến, giờ bắt đầu, quán ăn và hoạt động.',
    fieldsCount: 7,
    relations: ['itinerary_days.id'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'dayId', type: 'string', isForeign: true },
      { name: 'time', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'location', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'cost', type: 'string' },
    ],
  },
  {
    name: 'Hồ sơ Phản hồi & Đóng góp',
    tableName: 'feedback_tickets',
    description: 'Phiếu báo lỗi và đánh giá trải nghiệm từ du khách.',
    fieldsCount: 9,
    relations: ['users.id'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'userName', type: 'string' },
      { name: 'userEmail', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'severity', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'subject', type: 'string' },
      { name: 'createdAt', type: 'timestamp' },
    ],
  },
];

type DestinationItem = (typeof MOCK_DESTINATIONS)[number];

export default function SchemaMapViewer() {
  const [selectedSchema, setSelectedSchema] = useState<SchemaEntity>(SCHEMAS[0]);
  const [destinationsData, setDestinationsData] = useState(MOCK_DESTINATIONS);
  const [editingDest, setEditingDest] = useState<DestinationItem | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest) return;

    setDestinationsData((prev) =>
      prev.map((d) => (d.id === editingDest.id ? editingDest : d))
    );
    setSaveNotice(`Đã lưu cập nhật cho bản ghi [${editingDest.name}].`);
    setEditingDest(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {saveNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Icon name="check_circle" className="size-4" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Schema Map Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-5">
        <div className="border-b border-[#0E1D4F]/10 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              SƠ ĐỒ CƠ SỞ DỮ LIỆU THỰC THỂ (SCHEMA MAP)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-[#205BD6] text-[10px] font-bold">
              RELATIONAL GRAPH
            </span>
          </div>
          <h3 className="font-headline-sm text-lg text-[#0E1D4F] font-bold">
            Kiến trúc Thực thể Dữ liệu &amp; Liên kết Bảng (Schema Entities)
          </h3>
          <p className="text-xs text-[#4B5875] mt-0.5">
            Mô hình hóa các bảng lưu trữ của VISTRA: điểm đến, hành trình, phân đoạn ngày và hồ sơ phản hồi.
          </p>
        </div>

        {/* Entities Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SCHEMAS.map((schema) => {
            const isSelected = schema.tableName === selectedSchema.tableName;
            return (
              <button
                key={schema.tableName}
                type="button"
                onClick={() => setSelectedSchema(schema)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? 'border-[#205BD6] bg-[#205BD6]/5 shadow-xs'
                    : 'border-[#0E1D4F]/10 bg-white hover:bg-[#EBF1F0]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0E1D4F]">{schema.tableName}</span>
                  <span className="text-[10px] text-[#4B5875] bg-[#EBF1F0] px-1.5 py-0.5 rounded">
                    {schema.fieldsCount} trường
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#205BD6] truncate">{schema.name}</h4>
                <p className="text-[11px] text-[#4B5875] line-clamp-2">{schema.description}</p>
              </button>
            );
          })}
        </div>

        {/* Schema Inspector */}
        <div className="p-5 rounded-2xl bg-[#EBF1F0]/40 border border-[#0E1D4F]/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0E1D4F]/10 pb-2">
            <div>
              <span className="text-xs font-bold text-[#0E1D4F]">
                Bảng: <code className="font-mono text-[#205BD6]">{selectedSchema.tableName}</code>
              </span>
              <span className="text-xs text-[#4B5875] ml-2">({selectedSchema.description})</span>
            </div>
            <div className="text-xs text-[#4B5875] flex items-center gap-1">
              <span>Liên kết khóa ngoại (Foreign Keys):</span>
              <strong className="text-[#0E1D4F]">{selectedSchema.relations.join(', ')}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {selectedSchema.fields.map((f, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white border border-[#0E1D4F]/5 text-xs flex items-center justify-between">
                <span className="font-mono font-semibold text-[#0E1D4F]">{f.name}</span>
                <span className="font-mono text-[10px] text-[#4B5875] bg-[#EBF1F0] px-1.5 py-0.5 rounded">
                  {f.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Record Viewer & Editor Table (Using destinations as live sample entity) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0E1D4F]/10 pb-4">
          <div>
            <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
              Bản ghi Dữ liệu Thực thể: <code className="text-[#205BD6]">destinations</code> ({destinationsData.length} records)
            </h3>
            <p className="text-xs text-[#4B5875] mt-0.5">
              Cho phép xem trực tiếp và điều chỉnh nhanh các thông số thị giác hoặc giờ vàng của điểm đến.
            </p>
          </div>
          <span className="text-xs text-[#4B5875] bg-[#EBF1F0] px-3 py-1 rounded-xl">
            Live Record Editor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EBF1F0] text-[#0E1D4F] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Tên điểm đến</th>
                <th className="py-3 px-4">Khu vực</th>
                <th className="py-3 px-4">Thời lượng</th>
                <th className="py-3 px-4 text-center">Khớp thị giác</th>
                <th className="py-3 px-4 text-center">Khớp ngân sách</th>
                <th className="py-3 px-4">Giờ vàng săn ảnh</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1D4F]/5">
              {destinationsData.map((dest) => (
                <tr key={dest.id} className="hover:bg-[#EBF1F0]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#0E1D4F]">{dest.id}</td>
                  <td className="py-3 px-4 font-semibold text-[#0E1D4F]">{dest.name}</td>
                  <td className="py-3 px-4 text-[#4B5875]">{dest.region}</td>
                  <td className="py-3 px-4 text-[#4B5875]">{dest.duration}</td>
                  <td className="py-3 px-4 text-center font-bold text-[#205BD6]">
                    {dest.visualMatch}%
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    {dest.budgetMatch}%
                  </td>
                  <td className="py-3 px-4 text-[#0E1D4F] font-medium">{dest.goldenHour}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingDest({ ...dest })}
                      className="px-2.5 py-1 rounded-lg bg-[#205BD6]/10 hover:bg-[#205BD6] text-[#205BD6] hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingDest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col">
            <div className="p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <h4 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                Chỉnh sửa bản ghi: {editingDest.name}
              </h4>
              <button
                type="button"
                onClick={() => setEditingDest(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] border border-[#0E1D4F]/10 cursor-pointer"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#0E1D4F] mb-1">
                  Độ khớp thị giác DNA (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={editingDest.visualMatch}
                  onChange={(e) =>
                    setEditingDest({ ...editingDest, visualMatch: parseInt(e.target.value, 10) })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#0E1D4F]/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0E1D4F] mb-1">
                  Độ hợp ngân sách (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={editingDest.budgetMatch}
                  onChange={(e) =>
                    setEditingDest({ ...editingDest, budgetMatch: parseInt(e.target.value, 10) })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#0E1D4F]/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0E1D4F] mb-1">
                  Thời điểm săn cảnh đẹp (Golden Hour)
                </label>
                <input
                  type="text"
                  value={editingDest.goldenHour}
                  onChange={(e) =>
                    setEditingDest({ ...editingDest, goldenHour: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#0E1D4F]/15"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDest(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-[#4B5875] font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#205BD6] text-white font-semibold rounded-xl cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

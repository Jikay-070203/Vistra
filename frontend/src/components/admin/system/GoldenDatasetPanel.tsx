'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: 'passed' | 'warning' | 'failed';
  latencyMs?: number;
}

export interface GoldenDataset {
  id: string;
  name: string;
  description: string;
  testCasesCount: number;
  lastRunDate: string;
  isCustom?: boolean;
  benchmarkScore: number;
  testCases: TestCase[];
}

const BUILTIN_DATASETS: GoldenDataset[] = [
  {
    id: 'DS-01',
    name: 'Bộ dữ liệu Chuẩn Lịch trình Đa thế hệ',
    description: 'Đánh giá khả năng tối ưu hóa nhịp độ, độ dốc di chuyển và thời điểm săn mây tránh gió lạnh.',
    testCasesCount: 4,
    lastRunDate: '02/10/2026 14:30',
    benchmarkScore: 92,
    testCases: [
      {
        id: 'TC-04',
        name: 'Ninh Bình 2N1Đ - Chèo thuyền Tràng An mùa mưa lũ',
        input: 'Kế hoạch chèo thuyền Tràng An 2 người vào chiều muộn tháng 9, có cảnh báo lũ từ trạm thượng nguồn.',
        expected: 'Hệ thống phải tự động dời lịch chèo thuyền sang sáng hôm sau hoặc đổi địa điểm Hang Múa.',
        actual: 'Lịch trình vẫn xếp thuyền lúc 16:30 mà không gắn cảnh báo lũ quét cục bộ từ thủy văn.',
        status: 'failed',
        latencyMs: 1420,
      },
      {
        id: 'TC-03',
        name: 'Sa Pa 3N2Đ - Cáp treo Fansipan giờ cao điểm',
        input: 'Đoàn khách gia đình có trẻ nhỏ lên đỉnh Fansipan vào khung giờ 10:00 sáng Thứ Bảy.',
        expected: 'Gợi ý dời lên chuyến 07:30 sáng hoặc chiều sau 14:00 để tránh xếp hàng chờ >45 phút.',
        actual: 'Khuyến nghị dời lịch nhưng xếp thời gian ăn trưa quá sát giờ tàu hỏa leo núi Mường Hoa.',
        status: 'warning',
        latencyMs: 1180,
      },
      {
        id: 'TC-01',
        name: 'Đà Lạt 3N2Đ - Gia đình người cao tuổi',
        input: 'Gia đình 3 thế hệ, có người già 72 tuổi, yêu cầu không đi bộ dốc quá 15 phút.',
        expected: 'Chọn điểm đến có đường bằng phẳng (Hồ Tuyền Lâm, Dinh 1), khách sạn có thang máy.',
        actual: 'Tất cả các điểm được xếp dốc thoải, thời gian nghỉ ngơi trưa 2 tiếng tại resort.',
        status: 'passed',
        latencyMs: 890,
      },
      {
        id: 'TC-02',
        name: 'Hà Giang 4N3Đ - Cung phượt đèo Mã Pí Lèng',
        input: 'Thanh niên đi xe máy cá nhân, yêu cầu cảnh báo sương mù đèo sáng sớm.',
        expected: 'Đưa giờ khởi hành qua đèo về sau 08:00 sáng và gợi ý trạm dừng nghỉ ngắm sông Nho Quế.',
        actual: 'Lịch trình tuân thủ khung giờ an toàn sau 08:30 và có trạm tiếp nhiên liệu dự phòng.',
        status: 'passed',
        latencyMs: 950,
      },
    ],
  },
  {
    id: 'DS-02',
    name: 'Bộ dữ liệu Kiểm thử Ràng buộc Ngân sách & Vi khí hậu',
    description: 'Kiểm thử độ nhạy giải thuật trước các ràng buộc ngân sách khắt khe và rủi ro thời tiết cực đoan.',
    testCasesCount: 3,
    lastRunDate: '01/10/2026 09:15',
    benchmarkScore: 88,
    testCases: [
      {
        id: 'TC-05',
        name: 'Phú Quốc 3N2Đ - Khuyến nghị cano mùa biển động',
        input: 'Chuyến đi tháng 10 gặp gió mùa cấp 5, du khách yêu cầu tour 4 đảo cano tốc độ cao.',
        expected: 'Từ chối xếp tour cano biển hở; chuyển sang Vinpearl Safari hoặc Grand World trong nhà.',
        actual: 'Hệ thống vẫn giữ tour cano lúc 09:00 sáng kèm ghi chú thời tiết nhỏ.',
        status: 'failed',
        latencyMs: 1650,
      },
      {
        id: 'TC-06',
        name: 'Quy Nhơn 4N3Đ - Ràng buộc ngân sách 5 triệu/người',
        input: '4 người lớn, ngân sách cứng 5.000.000 đ/người bao gồm vé máy bay khứ hồi từ TP.HCM.',
        expected: 'Cân bằng khách sạn 3 sao và gợi ý quán hải sản địa phương.',
        actual: 'Chi phí tính toán vượt 8% (5.400.000 đ) do tiền xe đón sân bay Phù Cát.',
        status: 'warning',
        latencyMs: 2100,
      },
      {
        id: 'TC-07',
        name: 'Mộc Châu 2N1Đ - Mùa hoa mận nở',
        input: 'Cặp đôi đi cuối tháng 1, chụp ảnh thung lũng mận Nà Ka lúc nắng đẹp.',
        expected: 'Gợi ý khung giờ nắng xuyên sương 09:00 - 11:00 sáng.',
        actual: 'Điểm đến và giờ chụp hình khớp 100% thời điểm hoa nở rộ theo trạm vi khí hậu.',
        status: 'passed',
        latencyMs: 820,
      },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'vistra_golden_datasets_v1';

export default function GoldenDatasetPanel() {
  const [datasets, setDatasets] = useState<GoldenDataset[]>(() => {
    if (typeof window === 'undefined') return BUILTIN_DATASETS;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: GoldenDataset[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...BUILTIN_DATASETS, ...parsed];
        }
      }
    } catch {}
    return BUILTIN_DATASETS;
  });
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('DS-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunDatasetId, setLastRunDatasetId] = useState<string | null>('DS-01');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Import Modal Form state
  const [importName, setImportName] = useState('');
  const [importId, setImportId] = useState('');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const selectedDataset = useMemo(() => {
    return datasets.find((d) => d.id === selectedDatasetId) || datasets[0];
  }, [datasets, selectedDatasetId]);

  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasets;
    const q = searchQuery.toLowerCase();
    return datasets.filter(
      (d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
    );
  }, [datasets, searchQuery]);

  // Run test workflow (ADM-SYS-02C)
  const handleRunTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setLastRunDatasetId(selectedDatasetId);
    }, 800);
  };

  // Sort test cases: Failed first, then Warning, then Passed (ADM-SYS-02D)
  const sortedTestCases = useMemo(() => {
    if (!selectedDataset) return [];
    const statusOrder: Record<string, number> = { failed: 0, warning: 1, passed: 2 };
    return [...selectedDataset.testCases].sort(
      (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
    );
  }, [selectedDataset]);

  const passedCount = selectedDataset.testCases.filter((t) => t.status === 'passed').length;
  const warningCount = selectedDataset.testCases.filter((t) => t.status === 'warning').length;
  const failedCount = selectedDataset.testCases.filter((t) => t.status === 'failed').length;

  // Handle Import JSON validation (ADM-SYS-02B)
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    if (!importName.trim()) {
      setImportError('Vui lòng nhập tên bộ dữ liệu');
      return;
    }

    const cleanId = importId.trim() || `DS-CUST-${Date.now().toString().slice(-4)}`;
    if (datasets.some((d) => d.id === cleanId)) {
      setImportError(`Mã bộ dữ liệu "${cleanId}" đã tồn tại. Vui lòng chọn mã khác.`);
      return;
    }

    let parsedCases: unknown;
    try {
      parsedCases = JSON.parse(importJson);
    } catch {
      setImportError('Cú pháp JSON không hợp lệ. Vui lòng kiểm tra lại định dạng mảng JSON.');
      return;
    }

    if (!Array.isArray(parsedCases) || parsedCases.length === 0) {
      setImportError('Bộ dữ liệu phải là một mảng JSON chứa ít nhất 1 testcase.');
      return;
    }

    // Validate fields for each testcase (ADM-SYS-02B)
    const validatedCases: TestCase[] = [];
    for (let i = 0; i < parsedCases.length; i++) {
      const item = parsedCases[i];
      if (typeof item !== 'object' || item === null) {
        setImportError(`Testcase tại vị trí #${i + 1} không phải là đối tượng hợp lệ.`);
        return;
      }
      const tc = item as Record<string, unknown>;
      if (!tc.id || typeof tc.id !== 'string') {
        setImportError(`Testcase #${i + 1} thiếu trường "id" (chuỗi bắt buộc).`);
        return;
      }
      if (!tc.name || typeof tc.name !== 'string') {
        setImportError(`Testcase #${i + 1} thiếu trường "name" (chuỗi bắt buộc).`);
        return;
      }
      if (!tc.input || typeof tc.input !== 'string') {
        setImportError(`Testcase #${i + 1} thiếu trường "input" (chuỗi bắt buộc).`);
        return;
      }
      if (!tc.expected || typeof tc.expected !== 'string') {
        setImportError(`Testcase #${i + 1} thiếu trường "expected" (chuỗi bắt buộc).`);
        return;
      }
      const status = tc.status === 'failed' || tc.status === 'warning' ? tc.status : 'passed';
      validatedCases.push({
        id: String(tc.id),
        name: String(tc.name),
        input: String(tc.input),
        expected: String(tc.expected),
        actual: String(tc.actual || tc.expected),
        status,
        latencyMs: typeof tc.latencyMs === 'number' ? tc.latencyMs : 1100,
      });
    }

    const newDataset: GoldenDataset = {
      id: cleanId,
      name: importName.trim(),
      description: 'Bộ dữ liệu kiểm thử tải lên thủ công qua định dạng JSON.',
      testCasesCount: validatedCases.length,
      lastRunDate: 'Vừa nhập',
      isCustom: true,
      benchmarkScore: Math.round(
        (validatedCases.filter((c) => c.status === 'passed').length / validatedCases.length) * 100
      ),
      testCases: validatedCases,
    };

    const customOnly = datasets.filter((d) => d.isCustom);
    const updatedCustom = [...customOnly, newDataset];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCustom));
    } catch {
      // Storage full
    }

    setDatasets([...BUILTIN_DATASETS, ...updatedCustom]);
    setSelectedDatasetId(newDataset.id);
    setIsImportModalOpen(false);
    setImportName('');
    setImportId('');
    setImportJson('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#0E1D4F]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              ĐÁNH GIÁ CHẤT LƯỢNG MÔ HÌNH
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              GOLDEN DATASET BENCHMARK
            </span>
          </div>
          <h2 className="font-headline-sm text-xl text-[#0E1D4F] font-bold">
            Kiểm thử Khớp Yêu cầu bằng Bộ Dữ liệu Chuẩn (Golden Datasets)
          </h2>
          <p className="text-xs text-[#4B5875] mt-0.5 max-w-2xl">
            Lựa chọn hoặc tải lên bộ dữ liệu kiểm định đã chuẩn hóa để chấm điểm độ chuẩn xác logic hành trình và vi khí hậu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-white border border-[#205BD6] text-[#205BD6] hover:bg-[#205BD6]/5 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Icon name="upload" className="size-4" />
          <span>Nhập bộ dữ liệu JSON mới</span>
        </button>
      </div>

      {/* Dataset Selector Bar (ADM-SYS-02A) */}
      <div className="p-4 rounded-2xl bg-[#EBF1F0]/50 border border-[#0E1D4F]/10 flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Tìm theo tên/mã dataset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-[#0E1D4F]/15 text-xs text-[#0E1D4F] focus:outline-none focus:border-[#205BD6]"
          />
          <Icon name="search" className="size-4 text-[#4B5875] absolute left-2.5 top-2.5" />
        </div>

        {/* Dropdown Selector */}
        <div className="flex-1">
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-xl border border-[#0E1D4F]/15 text-xs font-semibold text-[#0E1D4F] focus:outline-none focus:border-[#205BD6]"
          >
            {filteredDatasets.map((d) => (
              <option key={d.id} value={d.id}>
                [{d.id}] {d.name} — ({d.testCasesCount} testcases · Lần chạy: {d.lastRunDate})
                {d.isCustom ? ' (Tùy chỉnh)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button: Run Test (ADM-SYS-02C) */}
        <button
          type="button"
          onClick={handleRunTest}
          disabled={isRunning}
          className="px-5 py-2 rounded-xl bg-[#205BD6] hover:bg-[#1847a8] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          {isRunning ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Đang đánh giá...</span>
            </>
          ) : (
            <>
              <Icon name="play_arrow" className="size-4" />
              <span>Chạy kiểm thử ({selectedDataset.testCasesCount} ca)</span>
            </>
          )}
        </button>
      </div>

      {/* Selected Dataset Summary Card (ADM-SYS-02C) */}
      <div className="p-5 rounded-2xl border border-[#0E1D4F]/10 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#205BD6] bg-blue-50 px-2 py-0.5 rounded">
              {selectedDataset.id}
            </span>
            <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
              {selectedDataset.name}
            </h3>
            {selectedDataset.isCustom && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                Lưu trên trình duyệt
              </span>
            )}
          </div>
          <p className="text-xs text-[#4B5875]">{selectedDataset.description}</p>
          <div className="text-[11px] text-[#4B5875] pt-1">
            Lần chạy gần nhất: <strong className="text-[#0E1D4F]">{selectedDataset.lastRunDate}</strong> · Lần chạy hiện thời: <strong className="text-[#0E1D4F]">{lastRunDatasetId === selectedDataset.id ? 'Khớp bộ đang chọn' : 'Chưa chạy lại'}</strong>
          </div>
        </div>

        {/* Results summary badges */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              ✓ {passedCount} Đạt
            </span>
            {warningCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                ⚠ {warningCount} Cảnh báo
              </span>
            )}
            {failedCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                ✕ {failedCount} Lỗi
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsDetailModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0E1D4F] hover:bg-[#182a63] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <Icon name="visibility" className="size-4" />
            <span>Xem chi tiết testcase</span>
          </button>
        </div>
      </div>

      {/* DETAIL MODAL (ADM-SYS-02D): Failed first, Escape key, clean layout */}
      {isDetailModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsDetailModalOpen(false);
          }}
          tabIndex={-1}
        >
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#205BD6]">
                  KẾT QUẢ KIỂM THỬ CHI TIẾT ({selectedDataset.id})
                </span>
                <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                  {selectedDataset.name} (Sắp xếp: Ca lỗi lên trước)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] border border-[#0E1D4F]/10 cursor-pointer"
                aria-label="Đóng hộp thoại chi tiết"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[11px] flex items-center gap-2">
                <Icon name="info" className="size-4 text-amber-600 shrink-0" />
                <span>
                  Các trường hợp không đạt chuẩn (Failed) và cảnh báo (Warning) được ưu tiên xếp lên đầu để phục vụ rà soát prompt &amp; ràng buộc.
                </span>
              </div>

              {sortedTestCases.map((tc) => (
                <div
                  key={tc.id}
                  className={`p-4 rounded-xl border transition-all ${
                    tc.status === 'failed'
                      ? 'border-rose-300 bg-rose-50/40'
                      : tc.status === 'warning'
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-emerald-200 bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0E1D4F]">{tc.id}</span>
                      <h4 className="font-bold text-xs text-[#0E1D4F]">{tc.name}</h4>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tc.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : tc.status === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {tc.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] mt-2">
                    <div className="p-2.5 bg-white rounded-lg border border-[#0E1D4F]/5">
                      <strong className="block text-[#4B5875] mb-1">Dữ liệu Đầu vào (Input):</strong>
                      <p className="text-[#0E1D4F]">{tc.input}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-[#0E1D4F]/5">
                      <strong className="block text-[#4B5875] mb-1">Kỳ vọng (Expected):</strong>
                      <p className="text-[#0E1D4F]">{tc.expected}</p>
                    </div>
                  </div>

                  <div className="mt-2 p-2.5 bg-white rounded-lg border border-[#0E1D4F]/5 text-[11px]">
                    <strong className="block text-[#4B5875] mb-1">Kết quả Thực tế / Lý do (Actual / Reason):</strong>
                    <p className={tc.status === 'failed' ? 'text-rose-700 font-medium' : 'text-[#0E1D4F]'}>
                      {tc.actual}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#EBF1F0]/50 border-t border-[#0E1D4F]/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0E1D4F] text-white font-semibold text-xs cursor-pointer hover:bg-[#182a63]"
              >
                Đóng (Phím Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT JSON MODAL FOR DATASETS (ADM-SYS-02A/B) */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsImportModalOpen(false);
          }}
          tabIndex={-1}
        >
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#205BD6]">
                  TẢI LÊN BỘ DỮ LIỆU KIỂM THỬ
                </span>
                <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                  Nhập Golden Dataset qua JSON
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] border border-[#0E1D4F]/10 cursor-pointer"
                aria-label="Đóng hộp thoại nhập dataset"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {importError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <Icon name="error" className="size-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0E1D4F] mb-1">
                  Tên bộ dữ liệu: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiểm định vi khí hậu Tây Bắc Mùa Đông"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#0E1D4F]/15 bg-white text-xs text-[#0E1D4F] focus:outline-none focus:border-[#205BD6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0E1D4F] mb-1">
                  Mã bộ dữ liệu (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: DS-TAYBAC-01"
                  value={importId}
                  onChange={(e) => setImportId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#0E1D4F]/15 bg-white text-xs font-mono text-[#0E1D4F] focus:outline-none focus:border-[#205BD6]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#0E1D4F]">
                    Nội dung mảng JSON các testcases: <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setImportJson(
                        JSON.stringify(
                          [
                            {
                              id: 'TC-CUSTOM-01',
                              name: 'Tà Xùa 2N1Đ - Săn mây đỉnh gió',
                              input: 'Yêu cầu đi Tà Xùa vào sáng sớm thứ 7 có sương giá',
                              expected: 'Khuyến cáo áo ấm 3 lớp và giờ săn mây 05:30',
                              actual: 'Đã gắn khuyến nghị an toàn đèo dốc',
                              status: 'passed',
                            },
                          ],
                          null,
                          2
                        )
                      );
                    }}
                    className="text-[11px] text-[#205BD6] font-semibold hover:underline"
                  >
                    Dán mẫu JSON hợp lệ
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder={`[\n  {\n    "id": "TC-01",\n    "name": "Tên kịch bản",\n    "input": "Nội dung đầu vào",\n    "expected": "Kết quả kỳ vọng",\n    "actual": "Kết quả thực tế",\n    "status": "passed"\n  }\n]`}
                  className="w-full p-3 rounded-xl border border-[#0E1D4F]/15 bg-gray-50 font-mono text-[11px] text-[#0E1D4F] focus:outline-none focus:border-[#205BD6]"
                />
              </div>

              <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-[11px]">
                Bộ dữ liệu tải lên sẽ được lưu vào <code>localStorage</code> trên trình duyệt này và sẵn sàng cho các lần kiểm định tiếp theo.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0E1D4F]/10">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#0E1D4F]/15 text-[#0E1D4F] font-semibold text-xs hover:bg-[#EBF1F0]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#205BD6] text-white font-semibold text-xs hover:bg-[#1847a8]"
                >
                  Lưu &amp; Kích hoạt bộ dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

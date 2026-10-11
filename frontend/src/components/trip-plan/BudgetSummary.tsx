'use client';
import type { BudgetDto, TripBudgetResponse } from '@/types/tripApi';
import { money, tripPanelClass } from './ItineraryView';

const labels = { transport: 'Di chuyển', food: 'Ăn uống', stay: 'Lưu trú', tickets: 'Vé tham quan', other: 'Chi phí khác' } as const;

export default function BudgetSummary({ planned, actual, error }: { planned: BudgetDto; actual: TripBudgetResponse | null; error: string | null }) {
  return <section className={tripPanelClass} aria-label="Chi phí hành trình">
    <h2 className="text-lg font-bold mb-4">Ngân sách & chi phí</h2>
    <p className="mb-3">Chi phí đã biết: <strong>{money(planned.known_min_vnd)} – {money(planned.known_max_vnd)}</strong></p>
    {!planned.complete && <p className="text-sm text-amber-800 mb-3">Ước tính chưa đầy đủ. Chi phí chưa biết không được tính là miễn phí.</p>}
    {planned.known_over_budget_vnd > 0 && <p className="text-sm text-rose-700 mb-3">Vượt ngân sách: {money(planned.known_over_budget_vnd)}</p>}
    <dl className="space-y-3 text-sm">
      {(Object.keys(labels) as Array<keyof typeof labels>).map(key => <div key={key} className="border-t border-[#0E1D4F]/10 pt-3">
        <dt className="font-semibold">{labels[key]}</dt>
        <dd className="text-[#4B5875]">{money(planned.categories[key].min_vnd)} – {money(planned.categories[key].max_vnd)}</dd>
        {planned.categories[key].unknown_items > 0 && <dd className="text-amber-800">{planned.categories[key].unknown_items} khoản chưa có giá</dd>}
        {actual && actual.categories[key].actual_vnd > 0 && <dd>Đã chi: {money(actual.categories[key].actual_vnd)}</dd>}
      </div>)}
    </dl>
    {actual && actual.actual_total_vnd > 0 && <p className="mt-4 font-semibold">Tổng đã chi: {money(actual.actual_total_vnd)}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
  </section>;
}

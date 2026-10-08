import Icon from '@/components/ui/Icon';

export default function UnavailableAdminPanel({ title, description, actions = [] }: {
  title: string; description: string; actions?: string[];
}) {
  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <Icon name="info" className="size-6 shrink-0 text-[#205BD6]" aria-hidden="true" />
        <div>
          <h2 className="font-headline-sm text-xl text-[#0E1D4F] font-bold">{title}</h2>
          <p className="mt-2 text-sm text-[#4B5875]">{description}</p>
        </div>
      </div>
      <p role="status" className="rounded-2xl bg-[#EBF1F0]/50 border border-[#0E1D4F]/10 p-4 text-sm text-[#4B5875]">Chưa khả dụng — chưa có dữ liệu hoặc thao tác được backend hỗ trợ.</p>
      {actions.length > 0 && <div className="flex flex-wrap gap-3">{actions.map(action => (
        <button key={action} type="button" disabled className="px-4 py-2.5 rounded-xl bg-[#0E1D4F]/10 text-[#4B5875] text-sm font-semibold cursor-not-allowed">{action}</button>
      ))}</div>}
    </section>
  );
}

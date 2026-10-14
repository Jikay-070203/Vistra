'use client';

export default function ProfileSubscriptionTab() {
  return (
    <section className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 sm:p-8" aria-labelledby="subscription-title">
      <h2 id="subscription-title" className="font-headline-sm text-xl text-[#0E1D4F] font-bold">Gói dịch vụ &amp; Hạn mức</h2>
      <p className="mt-3 text-sm text-[#4B5875]" role="status">
        Tài khoản thành viên tiêu chuẩn VISTRA. Toàn bộ các tính năng cơ bản và lập kế hoạch đồng sáng tạo đang được cung cấp miễn phí.
      </p>
    </section>
  );
}

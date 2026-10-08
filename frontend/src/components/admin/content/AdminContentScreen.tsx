'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';
import {
  HeroCarouselPlan,
  AllergyOption,
} from '@/types/content';
import {
  getAdminContent,
  updateIntroContent,
  createHeroContent,
  updateHeroContent,
  createAllergyContent,
  updateAllergyContent,
  deleteContent,
} from '@/services/contentService';
import { useUserAuth } from '@/lib/userAuth';
import AllergyOptionModal from './AllergyOptionModal';

type ContentTab = 'intro' | 'hero' | 'allergies';

export interface AdminIntroItem {
  id: string;
  label: string;
  image: string;
  provinceCode: number | null;
  rawProvinceCode?: string | number | null;
  order: number;
  active: boolean;
  tagline?: string;
}

export default function AdminContentScreen() {
  const { user, isLoggedIn } = useUserAuth();
  const accountId = isLoggedIn && user?.role === 'admin' ? user.id : null;
  return accountId ? <AdminContentPanel key={accountId} /> : <p className="p-8 text-sm text-[#4B5875]">Cần phiên quản trị để quản lý nội dung.</p>;
}

function AdminContentPanel() {
  const [activeTab, setActiveTab] = useState<ContentTab>('intro');
  const [introList, setIntroList] = useState<AdminIntroItem[]>([]);
  const [heroList, setHeroList] = useState<HeroCarouselPlan[]>([]);
  const [allergyList, setAllergyList] = useState<AllergyOption[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentReload, setContentReload] = useState(0);

  // Modal / Form state for Intro Destinations
  const [editingIntro, setEditingIntro] = useState<AdminIntroItem | null>(null);
  const [introFormError, setIntroFormError] = useState<string | null>(null);

  // Modal / Form state for Hero Plans
  const [editingHero, setEditingHero] = useState<HeroCarouselPlan | null>(null);
  const [heroFormError, setHeroFormError] = useState<string | null>(null);

  // Modal / Form state for Allergies
  const [editingAllergy, setEditingAllergy] = useState<AllergyOption | null>(null);

  // Load content from Backend API on mount
  useEffect(() => {
    let mounted = true;

    getAdminContent()
      .then((res) => {
        if (!mounted) return;
        if (res.data) {
          setIntroList(
            res.data.introDestinations.map((d) => {
              const numCode =
                typeof d.provinceCode === 'number' && d.provinceCode > 0
                  ? d.provinceCode
                  : typeof d.provinceCode === 'string' && /^\d+$/.test(d.provinceCode.trim()) && Number(d.provinceCode) > 0
                  ? Number(d.provinceCode)
                  : null;
              return {
                id: d.id,
                label: d.label ?? '',
                image: d.image ?? '',
                provinceCode: numCode,
                rawProvinceCode: d.provinceCode,
                order: d.order,
                active: d.active,
                tagline: d.tagline ?? '',
              };
            })
          );
          setHeroList(
            res.data.heroPlans.map((h) => ({
              id: h.id,
              title: h.title,
              destination: h.destination ?? '',
              duration: h.duration ?? '',
              budget: h.budget ?? '',
              image: h.image ?? '',
              tags: h.tags ?? [],
              summary: h.summary ?? '',
              highlights: h.highlights ?? [],
              active: h.active,
              order: h.order,
            }))
          );
          setAllergyList(
            res.data.allergyOptions.map((a) => ({
              id: a.id,
              label: a.label ?? '',
              active: a.active,
            }))
          );
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setContentError(err instanceof Error ? err.message : 'Không thể tải nội dung Admin CMS từ máy chủ.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [contentReload]);

  const activeIntroCount = introList.filter((d) => d.active).length;
  const currentItems = activeTab === 'intro' ? introList : activeTab === 'hero' ? heroList : allergyList;
  const totalPages = Math.max(1, Math.ceil(currentItems.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const visibleIntro = introList.slice((page - 1) * pageSize, page * pageSize);
  const visibleHero = heroList.slice((page - 1) * pageSize, page * pageSize);
  const visibleAllergies = allergyList.slice((page - 1) * pageSize, page * pageSize);

  const handleSaveIntro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntro || isSubmitting) return;

    const label = editingIntro.label.trim();
    const image = editingIntro.image.trim();

    if (!label) {
      setIntroFormError('Vui lòng nhập tên địa danh');
      return;
    }
    if (!image) {
      setIntroFormError('Vui lòng nhập đường dẫn ảnh');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatePayload: Parameters<typeof updateIntroContent>[1] = {
        label,
        image,
        tagline: editingIntro.tagline || '',
        order: editingIntro.order,
        active: editingIntro.active,
      };

      const res = await updateIntroContent(editingIntro.id, updatePayload);

      const updated = res.data;
      const updatedCode =
        typeof updated.provinceCode === 'number' && updated.provinceCode > 0
          ? updated.provinceCode
          : typeof updated.provinceCode === 'string' && /^\d+$/.test(updated.provinceCode.trim()) && Number(updated.provinceCode) > 0
          ? Number(updated.provinceCode)
          : editingIntro.provinceCode;

      setIntroList((prev) =>
        prev.map((d) =>
          d.id === editingIntro.id
            ? {
                ...d,
                label: updated.label ?? label,
                image: updated.image ?? image,
                provinceCode: updatedCode,
                rawProvinceCode: updated.provinceCode,
                tagline: updated.tagline ?? '',
                order: updated.order,
                active: updated.active,
              }
            : d
        )
      );

      setEditingIntro(null);
      setSaveStatus('Đã cập nhật điểm đến trong Admin CMS.');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: unknown) {
      setIntroFormError(err instanceof Error ? err.message : 'Không thể lưu điểm đến vào máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleIntroActive = async (dest: AdminIntroItem) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await updateIntroContent(dest.id, { active: !dest.active });
      setIntroList((prev) =>
        prev.map((d) => (d.id === dest.id ? { ...d, active: res.data.active } : d))
      );
      setSaveStatus(`Đã ${res.data.active ? 'kích hoạt' : 'bỏ chọn'} điểm đến ${dest.label}.`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      setSaveStatus(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái hiển thị.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHero || isSubmitting) return;

    if (!editingHero.title.trim()) {
      setHeroFormError('Vui lòng nhập tiêu đề kế hoạch');
      return;
    }
    if (!editingHero.destination.trim()) {
      setHeroFormError('Vui lòng nhập địa danh');
      return;
    }
    if (!editingHero.image.trim()) {
      setHeroFormError('Vui lòng nhập đường dẫn ảnh');
      return;
    }

    try {
      setIsSubmitting(true);
      setHeroFormError(null);

      const isExisting = heroList.some((h) => h.id === editingHero.id);
      if (isExisting) {
        const res = await updateHeroContent(editingHero.id, {
          title: editingHero.title.trim(),
          destination: editingHero.destination.trim(),
          image: editingHero.image.trim(),
          duration: editingHero.duration,
          budget: editingHero.budget,
          summary: editingHero.summary,
          highlights: editingHero.highlights,
          tags: editingHero.tags,
          active: editingHero.active,
          order: editingHero.order,
        });

        const updated = res.data;
        setHeroList((prev) =>
          prev.map((h) =>
            h.id === editingHero.id
              ? {
                  ...h,
                  title: updated.title,
                  destination: updated.destination ?? '',
                  duration: updated.duration ?? '',
                  budget: updated.budget ?? '',
                  image: updated.image ?? '',
                  tags: updated.tags ?? [],
                  summary: updated.summary ?? '',
                  highlights: updated.highlights ?? [],
                  active: updated.active,
                  order: updated.order,
                }
              : h
          )
        );
        setSaveStatus('Đã cập nhật kế hoạch Hero Carousel trong Admin CMS.');
      } else {
        const res = await createHeroContent({
          title: editingHero.title.trim(),
          destination: editingHero.destination.trim(),
          image: editingHero.image.trim(),
          duration: editingHero.duration,
          budget: editingHero.budget,
          summary: editingHero.summary,
          highlights: editingHero.highlights,
          tags: editingHero.tags,
        });

        const created = res.data;
        setHeroList((prev) => [
          ...prev,
          {
            id: created.id,
            title: created.title,
            destination: created.destination ?? '',
            duration: created.duration ?? '',
            budget: created.budget ?? '',
            image: created.image ?? '',
            tags: created.tags ?? [],
            summary: created.summary ?? '',
            highlights: created.highlights ?? [],
            active: created.active,
            order: created.order,
          },
        ]);
        setSaveStatus('Đã tạo kế hoạch mới trong Admin CMS.');
      }

      setEditingHero(null);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: unknown) {
      setHeroFormError(err instanceof Error ? err.message : 'Không thể lưu kế hoạch vào máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleHeroActive = async (plan: HeroCarouselPlan) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await updateHeroContent(plan.id, { active: !plan.active });
      setHeroList((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, active: res.data.active } : p))
      );
      setSaveStatus(`Đã ${res.data.active ? 'bật' : 'tắt'} hiển thị kế hoạch.`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      setSaveStatus(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái kế hoạch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHero = async (id: string) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await deleteContent('hero-plans', id);
      setHeroList((prev) => prev.filter((p) => p.id !== id));
      setSaveStatus('Đã xóa kế hoạch khỏi Admin CMS.');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      setSaveStatus(err instanceof Error ? err.message : 'Không thể xóa kế hoạch khỏi máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSingleAllergy = async (allergy: { id?: string; label: string; active?: boolean }) => {
    const isExisting = allergyList.some((a) => a.id === allergy.id);
    if (isExisting && allergy.id) {
      const res = await updateAllergyContent(allergy.id, {
        label: allergy.label.trim(),
        active: allergy.active,
      });
      setAllergyList((prev) =>
        prev.map((a) =>
          a.id === allergy.id
            ? { ...a, label: res.data.label ?? allergy.label, active: res.data.active }
            : a
        )
      );
      setSaveStatus('Đã cập nhật mục dị ứng trong danh mục.');
    } else {
      const res = await createAllergyContent({
        label: allergy.label.trim(),
      });
      setAllergyList((prev) => [
        ...prev,
        {
          id: res.data.id,
          label: res.data.label ?? allergy.label,
          active: res.data.active ?? true,
        },
      ]);
      setSaveStatus('Đã thêm mục dị ứng mới vào danh mục.');
    }
    setEditingAllergy(null);
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleSaveBulkAllergies = async (items: string[]) => {
    const succeeded: string[] = [];
    const failed: { label: string; error: string }[] = [];

    for (const label of items) {
      try {
        const res = await createAllergyContent({ label: label.trim() });
        setAllergyList((prev) => [
          ...prev,
          {
            id: res.data.id,
            label: res.data.label ?? label,
            active: res.data.active ?? true,
          },
        ]);
        succeeded.push(label);
      } catch (err: unknown) {
        failed.push({
          label,
          error: err instanceof Error ? err.message : 'Không thể lưu vào máy chủ',
        });
      }
    }

    if (succeeded.length > 0 && failed.length === 0) {
      setSaveStatus(`Đã thêm thành công ${succeeded.length} mục dị ứng vào Admin CMS.`);
      setTimeout(() => setSaveStatus(null), 4000);
    } else if (succeeded.length > 0) {
      setSaveStatus(`Đã lưu ${succeeded.length} mục. Còn ${failed.length} mục gặp lỗi.`);
    }

    return { succeeded, failed };
  };

  const handleToggleAllergyActive = async (item: AllergyOption) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await updateAllergyContent(item.id, { active: !item.active });
      setAllergyList((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, active: res.data.active } : a))
      );
      setSaveStatus(`Đã ${res.data.active ? 'kích hoạt' : 'ẩn'} mục dị ứng ${item.label}.`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      setSaveStatus(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái dị ứng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAllergy = async (id: string) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await deleteContent('allergy-options', id);
      setAllergyList((prev) => prev.filter((a) => a.id !== id));
      setSaveStatus('Đã xóa mục dị ứng khỏi danh mục.');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      setSaveStatus(err instanceof Error ? err.message : 'Không thể xóa mục dị ứng khỏi máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || contentError) return <div className="max-w-[1720px] mx-auto w-full p-6 sm:p-8">
    <section className="bg-white rounded-3xl border border-[#0E1D4F]/10 p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#0E1D4F]">Quản trị Nội dung Landing & Danh mục Dịch vụ</h1>
      <p role={contentError ? 'alert' : 'status'} className="text-sm text-[#4B5875]">{contentError || 'Đang tải nội dung CMS…'}</p>
      {contentError && <button type="button" onClick={() => { setContentError(null); setIsLoading(true); setContentReload(value => value + 1); }} className="px-4 py-2.5 rounded-xl bg-[#205BD6] text-white font-semibold">Thử tải lại</button>}
    </section>
  </div>;
  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Top Banner (ADMINUI-01: No subtitle paragraph, only Title) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Quản trị Nội dung Landing &amp; Danh mục Dịch vụ
          </h1>
        </div>

        {/* Backend API status badge */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-2xl text-xs text-[#0E1D4F] font-semibold shadow-xs">
          <Icon name="cloud_done" size={16} className="text-[#205BD6] shrink-0" />
          <span>{isLoading ? 'Đang tải dữ liệu CMS...' : 'Đã tải dữ liệu CMS từ backend'}</span>
        </div>
      </div>

      <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Thay đổi được lưu vào Admin CMS. Đồng bộ với Hero, điểm đến Landing và danh mục dị ứng public đang chờ backend hỗ trợ.
      </p>

      {/* Global Notice Toast */}
      {saveStatus && (
        <div
          role="status"
          className="p-4 bg-blue-50 border border-[#205BD6]/30 text-[#0E1D4F] text-xs font-semibold rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <Icon name="info" size={16} className="text-[#205BD6]" />
            <span>{saveStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Content Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => { setActiveTab('intro'); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'intro'
              ? 'bg-[#205BD6] text-white shadow-sm'
              : 'bg-white text-[#4B5875] hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Icon name="explore" size={16} />
          <span>Điểm đến Intro ({activeIntroCount} hoạt động)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('hero'); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'hero'
              ? 'bg-[#205BD6] text-white shadow-sm'
              : 'bg-white text-[#4B5875] hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Icon name="view_carousel" size={16} />
          <span>Kế hoạch Hero Carousel ({heroList.length} plans)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('allergies'); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'allergies'
              ? 'bg-[#205BD6] text-white shadow-sm'
              : 'bg-white text-[#4B5875] hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Icon name="restaurant" size={16} />
          <span>Danh mục Dị ứng &amp; Ăn kiêng ({allergyList.length} mục)</span>
        </button>
      </div>

      {/* TAB 1: INTRO DESTINATIONS */}
      {activeTab === 'intro' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0E1D4F]">
                Điểm đến Khởi nguồn Trang chủ
              </h2>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Danh sách được lưu trong Admin CMS; nguồn điểm đến Landing hiện đọc catalog riêng.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
              Đang chọn: <strong className="text-[#205BD6]">{activeIntroCount}</strong> hiển thị
            </div>
          </div>

          {introList.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-[#4B5875]">Máy chủ chưa có điểm đến intro.</p>}
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleIntro.map((dest) => {
              const destName = dest.label || 'Điểm đến';
              const destImage = dest.image;
              const destTagline = dest.tagline || '';

              return (
                <div
                  key={dest.id}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
                    dest.active ? 'border-[#08B3C6]/60 ring-1 ring-[#08B3C6]/30' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="relative h-44 w-full bg-slate-100">
                      {destImage ? (
                        <Image
                          src={destImage}
                          alt={destName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Icon name="image" size={32} />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dest.active
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-500 text-white'
                          }`}
                        >
                          {dest.active ? 'Hiển thị' : 'Đang ẩn'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-[#0A1435]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                        Thứ tự: #{dest.order}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#0E1D4F] text-base">{destName}</h3>
                        <span className="font-mono text-xs text-[#205BD6] bg-[#205BD6]/10 px-2 py-0.5 rounded">
                          Mã tỉnh: {dest.provinceCode != null ? dest.provinceCode : dest.rawProvinceCode ? String(dest.rawProvinceCode) : 'Chưa gắn'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5875] line-clamp-2">
                        {destTagline || 'Chưa có mô tả ngắn'}
                      </p>
                    </div>
                  </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleToggleIntroActive(dest)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      dest.active
                        ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {dest.active ? 'Bỏ chọn' : 'Kích hoạt'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingIntro(dest)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#205BD6] text-white hover:bg-[#1847a8]"
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* TAB 2: HERO CAROUSEL PLANS */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0E1D4F]">
                Kế hoạch Gợi ý Hero Carousel
              </h2>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Hiển thị toàn bộ kế hoạch đang có, không áp đặt giới hạn số lượng và không dùng placeholder giả.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingHero({
                  id: `hero-${Date.now()}`,
                  title: '',
                  destination: '',
                  duration: '',
                  budget: '',
                  image: '',
                  summary: '',
                  tags: [],
                  highlights: [],
                  order: heroList.length + 1,
                  active: true,
                });
              }}
              className="px-4 py-2 rounded-xl bg-[#205BD6] text-white text-xs font-bold hover:bg-[#1847a8] flex items-center gap-1.5 shadow-xs"
            >
              <Icon name="add" size={16} />
              <span>Thêm Kế hoạch Mới</span>
            </button>
          </div>

          {heroList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Icon name="view_carousel" size={40} className="mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-[#0E1D4F]">Chưa có kế hoạch nào trong Carousel</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Bấm &quot;Thêm Kế hoạch Mới&quot; để tạo một kế hoạch gợi ý hiển thị trên trang chủ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleHero.map((plan) => {
                const planImage = plan.image;

                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 w-full bg-slate-100">
                        {planImage ? (
                          <Image
                            src={planImage}
                            alt={plan.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Icon name="image" size={32} />
                          </div>
                        )}
                      <div className="absolute top-3 left-3 bg-[#0E1D4F]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        {plan.destination}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/95 text-[#0E1D4F] text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        {plan.budget}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-[#0E1D4F] text-base line-clamp-1">{plan.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-[#4B5875]">
                        <span className="flex items-center gap-1">
                          <Icon name="schedule" size={14} className="text-[#08B3C6]" />
                          {plan.duration}
                        </span>
                        <span>•</span>
                        <span className="line-clamp-1">{plan.summary}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {plan.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleToggleHeroActive(plan)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                        plan.active
                          ? 'bg-white text-slate-600 border-slate-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}
                    >
                      {plan.active ? 'Đang bật' : 'Đang tắt'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingHero(plan)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#205BD6] text-white hover:bg-[#1847a8]"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDeleteHero(plan.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        aria-label="Xóa kế hoạch"
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALLERGIES CATALOG */}
      {activeTab === 'allergies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0E1D4F]">
                Danh mục Dị ứng &amp; Chế độ Ăn kiêng
              </h2>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Danh mục trong Admin CMS; chưa đồng bộ với catalog public hoặc request tạo chuyến đi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingAllergy({
                  id: `allergy-${Date.now()}`,
                  label: '',
                  active: true,
                });
              }}
              className="px-4 py-2 rounded-xl bg-[#205BD6] text-white text-xs font-bold hover:bg-[#1847a8] flex items-center gap-1.5 shadow-xs"
            >
              <Icon name="add" size={16} />
              <span>Thêm Mục Dị ứng</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[#0E1D4F] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Tên dị ứng / Kiêng cử</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleAllergies.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-[#4B5875]">Chưa có mục dị ứng nào trong danh mục.</td></tr>}
                {visibleAllergies.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0E1D4F]">
                      {item.label}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{item.active ? 'Đang dùng' : 'Đã ẩn'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleToggleAllergyActive(item)}
                          className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-[#0E1D4F] disabled:opacity-50"
                        >
                          {item.active ? 'Ẩn' : 'Kích hoạt'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAllergy(item)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold text-[#0E1D4F]"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleDeleteAllergy(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                          aria-label="Xóa dị ứng"
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <nav aria-label="Phân trang nội dung" className="flex items-center justify-between gap-3 text-xs text-[#4B5875]">
        <span>{currentItems.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, currentItems.length)} / {currentItems.length} mục</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page === 1} onClick={() => setCurrentPage(page - 1)} className="rounded-lg border border-[#0E1D4F]/15 bg-white px-3 py-2 disabled:opacity-40">Trước</button>
          <span>Trang {page}/{totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setCurrentPage(page + 1)} className="rounded-lg border border-[#0E1D4F]/15 bg-white px-3 py-2 disabled:opacity-40">Sau</button>
        </div>
      </nav>

      {/* MODAL: EDIT INTRO DESTINATION */}
      {editingIntro && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingIntro(null);
          }}
        >
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-[#0E1D4F]">
                Chỉnh sửa Điểm đến Intro: {editingIntro.label || 'Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingIntro(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveIntro} className="p-6 space-y-4 text-xs">
              {introFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold">
                  {introFormError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên địa danh</label>
                <input
                  type="text"
                  value={editingIntro.label}
                  onChange={(e) => setEditingIntro({ ...editingIntro, label: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  placeholder="Ví dụ: Quảng Bình"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={editingIntro.tagline || ''}
                  onChange={(e) => setEditingIntro({ ...editingIntro, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  placeholder="Ví dụ: Vương quốc hang động kỳ vĩ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã tỉnh đã lưu</label>
                  <input readOnly disabled value={editingIntro.rawProvinceCode == null ? '' : String(editingIntro.rawProvinceCode)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 bg-slate-100" />
                  <p className="mt-1 text-xs text-slate-600">Backend chưa cung cấp danh mục mã tỉnh hành chính; chỉnh sửa mã tỉnh chưa khả dụng.</p>                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thứ tự hiển thị (#)</label>
                  <input
                    type="number"
                    value={editingIntro.order}
                    onChange={(e) => setEditingIntro({ ...editingIntro, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL Hình ảnh</label>
                <input
                  type="url"
                  value={editingIntro.image}
                  onChange={(e) => setEditingIntro({ ...editingIntro, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              {/* Image Preview Box */}
              {editingIntro.image && (
                <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-200">
                  <Image
                    src={editingIntro.image}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-[#205BD6] font-semibold flex items-center gap-1">
                  <Icon name="cloud_upload" size={14} />
                  <span>Lưu vào Admin CMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIntro(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#205BD6] text-white font-semibold hover:bg-[#1847a8] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT HERO PLAN */}
      {editingHero && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingHero(null);
          }}
        >
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-[#0E1D4F]">
                Kế hoạch Carousel: {editingHero.title || 'Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingHero(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveHero} className="p-6 space-y-4 text-xs">
              {heroFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold">
                  {heroFormError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu đề kế hoạch</label>
                <input
                  type="text"
                  value={editingHero.title}
                  onChange={(e) => setEditingHero({ ...editingHero, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  placeholder="Ví dụ: Chinh phục Sơn Đoòng &amp; Di sản Phong Nha"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa danh</label>
                  <input
                    type="text"
                    value={editingHero.destination}
                    onChange={(e) => setEditingHero({ ...editingHero, destination: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                    placeholder="Quảng Bình"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngân sách ước tính</label>
                  <input
                    type="text"
                    value={editingHero.budget}
                    onChange={(e) => setEditingHero({ ...editingHero, budget: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                    placeholder="4.500.000 ₫"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thời lượng</label>
                  <input
                    type="text"
                    value={editingHero.duration}
                    onChange={(e) => setEditingHero({ ...editingHero, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                    placeholder="3 ngày 2 đêm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mô tả ngắn</label>
                  <input
                    type="text"
                    value={editingHero.summary}
                    onChange={(e) => setEditingHero({ ...editingHero, summary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                    placeholder="Nêu điểm nhấn của hành trình"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL Hình ảnh</label>
                <input
                  type="url"
                  value={editingHero.image}
                  onChange={(e) => setEditingHero({ ...editingHero, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              {editingHero.image && (
                <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-200">
                  <Image
                    src={editingHero.image}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-[#205BD6] font-semibold flex items-center gap-1">
                  <Icon name="cloud_upload" size={14} />
                  <span>Lưu vào Admin CMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingHero(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#205BD6] text-white font-semibold hover:bg-[#1847a8] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu kế hoạch'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT/BULK ALLERGY OPTION */}
      <AllergyOptionModal
        isOpen={Boolean(editingAllergy)}
        editingAllergy={editingAllergy}
        existingAllergies={allergyList}
        onClose={() => setEditingAllergy(null)}
        onSaveSingle={handleSaveSingleAllergy}
        onSaveBulk={handleSaveBulkAllergies}
      />
    </div>
  );
}

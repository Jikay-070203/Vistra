'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';
import { getTravelDnaLabel } from '@/config/travelDnaLabels';
import { getTravelDna, updateTravelDna } from '@/services/profileService';
import { useUserAuth } from '@/lib/userAuth';

const useIdentityEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface DnaDisplayItem {
  key: string;
  label: string;
  score: number | null;
  rating: string;
}

export default function ProfileDnaTab() {
  const { user } = useUserAuth();
  // Normalize absent ID strictly to null to avoid undefined vs null mismatch loops
  const currentUserId = user?.id ?? null;
  const [activeUserId, setActiveUserId] = useState<string | null>(currentUserId);

  const [dnaMetrics, setDnaMetrics] = useState<DnaDisplayItem[]>([]);
  const [isLoadingDna, setIsLoadingDna] = useState<boolean>(Boolean(currentUserId));
  const [dnaError, setDnaError] = useState<string | null>(null);
  const [hasLoadedBackendDna, setHasLoadedBackendDna] = useState(false);
  const [hasLoadedDnaSuccessfully, setHasLoadedDnaSuccessfully] = useState(false);
  const [pacePreference, setPacePreference] = useState<string>('');
  const [sceneryFocus, setSceneryFocus] = useState<string>('');
  const [cuisinePriority, setCuisinePriority] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', success: false });
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Immediate state normalization when account/identity changes
  if (currentUserId !== activeUserId) {
    setActiveUserId(currentUserId);
    setDnaMetrics([]);
    setPacePreference('');
    setSceneryFocus('');
    setCuisinePriority('');
    setLastUpdated(null);
    setHasLoadedBackendDna(false);
    setHasLoadedDnaSuccessfully(false);
    setDnaError(null);
    setSaveToast(false);
    setIsSaving(false);
    setIsLoadingDna(Boolean(currentUserId));
  }

  // Generation tracking for async operations; invalidated on identity change and unmount
  const asyncGenRef = useRef(0);
  const liveUserIdRef = useRef<string | null>(currentUserId);

  useIdentityEffect(() => {
    liveUserIdRef.current = currentUserId;
    asyncGenRef.current += 1;
    return () => {
      asyncGenRef.current += 1;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let isMounted = true;
    const opGen = asyncGenRef.current;
    const opUserId = currentUserId;

    async function loadDna() {
      try {
        const result = await getTravelDna();
        if (!isMounted || asyncGenRef.current !== opGen || liveUserIdRef.current !== opUserId) {
          return;
        }
        if (result.data) {
          const { metrics, preferences, updatedAt } = result.data;
          setLastUpdated(updatedAt ?? null);
          setDnaMetrics(
            Array.isArray(metrics)
              ? metrics.map((m) => {
                  const validScore = typeof m.score === 'number' ? m.score : null;
                  return {
                    key: m.key,
                    label: getTravelDnaLabel(m.key),
                    score: validScore,
                    rating: validScore !== null
                      ? (validScore >= 80 ? 'Rất cao' : validScore >= 60 ? 'Ưu tiên' : 'Vừa phải')
                      : 'Chưa có dữ liệu',
                  };
                })
              : []
          );
          setHasLoadedBackendDna(true);
          setHasLoadedDnaSuccessfully(true);

          setPacePreference(preferences.pace ?? '');
          setSceneryFocus(preferences.sceneryFocus ?? '');
          setCuisinePriority(preferences.cuisinePriority ?? '');
        }
      } catch (cause: unknown) {
        if (!isMounted || asyncGenRef.current !== opGen || liveUserIdRef.current !== opUserId) {
          return;
        }
        setDnaError(cause instanceof Error ? cause.message : 'Chưa thể tải dữ liệu Travel DNA từ máy chủ.');
        setHasLoadedDnaSuccessfully(false);
      } finally {
        if (isMounted && asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
          setIsLoadingDna(false);
        }
      }
    }

    loadDna();
    return () => {
      isMounted = false;
    };
  }, [currentUserId, reloadTrigger]);

  const handleUpdatePreference = (index: number, newScore: number) => {
    const updated = [...dnaMetrics];
    updated[index] = {
      ...updated[index],
      score: newScore,
      rating: newScore >= 80 ? 'Rất cao' : newScore >= 60 ? 'Ưu tiên' : 'Vừa phải',
    };
    setDnaMetrics(updated);
  };

  const handleSavePreferences = async () => {
    if (isSaving || !currentUserId || activeUserId !== currentUserId || !hasLoadedDnaSuccessfully) {
      return;
    }

    const opGen = asyncGenRef.current;
    const opUserId = currentUserId;

    setIsSaving(true);
    try {
      const patchPayload: Parameters<typeof updateTravelDna>[0] = {
        pace: pacePreference.trim() || null,
        sceneryFocus: sceneryFocus.trim() || null,
        cuisinePriority: cuisinePriority.trim() || null,
      };
      if (hasLoadedBackendDna) {
        patchPayload.metrics = dnaMetrics.map((m) => ({
          key: m.key,
          score: m.score ?? 50,
        }));
      }

      const result = await updateTravelDna(patchPayload);

      if (asyncGenRef.current !== opGen || liveUserIdRef.current !== opUserId) {
        return;
      }

      if (result.data) {
        const { metrics, preferences, updatedAt } = result.data;
        setLastUpdated(updatedAt ?? null);
        setDnaMetrics(
          Array.isArray(metrics)
            ? metrics.map((m) => {
                const validScore = typeof m.score === 'number' ? m.score : null;
                return {
                  key: m.key,
                  label: getTravelDnaLabel(m.key),
                  score: validScore,
                  rating: validScore !== null
                    ? (validScore >= 80 ? 'Rất cao' : validScore >= 60 ? 'Ưu tiên' : 'Vừa phải')
                    : 'Chưa có dữ liệu',
                };
              })
            : []
        );
        setPacePreference(preferences.pace ?? '');
        setSceneryFocus(preferences.sceneryFocus ?? '');
        setCuisinePriority(preferences.cuisinePriority ?? '');

        setToastMessage({
          success: true,
          title: 'Đã lưu Travel DNA thành công!',
          desc: 'Đã cập nhật các chỉ số và tùy chọn DNA theo phản hồi máy chủ.',
        });
        setSaveToast(true);
        setTimeout(() => {
          if (asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
            setSaveToast(false);
          }
        }, 3500);
      }
    } catch (err: unknown) {
      if (asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
        setToastMessage({
          success: false,
          title: 'Lỗi khi cập nhật Travel DNA',
          desc: err instanceof Error ? err.message : 'Không thể kết nối máy chủ để lưu Travel DNA. Thay đổi được giữ trong phiên nháp.',
        });
        setSaveToast(true);
        setTimeout(() => {
          if (asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
            setSaveToast(false);
          }
        }, 4500);
      }
    } finally {
      if (asyncGenRef.current === opGen && liveUserIdRef.current === opUserId) {
        setIsSaving(false);
      }
    }
  };

  if (!currentUserId) {
    return (
      <div className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-8 text-center text-sm text-[#4B5875]">
        <p>Đăng nhập để xem và cập nhật Travel DNA của bạn.</p>
        <Link href="/login" className="inline-block mt-3 text-[#205BD6] font-semibold underline">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {saveToast && (
        <div
          role={toastMessage.success ? 'status' : 'alert'}
          className="fixed right-4 top-20 z-50 flex max-w-md items-center gap-3 rounded-xl bg-[#0E1D4F] p-4 text-white shadow-lg animate-in fade-in slide-in-from-top-4 sm:right-6"
        >
          <Icon name={toastMessage.success ? 'check_circle' : 'warning'} className="size-5 text-[#08B3C6] shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="block text-white font-bold">{toastMessage.title}</strong>
            <span className="text-[#EBF1F0]/80">{toastMessage.desc}</span>
          </div>
        </div>
      )}

      {/* 1. Main DNA Overview Card at TOP (VST-PROFILE-01) */}
      <div className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-5 sm:p-7">
        {/* Header with Save button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#0E1D4F]/10 mb-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-[#205BD6]/10 text-[#205BD6] text-xs font-bold uppercase tracking-wider">
                Mô hình Travel DNA
              </span>
              <span className="text-xs text-[#4B5875]">
                {lastUpdated ? `Cập nhật: ${lastUpdated}` : 'Đồng bộ máy chủ (/api/v1/profile/dna)'}
              </span>
            </div>
            <h2 className="font-headline-sm text-2xl text-[#0E1D4F] font-bold">
              Bản đồ Travel DNA &amp; Chỉ số cá nhân hóa
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5875] mt-1 leading-relaxed">
              Mô hình học hỏi sở thích du lịch từ thói quen lập kế hoạch và các tùy chỉnh trực tiếp bên dưới.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSaving || !currentUserId || !hasLoadedDnaSuccessfully}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#205BD6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Icon name="save" className="size-4" />
              )}
              <span>{isSaving ? 'Đang lưu DNA...' : 'Áp dụng cập nhật DNA'}</span>
            </button>
          </div>
        </div>

        {/* DNA Metrics Sliders at Top */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-label-caps uppercase tracking-wider font-bold text-[#0E1D4F] flex items-center gap-2">
              <Icon name="equalizer" className="size-4 text-[#205BD6]" />
              <span>Chỉ số DNA hiện tại &amp; Tùy chỉnh trực tiếp</span>
            </h3>
            <span className="text-xs text-[#4B5875]">Kéo thanh trượt để điều chỉnh mức ưu tiên</span>
          </div>

          {isLoadingDna ? (
            <div className="p-8 rounded-2xl border border-[#0E1D4F]/10 text-center text-xs text-[#4B5875] flex items-center justify-center gap-3" role="status">
              <span className="w-4 h-4 border-2 border-[#205BD6] border-t-transparent rounded-full animate-spin"></span>
              <span>Đang tải chỉ số Travel DNA từ máy chủ...</span>
            </div>
          ) : dnaError ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2" role="alert">
              <Icon name="warning" className="size-4 shrink-0 text-amber-600" />
              <span>{dnaError}</span>
              <button
                type="button"
                onClick={() => {
                  setIsLoadingDna(true);
                  setDnaError(null);
                  setReloadTrigger((value) => value + 1);
                }}
                className="ml-auto inline-flex min-h-11 shrink-0 items-center px-4 py-2 font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]"
              >
                Thử lại
              </button>
            </div>
          ) : dnaMetrics.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[#0E1D4F]/10 text-center text-xs text-[#4B5875]">
              Chưa có dữ liệu chỉ số DNA từ máy chủ.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dnaMetrics.map((metric, idx) => (
                <div
                  key={metric.key || idx}
                  className="space-y-3 rounded-xl border border-[#0E1D4F]/10 bg-[#EBF1F0]/35 p-4 transition-colors hover:border-[#205BD6]/40 sm:p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0E1D4F]">{metric.label}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                        metric.score !== null
                          ? 'text-[#205BD6] bg-[#205BD6]/10 border-[#205BD6]/20'
                          : 'text-[#4B5875] bg-[#EBF1F0] border-[#0E1D4F]/10'
                      }`}
                    >
                      {metric.score !== null ? `${metric.score}%` : 'Chưa có dữ liệu'}
                    </span>
                  </div>

                  <div className="pt-1">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      value={metric.score ?? 50}
                      onChange={(e) => handleUpdatePreference(idx, parseInt(e.target.value, 10))}
                      disabled={isSaving || !hasLoadedDnaSuccessfully}
                      className="min-h-11 w-full rounded-lg bg-[#EBF1F0] accent-[#205BD6] cursor-pointer disabled:opacity-60"
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
          )}
        </div>

        {hasLoadedDnaSuccessfully && (
          <section className="mt-8 pt-6 border-t border-[#0E1D4F]/10" aria-labelledby="travel-dna-preferences-heading">
            <div className="mb-4">
              <h3 id="travel-dna-preferences-heading" className="text-xs font-label-caps uppercase tracking-wider font-bold text-[#0E1D4F]">
                Tùy chọn du lịch
              </h3>
              <p className="text-xs text-[#4B5875] mt-1">Các lựa chọn này được lưu cùng Travel DNA của bạn.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#0E1D4F]">Nhịp độ</span>
                <input
                  type="text"
                  maxLength={80}
                  value={pacePreference}
                  onChange={(event) => setPacePreference(event.target.value)}
                  disabled={isSaving}
                  placeholder="Chưa thiết lập"
                  className="w-full rounded-xl border border-[#0E1D4F]/10 bg-white px-3 py-2.5 text-sm text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus-visible:outline-2 focus-visible:outline-[#205BD6] disabled:opacity-60"
                />
              </label>
              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#0E1D4F]">Ưu tiên cảnh quan</span>
                <input
                  type="text"
                  maxLength={80}
                  value={sceneryFocus}
                  onChange={(event) => setSceneryFocus(event.target.value)}
                  disabled={isSaving}
                  placeholder="Chưa thiết lập"
                  className="w-full rounded-xl border border-[#0E1D4F]/10 bg-white px-3 py-2.5 text-sm text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus-visible:outline-2 focus-visible:outline-[#205BD6] disabled:opacity-60"
                />
              </label>
              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#0E1D4F]">Ưu tiên ẩm thực</span>
                <input
                  type="text"
                  maxLength={80}
                  value={cuisinePriority}
                  onChange={(event) => setCuisinePriority(event.target.value)}
                  disabled={isSaving}
                  placeholder="Chưa thiết lập"
                  className="w-full rounded-xl border border-[#0E1D4F]/10 bg-white px-3 py-2.5 text-sm text-[#0E1D4F] placeholder:text-[#4B5875]/60 focus-visible:outline-2 focus-visible:outline-[#205BD6] disabled:opacity-60"
                />
              </label>
            </div>
          </section>
        )}
      </div>

          </div>
  );
}

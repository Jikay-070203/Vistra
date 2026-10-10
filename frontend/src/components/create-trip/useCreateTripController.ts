'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/lib/userAuth';
import { createTrip } from '@/services/tripService';
import { uploadCloudinaryImage } from '@/services/cloudinaryUploadService';
import { analyzeTripImages } from '@/services/dnaAnalysisService';
import { ApiClientError } from '@/services/apiClient';
import { getProvinceCatalog, getAllergyCatalog } from '@/services/catalogService';
import type { PlanPace } from '@/types/planApi';
import type { CreatedTripView } from '@/types/tripCreateApi';
import type { TravelDnaMetric } from '@/types/tripDna';
import { DEFAULT_BUDGET_MIN } from '@/components/shared/BudgetRangeField';
import { validateImageSelection } from './imageUploadValidation';
import { matchRejectedDnaAttachments } from './dnaAnalysisErrors';
import { abortPendingUpload, isCurrentUploadSession } from './uploadSession';
import { restoreTravelDnaMetrics } from './travelDnaState';
import type { LocalImageAttachment } from './types';

export function useCreateTripController() {
  const router = useRouter();
  const { user, isLoggedIn, isLoaded } = useUserAuth();
  const preferredProvince = useSearchParams().get('province');
  const accountId = isLoggedIn ? user?.id ?? null : null;
  const accountRef = useRef<string | null>(accountId);

  // Auth Guard: Auto-redirect anonymous users to login
  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      router.replace('/login?next=/create-trip');
    }
  }, [isLoaded, isLoggedIn, router]);

  const submittingRef = useRef(false);
  const [catalog, setCatalog] = useState<Array<{ id: number; slug: string; name: string }>>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // Form core fields (accepted by backend API)
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState({ min: DEFAULT_BUDGET_MIN, max: DEFAULT_BUDGET_MIN });
  const [people, setPeople] = useState(1);
  const [pace, setPace] = useState<PlanPace>('normal');

  // Allergies remain local until TripCreate accepts them.
  const [notes, setNotes] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [allergyOptions, setAllergyOptions] = useState<string[]>([]);
  const [allergyLoading, setAllergyLoading] = useState(true);
  const [allergyError, setAllergyError] = useState<string | null>(null);
  const [allergyReload, setAllergyReload] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Local image attachments (managed client-side, zero mock API calls)
  const [attachments, setAttachments] = useState<LocalImageAttachment[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<LocalImageAttachment | null>(null);
  const [travelDna, setTravelDna] = useState<TravelDnaMetric[]>([]);
  const [travelDnaAnalysisId, setTravelDnaAnalysisId] = useState<string | null>(null);
  const [dnaStatus, setDnaStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [dnaError, setDnaError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ accountId: string; message: string } | null>(null);
  const [created, setCreated] = useState<(CreatedTripView & { accountId: string }) | null>(null);

  // Keep attachment state synchronized for concurrent upload callbacks.
  const attachmentsRef = useRef<LocalImageAttachment[]>(attachments);
  attachmentsRef.current = attachments;
  const dnaRequestIdRef = useRef(0);
  const originalTravelDnaRef = useRef<TravelDnaMetric[]>([]);
  const uploadGenerationRef = useRef(0);
  const previousAccountIdRef = useRef(accountId);
  const uploadControllersRef = useRef(new Map<string, AbortController>());

  const updateAttachments = (update: (current: LocalImageAttachment[]) => LocalImageAttachment[]) => {
    const next = update(attachmentsRef.current);
    attachmentsRef.current = next;
    setAttachments(next);
    return next;
  };

  const invalidateAttachmentSession = () => {
    uploadGenerationRef.current += 1;
    uploadControllersRef.current.forEach((controller) => controller.abort());
    uploadControllersRef.current.clear();
    dnaRequestIdRef.current += 1;
    attachmentsRef.current.forEach((attachment) => {
      try {
        URL.revokeObjectURL(attachment.previewUrl);
      } catch {
        // Ignore revocation errors for URLs already released by the browser.
      }
    });
    attachmentsRef.current = [];
    originalTravelDnaRef.current = [];
  };

  const analyzeUploadedImages = async () => {
    const imageUrls = attachmentsRef.current
      .filter((attachment) => attachment.uploadStatus === 'uploaded' && attachment.imageUrl)
      .map((attachment) => attachment.imageUrl as string);

    if (imageUrls.length === 0) {
      dnaRequestIdRef.current += 1;
      originalTravelDnaRef.current = [];
      setTravelDna([]);
      setTravelDnaAnalysisId(null);
      setDnaStatus('idle');
      setDnaError(null);
      return;
    }

    const requestId = ++dnaRequestIdRef.current;
    originalTravelDnaRef.current = [];
    setTravelDna([]);
    setTravelDnaAnalysisId(null);
    setDnaStatus('loading');
    setDnaError(null);
    try {
      const result = await analyzeTripImages(imageUrls);
      if (requestId !== dnaRequestIdRef.current) return;
      if (result.data.status !== 'completed' || !result.data.analysisId.trim()) {
        throw new Error('Phân tích ảnh chưa hoàn tất. Vui lòng thử lại trước khi tạo chuyến đi.');
      }
      const rejectedImages: string[] = [];
      updateAttachments(current => current.map(attachment => {
        if (!attachment.imageUrl || !imageUrls.includes(attachment.imageUrl)) return attachment;
        const source = result.data.sources.find(item => item.url === attachment.imageUrl && item.status === 'rejected')
          ?? result.data.sources.find(item => item.url === attachment.imageUrl);
        const analysisError = source?.status === 'processed' ? undefined
          : source?.error ?? 'Máy chủ chưa xác nhận ảnh này.';
        if (analysisError) rejectedImages.push(`${attachment.name} (${analysisError})`);
        return { ...attachment, analysisError };
      }));
      if (rejectedImages.length > 0) {
        throw new Error(`Không thể phân tích ảnh: ${rejectedImages.join(', ')}. Hãy thử lại hoặc gỡ các ảnh này.`);
      }
      originalTravelDnaRef.current = restoreTravelDnaMetrics(result.data.metrics);
      setTravelDnaAnalysisId(result.data.analysisId);
      setTravelDna(restoreTravelDnaMetrics(originalTravelDnaRef.current));
      setDnaStatus(result.data.metrics.length > 0 ? 'ready' : 'empty');
    } catch (cause: unknown) {
      if (requestId !== dnaRequestIdRef.current) return;
      setTravelDnaAnalysisId(null);
      setDnaStatus('error');
      const rejectedAttachments = cause instanceof ApiClientError
        ? matchRejectedDnaAttachments(cause.responseData, attachmentsRef.current)
        : [];
      if (rejectedAttachments.length > 0) {
        const rejectedByUrl = new Map(rejectedAttachments.map(attachment => [attachment.url, attachment.message]));
        updateAttachments(current => current.map(attachment => {
          const message = attachment.imageUrl ? rejectedByUrl.get(attachment.imageUrl) : undefined;
          return message ? { ...attachment, analysisError: message } : attachment;
        }));
        setDnaError(`Không thể phân tích ảnh: ${rejectedAttachments.map(item => `${item.name} — ${item.message}`).join(' ')} Hãy thử ảnh khác hoặc gỡ ảnh bị từ chối.`);
      } else {
        setDnaError(cause instanceof Error ? cause.message : 'Không thể phân tích Travel DNA từ ảnh.');
      }
    }
  };

  useLayoutEffect(() => {
    const accountChanged = previousAccountIdRef.current !== accountId;
    previousAccountIdRef.current = accountId;
    accountRef.current = accountId;
    if (!accountChanged) return;

    invalidateAttachmentSession();
    setAttachments([]);
    setPreviewAttachment(null);
    setTravelDna([]);
    setTravelDnaAnalysisId(null);
    setDnaStatus('idle');
    setDnaError(null);
    setDestination('');
    setStartDate('');
    setEndDate('');
    setBudget({ min: DEFAULT_BUDGET_MIN, max: DEFAULT_BUDGET_MIN });
    setPeople(1);
    setPace('normal');
    setNotes('');
    setSelectedAllergies([]);
    setError(null);
    setCreated(null);
  }, [accountId]);

  useEffect(() => () => invalidateAttachmentSession(), []);

  useEffect(() => {
    let active = true;
    getProvinceCatalog().then(({ data: items }) => {
      if (!active) return;
      setCatalog(items);
      setCatalogError(null);
      if (preferredProvince) {
        const match = items.find(item => item.slug === preferredProvince || item.name === preferredProvince);
        if (match) setDestination(match.slug);
      }
    }).catch((cause: unknown) => {
      if (active) setCatalogError(cause instanceof Error ? cause.message : 'Không thể tải danh mục tỉnh.');
    }).finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [reload, preferredProvince]);

  useEffect(() => {
    let active = true;
    setAllergyLoading(true);
    setAllergyError(null);
    getAllergyCatalog().then(({ data: items }) => {
      if (!active) return;
      const activeLabels = items.filter(item => item.active !== false).map(item => item.label);
      setAllergyOptions(activeLabels);
      setAllergyError(null);
    }).catch((cause: unknown) => {
      if (active) setAllergyError(cause instanceof Error ? cause.message : 'Không thể tải danh mục dị ứng.');
    }).finally(() => {
      if (active) setAllergyLoading(false);
    });
    return () => { active = false; };
  }, [allergyReload]);

  const retryAllergies = () => {
    setAllergyLoading(true);
    setAllergyError(null);
    setAllergyReload((v) => v + 1);
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(item => item !== allergy) : [...prev, allergy]
    );
  };

  const addImageFiles = (files: FileList | File[]) => {
    setToastMessage(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    const selection = validateImageSelection(attachmentsRef.current.length, fileArray);
    if (selection.rejected.length > 0) {
      const reasons = new Set(selection.rejected.map((item) => item.reason));
      setToastMessage([
        reasons.has('unsupported_type') && 'Chỉ hỗ trợ ảnh JPG/JPEG và PNG.',
        reasons.has('too_large') && 'Mỗi ảnh phải có dung lượng không quá 5 MB.',
        reasons.has('too_many') && 'Để đảm bảo tối đa sự ăn khớp với ý tưởng của bạn, chúng tôi xin tối đa chỉ 3 hình.',
      ].filter(Boolean).join(' '));
    }
    if (selection.accepted.length === 0) return;

    const newAttachments: LocalImageAttachment[] = selection.accepted.map((file) => {
      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);
      return {
        id,
        file,
        previewUrl,
        name: file.name || 'Ảnh đính kèm',
        uploadStatus: 'uploading',
      };
    });

    updateAttachments((current) => [...current, ...newAttachments]);
    for (const attachment of newAttachments) void uploadAttachment(attachment.id);
  };

  const uploadAttachment = async (id: string) => {
    const attachment = attachmentsRef.current.find((item) => item.id === id);
    const uploadAccountId = accountRef.current;
    if (!attachment || !uploadAccountId) return;
    const uploadSession = { accountId: uploadAccountId, generation: uploadGenerationRef.current };
    const controller = new AbortController();
    uploadControllersRef.current.set(id, controller);
    updateAttachments((current) => current.map((item) => item.id === id
      ? { ...item, uploadStatus: 'uploading', uploadError: undefined, analysisError: undefined }
      : item));
    try {
      const uploaded = await uploadCloudinaryImage(attachment.file, undefined, controller.signal);
      if (!isCurrentUploadSession(uploadSession, accountRef.current, uploadGenerationRef.current)) return;
      let stillAttached = false;
      updateAttachments((current) => current.map((item) => {
        if (item.id !== id) return item;
        stillAttached = true;
        return {
          ...item,
          uploadStatus: 'uploaded',
          cloudinaryPublicId: uploaded.publicId,
          imageUrl: uploaded.secureUrl,
          uploadError: undefined,
          analysisError: undefined,
        };
      }));
      if (stillAttached) await analyzeUploadedImages();
    } catch (cause: unknown) {
      if (!isCurrentUploadSession(uploadSession, accountRef.current, uploadGenerationRef.current)) return;
      updateAttachments((current) => current.map((item) => item.id === id
        ? { ...item, uploadStatus: 'failed', uploadError: cause instanceof Error ? cause.message : 'Không thể tải ảnh lên.' }
        : item));
    } finally {
      if (uploadControllersRef.current.get(id) === controller) uploadControllersRef.current.delete(id);
    }
  };

  const removeImage = (id: string) => {
    const target = attachmentsRef.current.find((item) => item.id === id);
    if (target?.uploadStatus === 'uploading') abortPendingUpload(uploadControllersRef.current, id);
    updateAttachments((current) => current.filter((item) => item.id !== id));
    if (target) URL.revokeObjectURL(target.previewUrl);

    if (previewAttachment?.id === id) {
      setPreviewAttachment(null);
    }
    if (target?.uploadStatus === 'uploaded') void analyzeUploadedImages();
  };

  const changeTravelDnaMetric = (key: string, score: number) => {
    setTravelDna((current) => current.map((metric) => metric.key === key ? { ...metric, score } : metric));
  };

  const resetTravelDna = () => {
    setTravelDna(restoreTravelDnaMetrics(originalTravelDnaRef.current));
  };

  const submit = async () => {
    if (submittingRef.current || !accountRef.current) return;
    const days = (Date.parse(endDate) - Date.parse(startDate)) / 86400000 + 1;
    if (!catalog.some(item => item.slug === destination) || !startDate || !endDate ||
        !Number.isInteger(days) || days < 1 || !Number.isInteger(people) || people < 1 || people > 50) {
      setError({ accountId: accountRef.current, message: 'Chọn tỉnh, ngày đi/ngày về hợp lệ và số người từ 1 đến 50.' });
      return;
    }
    if (!Number.isInteger(budget.min) || !Number.isInteger(budget.max) ||
        budget.min < 0 || budget.max > 100_000_000_000 || budget.min > budget.max || notes.trim().length > 5000) {
      setError({ accountId: accountRef.current, message: 'Ngân sách phải là số nguyên từ 0 đến 100 tỷ VNĐ và mức tối thiểu không vượt quá tối đa; ghi chú tối đa 5.000 ký tự.' });
      return;
    }
    if (attachmentsRef.current.length > 0 && (attachmentsRef.current.some(item => item.uploadStatus !== 'uploaded' || item.analysisError) ||
        !travelDnaAnalysisId || (dnaStatus !== 'ready' && dnaStatus !== 'empty'))) {
      setError({ accountId: accountRef.current, message: 'Hãy tải lên và phân tích xong tất cả ảnh trước khi tạo chuyến đi; thử tải lại hoặc gỡ ảnh bị lỗi.' });
      return;
    }
    const currentAccId = accountRef.current;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const result = await createTrip({
        destination,
        start_date: startDate,
        days,
        people,
        budget_vnd: budget.max,
        budget_scope: 'total',
        transport: 'car',
        pace,
        notes: notes.trim(),
        ...(travelDnaAnalysisId ? { dna_analysis_id: travelDnaAnalysisId } : {}),
        ...(travelDna.length > 0 ? {
          travel_dna_override: { metrics: travelDna.map(({ key, score }) => ({ key, score })) },
        } : {}),
      });
      if (accountRef.current === currentAccId) {
        setCreated({ ...result.data, accountId: currentAccId });
        router.push(`/planner?trip_id=${encodeURIComponent(result.data.id)}`);
      }
    } catch (cause: unknown) {
      if (accountRef.current === currentAccId) setError({ accountId: currentAccId, message: cause instanceof Error ? cause.message : 'Không thể tạo chuyến đi.' });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    isLoggedIn,
    isLoaded,
    catalog,
    catalogLoading,
    catalogError,
    retryCatalog: () => { setCatalogLoading(true); setCatalogError(null); setReload(value => value + 1); },
    destination,
    setDestination,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    budget,
    setBudget,
    people,
    setPeople,
    pace,
    setPace,
    notes,
    setNotes,
    selectedAllergies,
    toggleAllergy,
    allergyOptions,
    allergyLoading,
    allergyError,
    retryAllergies,
    toastMessage,
    clearToast: () => setToastMessage(null),
    attachments,
    addImageFiles,
    removeImage,
    previewAttachment,
    setPreviewAttachment,
    travelDna,
    travelDnaAnalysisId,
    dnaStatus,
    dnaError,
    changeTravelDnaMetric,
    resetTravelDna,
    retryImageUpload: uploadAttachment,
    isSubmitting,
    error: error?.accountId === accountId ? error.message : null,
    created: created?.accountId === accountId ? created : null,
    submit,
  };
}

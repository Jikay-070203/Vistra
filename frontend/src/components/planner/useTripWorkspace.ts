'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUserAuth } from '@/lib/userAuth';
import { ApiClientError } from '@/services/apiClient';
import { commitTripRevision, confirmTrip, generateTrip, getTrip, getTripBudget, previewTripRevision,
  sendTripMessage, setTripPublication } from '@/services/tripService';
import type { RevisionPreviewDto } from '@/types/planApi';
import type { TripBudgetResponse, TripDetailDto } from '@/types/tripApi';

export function formatPlannerErrorMessage(cause: unknown, fallbackMessage = 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.'): string {
  if (cause instanceof ApiClientError) {
    const detail = cause.responseData && typeof cause.responseData === 'object' && 'detail' in cause.responseData
      ? cause.responseData.detail : undefined;
    if (cause.httpStatus === 409) {
      if (typeof detail === 'string' && detail.includes('Hãy tạo lịch trình')) return detail;
      return 'Lịch trình đã bị thay đổi bởi thao tác khác. Vui lòng tải lại hành trình.';
    }
    if (cause.httpStatus === 422) {
      if (detail === 'Generate an itinerary before confirming the plan')
        return 'Máy chủ chưa cho phép chốt chuyến đi khi chưa có lịch trình chi tiết.';
      if (Array.isArray(detail) && detail.some(issue =>
        typeof issue === 'object' && issue !== null && 'loc' in issue &&
        Array.isArray(issue.loc) && issue.loc.includes('base_version')))
        return 'Máy chủ chưa hỗ trợ chat khi hành trình chưa có lịch trình chi tiết.';
      return `Máy chủ từ chối yêu cầu (422): ${typeof detail === 'string' ? detail : 'Dữ liệu hiện tại chưa hợp lệ.'}`;
    }
    if (cause.httpStatus === 404) return 'Không tìm thấy dữ liệu hành trình.';
    if (cause.httpStatus === 401 || cause.httpStatus === 403) return 'Bạn không có quyền thực hiện thao tác này hoặc phiên đăng nhập đã hết hạn.';
    if (cause.httpStatus && cause.httpStatus >= 500) return 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.';
    if (cause.errorType === 'network_error') return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.';
    return fallbackMessage;
  }
  if (cause instanceof Error) {
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(cause.message)) {
      return cause.message;
    }
    return fallbackMessage;
  }
  return fallbackMessage;
}

export function useTripWorkspace(loadBudget = false) {
  const searchParams = useSearchParams();
  const id = searchParams.get('trip_id') ?? searchParams.get('id') ?? '';
  const { user, isLoggedIn, isLoaded } = useUserAuth();
  const userId = user?.id ?? null;
  const key = id;
  const currentKey = useRef(key);
  useLayoutEffect(() => { currentKey.current = key; return () => { currentKey.current = ''; }; }, [key]);
  const [resource, setResource] = useState<{ key: string; trip: TripDetailDto } | null>(null);
  const [preview, setPreview] = useState<RevisionPreviewDto | null>(null);
  const [confirmationResolved, setConfirmationResolved] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [budget, setBudget] = useState<TripBudgetResponse | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const actionLock = useRef(false);
  const generation = useRef(0);
  const trip = resource?.key === key ? resource.trip : null;

  useEffect(() => {
    if (!isLoaded) return;
    let active = true;
    setBudget(null);
    setBudgetError(null);
    const request = ++generation.current;
    const valid = () => active && request === generation.current;
    queueMicrotask(() => {
      if (!valid()) return;
      setError(null); setPreview(null); setMessages([]); setBudget(null); setBudgetError(null);
      setResource(null); setLoading(!!key && !!id); setBusy(false); actionLock.current = false;
    });
    if (key && id) {
      getTrip(id).then(({ data }) => {
        if (!valid()) return;
        setResource({ key, trip: data });
        if (loadBudget && isLoggedIn && userId && data.owner_user_id === userId) {
          getTripBudget(id).then(({ data: budgetData }) => {
            if (valid()) setBudget(budgetData);
          }).catch((cause: unknown) => {
            if (valid()) setBudgetError(formatPlannerErrorMessage(cause, 'Không thể tải chi phí thực tế.'));
          });
        }
      }).catch((cause: unknown) => {
        if (valid()) setError(formatPlannerErrorMessage(cause, 'Không thể tải hành trình. Vui lòng thử lại.'));
      }).finally(() => { if (valid()) setLoading(false); });
    }
    return () => { active = false; };
  }, [id, key, isLoaded, isLoggedIn, userId, reload, loadBudget]);

  async function run(action: (isCurrent: () => boolean) => Promise<void>) {
    if (!trip || !key || actionLock.current) return;
    const request = generation.current;
    const valid = () => currentKey.current === key && generation.current === request;
    actionLock.current = true; setBusy(true); setError(null);
    try { await action(valid); } catch (cause: unknown) {
      if (valid()) {
        setError(formatPlannerErrorMessage(cause, 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.'));
        if (cause instanceof ApiClientError && cause.httpStatus === 409) setPreview(null);
      }
    } finally {
      if (valid()) { actionLock.current = false; setBusy(false); }
    }
  }

  async function send(text: string, commitReplyPreview = false): Promise<boolean> {
    if (!trip || trip.status === 'confirmed' || !text.trim() || actionLock.current || preview) return false;
    const messageText = text.trim();
    setMessages(items => [...items, { role: 'user', text: messageText }]);
    let sent = false;
    await run(async valid => {
      const { data } = await sendTripMessage(id, messageText, trip.current_version);
      if (!valid()) return;
      if (data.base_version !== trip.current_version) throw new Error('Phản hồi dựa trên phiên bản khác. Hãy tải lại hành trình.');
      let nextTrip = trip;
      if (data.preview && commitReplyPreview) {
        const committed = await commitTripRevision(id, data.preview.preview_id, data.preview.base_version);
        if (!valid()) return;
        nextTrip = { ...trip, itinerary: committed.data, current_version: committed.data.version };
      }
      setResource({ key, trip: nextTrip });
      setConfirmationResolved(false);
      setMessages(items => [...items, { role: 'assistant', text: data.reply }]);
      setPreview(commitReplyPreview ? null : data.preview); sent = true;
    });
    return sent;
  }

  async function move(placeId: number, targetPlaceId: number) {
    if (!trip?.itinerary || trip.status === 'confirmed' || placeId === targetPlaceId) return;
    const activities = (preview?.itinerary ?? trip.itinerary).activities;
    const from = activities.findIndex(item => item.place_id === placeId);
    const to = activities.findIndex(item => item.place_id === targetPlaceId);
    if (from < 0 || to < 0 || activities[from].day !== activities[to].day) return;
    const reordered = [...activities];
    const [moved] = reordered.splice(from, 1); reordered.splice(to, 0, moved);
    await run(async valid => {
      const { data } = await previewTripRevision(id, {
        base_version: trip.current_version,
        // Omit start_time so the backend recalculates a feasible schedule after reordering.
        stops: reordered.map(item => ({ place_id: item.place_id, day: item.day })),
      });
      if (valid()) setPreview(data);
    });
  }

  async function remove(placeId: number) {
    if (!trip?.itinerary || trip.status !== 'draft' || preview || actionLock.current) return;
    const activities = trip.itinerary.activities;
    const remaining = activities.filter(item => item.place_id !== placeId);
    if (remaining.length < 1 || remaining.length === activities.length) return;
    await run(async valid => {
      const { data } = await previewTripRevision(id, {
        base_version: trip.current_version,
        stops: remaining.map(item => ({ place_id: item.place_id, day: item.day })),
      });
      if (valid()) setPreview(data);
    });
  }

  async function addPlaces(placeIds: number[], day: number) {
    if (!trip?.itinerary || trip.status !== 'draft' || preview || !placeIds.length) return;
    const existing = trip.itinerary.activities;
    const additions = placeIds.filter(id => !existing.some(item => item.place_id === id))
      .map(place_id => ({ place_id, day }));
    if (!additions.length || existing.length + additions.length > 18) return;
    await run(async valid => {
      const { data } = await previewTripRevision(id, {
        base_version: trip.current_version,
        stops: [...existing.map(item => ({ place_id: item.place_id, day: item.day })), ...additions],
      });
      if (valid()) setPreview(data);
    });
  }

  async function replacePlace(suggestedId: number, targetId: number) {
    if (!trip?.itinerary || trip.status !== 'draft' || preview || suggestedId === targetId) return;
    const activities = trip.itinerary.activities;
    const target = activities.find(item => item.place_id === targetId);
    if (!target || activities.some(item => item.place_id === suggestedId)) return;
    await run(async valid => {
      const { data } = await previewTripRevision(id, {
        base_version: trip.current_version,
        stops: activities.map(item => ({
          place_id: item.place_id === targetId ? suggestedId : item.place_id,
          day: item.day,
        })),
      });
      if (valid()) setPreview(data);
    });
  }

  const savePreview = () => run(async valid => {
    if (!trip || !preview) return;
    const { data } = await commitTripRevision(id, preview.preview_id, preview.base_version);
    if (valid()) {
      setResource({ key, trip: { ...trip, itinerary: data, current_version: data.version } });
      setPreview(null); setConfirmationResolved(true); setBudget(null);
    }
  });

  async function generate(selectedIds: number[], allowUnverified: boolean): Promise<boolean> {
    if (!trip || trip.status !== 'draft' || trip.current_version !== 0 || actionLock.current || preview || !selectedIds.length) return false;
    let generated = false;
    await run(async valid => {
      const { data } = await generateTrip(id, selectedIds, allowUnverified);
      if (valid()) {
        setResource({ key, trip: {
          ...trip, itinerary: data, current_version: data.version, generation_error: null,
          request: { ...trip.request, must_visit: [...selectedIds], allow_unverified: allowUnverified || trip.request.allow_unverified },
        } });
        generated = true;
      }
    });
    return generated;
  }

  const confirm = () => run(async valid => {
    if (!trip || preview) return;
    const { data } = await confirmTrip(id, trip.current_version);
    if (valid()) setResource({ key, trip: data.plan });
  });

  const togglePublication = () => run(async valid => {
    if (!trip || trip.status !== 'confirmed') return;
    const { data } = await setTripPublication(id, !trip.is_published, trip.current_version);
    if (valid()) setResource({ key, trip: { ...trip, is_published: data.isPublished } });
  });

  const canEdit = Boolean(trip && isLoggedIn && user && trip.owner_user_id === user.id);
  return { id, isLoggedIn, isAuthLoaded: isLoaded, canEdit, trip, itinerary: trip ? preview?.itinerary ?? trip.itinerary : null,
    preview: trip ? preview : null, messages: trip ? messages : [], budget: trip ? budget : null, budgetError,
    error, loading: !isLoaded || loading || (!!key && !!id && resource?.key !== key && !error), busy,
    retry: () => setReload(value => value + 1), send, move, remove, addPlaces, replacePlace, generate, savePreview, confirm, togglePublication,
    discardPreview: () => { if (!actionLock.current) { setPreview(null); setConfirmationResolved(true); } },
    confirmationResolved };
}

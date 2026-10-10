'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUserAuth } from '@/lib/userAuth';
import { ApiClientError } from '@/services/apiClient';
import { commitTripRevision, confirmTrip, generateTrip, getTrip, getTripBudget, previewTripRevision,
  sendTripMessage, setTripPublication } from '@/services/tripService';
import type { RevisionPreviewDto } from '@/types/planApi';
import type { TripBudgetResponse, TripDetailDto } from '@/types/tripApi';

export function useTripWorkspace(loadBudget = false) {
  const searchParams = useSearchParams();
  const id = searchParams.get('trip_id') ?? searchParams.get('id') ?? '';
  const { user, isLoggedIn, isLoaded } = useUserAuth();
  const key = isLoggedIn && user ? `${user.id}:${id}` : '';
  const currentKey = useRef(key);
  useLayoutEffect(() => { currentKey.current = key; return () => { currentKey.current = ''; }; }, [key]);
  const [resource, setResource] = useState<{ key: string; trip: TripDetailDto } | null>(null);
  const [preview, setPreview] = useState<RevisionPreviewDto | null>(null);
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
    const request = ++generation.current;
    const valid = () => active && request === generation.current;
    queueMicrotask(() => {
      if (!valid()) return;
      setError(null); setPreview(null); setMessages([]); setBudget(null); setBudgetError(null);
      setResource(null); setLoading(!!key && !!id); setBusy(false); actionLock.current = false;
    });
    if (key && id) {
      getTrip(id).then(({ data }) => {
        if (valid()) setResource({ key, trip: data });
      }).catch((cause: unknown) => {
        if (valid()) setError(cause instanceof Error ? cause.message : 'Không thể tải hành trình.');
      }).finally(() => { if (valid()) setLoading(false); });
      if (loadBudget) getTripBudget(id).then(({ data }) => {
        if (valid()) setBudget(data);
      }).catch((cause: unknown) => {
        if (valid()) setBudgetError(cause instanceof Error ? cause.message : 'Không thể tải chi phí thực tế.');
      });
    }
    return () => { active = false; };
  }, [id, key, isLoaded, reload, loadBudget]);

  async function run(action: (isCurrent: () => boolean) => Promise<void>) {
    if (!trip || !key || actionLock.current) return;
    const request = generation.current;
    const valid = () => currentKey.current === key && generation.current === request;
    actionLock.current = true; setBusy(true); setError(null);
    try { await action(valid); } catch (cause: unknown) {
      if (valid()) {
        setError(cause instanceof Error ? cause.message : 'Không thể cập nhật hành trình.');
        if (cause instanceof ApiClientError && cause.httpStatus === 409) setPreview(null);
      }
    } finally {
      if (valid()) { actionLock.current = false; setBusy(false); }
    }
  }

  async function send(text: string): Promise<boolean> {
    if (!trip?.itinerary || trip.status === 'confirmed' || !text.trim() || actionLock.current || preview) return false;
    let sent = false;
    await run(async valid => {
      const { data } = await sendTripMessage(id, text.trim(), trip.current_version);
      if (!valid()) return;
      if (data.base_version !== trip.current_version) throw new Error('Phản hồi dựa trên phiên bản khác. Hãy tải lại hành trình.');
      setMessages(items => [...items, { role: 'user', text: text.trim() }, { role: 'assistant', text: data.reply }]);
      setPreview(data.preview); sent = true;
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

  const savePreview = () => run(async valid => {
    if (!trip || !preview) return;
    const { data } = await commitTripRevision(id, preview.preview_id, preview.base_version);
    if (valid()) {
      setResource({ key, trip: { ...trip, itinerary: data, current_version: data.version } });
      setPreview(null); setBudget(null);
    }
  });

  const generate = () => run(async valid => {
    if (!trip || trip.current_version !== 0) return;
    const { data } = await generateTrip(id);
    if (valid()) setResource({ key, trip: { ...trip, itinerary: data, current_version: data.version, generation_error: null } });
  });

  const confirm = () => run(async valid => {
    if (!trip?.itinerary || preview) return;
    const { data } = await confirmTrip(id, trip.current_version);
    if (valid()) setResource({ key, trip: data.plan });
  });

  const togglePublication = () => run(async valid => {
    if (!trip || trip.status !== 'confirmed') return;
    const { data } = await setTripPublication(id, !trip.is_published, trip.current_version);
    if (valid()) setResource({ key, trip: { ...trip, is_published: data.isPublished } });
  });

  return { id, isLoggedIn, isAuthLoaded: isLoaded, trip, itinerary: trip ? preview?.itinerary ?? trip.itinerary : null,
    preview: trip ? preview : null, messages: trip ? messages : [], budget: trip ? budget : null, budgetError,
    error, loading: !isLoaded || loading || (!!key && !!id && resource?.key !== key && !error), busy,
    retry: () => setReload(value => value + 1), send, move, generate, savePreview, confirm, togglePublication,
    discardPreview: () => { if (!actionLock.current) setPreview(null); } };
}

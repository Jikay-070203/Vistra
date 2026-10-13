import type { TravelDnaMetric } from '@/types/tripDna';

export interface CreateTripDraft {
  destination: string;
  startDate: string;
  endDate: string;
  budget: { min: number; max: number };
  people: number;
  pace: 'relaxed' | 'normal' | 'busy';
  notes: string;
  selectedAllergies: string[];
  travelDna: TravelDnaMetric[];
  originalTravelDna: TravelDnaMetric[];
  travelDnaAnalysisId: string | null;
  attachments: Array<{ id: string; name: string; imageUrl: string; cloudinaryPublicId?: string }>;
}

const KEY_PREFIX = 'vistra:create-trip:return-draft:v1:';

function storageKey(accountId: string) {
  return `${KEY_PREFIX}${encodeURIComponent(accountId)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMetrics(value: unknown): value is TravelDnaMetric[] {
  return Array.isArray(value) && value.every(metric => isRecord(metric) &&
    typeof metric.key === 'string' && Number.isFinite(metric.score) &&
    (metric.label === undefined || typeof metric.label === 'string'));
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function parseDraft(value: unknown): CreateTripDraft | null {
  if (!isRecord(value) || value.version !== 1 ||
      typeof value.destination !== 'string' ||
      typeof value.startDate !== 'string' || typeof value.endDate !== 'string' ||
      typeof value.notes !== 'string' || value.notes.length > 5000 ||
      !isRecord(value.budget) || !Number.isInteger(value.budget.min) || !Number.isInteger(value.budget.max) ||
      (value.budget.min as number) < 0 || (value.budget.max as number) > 100_000_000_000 ||
      (value.budget.min as number) > (value.budget.max as number) ||
      !Number.isInteger(value.people) || (value.people as number) < 1 || (value.people as number) > 50 ||
      !['relaxed', 'normal', 'busy'].includes(String(value.pace)) ||
      !Array.isArray(value.selectedAllergies) || !value.selectedAllergies.every(item => typeof item === 'string') ||
      !isMetrics(value.travelDna) || !isMetrics(value.originalTravelDna) ||
      !(value.travelDnaAnalysisId === null || typeof value.travelDnaAnalysisId === 'string') ||
      !Array.isArray(value.attachments) || value.attachments.length > 3 ||
      !value.attachments.every(item => isRecord(item) && typeof item.id === 'string' &&
        typeof item.name === 'string' && isHttpsUrl(item.imageUrl) &&
        (item.cloudinaryPublicId === undefined || typeof item.cloudinaryPublicId === 'string'))) {
    return null;
  }

  return {
    destination: value.destination,
    startDate: value.startDate,
    endDate: value.endDate,
    budget: { min: value.budget.min as number, max: value.budget.max as number },
    people: value.people as number,
    pace: value.pace as CreateTripDraft['pace'],
    notes: value.notes,
    selectedAllergies: value.selectedAllergies as string[],
    travelDna: value.travelDna,
    originalTravelDna: value.originalTravelDna,
    travelDnaAnalysisId: value.travelDnaAnalysisId as string | null,
    attachments: value.attachments as CreateTripDraft['attachments'],
  };
}

export function readCreateTripDraft(storage: Pick<Storage, 'getItem' | 'removeItem'>, accountId: string): CreateTripDraft | null {
  const key = storageKey(accountId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const draft = parseDraft(JSON.parse(raw));
    if (!draft) storage.removeItem(key);
    return draft;
  } catch {
    try { storage.removeItem(key); } catch { /* Ignore unavailable storage. */ }
    return null;
  }
}

export function saveCreateTripDraft(storage: Pick<Storage, 'setItem'>, accountId: string, draft: CreateTripDraft) {
  try {
    storage.setItem(storageKey(accountId), JSON.stringify({ version: 1, ...draft }));
  } catch {
    // Storage may be unavailable; preserving the active form is more important than blocking trip creation.
  }
}

export function clearCreateTripDraft(storage: Pick<Storage, 'removeItem'>, accountId: string) {
  try {
    storage.removeItem(storageKey(accountId));
  } catch {
    // Ignore unavailable storage; no trip data is deleted from the backend.
  }
}

import { endDateFromDuration } from '@/lib/dateUtils';
import type { PlanDayView, PlanPreviewView } from '@/types/planApi';
import type { TripDetailDto } from '@/types/tripApi';

/** Existing UI display code; preserved from the ignored baseline source. */
export function getPlanDisplayCode(id: string): string {
  if (!id) return 'VST-00000';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash).toString(36).toUpperCase().padStart(5, '0');
  return `VST-${code.slice(0, 5)}`;
}

/** Partial preview from fields the backend actually provides; no UI fixture hydration. */
export function toPlanPreview(detail: TripDetailDto): PlanPreviewView {
  const days: PlanDayView[] = [];
  const seen = new Set<string>();
  for (let dayNumber = 1; dayNumber <= detail.request.days; dayNumber++) {
    const date = endDateFromDuration(detail.request.start_date, dayNumber);
    if (!date) throw new TypeError('Plan has an invalid start date or duration');
    const activities = (detail.itinerary?.activities ?? [])
      .filter(activity => activity.day === dayNumber)
      .map(activity => {
        const stableId = `${detail.id}:${dayNumber}:${activity.place_id}`;
        if (seen.has(stableId)) throw new TypeError('Duplicate activity place ID in plan');
        seen.add(stableId);
        return { ...activity, stableId };
      });
    days.push({ dayNumber, date, activities,
      routeLegs: (detail.itinerary?.route_legs ?? []).filter(leg => leg.day === dayNumber) });
  }
  if (detail.itinerary?.activities.some(activity => activity.day < 1 || activity.day > detail.request.days)) {
    throw new TypeError('Plan activity is outside the requested duration');
  }
  return {
    id: detail.id,
    version: detail.current_version,
    destinationId: detail.destination_id,
    request: detail.request,
    days,
    weather: detail.itinerary?.weather ?? null,
    budget: detail.itinerary?.budget ?? null,
    warnings: detail.itinerary?.warnings ?? [],
    generationError: detail.generation_error,
  };
}

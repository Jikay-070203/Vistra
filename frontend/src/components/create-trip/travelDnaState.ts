import type { TravelDnaMetric } from '@/types/tripDna';

export function restoreTravelDnaMetrics(baseline: readonly TravelDnaMetric[]): TravelDnaMetric[] {
  return baseline.map((metric) => ({ ...metric }));
}

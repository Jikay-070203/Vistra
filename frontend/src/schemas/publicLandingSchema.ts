import { boolean, list, nullable, number, record, string } from '@/schemas/apiSchemaHelpers';
import { parseHeroContent } from '@/schemas/contentSchema';
import type { PublicLandingView } from '@/types/publicLandingApi';

function count(value: unknown, label: string): number {
  const parsed = number(value, label);
  if (!Number.isInteger(parsed) || parsed < 0) throw new TypeError(label + ' must be a nonnegative integer');
  return parsed;
}

export const publicLandingSchema = {
  parse(value: unknown): PublicLandingView {
    const raw = record(value, 'public landing');
    const stats = record(raw.stats, 'public landing.stats');
    return {
      heroPlans: list(raw.heroPlans, 'public landing.heroPlans').map(parseHeroContent),
      introDestinations: list(raw.introDestinations, 'public landing.introDestinations').map((value) => {
        const item = record(value, 'public destination');
        const provinceCode = item.provinceCode;
        if (typeof provinceCode !== 'string' && typeof provinceCode !== 'number') throw new TypeError('public destination.provinceCode must be string or number');
        return { id: string(item.id, 'public destination.id'), active: boolean(item.active, 'public destination.active'),
          order: number(item.order, 'public destination.order'), label: string(item.label, 'public destination.label'),
          provinceCode, imageUrl: nullable(item.imageUrl, string, 'public destination.imageUrl'),
          tagline: nullable(item.tagline, string, 'public destination.tagline') };
      }),
      allergyOptions: list(raw.allergyOptions, 'public landing.allergyOptions').map((value) => {
        const item = record(value, 'public allergy');
        return { id: string(item.id, 'public allergy.id'), active: boolean(item.active, 'public allergy.active'),
          label: string(item.label, 'public allergy.label') };
      }),
      stats: { destinations: nullable(stats.destinations, count, 'public landing.stats.destinations'),
        places: nullable(stats.places, count, 'public landing.stats.places') },
    };
  },
};

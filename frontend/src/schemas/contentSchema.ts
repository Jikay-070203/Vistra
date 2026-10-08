import { boolean, list, nullable, number, record, string } from '@/schemas/apiSchemaHelpers';
import type { AdminContentView, AllergyContentItem, HeroContentItem, IntroContentItem } from '@/types/contentApi';

function textOrNull(value: unknown, label: string): string | null {
  return value === undefined ? null : nullable(value, string, label);
}

function stringsOrNull(value: unknown, label: string): string[] | null {
  return value === undefined || value === null ? null : list(value, label).map((item, index) =>
    string(item, label + '[' + index + ']'));
}

function common(value: unknown, label: string) {
  const raw = record(value, label);
  return { raw, id: string(raw.id, label + '.id'),
    active: boolean(raw.active, label + '.active'), order: number(raw.order, label + '.order') };
}

export function parseHeroContent(value: unknown): HeroContentItem {
  const item = common(value, 'hero content');
  return { id: item.id, active: item.active, order: item.order,
    title: string(item.raw.title, 'hero content.title'),
    destination: textOrNull(item.raw.destination, 'hero content.destination'),
    image: textOrNull(item.raw.image, 'hero content.image'),
    duration: textOrNull(item.raw.duration, 'hero content.duration'),
    budget: textOrNull(item.raw.budget, 'hero content.budget'),
    tags: stringsOrNull(item.raw.tags, 'hero content.tags'),
    summary: textOrNull(item.raw.summary, 'hero content.summary'),
    highlights: stringsOrNull(item.raw.highlights, 'hero content.highlights') };
}

export function parseIntroContent(value: unknown): IntroContentItem {
  const item = common(value, 'intro content');
  const code = item.raw.provinceCode;
  if (code !== undefined && code !== null && typeof code !== 'number' && typeof code !== 'string') {
    throw new TypeError('intro content.provinceCode must be string, number or null');
  }
  return { id: item.id, active: item.active, order: item.order,
    label: textOrNull(item.raw.label, 'intro content.label'),
    image: textOrNull(item.raw.image, 'intro content.image'),
    provinceCode: code === undefined ? null : code,
    tagline: textOrNull(item.raw.tagline, 'intro content.tagline') };
}

export function parseAllergyContent(value: unknown): AllergyContentItem {
  const item = common(value, 'allergy content');
  return { id: item.id, active: item.active, order: item.order,
    label: textOrNull(item.raw.label, 'allergy content.label') };
}

export const adminContentSchema = {
  parse(value: unknown): AdminContentView {
    const raw = record(value, 'admin content');
    return {
      heroPlans: list(raw.heroPlans, 'admin content.heroPlans').map(parseHeroContent),
      introDestinations: list(raw.introDestinations, 'admin content.introDestinations').map(parseIntroContent),
      allergyOptions: list(raw.allergyOptions, 'admin content.allergyOptions').map(parseAllergyContent),
    };
  },
};

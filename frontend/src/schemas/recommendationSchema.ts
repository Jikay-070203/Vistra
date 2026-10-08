import { list, nullable, number, record, string } from '@/schemas/apiSchemaHelpers';
import type { DestinationDetailView, DestinationDetailsView,
  DestinationRecommendationView, DestinationRecommendationsView } from '@/types/recommendationApi';

function recommendation(value: unknown): DestinationRecommendationView {
  const raw = record(value, 'recommendation');
  if (raw.details !== null) throw new TypeError('Recommendation details shape is not contracted');
  return {
    id: string(raw.id, 'recommendation.id'),
    name: string(raw.name, 'recommendation.name'),
    region: nullable(raw.region, string, 'recommendation.region'),
    country: string(raw.country, 'recommendation.country'),
    imageUrl: nullable(raw.imageUrl, string, 'recommendation.imageUrl'),
    durationDays: nullable(raw.durationDays, number, 'recommendation.durationDays'),
    estimatedCostVnd: nullable(raw.estimatedCostVnd, number, 'recommendation.estimatedCostVnd'),
    visualMatchPct: nullable(raw.visualMatchPct, number, 'recommendation.visualMatchPct'),
    budgetMatchPct: nullable(raw.budgetMatchPct, number, 'recommendation.budgetMatchPct'),
    seasonMatchPct: nullable(raw.seasonMatchPct, number, 'recommendation.seasonMatchPct'),
    vibe: nullable(raw.vibe, string, 'recommendation.vibe'),
    tags: list(raw.tags, 'recommendation.tags').map(value => string(value, 'recommendation.tag')),
    goldenHour: nullable(raw.goldenHour, string, 'recommendation.goldenHour'),
    transportSummary: nullable(raw.transportSummary, string, 'recommendation.transportSummary'),
    rationale: string(raw.rationale, 'recommendation.rationale'),
    realityCheck: nullable(raw.realityCheck, string, 'recommendation.realityCheck'),
    bestMoments: nullable(raw.bestMoments, string, 'recommendation.bestMoments'),
    details: null,
  };
}

function detail(value: unknown): DestinationDetailView {
  const raw = record(value, 'destination detail');
  const coordinates = record(raw.coordinates, 'destination detail.coordinates');
  return {
    id: number(raw.id, 'destination detail.id'),
    slug: string(raw.slug, 'destination detail.slug'),
    name: string(raw.name, 'destination detail.name'),
    region: nullable(raw.region, string, 'destination detail.region'),
    coordinates: {
      lat: nullable(coordinates.lat, number, 'destination detail.lat'),
      lng: nullable(coordinates.lng, number, 'destination detail.lng'),
    },
    targetPlaces: number(raw.targetPlaces, 'destination detail.targetPlaces'),
    highlights: list(raw.highlights, 'destination detail.highlights').map(value => string(value, 'highlight')),
  };
}

export const recommendationSchema = {
  parse(value: unknown): DestinationRecommendationsView {
    const raw = record(value, 'recommendations');
    const period = record(raw.period, 'recommendations.period');
    return {
      period: {
        from: nullable(period.from, string, 'recommendations.period.from'),
        to: nullable(period.to, string, 'recommendations.period.to'),
      },
      items: list(raw.items, 'recommendations.items').map(recommendation),
      generatedAt: string(raw.generatedAt, 'recommendations.generatedAt'),
    };
  },
};

export const destinationDetailsSchema = {
  parse(value: unknown): DestinationDetailsView {
    const raw = record(value, 'destination details');
    return { destinations: list(raw.destinations, 'destination details.destinations').map(detail) };
  },
};

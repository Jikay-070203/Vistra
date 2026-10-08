export interface DestinationRecommendationView {
  id: string;
  name: string;
  region: string | null;
  country: string;
  imageUrl: string | null;
  durationDays: number | null;
  estimatedCostVnd: number | null;
  visualMatchPct: number | null;
  budgetMatchPct: number | null;
  seasonMatchPct: number | null;
  vibe: string | null;
  tags: string[];
  goldenHour: string | null;
  transportSummary: string | null;
  rationale: string;
  realityCheck: string | null;
  bestMoments: string | null;
  details: null;
}

export interface DestinationRecommendationsView {
  period: { from: string | null; to: string | null };
  items: DestinationRecommendationView[];
  generatedAt: string;
}

export interface DestinationDetailView {
  id: number;
  slug: string;
  name: string;
  region: string | null;
  coordinates: { lat: number | null; lng: number | null };
  targetPlaces: number;
  highlights: string[];
}

export interface DestinationDetailsView { destinations: DestinationDetailView[] }

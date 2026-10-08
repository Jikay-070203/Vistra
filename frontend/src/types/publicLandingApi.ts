import type { HeroContentItem } from './contentApi';

export interface PublicIntroDestination {
  id: string;
  active: boolean;
  order: number;
  label: string;
  provinceCode: string | number;
  imageUrl: string | null;
  tagline: string | null;
}

export interface PublicLandingView {
  heroPlans: HeroContentItem[];
  introDestinations: PublicIntroDestination[];
  allergyOptions: { id: string; active: boolean; label: string }[];
  stats: { destinations: number | null; places: number | null };
}

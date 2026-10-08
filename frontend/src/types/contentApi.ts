export type ContentCollection = 'hero-plans' | 'intro-destinations' | 'allergy-options';

export interface HeroContentItem {
  id: string;
  title: string;
  destination: string | null;
  image: string | null;
  duration: string | null;
  budget: string | null;
  tags: string[] | null;
  summary: string | null;
  highlights: string[] | null;
  active: boolean;
  order: number;
}

export interface IntroContentItem {
  id: string;
  label: string | null;
  image: string | null;
  provinceCode: string | number | null;
  tagline: string | null;
  active: boolean;
  order: number;
}

export interface AllergyContentItem {
  id: string;
  label: string | null;
  active: boolean;
  order: number;
}

export interface AdminContentView {
  heroPlans: HeroContentItem[];
  introDestinations: IntroContentItem[];
  allergyOptions: AllergyContentItem[];
}

export interface HeroContentPayload {
  title: string;
  destination: string;
  image: string;
  duration?: string;
  budget?: string;
  tags?: string[];
  summary?: string;
  highlights?: string[];
}

export interface IntroContentPayload {
  label: string;
  image: string;
  provinceCode: number;
  tagline?: string;
}

export interface AllergyContentPayload { label: string }
export interface ContentFlags { active?: boolean; order?: number }

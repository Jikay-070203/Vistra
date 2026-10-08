/**
 * Shared Content Models for VISTRA
 * File: frontend/src/types/content.ts
 */

export interface ProvinceItem {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code?: number;
}

export interface IntroDestination {
  id: string;
  label: string;
  image: string;
  provinceCode: number;
  order: number;
  active: boolean;
  tagline?: string;
}

export interface HeroCarouselPlan {
  id: string;
  title: string;
  destination: string;
  duration: string;
  budget: string;
  image: string;
  tags: string[];
  summary: string;
  highlights: string[];
  active: boolean;
  order: number;
}

export interface AllergyOption {
  id: string;
  label: string;
  active: boolean;
}

export type FitnessLevel =
  | 'Rất nhẹ nhàng'
  | 'Nhẹ nhàng'
  | 'Trung bình'
  | 'Năng động'
  | 'Cường độ cao';

export const FITNESS_LEVELS: FitnessLevel[] = [
  'Rất nhẹ nhàng',
  'Nhẹ nhàng',
  'Trung bình',
  'Năng động',
  'Cường độ cao',
];

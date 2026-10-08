import type { PlanPace } from '@/types/planApi';

export interface TripCreateRequest {
  destination: string;
  start_date: string;
  days: number;
  people: number;
  budget_vnd: number;
  budget_scope: 'total';
  transport: 'car';
  pace: PlanPace;
}

export interface CreatedTripView {
  id: string;
  generationError: string | Record<string, unknown> | null;
}

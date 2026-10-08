import type { PlaceDto } from '@/types/destinationApi';
import type { PlanItineraryDto, PlanRequestDto } from '@/types/planApi';

export interface TripListParams {
  limit?: number;
  offset?: number;
  deleted?: boolean;
}

export interface TripSummaryDto {
  id: string;
  destination_id: number;
  current_version: number;
  created_at: string;
  deleted_at: string | null;
}

export interface TripListResponse {
  items: TripSummaryDto[];
}

export interface BudgetCategoryDto {
  min_vnd: number;
  max_vnd: number;
  unknown_items: number;
}

export interface BudgetDto {
  categories: Record<'transport' | 'food' | 'stay' | 'tickets' | 'other', BudgetCategoryDto>;
  known_min_vnd: number;
  known_max_vnd: number;
  complete: boolean;
  limit_vnd: number;
  known_over_budget_vnd: number;
}

export type ItineraryDto = PlanItineraryDto;

export interface TripDetailDto extends TripSummaryDto {
  owner_user_id: string | null;
  status: 'draft' | 'confirmed';
  is_published: boolean;
  request: PlanRequestDto;
  generation_error: Record<string, unknown> | string | null;
  itinerary: ItineraryDto | null;
  recommendations: { attraction: PlaceDto[]; food: PlaceDto[]; stay: PlaceDto[] };
}

export interface TripBudgetResponse {
  trip_id: string;
  version: number;
  planned: BudgetDto | null;
  categories: Record<
    'transport' | 'food' | 'stay' | 'tickets' | 'other',
    { actual_vnd: number; estimate: BudgetCategoryDto | null }
  >;
  actual_total_vnd: number;
  actual_minus_known_max_vnd: number | null;
}

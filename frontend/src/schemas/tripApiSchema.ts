import { boolean, list, nullable, number, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import { placeDetailResponseSchema } from '@/schemas/destinationApiSchema';
import { planItinerary, planRequestSchema } from '@/schemas/planSchema';
import type {
  BudgetCategoryDto,
  BudgetDto,
  ItineraryDto,
  TripBudgetResponse,
  TripDetailDto,
  TripListResponse,
  TripSummaryDto,
} from '@/types/tripApi';

const categories = ['transport', 'food', 'stay', 'tickets', 'other'] as const;

function summary(value: unknown): TripSummaryDto {
  const item = record(value, 'trip');
  return {
    id: string(item.id, 'trip.id'),
    destination_id: number(item.destination_id, 'trip.destination_id'),
    current_version: number(item.current_version, 'trip.current_version'),
    created_at: string(item.created_at, 'trip.created_at'),
    deleted_at: nullable(item.deleted_at, string, 'trip.deleted_at'),
  };
}

function budgetCategory(value: unknown): BudgetCategoryDto {
  const item = record(value, 'budget category');
  return {
    min_vnd: number(item.min_vnd, 'budget category.min_vnd'),
    max_vnd: number(item.max_vnd, 'budget category.max_vnd'),
    unknown_items: number(item.unknown_items, 'budget category.unknown_items'),
  };
}

function budget(value: unknown): BudgetDto {
  const item = record(value, 'budget');
  const inputCategories = record(item.categories, 'budget.categories');
  const parsedCategories = {} as BudgetDto['categories'];
  for (const key of categories) parsedCategories[key] = budgetCategory(inputCategories[key]);
  return {
    categories: parsedCategories,
    known_min_vnd: number(item.known_min_vnd, 'budget.known_min_vnd'),
    known_max_vnd: number(item.known_max_vnd, 'budget.known_max_vnd'),
    complete: boolean(item.complete, 'budget.complete'),
    limit_vnd: number(item.limit_vnd, 'budget.limit_vnd'),
    known_over_budget_vnd: number(item.known_over_budget_vnd, 'budget.known_over_budget_vnd'),
  };
}

export function itinerary(value: unknown): ItineraryDto {
  return planItinerary(value, budget);
}

export const tripListResponseSchema = {
  parse(value: unknown): TripListResponse {
    const response = record(value, 'trips response');
    return { items: list(response.items, 'trips.items').map(summary) };
  },
};

export const tripDetailResponseSchema = {
  parse(value: unknown): TripDetailDto {
    const item = record(value, 'trip detail');
    const recommendations = record(item.recommendations, 'trip.recommendations');
    if (![true, false, 0, 1].includes(item.is_published as boolean | number)) {
      throw new TypeError('trip.is_published must be a boolean or SQLite 0/1');
    }
    return {
      ...summary(item),
      owner_user_id: nullable(item.owner_user_id, string, 'trip.owner_user_id'),
      status: oneOf(item.status, ['draft', 'confirmed'] as const, 'trip.status'),
      is_published: item.is_published === true || item.is_published === 1,
      request: planRequestSchema.parse(item.request),
      generation_error: item.generation_error === null
        ? null
        : typeof item.generation_error === 'string'
          ? item.generation_error
          : record(item.generation_error, 'trip.generation_error'),
      itinerary: nullable(item.itinerary, itinerary, 'trip.itinerary'),
      recommendations: {
        attraction: list(recommendations.attraction, 'trip.recommendations.attraction').map(placeDetailResponseSchema.parse),
        food: list(recommendations.food, 'trip.recommendations.food').map(placeDetailResponseSchema.parse),
        stay: list(recommendations.stay, 'trip.recommendations.stay').map(placeDetailResponseSchema.parse),
      },
    };
  },
};

export const tripBudgetResponseSchema = {
  parse(value: unknown): TripBudgetResponse {
    const response = record(value, 'trip budget response');
    const inputCategories = record(response.categories, 'trip budget.categories');
    const parsedCategories = {} as TripBudgetResponse['categories'];
    for (const key of categories) {
      const item = record(inputCategories[key], 'trip budget category');
      parsedCategories[key] = {
        actual_vnd: number(item.actual_vnd, 'trip budget category.actual_vnd'),
        estimate: nullable(item.estimate, budgetCategory, 'trip budget category.estimate'),
      };
    }
    return {
      trip_id: string(response.trip_id, 'trip budget.trip_id'),
      version: number(response.version, 'trip budget.version'),
      planned: nullable(response.planned, budget, 'trip budget.planned'),
      categories: parsedCategories,
      actual_total_vnd: number(response.actual_total_vnd, 'trip budget.actual_total_vnd'),
      actual_minus_known_max_vnd: nullable(response.actual_minus_known_max_vnd, number, 'trip budget.actual_minus_known_max_vnd'),
    };
  },
};

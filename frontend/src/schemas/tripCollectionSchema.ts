import { endDateFromDuration } from '@/lib/dateUtils';
import { boolean, list, nullable, number, record, string } from '@/schemas/apiSchemaHelpers';
import type { PagedTripCardsView, TripCardRaw, TripCardView, TripLikeView } from '@/types/tripCollectionApi';

function rawCard(value: unknown): TripCardRaw {
  const raw = record(value, 'trip card');
  const origin = nullable(raw.origin, record, 'trip card.origin');
  return {
    id: string(raw.id, 'trip card.id'),
    title: string(raw.title, 'trip card.title'),
    origin: origin ? {
      latitude: number(origin.latitude, 'trip card.origin.latitude'),
      longitude: number(origin.longitude, 'trip card.origin.longitude'),
    } : null,
    destination: string(raw.destination, 'trip card.destination'),
    coverImageUrl: nullable(raw.coverImageUrl, string, 'trip card.coverImageUrl'),
    startDate: nullable(raw.startDate, string, 'trip card.startDate'),
    endDate: nullable(raw.endDate, string, 'trip card.endDate'),
    durationDays: number(raw.durationDays, 'trip card.durationDays'),
    budgetMinVnd: nullable(raw.budgetMinVnd, number, 'trip card.budgetMinVnd'),
    budgetMaxVnd: nullable(raw.budgetMaxVnd, number, 'trip card.budgetMaxVnd'),
    estimatedCostVnd: nullable(raw.estimatedCostVnd, number, 'trip card.estimatedCostVnd'),
    status: string(raw.status, 'trip card.status'),
    isPublished: boolean(raw.isPublished, 'trip card.isPublished'),
    updatedAt: nullable(raw.updatedAt, string, 'trip card.updatedAt'),
    tags: list(raw.tags, 'trip card.tags').map(value => string(value, 'trip card.tag')),
    likesCount: number(raw.likesCount, 'trip card.likesCount'),
    likedByMe: boolean(raw.likedByMe, 'trip card.likedByMe'),
  };
}

function card(value: unknown): TripCardView {
  const raw = rawCard(value);
  return {
    id: raw.id, title: raw.title, origin: raw.origin, destination: raw.destination,
    coverImageUrl: raw.coverImageUrl, startDate: raw.startDate,
    endDate: endDateFromDuration(raw.startDate, raw.durationDays),
    durationDays: raw.durationDays, budgetMinVnd: raw.budgetMinVnd,
    budgetMaxVnd: raw.budgetMaxVnd, estimatedCostVnd: raw.estimatedCostVnd,
    status: raw.status, isPublished: raw.isPublished, updatedAt: raw.updatedAt,
    tags: raw.tags, likesCount: raw.likesCount,
    likedByMe: raw.likedByMe,
  };
}

export const myTripCardsSchema = {
  parse(value: unknown): PagedTripCardsView {
    const raw = record(value, 'my trips');
    const pagination = record(raw.pagination, 'my trips.pagination');
    const page = number(pagination.page, 'my trips.page');
    const pageSize = number(pagination.page_size, 'my trips.page_size');
    const total = number(pagination.total_records, 'my trips.total_records');
    return { items: list(raw.items, 'my trips.items').map(card), page, pageSize,
      total, totalPages: Math.ceil(total / pageSize) };
  },
};

export const communityTripCardsSchema = {
  parse(value: unknown): PagedTripCardsView {
    const raw = record(value, 'community trips');
    return {
      items: list(raw.items, 'community trips.items').map(card),
      page: number(raw.page, 'community trips.page'),
      pageSize: number(raw.pageSize, 'community trips.pageSize'),
      total: number(raw.total, 'community trips.total'),
      totalPages: number(raw.totalPages, 'community trips.totalPages'),
    };
  },
};

export const tripLikeSchema = {
  parse(value: unknown): TripLikeView {
    const raw = record(value, 'trip like');
    return {
      tripId: string(raw.trip_id, 'trip like.trip_id'),
      liked: boolean(raw.liked, 'trip like.liked'),
      likesCount: number(raw.total_likes, 'trip like.total_likes'),
    };
  },
};

import { boolean, number, record, string } from '@/schemas/apiSchemaHelpers';
import type { TripLikeView } from '@/types/tripCollectionApi';

export const communityLikeSchema = {
  parse(value: unknown): TripLikeView {
    const raw = record(value, 'community like');
    return { tripId: string(raw.planId, 'like.planId'), liked: boolean(raw.likedByMe, 'like.likedByMe'), likesCount: number(raw.likesCount, 'like.likesCount') };
  },
};

export const communityCloneSchema = {
  parse(value: unknown): { id: string } {
    const root = record(value, 'community clone');
    const plan = record(root.plan, 'community clone.plan');
    return { id: string(plan.id, 'community clone.plan.id') };
  },
};

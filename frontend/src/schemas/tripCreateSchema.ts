import { record, string } from '@/schemas/apiSchemaHelpers';
import type { CreatedTripView } from '@/types/tripCreateApi';

export const tripCreateResponseSchema = {
  parse(value: unknown): CreatedTripView {
    const result = record(value, 'created trip');
    const id = string(result.id, 'created trip.id');
    if (!id.trim()) throw new TypeError('created trip.id must not be empty');
    return {
      id,
      generationError: result.generation_error == null ? null
        : typeof result.generation_error === 'string' ? result.generation_error
        : record(result.generation_error, 'created trip.generation_error'),
    };
  },
};

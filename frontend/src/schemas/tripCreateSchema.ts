import { number, record, string } from '@/schemas/apiSchemaHelpers';
import type { CreatedTripView } from '@/types/tripCreateApi';

type InitialCandidate = { id: number; qualityStatus: 'verified' | 'schedulable' | 'discovered' };

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

  initialGenerationCandidates(value: unknown): InitialCandidate[] {
    const result = record(value, 'created trip');
    if (result.itinerary != null || number(result.current_version, 'created trip.current_version') !== 0) return [];
    const recommendations = record(result.recommendations, 'created trip.recommendations');
    return ['attraction', 'food'].flatMap(kind => {
      const items = recommendations[kind];
      if (!Array.isArray(items)) return [];
      return items.flatMap(item => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) return [];
        const candidate = item as Record<string, unknown>;
        const id = candidate.id;
        const quality = candidate.quality_status;
        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0 ||
          (quality !== 'verified' && quality !== 'schedulable' && quality !== 'discovered')) return [];
        return [{ id, qualityStatus: quality }];
      });
    });
  },
};

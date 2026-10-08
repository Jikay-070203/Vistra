import { boolean, list, nullable, number, record, string } from '@/schemas/apiSchemaHelpers';
import { itinerary, tripDetailResponseSchema } from '@/schemas/tripApiSchema';
import type { RevisionPreviewDto, TripChatResponse } from '@/types/planApi';

export const revisionPreviewSchema = {
  parse(value: unknown): RevisionPreviewDto {
    const raw = record(value, 'revision preview');
    return {
      preview_id: string(raw.preview_id, 'preview.preview_id'),
      base_version: number(raw.base_version, 'preview.base_version'),
      itinerary: itinerary(raw.itinerary),
      known_cost_delta_vnd: number(raw.known_cost_delta_vnd, 'preview.known_cost_delta_vnd'),
    };
  },
};

export const tripChatSchema = {
  parse(value: unknown): TripChatResponse {
    const raw = record(value, 'trip chat');
    return {
      reply: string(raw.reply, 'chat.reply'),
      base_version: number(raw.base_version, 'chat.base_version'),
      preview: nullable(raw.preview, revisionPreviewSchema.parse, 'chat.preview'),
      tools_used: list(raw.tools_used, 'chat.tools_used').map(value => {
        const tool = record(value, 'chat tool');
        return { name: string(tool.name, 'tool.name'), ok: boolean(tool.ok, 'tool.ok') };
      }),
    };
  },
};

export const confirmedTripSchema = {
  parse(value: unknown) {
    const raw = record(value, 'confirmed trip');
    return {
      plan: tripDetailResponseSchema.parse(raw.plan),
      confirmedAt: string(raw.confirmedAt, 'confirm.confirmedAt'),
      version: number(raw.version, 'confirm.version'),
    };
  },
};

export const savedItinerarySchema = {
  parse(value: unknown) {
    const raw = record(value, 'saved itinerary');
    return { ...itinerary(raw), trip_id: string(raw.trip_id, 'itinerary.trip_id'), version: number(raw.version, 'itinerary.version') };
  },
};

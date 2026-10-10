import { boolean, nullable, number, objectList, record, string } from '@/schemas/apiSchemaHelpers';
import type { AdminSafetyEvaluation, AdminSafetyPresets } from '@/types/adminSafetyApi';

export const adminSafetyPresetsSchema = {
  parse(value: unknown): AdminSafetyPresets {
    const envelope = record(value, 'safety presets response');
    const data = record(envelope.data, 'safety presets data');
    return { mode: string(data.mode, 'safety presets mode'), items: objectList(data.items, 'safety presets items') };
  },
};

export const adminSafetyEvaluationSchema = {
  parse(value: unknown): AdminSafetyEvaluation {
    const envelope = record(value, 'safety evaluation response');
    const data = record(envelope.data, 'safety evaluation data');
    return {
      executionMode: string(data.executionMode, 'executionMode'),
      prompt: string(data.prompt, 'prompt'),
      presetId: nullable(data.presetId, string, 'presetId'),
      blocked: boolean(data.blocked, 'blocked'),
      blockedCount: number(data.blockedCount, 'blockedCount'),
      attackType: nullable(data.attackType, string, 'attackType'),
      latencyMs: nullable(data.latencyMs, number, 'latencyMs'),
      defenseLayer: nullable(data.defenseLayer, string, 'defenseLayer'),
      sanitizedResponse: nullable(data.sanitizedResponse, string, 'sanitizedResponse'),
      expectedDefense: nullable(data.expectedDefense, string, 'expectedDefense'),
    };
  },
};

import type { HealthResponse } from '@/types/system';

export const healthResponseSchema = {
  parse(value: unknown): HealthResponse {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new TypeError('Health response must be an object.');
    }

    const response = value as Record<string, unknown>;
    if (response.status !== 'ok' || typeof response.version !== 'string' || !response.version.trim()) {
      throw new TypeError('Health response must include status "ok" and a non-empty version.');
    }

    return { status: 'ok', version: response.version };
  },
};

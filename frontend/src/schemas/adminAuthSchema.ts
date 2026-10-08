import type { AdminAuthResponse } from '@/types/adminAuth';

export const adminAuthResponseSchema = {
  parse(value: unknown): AdminAuthResponse {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new TypeError('Admin auth response must be an object.');
    }

    const response = value as Record<string, unknown>;
    if (typeof response.success !== 'boolean' || typeof response.message !== 'string') {
      throw new TypeError('Admin auth response must include success and message.');
    }

    return { success: response.success, message: response.message };
  },
};

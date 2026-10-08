import { nullable, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import type { AuthView, RawAuthResponse } from '@/types/auth';

const roles = ['traveler', 'staff', 'admin'] as const;

function requiredText(value: unknown, label: string): string {
  const text = string(value, label);
  if (!text.trim()) throw new TypeError(label + ' must not be empty');
  return text;
}

export const authResponseSchema = {
  parse(value: unknown): AuthView {
    const root = record(value, 'auth');
    const user = record(root.user, 'auth.user');
    const session = record(root.session, 'auth.session');
    const raw: RawAuthResponse = {
      user: {
        id: requiredText(user.id, 'auth.user.id'),
        full_name: requiredText(user.full_name, 'auth.user.full_name'),
        email: requiredText(user.email, 'auth.user.email'),
        role: oneOf(user.role, roles, 'auth.user.role'),
        avatar_url: nullable(user.avatar_url, string, 'auth.user.avatar_url'),
      },
      session: { expires_at: requiredText(session.expires_at, 'auth.session.expires_at') },
    };
    if (Number.isNaN(Date.parse(raw.session.expires_at))) {
      throw new TypeError('auth.session.expires_at must be a valid datetime');
    }
    return {
      user: {
        id: raw.user.id,
        fullName: raw.user.full_name,
        email: raw.user.email,
        role: raw.user.role,
        avatarUrl: raw.user.avatar_url,
      },
      session: { expiresAt: raw.session.expires_at },
    };
  },
};

export const logoutResponseSchema = {
  parse(value: unknown): { success: true } {
    if (record(value, 'logout').success !== true) throw new TypeError('logout.success must be true');
    return { success: true };
  },
};

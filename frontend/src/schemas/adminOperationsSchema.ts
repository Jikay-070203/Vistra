import type { AdminOverviewView, AdminRevenueView, AdminUserView, AdminUsersPageView } from '@/types/adminOperationsApi';

function object(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError(label + ' must be an object');
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new TypeError(label + ' must be a string');
  return value;
}

function count(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) throw new TypeError(label + ' must be a non-negative integer');
  return value;
}

function user(value: unknown): AdminUserView {
  const raw = object(value, 'user');
  if (!['traveler', 'staff', 'admin'].includes(String(raw.role))) throw new TypeError('user.role has an unsupported value');
  if (!['active', 'suspended', 'disabled'].includes(String(raw.status))) throw new TypeError('user.status has an unsupported value');
  if (raw.avatar_url !== null && typeof raw.avatar_url !== 'string') throw new TypeError('user.avatar_url must be a string or null');
  return {
    id: text(raw.id, 'user.id'),
    full_name: text(raw.full_name, 'user.full_name'),
    email: text(raw.email, 'user.email'),
    role: raw.role as AdminUserView['role'],
    status: raw.status as AdminUserView['status'],
    avatar_url: raw.avatar_url,
    created_at: text(raw.created_at, 'user.created_at'),
    updated_at: text(raw.updated_at, 'user.updated_at'),
  };
}

function envelopeData(value: unknown, label: string): Record<string, unknown> {
  return object(object(value, label).data, label + '.data');
}

export const adminOverviewSchema = {
  parse(value: unknown): AdminOverviewView {
    const raw = envelopeData(value, 'admin overview');
    return {
      users: count(raw.users, 'overview.users'),
      places: count(raw.places, 'overview.places'),
      trips: count(raw.trips, 'overview.trips'),
      feedback: count(raw.feedback, 'overview.feedback'),
      updatedAt: text(raw.updatedAt, 'overview.updatedAt'),
    };
  },
};

export const adminUsersPageSchema = {
  parse(value: unknown): AdminUsersPageView {
    const raw = envelopeData(value, 'admin users');
    if (!Array.isArray(raw.items)) throw new TypeError('users.items must be an array');
    return {
      items: raw.items.map(user),
      page: count(raw.page, 'users.page'),
      pageSize: count(raw.pageSize, 'users.pageSize'),
      total: count(raw.total, 'users.total'),
    };
  },
};

export const adminUserStatusSchema = {
  parse(value: unknown): { id: string; status: AdminUserView['status'] } {
    const raw = envelopeData(value, 'admin user status');
    if (!['active', 'suspended', 'disabled'].includes(String(raw.status))) throw new TypeError('user status has an unsupported value');
    return { id: text(raw.id, 'user status.id'), status: raw.status as AdminUserView['status'] };
  },
};

export const adminRevenueSchema = {
  parse(value: unknown): AdminRevenueView {
    const raw = envelopeData(value, 'admin revenue');
    const items = raw.items;
    if (!Array.isArray(items) || items.length !== 0) throw new TypeError('revenue.items must be an empty array until payment history is configured');
    for (const key of ['total', 'mrr'] as const) {
      if (raw[key] !== null && (typeof raw[key] !== 'number' || !Number.isFinite(raw[key]))) {
        throw new TypeError('revenue.' + key + ' must be a number or null');
      }
    }
    if (typeof raw.available !== 'boolean') throw new TypeError('revenue.available must be a boolean');
    return {
      currency: text(raw.currency, 'revenue.currency'),
      total: raw.total as number | null,
      mrr: raw.mrr as number | null,
      items: [],
      available: raw.available,
      message: text(raw.message, 'revenue.message'),
    };
  },
};

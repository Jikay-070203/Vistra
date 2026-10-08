import { boolean, list, nullable, number, record, string } from '@/schemas/apiSchemaHelpers';
import type { ProfileUpdateView, ProfileView, TravelDnaMetric, TravelDnaView } from '@/types/profileApi';

function optionalText(value: unknown, label: string): string | null {
  return nullable(value, string, label);
}

export const profileSchema = {
  parse(value: unknown): ProfileView {
    const raw = record(value, 'profile');
    return {
      id: string(raw.id, 'profile.id'),
      fullName: string(raw.fullName, 'profile.fullName'),
      email: string(raw.email, 'profile.email'),
      phone: optionalText(raw.phone, 'profile.phone'),
      defaultOrigin: optionalText(raw.defaultOrigin, 'profile.defaultOrigin'),
      bio: optionalText(raw.bio, 'profile.bio'),
      preferredPace: optionalText(raw.preferredPace, 'profile.preferredPace'),
      preferredStay: optionalText(raw.preferredStay, 'profile.preferredStay'),
      dietaryPreference: optionalText(raw.dietaryPreference, 'profile.dietaryPreference'),
      avatarUrl: optionalText(raw.avatarUrl, 'profile.avatarUrl'),
      joinedAt: string(raw.joinedAt, 'profile.joinedAt'),
    };
  },
};

export const profileUpdateSchema = {
  parse(value: unknown): ProfileUpdateView {
    const raw = record(value, 'profile update');
    return {
      profile: profileSchema.parse(raw.profile),
      emailChangePending: boolean(raw.emailChangePending, 'profile update.emailChangePending'),
    };
  },
};

function metric(value: unknown, index: number): TravelDnaMetric {
  const raw = record(value, 'dna.metrics[' + index + ']');
  const key = string(raw.key, 'dna.metrics[' + index + '].key');
  const score = number(raw.score, 'dna.metrics[' + index + '].score');
  if (!key.trim() || score < 0 || score > 100) throw new RangeError('Invalid DNA metric');
  return { key, score };
}

export const travelDnaSchema = {
  parse(value: unknown): TravelDnaView {
    const raw = record(value, 'dna');
    const preferences = record(raw.preferences, 'dna.preferences');
    return {
      metrics: list(raw.metrics, 'dna.metrics').map(metric),
      preferences: {
        pace: optionalText(preferences.pace, 'dna.preferences.pace'),
        sceneryFocus: optionalText(preferences.sceneryFocus, 'dna.preferences.sceneryFocus'),
        cuisinePriority: optionalText(preferences.cuisinePriority, 'dna.preferences.cuisinePriority'),
      },
      updatedAt: optionalText(raw.updatedAt, 'dna.updatedAt'),
    };
  },
};

export interface ProfileView {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  defaultOrigin: string | null;
  bio: string | null;
  preferredPace: string | null;
  preferredStay: string | null;
  dietaryPreference: string | null;
  avatarUrl: string | null;
  joinedAt: string;
}

export type ProfilePatchView = Partial<Pick<ProfileView,
  'fullName' | 'email' | 'phone' | 'defaultOrigin' | 'bio' |
  'preferredPace' | 'preferredStay' | 'dietaryPreference'>>;

export interface ProfileUpdateView {
  profile: ProfileView;
  emailChangePending: boolean;
}

export interface TravelDnaMetric { key: string; score: number }

export interface TravelDnaView {
  metrics: TravelDnaMetric[];
  preferences: {
    pace: string | null;
    sceneryFocus: string | null;
    cuisinePriority: string | null;
  };
  updatedAt: string | null;
}

export interface TravelDnaPatchView {
  metrics?: TravelDnaMetric[];
  pace?: string | null;
  sceneryFocus?: string | null;
  cuisinePriority?: string | null;
}

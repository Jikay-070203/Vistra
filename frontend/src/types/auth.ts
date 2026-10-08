export type AuthRole = 'traveler' | 'staff' | 'admin';

export interface RawAuthResponse {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: AuthRole;
    avatar_url: string | null;
  };
  session: { expires_at: string };
}

export interface AuthView {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: AuthRole;
    avatarUrl: string | null;
  };
  session: { expiresAt: string };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
  dateOfBirth: string | null;
  acceptedTermsVersion?: string;
}

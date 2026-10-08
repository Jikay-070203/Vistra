'use client';

import { useSyncExternalStore, useEffect } from 'react';
import type { AuthView } from '@/types/auth';
import { getSession, logout as apiLogout } from '@/services/authService';

export type AuthUser = AuthView['user'];

export interface UserAuthState {
  isLoggedIn: boolean;
  isLoaded: boolean;
  user: AuthUser | null;
  expiresAt: string | null;
  networkError?: boolean;
  error?: string | null;
}

let currentAuthState: UserAuthState = {
  isLoggedIn: false,
  isLoaded: false,
  user: null,
  expiresAt: null,
  networkError: false,
  error: null,
};

let authStateGeneration = 0;
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('vistra_user_auth_change'));
  }
}

/**
 * Hydrates user session from backend /api/v1/auth/me via authService.getSession.
 * Uses authStateGeneration guard to ensure newer explicit logins are not overwritten by stale requests.
 */
export async function hydrateSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  const generationAtStart = ++authStateGeneration;
  try {
    const result = await getSession();
    if (generationAtStart !== authStateGeneration) {
      return;
    }
    if (result.data && result.data.user) {
      currentAuthState = {
        isLoggedIn: true,
        isLoaded: true,
        user: result.data.user,
        expiresAt: result.data.session.expiresAt,
        networkError: false,
        error: null,
      };
    } else {
      currentAuthState = {
        isLoggedIn: false,
        isLoaded: true,
        user: null,
        expiresAt: null,
        networkError: false,
        error: null,
      };
    }
  } catch (err) {
    if (generationAtStart !== authStateGeneration) return;
    const isNetErr = err instanceof Error && (err.name === 'TypeError' || err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('fetch'));
    currentAuthState = {
      isLoggedIn: false,
      isLoaded: true,
      user: null,
      expiresAt: null,
      networkError: isNetErr,
      error: err instanceof Error ? err.message : 'Lỗi kết nối phiên làm việc.',
    };
  } finally {
    hydrationPromise = null;
    notifyListeners();
  }
}

/**
 * Explicitly set the authenticated session state in memory.
 */
export function setAuthState(session: AuthView | null): void {
  authStateGeneration++;
  if (session && session.user) {
    currentAuthState = {
      isLoggedIn: true,
      isLoaded: true,
      user: session.user,
      expiresAt: session.session.expiresAt,
      networkError: false,
      error: null,
    };
  } else {
    currentAuthState = {
      isLoggedIn: false,
      isLoaded: true,
      user: null,
      expiresAt: null,
      networkError: false,
      error: null,
    };
  }
  notifyListeners();
}

/**
 * Check if a traveler user is currently logged in.
 */
export function isUserLoggedIn(): boolean {
  return currentAuthState.isLoggedIn;
}

/**
 * Compatibility helper to update login state.
 * Refuses to fabricate a dummy logged-in state without an authentic AuthView.
 */
export function setUserLoggedIn(loggedIn: boolean): void {
  if (!loggedIn) {
    setAuthState(null);
  } else {
    // Never fabricate dummy login without real AuthView; trigger genuine hydration instead.
    if (!currentAuthState.isLoggedIn) {
      hydrateSession().catch(() => {});
    }
  }
}

/**
 * Logout the current user by revoking backend session.
 * Only resets local session state after backend confirms success.
 */
export async function logoutUser(): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await apiLogout();
    if (result.data?.success) {
      setAuthState(null);
      return { success: true };
    }
    return { success: false, message: 'Đăng xuất không thành công từ máy chủ.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi kết nối khi đăng xuất.';
    return { success: false, message };
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): UserAuthState {
  return currentAuthState;
}

const SERVER_SNAPSHOT: UserAuthState = {
  isLoggedIn: false,
  isLoaded: false,
  user: null,
  expiresAt: null,
};

function getServerSnapshot(): UserAuthState {
  return SERVER_SNAPSHOT;
}

/**
 * React hook to listen to real user authentication state.
 */
export function useUserAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!currentAuthState.isLoaded && !hydrationPromise) {
      hydrationPromise = hydrateSession();
    }
  }, []);

  return {
    ...state,
    logout: logoutUser,
    refresh: hydrateSession,
  };
}

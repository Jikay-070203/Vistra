export const API_BASE_URLS = {
  PROVINCES: 'https://provinces.open-api.vn/api',
  TEMPORARY_SESSION_PROXY: '/api/backend',
} as const;

/**
 * Temporary session proxy path for session-dependent services.
 *
 * BLOCKED EXCEPTION:
 * Retained pending resolution of the backend host-only SameSite=Lax session cookie
 * blocker (cannot be read by Next SSR guard on frontend host after direct backend login).
 */
export const TEMPORARY_SESSION_PROXY_BASE_URL = API_BASE_URLS.TEMPORARY_SESSION_PROXY;

export function getSessionProxyBaseUrl(): string {
  return TEMPORARY_SESSION_PROXY_BASE_URL;
}

/**
 * Normalizes a raw URL string into a plain HTTP(S) origin.
 *
 * Rejects credentials (user/password), non-root paths (only root '/' or empty allowed),
 * query strings, and hashes. Trailing slash is allowed.
 * Returns the normalized origin string, or undefined if invalid or missing.
 */
export function normalizeHttpOrigin(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    if (parsed.username || parsed.password) {
      return undefined;
    }
    if (parsed.search || parsed.hash) {
      return undefined;
    }
    if (parsed.pathname !== '/' && parsed.pathname !== '') {
      return undefined;
    }
    return parsed.origin;
  } catch {
    return undefined;
  }
}

/**
 * Default VISTRA backend base URL from process.env.NEXT_PUBLIC_API_URL.
 * Normalized HTTP(S) origin; no automatic '/api/backend', window origin,
 * or hardcoded Vercel domain fallback.
 */
export function getApiBaseUrl(): string | undefined {
  return normalizeHttpOrigin(process.env.NEXT_PUBLIC_API_URL);
}

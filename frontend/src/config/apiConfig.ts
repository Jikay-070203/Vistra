export const API_BASE_URLS = {
  PROVINCES: 'https://provinces.open-api.vn/api',
  BACKEND_PROXY: '/api/backend',
} as const;

/** Same-origin Next.js route that forwards allowlisted VISTRA Backend requests. */
export const BACKEND_PROXY_BASE_URL = API_BASE_URLS.BACKEND_PROXY;

/** @deprecated Use BACKEND_PROXY_BASE_URL; retained for existing imports. */
export const TEMPORARY_SESSION_PROXY_BASE_URL = BACKEND_PROXY_BASE_URL;

/** Kept as the existing service-facing name for compatibility. */
export function getSessionProxyBaseUrl(): string {
  return BACKEND_PROXY_BASE_URL;
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
 * Configured VISTRA backend origin used by server-side proxy forwarding.
 * Browser services should use getSessionProxyBaseUrl() instead.
 */
export function getApiBaseUrl(): string | undefined {
  return normalizeHttpOrigin(process.env.NEXT_PUBLIC_API_URL);
}

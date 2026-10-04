import { appConfig } from '@/config/appConfig';

/**
 * Interface representing the payload of an authenticated Admin session.
 */
export interface AdminSessionPayload {
  role: 'admin';
  email: string;
  iat: number;
  exp: number;
}

/**
 * Validates and retrieves server-only admin configuration.
 * Logs missing configuration keys to server console without leaking values.
 */
export function getAdminAuthConfig(): {
  email: string;
  password: string;
  secret: string;
} | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  const missing: string[] = [];
  if (!email) missing.push('ADMIN_EMAIL');
  if (!password) missing.push('ADMIN_PASSWORD');
  if (!secret) missing.push('ADMIN_SESSION_SECRET');

  if (!email || !password || !secret) {
    if (!email) missing.push('ADMIN_EMAIL');
    if (!password) missing.push('ADMIN_PASSWORD');
    if (!secret) missing.push('ADMIN_SESSION_SECRET');
    console.error(
      `[Admin Auth Error] Missing required server configuration variable(s): ${missing.join(', ')}`
    );
    return null;
  }

  return { email, password, secret };
}

/**
 * Encodes an ArrayBuffer or Uint8Array to a Base64URL string.
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a Base64URL string to a Uint8Array.
 */
function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Imports an HMAC SHA-256 CryptoKey from a secret string.
 */
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Signs an admin session payload using Web Crypto HMAC SHA-256.
 * Returns a compact token in format: <base64urlPayload>.<base64urlSignature>
 */
export async function signSessionToken(
  payload: AdminSessionPayload,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const payloadStr = JSON.stringify(payload);
  const payloadBytes = encoder.encode(payloadStr);
  const base64UrlPayload = bufferToBase64Url(payloadBytes.buffer);

  const key = await getCryptoKey(secret);
  const dataToSign = encoder.encode(base64UrlPayload);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataToSign);
  const base64UrlSignature = bufferToBase64Url(signatureBuffer);

  return `${base64UrlPayload}.${base64UrlSignature}`;
}

/**
 * Verifies an admin session token against HMAC SHA-256 signature and expiration.
 * Returns the parsed payload if valid, or null if tampered/expired/malformed.
 */
export async function verifySessionToken(
  token: string | undefined | null,
  secret: string
): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [base64UrlPayload, base64UrlSignature] = parts;
  if (!base64UrlPayload || !base64UrlSignature) {
    return null;
  }

  try {
    const key = await getCryptoKey(secret);
    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(base64UrlPayload);
    const signatureBytes = base64UrlToBuffer(base64UrlSignature);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      dataToVerify
    );

    if (!isValid) {
      return null;
    }

    const payloadBytes = base64UrlToBuffer(base64UrlPayload);
    const decoder = new TextDecoder();
    const payloadJson = decoder.decode(payloadBytes);
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    // Validate payload fields
    if (payload.role !== 'admin' || !payload.exp || typeof payload.exp !== 'number') {
      return null;
    }

    // Check expiration
    if (Date.now() >= payload.exp) {
      return null;
    }

    return payload;
  } catch {
    // Malformed token or JSON parsing failure
    return null;
  }
}

/**
 * Validates admin credentials against server environment configuration.
 */
export function verifyAdminCredentials(
  inputEmail: string,
  inputPassword: string
): {
  ok: boolean;
  errorType?: 'MISSING_CONFIG' | 'INVALID_CREDENTIALS';
} {
  const config = getAdminAuthConfig();
  if (!config) {
    return { ok: false, errorType: 'MISSING_CONFIG' };
  }

  const trimmedEmail = (inputEmail || '').trim().toLowerCase();
  const configEmail = config.email.trim().toLowerCase();

  // Compare email and password (avoid early exit to be timing-resistant)
  const emailMatches = trimmedEmail.length === configEmail.length && trimmedEmail === configEmail;
  const passwordMatches = inputPassword.length === config.password.length && inputPassword === config.password;

  if (emailMatches && passwordMatches) {
    return { ok: true };
  }

  return { ok: false, errorType: 'INVALID_CREDENTIALS' };
}

/**
 * Sanitizes and validates a requested redirect path to prevent open redirect vulnerabilities.
 * Only allows same-origin relative paths starting with '/admin' (excluding '/admin/login').
 */
export function getSafeAdminRedirect(requestedPath?: string | null): string {
  if (!requestedPath || typeof requestedPath !== 'string') {
    return '/admin';
  }

  const trimmed = requestedPath.trim();

  // Must start with '/admin'
  if (!trimmed.startsWith('/admin')) {
    return '/admin';
  }

  // Reject protocol-relative URLs (e.g. '//evil.com') or backslashes
  if (trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '/admin';
  }

  // Reject redirect loops pointing back to admin login
  if (trimmed === '/admin/login' || trimmed.startsWith('/admin/login?') || trimmed.startsWith('/admin/login/')) {
    return '/admin';
  }

  // Reject control characters or null bytes
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return '/admin';
  }

  return trimmed;
}

/**
 * Returns standard cookie options for the admin session cookie.
 */
export function getAdminCookieOptions(maxAge?: number) {
  return {
    name: appConfig.adminAuth.cookieName,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: maxAge !== undefined ? maxAge : appConfig.adminAuth.sessionDurationSeconds,
  };
}

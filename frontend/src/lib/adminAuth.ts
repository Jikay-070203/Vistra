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

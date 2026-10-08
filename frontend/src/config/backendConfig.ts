const B1_ROUTES: Readonly<Record<string, readonly string[]>> = {
  GET: ['/health', '/api/v1/auth/me', '/api/v1/users/me', '/api/v1/users/me/dna',
    '/api/v1/catalog/allergies', '/admin/content', '/api/v1/feedback/me', '/admin/feedback/tickets',
    '/api/v1/trips/me', '/community/plans', '/api/v1/destinations/recommendations',
    '/api/v1/admin/traces', '/admin/evaluation/datasets',
    '/destinations', '/places', '/admin/system/summary', '/api/v1/admin/system/metrics'],
  POST: ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/logout', '/api/v1/feedback',
    '/api/v1/trips', '/admin/evaluation/datasets', '/admin/evaluation/runs'],
  PATCH: ['/api/v1/users/me'],
  PUT: ['/api/v1/users/me/dna'],
};

/** Backend origin is fixed by server configuration, never by browser input. */
export function getBackendServerUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) throw new Error('NEXT_PUBLIC_API_URL is not configured');
  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
    (url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
    throw new Error('NEXT_PUBLIC_API_URL must be a plain HTTP(S) origin');
  }
  return url;
}

/** Exact method/path allowlist; reject decoded or encoded traversal and separators. */
export function resolveBackendPath(segments: readonly string[], method: string): string | null {
  if (!segments.length || segments.some(segment => !/^[A-Za-z0-9_-]+$/.test(segment))) return null;
  const path = '/' + segments.join('/');
  if (method === 'PUT' && /^\/community\/plans\/[A-Za-z0-9_-]+\/like$/.test(path)) return path;
  if (method === 'POST' && /^\/community\/plans\/[A-Za-z0-9_-]+\/clone$/.test(path)) return path;
  if (method === 'GET' && /^\/admin\/evaluation\/runs\/[A-Za-z0-9_-]+$/.test(path)) return path;
  if (method === 'POST' && /^\/api\/v1\/feedback\/[A-Za-z0-9_-]+\/rating$/.test(path)) return path;
  if (method === 'POST' && /^\/api\/v1\/community\/trips\/[A-Za-z0-9_-]+\/like$/.test(path)) return path;
  if (method === 'GET' && /^\/api\/v1\/destinations\/[A-Za-z0-9_-]+$/.test(path)) return path;
  if (method === 'GET' && /^\/destinations\/[A-Za-z0-9_-]+\/seasonality$/.test(path)) return path;
  if (method === 'GET' && /^\/places\/[0-9]+$/.test(path)) return path;
  // All these private routes additionally require an owner check in the proxy handler.
  if (method === 'GET' && /^\/api\/v1\/trips\/[A-Za-z0-9_-]+$/.test(path)) return path;
  if (method === 'GET' && /^\/trips\/[A-Za-z0-9_-]+\/budget$/.test(path)) return path;
  if (method === 'POST' && /^\/api\/v1\/trips\/[A-Za-z0-9_-]+\/chat$/.test(path)) return path;
  if (method === 'POST' && /^\/trips\/[A-Za-z0-9_-]+\/(generate|confirm|revisions\/(preview|commit))$/.test(path)) return path;
  if (method === 'PATCH' && /^\/trips\/[A-Za-z0-9_-]+\/publication$/.test(path)) return path;
  if (method === 'GET' && /^\/api\/v1\/admin\/traces\/[A-Za-z0-9_-]+$/.test(path)) return path;
  if (method === 'POST' && /^\/admin\/feedback\/tickets\/[A-Za-z0-9_-]+\/replies$/.test(path)) return path;
  if (method === 'PATCH' && /^\/admin\/feedback\/tickets\/[A-Za-z0-9_-]+$/.test(path)) return path;
  if (method === 'POST' && /^\/admin\/content\/(hero-plans|allergy-options)$/.test(path)) return path;
  if ((method === 'PATCH' || method === 'DELETE') &&
    /^\/admin\/content\/(hero-plans|intro-destinations|allergy-options)\/[A-Za-z0-9_-]+$/.test(path)) return path;
  return B1_ROUTES[method.toUpperCase()]?.includes(path) ? path : null;
}

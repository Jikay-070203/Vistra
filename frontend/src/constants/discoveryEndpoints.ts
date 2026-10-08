export const DISCOVERY_ENDPOINTS = {
  PROVINCES: '/api/v1/catalog/provinces',
  LIKE: (id: string) => '/community/plans/' + encodeURIComponent(id) + '/like',
  CLONE: (id: string) => '/community/plans/' + encodeURIComponent(id) + '/clone',
} as const;

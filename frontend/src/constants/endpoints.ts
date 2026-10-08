export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    ME: '/api/v1/auth/me',
    LOGOUT: '/api/v1/auth/logout',
  },
  PROFILE: {
    ME: '/api/v1/users/me',
    DNA: '/api/v1/users/me/dna',
  },
  CATALOG: {
    ALLERGIES: '/api/v1/catalog/allergies',
  },
  CONTENT: {
    PUBLIC_LANDING: '/api/v1/public/landing',
    ADMIN_LIST: '/admin/content',
    COLLECTION: (collection: string) => '/admin/content/' + encodeURIComponent(collection),
    ITEM: (collection: string, id: string) =>
      '/admin/content/' + encodeURIComponent(collection) + '/' + encodeURIComponent(id),
  },
  FEEDBACK: {
    CREATE: '/api/v1/feedback',
    MINE: '/api/v1/feedback/me',
    RATE: (id: string) => '/api/v1/feedback/' + encodeURIComponent(id) + '/rating',
    ADMIN_LIST: '/admin/feedback/tickets',
    ADMIN_ITEM: (id: string) => '/admin/feedback/tickets/' + encodeURIComponent(id),
    ADMIN_REPLY: (id: string) => '/admin/feedback/tickets/' + encodeURIComponent(id) + '/replies',
  },
  TRIP_COLLECTION: {
    MINE: '/api/v1/trips/me',
    COMMUNITY: '/community/plans',
    LIKE: (id: string) => '/api/v1/community/trips/' + encodeURIComponent(id) + '/like',
  },
  RECOMMENDATIONS: {
    LIST: '/api/v1/destinations/recommendations',
    DETAILS: (id: string) => '/api/v1/destinations/' + encodeURIComponent(id),
  },
  ADMIN_SYSTEM: {
    TRACES: '/api/v1/admin/traces',
    TRACE: (id: string) => '/api/v1/admin/traces/' + encodeURIComponent(id),
    DATASETS: '/admin/evaluation/datasets',
  },
  SYSTEM: {
    HEALTH: '/health',
  },
  ADMIN_AUTH: {
    LOGIN: '/api/admin/auth/login',
    LOGOUT: '/api/admin/auth/logout',
  },
  PROVINCES: {
    LIST: '/v2/',
  },
  DESTINATIONS: {
    LIST: '/destinations',
    SEASONALITY: (slug: string) => '/destinations/' + encodeURIComponent(slug) + '/seasonality',
  },
  PLACES: {
    LIST: '/places',
    DETAIL: (id: number) => '/places/' + encodeURIComponent(String(id)),
  },
  TRIPS: {
    CREATE: '/api/v1/trips',
    LIST: '/trips',
    DETAIL: (id: string) => '/api/v1/trips/' + encodeURIComponent(id),
    BUDGET: (id: string) => '/trips/' + encodeURIComponent(id) + '/budget',
    CHAT: (id: string) => '/api/v1/trips/' + encodeURIComponent(id) + '/chat',
    GENERATE: (id: string) => '/trips/' + encodeURIComponent(id) + '/generate',
    PREVIEW: (id: string) => '/trips/' + encodeURIComponent(id) + '/revisions/preview',
    COMMIT: (id: string) => '/trips/' + encodeURIComponent(id) + '/revisions/commit',
    CONFIRM: (id: string) => '/trips/' + encodeURIComponent(id) + '/confirm',
    PUBLICATION: (id: string) => '/trips/' + encodeURIComponent(id) + '/publication',
  },
} as const;

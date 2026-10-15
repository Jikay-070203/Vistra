export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    ME: '/api/v1/auth/me',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
  },
  PROFILE: {
    ME: '/api/v1/users/me',
    DNA: '/api/v1/users/me/dna',
  },
  DNA: {
    ANALYZE: '/api/v1/dna/analyze',
  },
  CATALOG: {
    ALLERGIES: '/api/v1/catalog/allergies',
    PROVINCES: '/api/v1/catalog/provinces',
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
    SYSTEM_PROMPT: '/api/v1/admin/system-prompt',
    TRACES: '/api/v1/admin/traces',
    TRACE: (id: string) => '/api/v1/admin/traces/' + encodeURIComponent(id),
    DATASETS: '/admin/evaluation/datasets',
  },
  ADMIN_V1: {
    OVERVIEW: '/api/v1/admin/overview',
    REVENUE: '/api/v1/admin/revenue',
    REVENUE_EXPORT: '/api/v1/admin/revenue/export',
    USERS: '/api/v1/admin/users',
    PERMISSIONS: '/api/v1/admin/permissions',
    USER_ROLE: (id: string) => '/api/v1/admin/users/' + encodeURIComponent(id) + '/role',
    USER_REVOKE: (id: string) => '/api/v1/admin/users/' + encodeURIComponent(id) + '/revoke',
    USER_STATUS: (id: string) => '/api/v1/admin/users/' + encodeURIComponent(id) + '/status',
    FEEDBACK: '/api/v1/admin/feedback',
    FEEDBACK_ITEM: (id: string) => '/api/v1/admin/feedback/' + encodeURIComponent(id),
    FEEDBACK_REPLIES: (id: string) => '/api/v1/admin/feedback/' + encodeURIComponent(id) + '/replies',
    CONTENT: '/api/v1/admin/content',
    CONTENT_COLLECTION: (collection: AdminContentCollection) =>
      '/api/v1/admin/content/' + encodeURIComponent(collection),
    CONTENT_ITEM: (collection: AdminContentCollection, id: string) =>
      '/api/v1/admin/content/' + encodeURIComponent(collection) + '/' + encodeURIComponent(id),
    ENTITY_METADATA: '/api/v1/admin/entities/metadata',
    IMPORT_PLACES: '/api/v1/admin/import/places',
    IMPORT_PLACE_IMAGES: '/api/v1/admin/import/place-images',
    ENTITY_RECORDS: (table: AdminEntityTable) =>
      '/api/v1/admin/entities/' + encodeURIComponent(table) + '/records',
    GOLDEN_DATASETS: '/api/v1/admin/golden-datasets',
    GOLDEN_DATASET: (id: string) => '/api/v1/admin/golden-datasets/' + encodeURIComponent(id),
    GOLDEN_DATASET_RUNS: (id: string) => '/api/v1/admin/golden-datasets/' + encodeURIComponent(id) + '/runs',
    SAFETY_PRESETS: '/api/v1/admin/safety-presets',
    SAFETY_EVALUATIONS: '/api/v1/admin/safety-evaluations',
    AI_PROVIDER: '/api/v1/admin/ai/provider',
    TRACES: '/api/v1/admin/traces',
    TRACE: (id: string) => '/api/v1/admin/traces/' + encodeURIComponent(id),
    METRICS: '/api/v1/admin/system/metrics',
    QDRANT_STATUS: '/api/v1/admin/qdrant/status',
    QDRANT_MOVE: '/api/v1/admin/qdrant/move',
    QDRANT_MEMORY: '/api/v1/admin/qdrant/memory',
    IMAGE_REPORT: '/api/v1/admin/images/report',
    IMAGE_REPORTS: '/api/v1/admin/images/reports',
    BENCHMARKS: '/api/v1/admin/benchmarks',
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
    BUDGET: (id: string) => '/api/v1/trips/' + encodeURIComponent(id) + '/budget',
    CHAT: (id: string) => '/api/v1/trips/' + encodeURIComponent(id) + '/chat',
    CHAT_STREAM: (id: string) => '/api/v1/trips/' + encodeURIComponent(id) + '/chat/stream',
    CHAT_HISTORY: (id: string) => '/api/v1/trips/' + encodeURIComponent(id) + '/chat/history',
    GENERATE: (id: string) => '/trips/' + encodeURIComponent(id) + '/generate',
    PREVIEW: (id: string) => '/trips/' + encodeURIComponent(id) + '/revisions/preview',
    COMMIT: (id: string) => '/trips/' + encodeURIComponent(id) + '/revisions/commit',
    CONFIRM: (id: string) => '/trips/' + encodeURIComponent(id) + '/confirm',
    PUBLICATION: (id: string) => '/trips/' + encodeURIComponent(id) + '/publication',
  },
} as const;

export type AdminContentCollection = 'hero-plans' | 'intro-destinations' | 'allergy-options';
export type AdminEntityTable = 'destinations' | 'plans' | 'itinerary_days' | 'activities' | 'feedback_tickets';

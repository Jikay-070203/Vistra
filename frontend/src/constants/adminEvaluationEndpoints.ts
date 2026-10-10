export const ADMIN_EVALUATION_ENDPOINTS = {
  RUN: (id: string) => '/admin/evaluation/runs/' + encodeURIComponent(id),
} as const;

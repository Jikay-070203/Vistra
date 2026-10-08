export const ADMIN_EVALUATION_ENDPOINTS = {
  DATASETS: '/admin/evaluation/datasets',
  RUNS: '/admin/evaluation/runs',
  RUN: (id: string) => '/admin/evaluation/runs/' + encodeURIComponent(id),
} as const;
export const ADMIN_METRICS_ENDPOINT = '/admin/system/summary';

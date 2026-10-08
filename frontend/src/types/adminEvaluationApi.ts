export interface AdminMetrics {
  availabilityPct: number | null;
  aiResponseLatencyMs: { avg: number | null; p95: number | null };
  apiLatencyMs: { avg: number | null; p95: number | null };
  planAcceptancePct: number | null;
  checkedAt: string;
  // No benchmark item contract is implemented by the backend yet.
  benchmarkGroups: unknown[];
}
export interface CreateDatasetRequest {
  name: string;
  description: string;
  test_cases: { name: string; input?: unknown; expected?: unknown }[];
}
export interface CreatedDataset {
  id: string;
  name: string;
  testCasesCount: number;
  isBuiltin: boolean;
  version: number;
}
export interface EvaluationRun {
  runId: string;
  status: string;
  datasetId?: string;
  scorePct?: number | null;
  counts?: { passed: number; warning: number; failed: number } | null;
  cases?: unknown;
}

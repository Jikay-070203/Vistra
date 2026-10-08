export interface AdminPageQuery { page: number; pageSize: number }

export interface TraceListItemView {
  id: string;
  timestamp: string;
  traceType: string;
  status: string;
  latencyMs: number | null;
  confidence: number | null;
  context: unknown;
}

export interface TraceDetailView extends TraceListItemView { details: unknown }

export interface AdminPageView<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GoldenDatasetMetadataView {
  id: string;
  name: string;
  description: string;
  testCasesCount: number;
  isBuiltin: boolean;
  /** The list endpoint does not hydrate individual cases. */
  testCases: [];
}

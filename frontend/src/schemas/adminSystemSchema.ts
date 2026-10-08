import { boolean, list, nullable, number, record, string } from '@/schemas/apiSchemaHelpers';
import type { AdminPageView, GoldenDatasetMetadataView, TraceDetailView,
  TraceListItemView } from '@/types/adminSystemApi';

function page<T>(value: unknown, label: string, item: (value: unknown) => T): AdminPageView<T> {
  const raw = record(value, label);
  return {
    items: list(raw.items, label + '.items').map(item),
    page: number(raw.page, label + '.page'),
    pageSize: number(raw.pageSize, label + '.pageSize'),
    total: number(raw.total, label + '.total'),
    totalPages: number(raw.totalPages, label + '.totalPages'),
  };
}

function trace(value: unknown): TraceListItemView {
  const raw = record(value, 'trace');
  return {
    id: string(raw.id, 'trace.id'),
    timestamp: string(raw.timestamp, 'trace.timestamp'),
    traceType: string(raw.traceType, 'trace.traceType'),
    status: string(raw.status, 'trace.status'),
    latencyMs: nullable(raw.latencyMs, number, 'trace.latencyMs'),
    confidence: nullable(raw.confidence, number, 'trace.confidence'),
    context: raw.context,
  };
}

function dataset(value: unknown): GoldenDatasetMetadataView {
  const raw = record(value, 'dataset');
  const cases = list(raw.testCases, 'dataset.testCases');
  if (cases.length) throw new TypeError('Dataset list unexpectedly contains cases');
  return {
    id: string(raw.id, 'dataset.id'),
    name: string(raw.name, 'dataset.name'),
    description: string(raw.description, 'dataset.description'),
    testCasesCount: number(raw.testCasesCount, 'dataset.testCasesCount'),
    isBuiltin: boolean(raw.isBuiltin, 'dataset.isBuiltin'),
    testCases: [],
  };
}

export const traceListSchema = {
  parse(value: unknown): AdminPageView<TraceListItemView> {
    return page(value, 'traces', trace);
  },
};

export const traceDetailSchema = {
  parse(value: unknown): TraceDetailView {
    const raw = record(value, 'trace detail');
    return { ...trace(raw), details: raw.details };
  },
};

export const datasetListSchema = {
  parse(value: unknown): AdminPageView<GoldenDatasetMetadataView> {
    return page(value, 'datasets', dataset);
  },
};

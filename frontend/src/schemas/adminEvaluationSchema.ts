import { boolean, list, nullable, number, record, string } from '@/schemas/apiSchemaHelpers';
import type { AdminMetrics, CreatedDataset, CreateDatasetRequest, EvaluationRun } from '@/types/adminEvaluationApi';

export const adminMetricsSchema = {
  parse(value: unknown): AdminMetrics {
    const raw = record(value, 'metrics');
    const latency = (value: unknown) => {
      const raw = record(value, 'latency');
      return { avg: nullable(raw.avg, number, 'avg'), p95: nullable(raw.p95, number, 'p95') };
    };
    return {
      availabilityPct: nullable(raw.availabilityPct, number, 'availabilityPct'),
      aiResponseLatencyMs: latency(raw.aiResponseLatencyMs),
      apiLatencyMs: latency(raw.apiLatencyMs),
      planAcceptancePct: nullable(raw.planAcceptancePct, number, 'planAcceptancePct'),
      checkedAt: string(raw.checkedAt, 'checkedAt'),
      benchmarkGroups: list(raw.benchmarkGroups, 'benchmarkGroups'),
    };
  },
};
export const createDatasetSchema = {
  parse(value: unknown): CreateDatasetRequest {
    const raw = record(value, 'dataset');
    const name = string(raw.name, 'name').trim();
    const description = string(raw.description, 'description');
    const cases = list(raw.test_cases, 'test_cases');
    if (!name || name.length > 200 || description.length > 2000 || !cases.length || cases.length > 1000) {
      throw new TypeError('Tên 1–200 ký tự, mô tả tối đa 2.000 ký tự và 1–1.000 test case.');
    }
    return { name, description, test_cases: cases.map((value, index) => {
      const item = record(value, 'case ' + (index + 1));
      const name = string(item.name, 'case.name').trim();
      if (!name) throw new TypeError('Test case ' + (index + 1) + ' cần có tên.');
      return { name, input: item.input, expected: item.expected };
    }) };
  },
};
export const createdDatasetSchema = {
  parse(value: unknown): CreatedDataset {
    const raw = record(record(value, 'response').dataset, 'dataset');
    return { id: string(raw.id, 'id'), name: string(raw.name, 'name'),
      testCasesCount: number(raw.testCasesCount, 'testCasesCount'),
      isBuiltin: boolean(raw.isBuiltin, 'isBuiltin'), version: number(raw.version, 'version') };
  },
};
export const evaluationRunSchema = {
  parse(value: unknown): EvaluationRun {
    const raw = record(value, 'run');
    const run: EvaluationRun = { runId: string(raw.runId, 'runId'), status: string(raw.status, 'status') };
    if ('datasetId' in raw) {
      run.datasetId = string(raw.datasetId, 'datasetId');
      run.scorePct = nullable(raw.scorePct, number, 'scorePct');
      if (raw.counts === null) run.counts = null;
      else {
        const counts = record(raw.counts, 'counts');
        run.counts = { passed: number(counts.passed, 'passed'), warning: number(counts.warning, 'warning'), failed: number(counts.failed, 'failed') };
      }
      run.cases = raw.cases;
    }
    return run;
  },
};

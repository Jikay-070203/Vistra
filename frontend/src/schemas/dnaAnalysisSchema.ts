import { list, nullable, number, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import type { TravelDnaAnalysisView, TravelDnaMetric } from '@/types/tripDna';

export const dnaAnalysisResponseSchema = {
  parse(value: unknown): TravelDnaAnalysisView {
    const response = record(value, 'DNA analysis response');
    const derivedDna = record(response.derived_dna, 'DNA analysis response.derived_dna');
    const metrics = list(derivedDna.metrics, 'DNA analysis response.derived_dna.metrics').map((value, index): TravelDnaMetric => {
      const metric = record(value, `DNA analysis response.derived_dna.metrics[${index}]`);
      const key = string(metric.key, `DNA analysis response.derived_dna.metrics[${index}].key`);
      const score = number(metric.score, `DNA analysis response.derived_dna.metrics[${index}].score`);
      if (!key.trim() || score < 0 || score > 100) throw new TypeError('DNA metric must have a key and score from 0 to 100.');
      return {
        key,
        score,
        ...(typeof metric.label === 'string' ? { label: metric.label } : {}),
      };
    });

    return {
      analysisId: string(response.analysis_id, 'DNA analysis response.analysis_id'),
      status: string(response.status, 'DNA analysis response.status'),
      metrics,
      confidence: nullable(response.confidence, number, 'DNA analysis response.confidence'),
      sources: list(response.sources, 'DNA analysis response.sources').map((value, index) => {
        const label = `DNA analysis response.sources[${index}]`;
        const source = record(value, label);
        return {
          id: string(source.id, label + '.id'),
          url: source.url == null ? null : string(source.url, label + '.url'),
          filename: string(source.filename, label + '.filename'),
          status: oneOf(source.status, ['processed', 'rejected'] as const, label + '.status'),
          error: source.error == null ? null : string(source.error, label + '.error'),
        };
      }),
    };
  },
};

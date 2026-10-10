export interface TravelDnaMetric {
  key: string;
  label?: string;
  score: number;
}

export interface TravelDnaAnalysisView {
  analysisId: string;
  status: string;
  metrics: TravelDnaMetric[];
  confidence: number | null;
  sources: Array<{
    id: string;
    url: string | null;
    filename: string;
    status: 'processed' | 'rejected';
    error: string | null;
  }>;
}

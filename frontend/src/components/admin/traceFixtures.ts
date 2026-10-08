export interface TraceLog {
  id: string;
  timestamp: string;
  traceType: string;
  latencyMs: number | null;
  confidence: number | null;
  status: 'SUCCESS' | 'WARNING' | 'LATENCY_SPIKE' | 'UNAVAILABLE' | string;
  context: string;
  details: {
    inputSummary: string;
    retrievedSources: string[];
    decisionImpact?: string;
  };
}

export const LATENCY_SPIKE_THRESHOLD_MS = 2500; // Common threshold for AI latency spikes (ADM-OV-03B)

export interface AdminSafetyPresets {
  mode: string;
  items: Record<string, unknown>[];
}

export interface AdminSafetyEvaluation {
  executionMode: string;
  prompt: string;
  presetId: string | null;
  blocked: boolean;
  blockedCount: number;
  attackType: string | null;
  latencyMs: number | null;
  defenseLayer: string | null;
  sanitizedResponse: string | null;
  expectedDefense: string | null;
}

export type AiProvider = 'gemini' | 'openai';
export type AiProviderModel = 'gemini-3.5-flash-lite' | 'gpt-4o-mini';

export interface AiProviderSettings {
  provider: AiProvider;
  model: string;
  hasKey: boolean;
  updatedAt: string | null;
  supportedProviders?: AiProvider[];
  recommendedModels: Record<AiProvider, string[]>;
  message?: string;
}

export interface AiProviderUpdateRequest {
  provider: AiProvider;
  model: AiProviderModel;
  apiKey: string;
}

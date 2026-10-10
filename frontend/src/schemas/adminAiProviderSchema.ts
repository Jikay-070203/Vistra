import { boolean, list, nullable, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import type { AiProvider, AiProviderModel, AiProviderSettings, AiProviderUpdateRequest } from '@/types/adminAiProviderApi';

const providers = ['gemini', 'openai'] as const;
const models = ['gemini-3.5-flash-lite', 'gpt-4o-mini'] as const;

export const aiProviderSettingsSchema = {
  parse(value: unknown): AiProviderSettings {
    const envelope = record(value, 'AI provider response');
    const data = record(envelope.data, 'AI provider settings');
    const recommended = record(data.recommendedModels, 'recommendedModels');
    const settings: AiProviderSettings = {
      provider: oneOf(data.provider, providers, 'provider'),
      model: string(data.model, 'model'),
      hasKey: boolean(data.hasKey, 'hasKey'),
      updatedAt: nullable(data.updatedAt, string, 'updatedAt'),
      recommendedModels: {
        gemini: list(recommended.gemini, 'recommendedModels.gemini').map((item, index) => string(item, `recommendedModels.gemini[${index}]`)),
        openai: list(recommended.openai, 'recommendedModels.openai').map((item, index) => string(item, `recommendedModels.openai[${index}]`)),
      },
    };
    if (data.supportedProviders !== undefined) {
      settings.supportedProviders = list(data.supportedProviders, 'supportedProviders')
        .map((item, index) => oneOf(item, providers, `supportedProviders[${index}]`));
    }
    if (data.message !== undefined) settings.message = string(data.message, 'message');
    return settings;
  },
};

export const aiProviderUpdateRequestSchema = {
  parse(value: unknown): AiProviderUpdateRequest {
    const data = record(value, 'AI provider update request');
    const provider: AiProvider = oneOf(data.provider, providers, 'provider');
    const model: AiProviderModel = oneOf(data.model, models, 'model');
    if ((provider === 'gemini') !== (model === 'gemini-3.5-flash-lite')) {
      throw new TypeError('model does not match provider');
    }
    const apiKey = string(data.apiKey, 'apiKey').trim();
    if (!apiKey || apiKey.length > 500) throw new TypeError('apiKey must contain 1 to 500 characters');
    return { provider, model, apiKey };
  },
};

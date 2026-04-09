import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export type AIProvider = 'anthropic' | 'openai' | 'google';

export interface UserAIConfig {
  provider: AIProvider;
  modelId: string;
  apiKey: string;
}

// Returns a Vercel AI SDK LanguageModel for the given user-supplied config.
// API keys are decrypted before being passed here — never store plaintext keys.
// TODO(Phase 3): move into modules/workout-generation/infrastructure/adapters/
export function getModel({ provider, modelId, apiKey }: UserAIConfig): LanguageModel {
  switch (provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(modelId);
    case 'openai':
      return createOpenAI({ apiKey })(modelId);
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(modelId);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

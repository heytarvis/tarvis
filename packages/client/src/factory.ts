import { ChatUiConfig } from './types/chat-ui-config.model';
import { signal } from '@preact/signals';
import { ChatUiContext } from '@tarvis/shared/src/types/chat-ui-context.model';
import { model_gpt_3_5_turbo } from '@tarvis/shared/src/available-models';

const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful assistant. Please format all your responses using markdown.';

export const createChatUIContext = (config: ChatUiConfig): ChatUiContext => {
  const useDefaultSystemPrompt = config.useDefaultSystemPrompt !== false; // Default to true if not specified
  const systemPrompt = useDefaultSystemPrompt
    ? config.systemPrompt
      ? `${DEFAULT_SYSTEM_PROMPT}\n\n${config.systemPrompt}`
      : DEFAULT_SYSTEM_PROMPT
    : config.systemPrompt || '';

  return {
    endpoint: config.endpoint,
    callToolEndpoint: config.callToolEndpoint || undefined,
    threads: signal(config.threads || []),
    theme: signal(config.theme || 'light'),
    currentThread: signal(null),
    onMessageComplete: signal(config.onMessageComplete),
    systemPrompt: signal(systemPrompt),
    customComponents: {},
    temperature: signal(config.temperature || 0.7),
    model: signal(config.model || 'gpt-3.5-turbo'),
    availableModels: signal(config.availableModels || [model_gpt_3_5_turbo]),
    plugins: signal(config.plugins || []),
    isLoading: signal(config.isLoading || false),
  };
};

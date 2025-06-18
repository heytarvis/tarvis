import { ChatUiConfig } from './types/chat-ui-config.model';
import { signal } from '@preact/signals';
import { ChatUiContext } from '@tarvis/shared/src/types/chat-ui-context.model';
import { model_gpt_3_5_turbo } from '@tarvis/shared/src/available-models';

export const createChatUIContext = (config: ChatUiConfig): ChatUiContext => {
  return {
    endpoint: config.endpoint,
    threads: signal(config.threads || []),
    theme: signal(config.theme || 'light'),
    currentThread: signal(null),
    onMessageComplete: signal(config.onMessageComplete),
    systemPrompt: signal(config.systemPrompt || ''),
    customComponents: {},
    temperature: signal(config.temperature || 0.7),
    model: signal(config.model || 'gpt-3.5-turbo'),
    availableModels: signal(config.availableModels || [model_gpt_3_5_turbo]),
    plugins: signal(config.plugins || []),
  };
};

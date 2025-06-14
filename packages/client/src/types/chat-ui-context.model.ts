import { Thread } from './conversations';
import { Signal } from '@preact/signals';
import { AssistantMessage } from './conversations';
import { CustomComponentFns } from './app';
import { ModelInfo } from '@tarvis/shared/src';

export type ChatUiContext = {
  endpoint: string;
  threads: Signal<Thread[]>;
  currentThread: Signal<Thread | null>;
  theme: Signal<'light' | 'dark'>;
  onMessageComplete: Signal<((message: AssistantMessage, thread?: Thread) => void) | undefined>;
  systemPrompt: Signal<string>;
  temperature: Signal<number>;
  model: Signal<string>;
  availableModels: Signal<ModelInfo[]>;
  customComponents: CustomComponentFns;
};

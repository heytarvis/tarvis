import { Thread } from '../../client/src/types/conversations';
import { Signal } from '@preact/signals';
import { AssistantMessage } from '../../client/src/types/conversations';
import { CustomComponentFns } from '../../client/src/types/app';
import { ModelInfo } from 'packages/shared/src';
import { ClientPlugin } from "../src/types/client-plugin";

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
  plugins?: Signal<ClientPlugin[]>;
};

import { Thread, AssistantMessage } from '@tarvis/shared/src/types/conversations';
import { Model } from '../../../shared/src/available-models';
import { ModelInfo } from '@tarvis/shared/src';
import { ClientPlugin } from '@tarvis/shared/src/types/client-plugin';

export interface ChatUiConfig {
  endpoint: string;
  threads?: Thread[];
  theme?: 'light' | 'dark';
  onMessageComplete?: (message: AssistantMessage, thread?: Thread) => void;
  systemPrompt?: string;
  temperature?: number;
  model?: (typeof Model)[keyof typeof Model] | string;
  availableModels?: ModelInfo[];
  plugins?: ClientPlugin[];
}

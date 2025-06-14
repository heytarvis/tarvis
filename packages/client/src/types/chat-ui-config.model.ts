import { Thread, AssistantMessage } from './conversations';
import { Model } from '../../../shared/src/available-models';
import { ModelInfo } from '@tarvis/shared/src';

export interface ChatUiConfig {
  endpoint: string;
  threads?: Thread[];
  theme?: 'light' | 'dark';
  onMessageComplete?: (message: AssistantMessage, thread?: Thread) => void;
  systemPrompt?: string;
  temperature?: number;
  model?: (typeof Model)[keyof typeof Model] | string;
  availableModels?: ModelInfo[];
}

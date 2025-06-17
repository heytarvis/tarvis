export {
  model_gemini_2_0_flash,
  model_claude_3_5_sonnet,
  model_llama_3_3_70b_versatile,
  model_llama_4_scout_17b,
  model_gpt_3_5_turbo,
  model_gpt_4,
} from '@tarvis/shared/src/available-models';

export { Model } from '../../shared/src/available-models';
export type { CustomComponentFn } from './types/app';
export type { CustomComponentName } from './types/app';
export { createChatUIContext } from './factory';
export type { ChatUiConfig } from './types/chat-ui-config.model';
export type { ChatUiContext } from '@tarvis/shared/types/chat-ui-context.model';
export { ChatUI } from './chat-ui.app';

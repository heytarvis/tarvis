export {
  availableModels,
  model_gpt_4,
  model_gpt_3_5_turbo,
  model_claude_3_5_sonnet,
  model_gemini_2_0_flash,
  model_llama_3_3_70b_versatile,
  model_llama_4_scout_17b,
} from '@tarvis/shared/src/available-models';

export type { CustomModelInstance } from '@tarvis/shared/src';

export {
  TarvisClient,
  type OnChunkCallback,
  type OnCompleteCallback,
  type OnErrorCallback,
} from './tarvis-client';

export { formatSSEMessage, parseSSEMessage } from './sse-utils';

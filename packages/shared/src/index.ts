import { LangChainMessage } from './types/langchain';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

export type { LangChainMessage } from './types/langchain';

export type CustomModelInstance = {
  stream: (messages: (HumanMessage | AIMessage | SystemMessage)[]) => AsyncIterable<{
    content?: string;
    usage_metadata?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  }>;

  invoke: (messages: (HumanMessage | AIMessage | SystemMessage)[]) => Promise<{
    content: string;
    usage_metadata?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  }>;
};

export interface ModelInfo {
  id: string;
  name: string;
  provider?: string;
  description?: string;
  ModelInstance?: CustomModelInstance;
}

export interface ChatRequest {
  threadId: string;
  messages: LangChainMessage[];
  modelId: string;
  messageId?: string;
  temperature?: number;
  isRetry?: boolean;
}

export interface UsageMetadata {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export interface ChatResponse {
  type: 'message' | 'error' | 'complete';
  content?: string;
  error?: string;
  threadId: string;
  messageId?: string;
  threadTitle?: string;
  isRetry?: boolean;
  usage_metadata?: UsageMetadata;
}

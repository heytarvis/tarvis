import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import {ChatRequest, ChatResponse, ModelInfo, UsageMetadata} from '@tarvis/shared/src';
import { createOrGetModel, isModelSupported } from './models';
import { formatSSEMessage } from './sse-utils';
import {availableModels} from "@tarvis/shared/src/available-models";

export type OnChunkCallback = (sseMessage: string) => void;
export type OnCompleteCallback = (sseMessage: string) => void;
export type OnErrorCallback = (sseMessage: string) => void;

type TarvisClientOptions = {
  defaultModelId?: string;
  defaultTemperature?: number;
  availableModels?: ModelInfo[];
};

export class TarvisClient {
  private defaultModelId: string;
  private defaultTemperature: number;
  private availableModels: ModelInfo[] = availableModels;

  constructor(options:
    TarvisClientOptions = {}
  ) {
    this.defaultModelId = options.defaultModelId || 'gpt-3.5-turbo';
    this.defaultTemperature = options.defaultTemperature || 0.7;

    if (options.availableModels) {
      this.availableModels = options.availableModels;
    }
  }

  private async generateThreadTitle(userMessage: string, modelId: string): Promise<string> {
    const titleModel = createOrGetModel(this.availableModels, modelId, { temperature: 0.3 });
    const messages = [
      new SystemMessage(
        'You are a helpful assistant that generates concise, descriptive titles for chat threads. The title should be 3-5 words maximum and capture the main topic of the conversation. Respond with ONLY the title, no additional text.'
      ),
      new HumanMessage(userMessage),
    ];

    const response = await titleModel.invoke(messages);
    return response.content.toString().trim();
  }

  async streamChatResponse(
    request: ChatRequest,
    onChunk: OnChunkCallback,
    onComplete: OnCompleteCallback,
    onError: OnErrorCallback
  ) {
    const {
      messages: langChainMessages,
      threadId,
      messageId,
      modelId = this.defaultModelId,
      temperature = this.defaultTemperature,
      isRetry = false,
    } = request;

    try {
      if (!isModelSupported(this.availableModels, modelId)) {
        throw new Error(`Unsupported model: ${modelId}`);
      }

      const messages = langChainMessages.map(msg => {
        switch (msg.type) {
          case 'human':
            return new HumanMessage(msg.content);
          case 'system':
            return new SystemMessage(msg.content);
          case 'ai':
            return new AIMessage(msg.content);
          default:
            throw new Error(`Unknown message type: ${msg.type}`);
        }
      });

      const chatModel = createOrGetModel(this.availableModels, modelId, { temperature });

      const stream = await chatModel.stream(messages);
      let lastUsageMetadata: UsageMetadata | undefined;

      for await (const chunk of stream) {
        if (chunk) {
          const content = chunk.content;
          lastUsageMetadata = chunk.usage_metadata;

          if (content) {
            const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
            const chatMessage: ChatResponse = {
              type: 'message',
              content: contentStr,
              threadId,
              messageId,
              isRetry,
              usage_metadata: chunk.usage_metadata,
            };
            onChunk(formatSSEMessage(chatMessage));
          }
        }
      }

      const userMessages = langChainMessages.filter(msg => msg.type === 'human');
      const hasOnlyOneUserMessage = userMessages.length === 1;
      let threadTitle: string | undefined;

      if (hasOnlyOneUserMessage) {
        threadTitle = await this.generateThreadTitle(userMessages[0].content, modelId);
      }

      const completionMessage: ChatResponse = {
        type: 'complete',
        content: '',
        threadId,
        messageId,
        threadTitle,
        isRetry,
        usage_metadata: lastUsageMetadata,
      };
      onComplete(formatSSEMessage(completionMessage));
    } catch (error) {
      console.error('Error processing message:', error);
      const errorResponse: ChatResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to process message',
        threadId,
        isRetry,
      };
      onError(formatSSEMessage(errorResponse));
    }
  }
}

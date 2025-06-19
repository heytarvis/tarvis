import {AIMessage, HumanMessage, SystemMessage} from '@langchain/core/messages';
import {
  ChatRequest,
  ChatResponse,
  MCPCallToolRequest,
  MCPCallToolResult,
  MCPTool,
  MCPToolsListResponse,
  ModelInfo,
  UsageMetadata
} from '@tarvis/shared/src';
import {createOrGetModel, isModelSupported} from './models';
import {formatSSEMessage} from './sse-utils';
import {availableModels} from '@tarvis/shared/src/available-models';
import {z} from 'zod';

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
  private tools: Map<string, MCPTool> = new Map();
  private toolHandlers: Map<string, (args: Record<string, any>) => Promise<MCPCallToolResult>> = new Map();

  constructor(options: TarvisClientOptions = {}) {
    this.defaultModelId = options.defaultModelId || 'gpt-3.5-turbo';
    this.defaultTemperature = options.defaultTemperature || 0.7;

    if (options.availableModels) {
      this.availableModels = options.availableModels;
    }
  }

  /**
   * Add a tool to the client
   * @param tool The MCP tool definition
   * @param handler Handler function for the tool
   */
  addTool(tool: MCPTool, handler: (args: Record<string, any>) => Promise<MCPCallToolResult>): void {
    this.tools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
  }

  /**
   * Remove a tool from the client
   * @param toolName The name of the tool to remove
   */
  removeTool(toolName: string): void {
    this.tools.delete(toolName);
    this.toolHandlers.delete(toolName);
  }

  /**
   * Get all available tools in MCP format
   * @returns JSON-RPC formatted list of tools
   */
  getToolsList(): MCPToolsListResponse {
    return {
      tools: Array.from(this.tools.values())
    };
  }

  /**
   * Use a specific tool
   * @param request The tool use request
   * @returns The tool response
   */
  async callTool(request: MCPCallToolRequest): Promise<MCPCallToolResult> {
    const { name, arguments: args } = request;

    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    const handler = this.toolHandlers.get(name);
    if (!handler) {
      throw new Error(`No handler registered for tool '${name}'`);
    }

    try {
      // Validate arguments against the tool's input schema
      this.validateToolArguments(tool, args);

      // Execute the tool
      return await handler(args);
    } catch (error) {
      return {
        content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error occurred' }],
        isError: true
      };
    }
  }

  /**
   * Validate tool arguments against the tool's input schema
   * @param tool The tool definition
   * @param args The arguments to validate
   */
  private validateToolArguments(tool: MCPTool, args: Record<string, any>): void {
    const { inputSchema } = tool;
    const { properties, required = [] } = inputSchema;

    // Check required fields
    for (const requiredField of required) {
      if (!(requiredField in args)) {
        throw new Error(`Missing required argument: ${requiredField}`);
      }
    }

    // Validate each provided argument
    for (const [key, value] of Object.entries(args)) {
      const paramSchema = properties[key];
      if (!paramSchema) {
        throw new Error(`Unknown argument: ${key}`);
      }

      this.validateParameterValue(paramSchema, value, key);
    }
  }

  /**
   * Validate a parameter value against its schema
   * @param schema The Zod schema for the parameter
   * @param value The value to validate
   * @param paramName The parameter name for error messages
   */
  private validateParameterValue(schema: z.ZodSchema, value: any, paramName: string): void {
    try {
      schema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => e.message).join(', ');
        throw new Error(`Invalid value for ${paramName}: ${errorMessage}`);
      }
      throw new Error(`Validation error for ${paramName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    onChunk?: OnChunkCallback,
    onComplete?: OnCompleteCallback,
    onError?: OnErrorCallback
  ): Promise<ReadableStream> {
    const {
      messages: langChainMessages,
      threadId,
      messageId,
      modelId = this.defaultModelId,
      temperature = this.defaultTemperature,
      isRetry = false,
    } = request;

    const self = this;
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          if (!isModelSupported(self.availableModels, modelId)) {
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

          const chatModel = createOrGetModel(self.availableModels, modelId, { temperature });
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
                const formattedMessage = formatSSEMessage(chatMessage);
                controller.enqueue(encoder.encode(formattedMessage));
                onChunk?.(formattedMessage);
              }
            }
          }

          const userMessages = langChainMessages.filter(msg => msg.type === 'human');
          const hasOnlyOneUserMessage = userMessages.length === 1;
          let threadTitle: string | undefined;

          if (hasOnlyOneUserMessage) {
            threadTitle = await self.generateThreadTitle(userMessages[0].content, modelId);
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
          const formattedComplete = formatSSEMessage(completionMessage);
          controller.enqueue(encoder.encode(formattedComplete));
          controller.close();
          onComplete?.(formattedComplete);
        } catch (error) {
          console.error('Error processing message:', error);
          const errorResponse: ChatResponse = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Failed to process message',
            threadId,
            isRetry,
          };
          const formattedError = formatSSEMessage(errorResponse);
          controller.enqueue(encoder.encode(formattedError));
          controller.close();
          onError?.(formattedError);
        }
      },
    });
  }
}

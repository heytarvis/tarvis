import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatRequest, ChatResponse, ModelInfo, UsageMetadata, MCPTool, MCPToolsListResponse, MCPToolUseRequest, MCPToolUseResponse } from '@tarvis/shared/src';
import { createOrGetModel, isModelSupported } from './models';
import { formatSSEMessage } from './sse-utils';
import { availableModels } from '@tarvis/shared/src/available-models';

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
  private toolHandlers: Map<string, (args: Record<string, any>) => Promise<MCPToolUseResponse>> = new Map();

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
  addTool(tool: MCPTool, handler: (args: Record<string, any>) => Promise<MCPToolUseResponse>): void {
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
  async useTool(request: MCPToolUseRequest): Promise<MCPToolUseResponse> {
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
      const result = await handler(args);
      return result;
    } catch (error) {
      return {
        content: error instanceof Error ? error.message : 'Unknown error occurred',
        is_error: true
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
   * @param schema The parameter schema
   * @param value The value to validate
   * @param paramName The parameter name for error messages
   */
  private validateParameterValue(schema: any, value: any, paramName: string): void {
    const { type, enum: enumValues } = schema;

    // Check enum values if specified
    if (enumValues && !enumValues.includes(value)) {
      throw new Error(`Invalid value for ${paramName}. Must be one of: ${enumValues.join(', ')}`);
    }

    // Type validation
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`${paramName} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`${paramName} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`${paramName} must be a boolean`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error(`${paramName} must be an object`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`${paramName} must be an array`);
        }
        break;
      default:
        throw new Error(`Unknown parameter type: ${type}`);
    }
  }

  /**
   * Get a tool by name
   * @param name The tool name
   * @returns The tool definition or undefined if not found
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   * @param name The tool name
   * @returns True if the tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all tool names
   * @returns Array of tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
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

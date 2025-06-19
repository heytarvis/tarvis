import { TarvisClient } from './tarvis-client';
import { 
  getExampleTools, 
  getExampleToolHandlers,
  createTextTool,
  createMultiParamTool 
} from './mcp-tools';
import { MCPTool, MCPToolUseResponse } from '@tarvis/shared/src';

/**
 * Example: Basic usage with pre-defined tools
 */
export function createClientWithExampleTools(): TarvisClient {
  const client = new TarvisClient({
    defaultModelId: 'gpt-3.5-turbo',
    defaultTemperature: 0.7,
  });

  // Add example tools with their handlers
  const exampleTools = getExampleTools();
  const handlers = getExampleToolHandlers();

  exampleTools.forEach(tool => {
    const handler = handlers[tool.name as keyof typeof handlers];
    if (handler) {
      client.addTool(tool, handler);
    }
  });

  return client;
}

/**
 * Example: Creating custom tools
 */
export function createClientWithCustomTools(): TarvisClient {
  const client = new TarvisClient();

  // Create a simple text-based tool
  const echoTool = createTextTool(
    'echo',
    'Echo back the input text',
    'text',
    'Text to echo back'
  );

  // Create a multi-parameter tool
  const customTool = createMultiParamTool(
    'custom_action',
    'Perform a custom action with multiple parameters',
    {
      action: {
        type: 'string',
        description: 'Action to perform',
        enum: ['process', 'validate', 'transform'],
      },
      data: {
        type: 'string',
        description: 'Data to process',
      },
      options: {
        type: 'object',
        description: 'Additional options',
      },
    },
    ['action', 'data']
  );

  // Add custom tools with their handlers
  client.addTool(echoTool, async (args) => ({
    content: `Echo: ${args.text}`,
  }));

  client.addTool(customTool, async (args) => ({
    content: `Performed ${args.action} on data: ${args.data} with options: ${JSON.stringify(args.options)}`,
  }));

  return client;
}

/**
 * Example: Using the client to list tools and execute them
 */
export async function demonstrateToolUsage() {
  const client = createClientWithExampleTools();

  // Get list of available tools
  const toolsList = client.getToolsList();
  console.log('Available tools:', toolsList.tools.map(t => t.name));

  // Use a specific tool
  try {
    const calculatorResult = await client.useTool({
      name: 'calculator',
      arguments: { expression: '2 + 2 * 3' }
    });
    console.log('Calculator result:', calculatorResult);

    const weatherResult = await client.useTool({
      name: 'weather',
      arguments: { location: 'New York', units: 'fahrenheit' }
    });
    console.log('Weather result:', weatherResult);

  } catch (error) {
    console.error('Error using tool:', error);
  }
}

/**
 * Example: Creating a tool with complex validation
 */
export function createAdvancedTool(): MCPTool {
  return {
    name: 'data_processor',
    description: 'Process data with advanced validation',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: 'Operation to perform',
          enum: ['filter', 'sort', 'aggregate', 'transform'],
        },
        data: {
          type: 'array',
          description: 'Array of data items to process',
        },
        criteria: {
          type: 'object',
          description: 'Processing criteria',
        },
        options: {
          type: 'object',
          description: 'Additional processing options',
        },
      },
      required: ['operation', 'data'],
    },
  };
}

/**
 * Example: Tool handler with complex logic
 */
export async function advancedToolHandler(args: Record<string, any>): Promise<MCPToolUseResponse> {
  const { operation, data, criteria, options } = args;

  try {
    let result: any;

    switch (operation) {
      case 'filter':
        result = data.filter((item: any) => {
          // Apply filtering criteria
          return true; // Simplified for example
        });
        break;
      case 'sort':
        result = data.sort((a: any, b: any) => {
          // Apply sorting logic
          return 0; // Simplified for example
        });
        break;
      case 'aggregate':
        result = data.reduce((acc: any, item: any) => {
          // Apply aggregation logic
          return acc;
        }, {});
        break;
      case 'transform':
        result = data.map((item: any) => {
          // Apply transformation logic
          return item;
        });
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return {
      content: JSON.stringify(result),
    };
  } catch (error) {
    return {
      content: `Error processing data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      is_error: true,
    };
  }
}

/**
 * Example: Integration with chat response
 */
export async function demonstrateChatWithTools() {
  const client = createClientWithExampleTools();

  // Simulate a chat request that might trigger tool usage
  const chatRequest = {
    threadId: 'thread-123',
    messages: [
      {
        type: 'human' as const,
        content: 'What is 15 * 23?',
      },
    ],
    modelId: 'gpt-3.5-turbo',
    messageId: 'msg-456',
  };

  // In a real implementation, the model would decide to use tools
  // Here we demonstrate manual tool usage
  const calculationResult = await client.useTool({
    name: 'calculator',
    arguments: { expression: '15 * 23' }
  });

  console.log('Tool result for chat:', calculationResult);
} 
import { TarvisClient } from './tarvis-client';
import {
  createTextTool,
  createMultiParamTool
} from './mcp-tools';
import { MCPTool, MCPCallToolResult } from '@tarvis/shared/src';
import { z } from 'zod';

/**
 * Example: Basic usage with custom tools
 */
export function createClientWithCustomTools(): TarvisClient {
  const client = new TarvisClient({
    defaultModelId: 'gpt-3.5-turbo',
    defaultTemperature: 0.7,
  });

  // Create a simple text-based tool
  const echoTool = createTextTool(
    'echo',
    'Echo back the input text',
    'text',
    'Text to echo back'
  );

  // Create a multi-parameter tool with Zod schemas
  const calculatorTool = createMultiParamTool(
    'calculator',
    'Perform mathematical calculations',
    {
      expression: z.string().describe('Mathematical expression to evaluate'),
    },
    ['expression']
  );

  // Add custom tools with their handlers
  client.addTool(echoTool, async (args) => ({
    content: [{ type: 'text', text: `Echo: ${args.text}` }],
  }));

  client.addTool(calculatorTool, async (args) => {
    try {
      const result = eval(args.expression as string);
      return {
        content: [{ type: 'text', text: `Result: ${result}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  });

  return client;
}

/**
 * Example: Using the client to list tools and execute them
 */
export async function demonstrateToolUsage() {
  const client = createClientWithCustomTools();

  // Get list of available tools
  const toolsList = client.getToolsList();
  console.log('Available tools:', toolsList.tools.map(t => t.name));

  // Use a specific tool
  try {
    const calculatorResult = await client.callTool({
      name: 'calculator',
      arguments: { expression: '2 + 2 * 3' }
    });
    console.log('Calculator result:', calculatorResult);

    const echoResult = await client.callTool({
      name: 'echo',
      arguments: { text: 'Hello, World!' }
    });
    console.log('Echo result:', echoResult);

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
        operation: z.enum(['filter', 'sort', 'aggregate', 'transform']).describe('Operation to perform'),
        data: z.array(z.any()).describe('Array of data items to process'),
        criteria: z.object({}).describe('Processing criteria'),
        options: z.object({}).describe('Additional processing options'),
      },
      required: ['operation', 'data'],
    },
  };
}

/**
 * Example: Tool handler with complex logic
 */
export async function advancedToolHandler(args: Record<string, any>): Promise<MCPCallToolResult> {
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
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error processing data: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
    };
  }
}

/**
 * Example: Integration with chat response
 */
export async function demonstrateChatWithTools() {
  const client = createClientWithCustomTools();

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
  const calculationResult = await client.callTool({
    name: 'calculator',
    arguments: { expression: '15 * 23' }
  });

  console.log('Tool result for chat:', calculationResult);
}

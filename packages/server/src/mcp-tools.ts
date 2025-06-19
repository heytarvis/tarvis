import { MCPTool, MCPToolUseResponse } from '@tarvis/shared/src';

/**
 * Create a simple text-based tool
 * @param name Tool name
 * @param description Tool description
 * @param parameterName Name of the input parameter
 * @param parameterDescription Description of the input parameter
 * @returns MCPTool definition
 */
export function createTextTool(
  name: string,
  description: string,
  parameterName: string,
  parameterDescription: string
): MCPTool {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties: {
        [parameterName]: {
          type: 'string',
          description: parameterDescription,
        },
      },
      required: [parameterName],
    },
  };
}

/**
 * Create a tool with multiple parameters
 * @param name Tool name
 * @param description Tool description
 * @param properties Parameter definitions
 * @param required Required parameter names
 * @returns MCPTool definition
 */
export function createMultiParamTool(
  name: string,
  description: string,
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    enum?: string[];
  }>,
  required: string[]
): MCPTool {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties,
      required,
    },
  };
}

/**
 * Example tool: Calculator
 */
export const calculatorTool: MCPTool = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  inputSchema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")',
      },
    },
    required: ['expression'],
  },
};

/**
 * Example tool: Weather
 */
export const weatherTool: MCPTool = {
  name: 'weather',
  description: 'Get current weather information for a location',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates (e.g., "New York", "40.7128,-74.0060")',
      },
      units: {
        type: 'string',
        description: 'Temperature units',
        enum: ['celsius', 'fahrenheit'],
      },
    },
    required: ['location'],
  },
};

/**
 * Example tool: File Operations
 */
export const fileOperationsTool: MCPTool = {
  name: 'file_operations',
  description: 'Perform file system operations',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'File operation to perform',
        enum: ['read', 'write', 'delete', 'list'],
      },
      path: {
        type: 'string',
        description: 'File or directory path',
      },
      content: {
        type: 'string',
        description: 'Content to write (only for write operation)',
      },
    },
    required: ['operation', 'path'],
  },
};

/**
 * Example tool: Web Search
 */
export const webSearchTool: MCPTool = {
  name: 'web_search',
  description: 'Search the web for information',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return',
      },
    },
    required: ['query'],
  },
};

/**
 * Example tool handlers
 */
export const toolHandlers = {
  calculator: async (args: Record<string, any>): Promise<MCPToolUseResponse> => {
    try {
      const expression = args.expression as string;
      // Note: In a real implementation, you'd want to use a safe evaluation library
      // This is just an example - be careful with eval in production!
      const result = eval(expression);
      return {
        content: `Result: ${result}`,
      };
    } catch (error) {
      return {
        content: `Error evaluating expression: ${error instanceof Error ? error.message : 'Unknown error'}`,
        is_error: true,
      };
    }
  },

  weather: async (args: Record<string, any>): Promise<MCPToolUseResponse> => {
    const location = args.location as string;
    const units = (args.units as string) || 'celsius';
    
    // This is a mock implementation
    // In a real implementation, you'd call a weather API
    return {
      content: `Weather for ${location}: 22°${units === 'celsius' ? 'C' : 'F'}, Partly Cloudy`,
    };
  },

  file_operations: async (args: Record<string, any>): Promise<MCPToolUseResponse> => {
    const operation = args.operation as string;
    const path = args.path as string;
    const content = args.content as string;

    // This is a mock implementation
    // In a real implementation, you'd perform actual file operations
    switch (operation) {
      case 'read':
        return {
          content: `Mock: Reading file ${path}`,
        };
      case 'write':
        return {
          content: `Mock: Writing content to file ${path}`,
        };
      case 'delete':
        return {
          content: `Mock: Deleting file ${path}`,
        };
      case 'list':
        return {
          content: `Mock: Listing contents of directory ${path}`,
        };
      default:
        return {
          content: `Unknown operation: ${operation}`,
          is_error: true,
        };
    }
  },

  web_search: async (args: Record<string, any>): Promise<MCPToolUseResponse> => {
    const query = args.query as string;
    const maxResults = (args.max_results as number) || 5;

    // This is a mock implementation
    // In a real implementation, you'd call a search API
    return {
      content: `Mock: Found ${maxResults} results for "${query}"`,
    };
  },
};

/**
 * Get all example tools
 * @returns Array of example MCP tools
 */
export function getExampleTools(): MCPTool[] {
  return [
    calculatorTool,
    weatherTool,
    fileOperationsTool,
    webSearchTool,
  ];
}

/**
 * Get all example tool handlers
 * @returns Object with tool handlers
 */
export function getExampleToolHandlers() {
  return toolHandlers;
} 
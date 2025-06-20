# MCP Tools Extension for TarvisClient

This extension adds Model Context Protocol (MCP) tool support to the TarvisClient, allowing you to define and use tools that follow the MCP specification.

## Overview

The MCP tools extension provides:

- **Tool Management**: Add, remove, and manage MCP-compliant tools
- **Tool Listing**: Get a JSON-RPC formatted list of all available tools
- **Tool Execution**: Execute tools with proper argument validation
- **Type Safety**: Full TypeScript support with proper type definitions
- **Validation**: Automatic argument validation against tool schemas

## Basic Usage

### Creating a Client with Tools

```typescript
import { TarvisClient } from '@tarvis/server';
import { getExampleTools, getExampleToolHandlers } from '@tarvis/server';

// Create a client with example tools
const client = new TarvisClient({
  defaultModelId: 'gpt-3.5-turbo',
  defaultTemperature: 0.7,
});

// Add example tools
const exampleTools = getExampleTools();
const handlers = getExampleToolHandlers();

exampleTools.forEach(tool => {
  const handler = handlers[tool.name as keyof typeof handlers];
  if (handler) {
    client.addTool(tool, handler);
  }
});
```

### Listing Available Tools

```typescript
// Get all available tools in MCP format
const toolsList = client.getToolsList();
console.log(
  'Available tools:',
  toolsList.tools.map(t => t.name)
);
```

### Using a Tool

```typescript
// Execute a tool with arguments
const result = await client.useTool({
  name: 'calculator',
  arguments: { expression: '2 + 2 * 3' },
});

console.log('Result:', result.content);
```

## Creating Custom Tools

### Simple Text Tool

```typescript
import { createTextTool } from '@tarvis/server';

const echoTool = createTextTool('echo', 'Echo back the input text', 'text', 'Text to echo back');

client.addTool(echoTool, async args => ({
  content: `Echo: ${args.text}`,
}));
```

### Multi-Parameter Tool

```typescript
import { createMultiParamTool } from '@tarvis/server';

const weatherTool = createMultiParamTool(
  'weather',
  'Get weather information',
  {
    location: {
      type: 'string',
      description: 'City name or coordinates',
    },
    units: {
      type: 'string',
      description: 'Temperature units',
      enum: ['celsius', 'fahrenheit'],
    },
  },
  ['location']
);

client.addTool(weatherTool, async args => ({
  content: `Weather for ${args.location}: 22°C, Sunny`,
}));
```

### Manual Tool Definition

```typescript
import { MCPTool } from '@tarvis/shared';

const customTool: MCPTool = {
  name: 'data_processor',
  description: 'Process data with advanced validation',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'Operation to perform',
        enum: ['filter', 'sort', 'aggregate'],
      },
      data: {
        type: 'array',
        description: 'Array of data items to process',
      },
      options: {
        type: 'object',
        description: 'Additional processing options',
      },
    },
    required: ['operation', 'data'],
  },
};

client.addTool(customTool, async args => {
  // Your processing logic here
  return {
    content: JSON.stringify({ processed: true, result: args.data }),
  };
});
```

## Tool Handler Functions

Tool handlers should return a `MCPToolUseResponse` object:

```typescript
interface MCPToolUseResponse {
  content:
    | string
    | Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: {
          url: string;
        };
      }>;
  is_error?: boolean;
}
```

### Example Handler

```typescript
async function calculatorHandler(args: Record<string, any>): Promise<MCPToolUseResponse> {
  try {
    const expression = args.expression as string;
    const result = eval(expression); // Use safe evaluation in production

    return {
      content: `Result: ${result}`,
    };
  } catch (error) {
    return {
      content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      is_error: true,
    };
  }
}
```

## Tool Management Methods

### Adding Tools

```typescript
// Add a tool with a handler (handler is required)
client.addTool(toolDefinition, handlerFunction);
```

### Removing Tools

```typescript
client.removeTool('tool_name');
```

### Checking Tool Availability

```typescript
// Check if a tool exists
const hasTool = client.hasTool('calculator');

// Get a specific tool
const tool = client.getTool('calculator');

// Get all tool names
const toolNames = client.getToolNames();
```

## Argument Validation

The client automatically validates tool arguments against the tool's input schema:

- **Required fields**: Ensures all required parameters are provided
- **Type validation**: Validates parameter types (string, number, boolean, object, array)
- **Enum validation**: Ensures enum values are valid
- **Unknown parameters**: Rejects parameters not defined in the schema

### Validation Example

```typescript
// This will throw an error due to missing required argument
await client.useTool({
  name: 'calculator',
  arguments: {}, // Missing 'expression'
});

// This will throw an error due to invalid type
await client.useTool({
  name: 'calculator',
  arguments: { expression: 123 }, // Should be string
});
```

## Integration with Chat

Tools can be integrated with the chat functionality:

```typescript
// In a chat context, tools can be used to enhance responses
const chatRequest = {
  threadId: 'thread-123',
  messages: [
    {
      type: 'human',
      content: 'What is 15 * 23?',
    },
  ],
  modelId: 'gpt-3.5-turbo',
  messageId: 'msg-456',
};

// The model can decide to use tools based on the conversation
const calculationResult = await client.useTool({
  name: 'calculator',
  arguments: { expression: '15 * 23' },
});
```

## Example Tools Included

The package includes several example tools:

- **calculator**: Perform mathematical calculations
- **weather**: Get weather information for a location
- **file_operations**: Perform file system operations
- **web_search**: Search the web for information

### Using Example Tools

```typescript
import { createClientWithExampleTools, demonstrateToolUsage } from '@tarvis/server';

// Create client with all example tools
const client = createClientWithExampleTools();

// Demonstrate tool usage
await demonstrateToolUsage();
```

## Type Definitions

### MCPTool

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolParameter>;
    required?: string[];
  };
}
```

### MCPToolParameter

```typescript
interface MCPToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  items?: MCPToolParameter;
  properties?: Record<string, MCPToolParameter>;
  required?: string[];
}
```

### MCPToolUseRequest

```typescript
interface MCPToolUseRequest {
  name: string;
  arguments: Record<string, any>;
}
```

### MCPToolUseResponse

```typescript
interface MCPToolUseResponse {
  content:
    | string
    | Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: {
          url: string;
        };
      }>;
  is_error?: boolean;
}
```

## Best Practices

1. **Always validate input**: Use the built-in validation or add custom validation
2. **Handle errors gracefully**: Return proper error responses with `is_error: true`
3. **Use descriptive names**: Tool names should be clear and descriptive
4. **Provide good descriptions**: Help users understand what each tool does
5. **Test thoroughly**: Ensure tools work correctly with various inputs
6. **Use safe evaluation**: Avoid `eval()` in production; use safe alternatives
7. **Document parameters**: Provide clear descriptions for all parameters

## Security Considerations

- **Input validation**: Always validate and sanitize tool inputs
- **Safe execution**: Use safe evaluation methods instead of `eval()`
- **Access control**: Consider implementing access control for sensitive tools
- **Rate limiting**: Implement rate limiting for external API calls
- **Error handling**: Don't expose sensitive information in error messages
